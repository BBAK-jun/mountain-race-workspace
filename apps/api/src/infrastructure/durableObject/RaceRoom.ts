import { DurableObject } from "cloudflare:workers";
import type { ClientMessage, ServerMessage } from "@mountain-race/types";
import { COUNTDOWN_SECONDS } from "@mountain-race/game-logic";
import { PlayerRegistry } from "../../application/shared/playerRegistry";
import { RaceSimulation } from "../../domain/raceSimulation";
import type { Broadcaster } from "../../application/ports";
import {
  handleSetCharacter,
  handleSetReady,
  handlePlayerDisconnect,
} from "../../application/room/useCases";

import type { Player } from "@mountain-race/types";

interface SessionAttachment {
  playerId: string;
  player: Player;
}

const ROOM_TTL_MS = 5 * 60 * 1000;
const SIM_TICK_MS = 16;

export class RaceRoom extends DurableObject implements Broadcaster {
  private registry = new PlayerRegistry();
  private simulation = new RaceSimulation();
  private countdownRemaining = 0;

  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    this.restoreHibernatedSessions();
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  // ── HTTP entry point ───────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/ws")) return this.acceptPlayer();
    if (request.method === "GET") return Response.json(this.registry.roomState());
    if (request.method === "POST") {
      const body = (await request.json()) as { roomCode: string };
      this.registry.roomCode = body.roomCode;
      return Response.json({ ok: true, roomCode: this.registry.roomCode });
    }

    return new Response("Not found", { status: 404 });
  }

  // ── WebSocket lifecycle ────────────────────────────────────────────────

  private acceptPlayer(): Response {
    if (this.registry.isFull) {
      return Response.json({ error: "Room is full" }, { status: 403 });
    }

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    const player = this.registry.addPlayer();

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: player.id, player } satisfies SessionAttachment);

    this.broadcast({ type: "playerJoined", player });
    this.sendTo(server, {
      type: "roomState",
      state: this.registry.roomState(),
      yourPlayerId: player.id,
    });

    if (this.registry.phase === "racing" || this.registry.phase === "countdown") {
      this.sendTo(server, { type: "hasHiddenEffect", hasEffect: true });
      if (this.registry.phase === "racing") {
        const snap = this.simulation.snapshot();
        this.sendTo(server, {
          type: "gameTick",
          characters: snap.characters,
          rankings: snap.rankings,
          finishedIds: snap.finishedIds,
          elapsedTime: snap.elapsedTime,
          activeGlobalEvent: snap.activeGlobalEvent,
          events: snap.events,
          eventLogs: snap.eventLogs,
          activeBubble: snap.activeBubble,
        });
      }
    }

    this.scheduleRoomTTL();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: ArrayBuffer | string): Promise<void> {
    const playerId = this.playerIdFrom(ws);
    if (!playerId) return;

    const player = this.registry.get(playerId);
    if (!player) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }

    const deps = { registry: this.registry, broadcaster: this as Broadcaster };

    switch (msg.type) {
      case "setCharacter":
        handleSetCharacter(deps, player, msg);
        ws.serializeAttachment({ playerId: player.id, player } satisfies SessionAttachment);
        break;

      case "setReady":
        handleSetReady(deps, player, msg);
        ws.serializeAttachment({ playerId: player.id, player } satisfies SessionAttachment);
        break;

      case "startRace":
        if (player.id !== this.registry.hostId) break;
        if (this.registry.size < 2) break;
        if (!this.registry.allReady()) break;
        this.beginCountdown();
        break;

      case "activateEffect":
        if (this.registry.phase !== "racing") break;
        this.handleActivateEffect(playerId);
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const playerId = this.playerIdFrom(ws);
    if (!playerId) return;

    handlePlayerDisconnect({ registry: this.registry, broadcaster: this as Broadcaster }, playerId);
    this.scheduleRoomTTL();
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    const playerId = this.playerIdFrom(ws);
    if (playerId) this.registry.disconnect(playerId);
    ws.close(1011, "WebSocket error");
  }

  // ── Alarm router ───────────────────────────────────────────────────────

  override async alarm(): Promise<void> {
    switch (this.registry.phase) {
      case "countdown":
        this.tickCountdown();
        return;
      case "racing":
        this.tickRace();
        return;
      default:
        if (this.registry.connectedCount() === 0) this.registry.clearIfEmpty();
    }
  }

  // ── Countdown ──────────────────────────────────────────────────────────

  private beginCountdown(): void {
    this.registry.phase = "countdown";
    this.countdownRemaining = COUNTDOWN_SECONDS;
    this.broadcast({ type: "countdown", seconds: this.countdownRemaining });
    this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  private tickCountdown(): void {
    this.countdownRemaining--;
    if (this.countdownRemaining > 0) {
      this.broadcast({ type: "countdown", seconds: this.countdownRemaining });
      this.ctx.storage.setAlarm(Date.now() + 1000);
      return;
    }

    this.registry.phase = "racing";
    this.simulation.init(this.registry.connectedPlayers);
    this.broadcast({ type: "hasHiddenEffect", hasEffect: true });
    this.ctx.storage.setAlarm(Date.now() + SIM_TICK_MS);
  }

  // ── Hidden effect activation ─────────────────────────────────────────

  private handleActivateEffect(playerId: string): void {
    const result = this.simulation.activateEffect(playerId);
    if (!result) return;

    const reveal: ServerMessage = {
      type: "effectReveal",
      playerId,
      effect: result.assignment.effect,
      ...(result.targetName !== undefined ? { targetName: result.targetName } : {}),
    };
    this.broadcast(reveal);
  }

  // ── Race tick ──────────────────────────────────────────────────────────

  private tickRace(): void {
    this.simulation.tick();

    if (this.simulation.isFinished) {
      this.endRace();
      return;
    }

    if (this.simulation.shouldBroadcast) {
      this.simulation.markBroadcasted();
      this.broadcastSnapshot();
    }

    this.ctx.storage.setAlarm(Date.now() + SIM_TICK_MS);
  }

  private endRace(): void {
    this.registry.phase = "result";
    this.broadcastSnapshot();

    const result = this.simulation.result();
    this.broadcast({
      type: "raceResult",
      rankings: result.rankings,
      characters: result.characters,
      hiddenEffects: result.hiddenEffects,
    });

    this.scheduleRoomTTL();
  }

  private broadcastSnapshot(): void {
    const snap = this.simulation.snapshot();
    this.broadcast({
      type: "gameTick",
      characters: snap.characters,
      rankings: snap.rankings,
      finishedIds: snap.finishedIds,
      elapsedTime: snap.elapsedTime,
      activeGlobalEvent: snap.activeGlobalEvent,
      events: snap.events,
      eventLogs: snap.eventLogs,
      activeBubble: snap.activeBubble,
    });
  }

  // ── Messaging (Broadcaster interface) ─────────────────────────────────

  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {
        /* cleaned up in webSocketClose */
      }
    }
  }

  sendTo(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* disconnected */
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────

  private playerIdFrom(ws: WebSocket): string | null {
    const attachment = ws.deserializeAttachment() as SessionAttachment | null;
    return attachment?.playerId ?? null;
  }

  private restoreHibernatedSessions(): void {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as SessionAttachment | null;
      if (!attachment) continue;

      const existing = this.registry.get(attachment.playerId);
      if (existing) {
        existing.connected = true;
      } else if (attachment.player) {
        this.registry.restorePlayer({ ...attachment.player, connected: true });
      }
    }
  }

  private scheduleRoomTTL(): void {
    if (this.registry.phase === "racing" || this.registry.phase === "countdown") return;
    this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }
}

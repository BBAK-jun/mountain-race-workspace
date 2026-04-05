import { DurableObject } from "cloudflare:workers";
import type {
  ActiveBubble,
  Character,
  ClientMessage,
  ColorPreset,
  EventLog,
  GameEvent,
  GlobalEventType,
  Player,
  RoomPhase,
  RoomState,
  ServerMessage,
} from "@mountain-race/types";
import {
  COUNTDOWN_SECONDS,
  FINISH_LINE,
  GAME_SPEED,
  JITTER_RANGE,
  RACE_END_GRACE_PERIOD_MS,
  VOLCANIC_ASH_SPEED_MULT,
  initEventScheduler,
  initDialogueScheduler,
  processEvents,
  processDialogues,
} from "@mountain-race/game-logic";

interface SessionAttachment {
  playerId: string;
}

const COLOR_PRESETS: readonly ColorPreset[] = [
  { jacket: "#FF69B4", inner: "#FFFFFF", pants: "#333333", buff: "#CC3355", hat: "#FF69B4" },
  { jacket: "#4488CC", inner: "#222222", pants: "#444444", buff: "#3366AA", hat: "#4488CC" },
  { jacket: "#55BB55", inner: "#EEEEEE", pants: "#555555", buff: "#44AA44", hat: "#55BB55" },
  { jacket: "#8855CC", inner: "#DDDDDD", pants: "#333333", buff: "#7744BB", hat: "#8855CC" },
  { jacket: "#FF6633", inner: "#FFFFFF", pants: "#444444", buff: "#EE5522", hat: "#FF6633" },
  { jacket: "#CC2222", inner: "#222222", pants: "#555555", buff: "#BB1111", hat: "#CC2222" },
  { jacket: "#F0C030", inner: "#333333", pants: "#444444", buff: "#E0B020", hat: "#F0C030" },
  { jacket: "#22BBBB", inner: "#FFFFFF", pants: "#333333", buff: "#11AAAA", hat: "#22BBBB" },
];

const MAX_PLAYERS = 8;
const ROOM_TTL_MS = 5 * 60 * 1000;
const SIM_TICK_MS = 16;
const BROADCAST_INTERVAL_MS = 50;
const RANK_CHANGE_CHECK_INTERVAL = 0.5;

export class RaceRoom extends DurableObject {
  private players: Map<string, Player> = new Map();
  private phase: RoomPhase = "waiting";
  private hostId: string | null = null;
  private roomCode: string | null = null;

  // ── Simulation state ───────────────────────────────────────────────────
  private characters: Character[] = [];
  private rankings: string[] = [];
  private finishedIds: string[] = [];
  private firstFinishTime: number | null = null;
  private elapsedTime = 0;
  private events: GameEvent[] = [];
  private eventLogs: EventLog[] = [];
  private activeGlobalEvent: GlobalEventType | null = null;
  private globalEventEndTime = 0;
  private ultimateCount = 0;
  private activeBubble: ActiveBubble | null = null;
  private countdownRemaining = 0;
  private lastBroadcastAt = 0;
  private lastRankChangeCheckTime = 0;
  private lastTickWallTime = 0;

  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    this.restoreSessions();
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  private restoreSessions(): void {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as SessionAttachment | null;
      if (attachment) {
        const existing = this.players.get(attachment.playerId);
        if (existing) {
          existing.connected = true;
        }
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/ws")) {
      return this.handleWebSocket(request);
    }

    if (request.method === "GET") {
      return Response.json(this.getRoomState());
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { roomCode: string };
      this.roomCode = body.roomCode;
      return Response.json({ ok: true, roomCode: this.roomCode });
    }

    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(_request: Request): Response {
    if (this.players.size >= MAX_PLAYERS) {
      return Response.json({ error: "Room is full" }, { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    const playerId = crypto.randomUUID();
    const colorIndex = this.players.size;
    const color: ColorPreset = COLOR_PRESETS[colorIndex % COLOR_PRESETS.length] ?? {
      jacket: "#FF69B4",
      inner: "#FFFFFF",
      pants: "#333333",
      buff: "#CC3355",
      hat: "#FF69B4",
    };

    const player: Player = {
      id: playerId,
      name: `산악인 ${this.players.size + 1}`,
      color,
      faceImage: null,
      ready: false,
      isHost: this.players.size === 0,
      connected: true,
    };

    if (player.isHost) {
      this.hostId = playerId;
    }

    this.players.set(playerId, player);

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId } satisfies SessionAttachment);

    this.broadcast({ type: "playerJoined", player });
    this.sendTo(server, { type: "roomState", state: this.getRoomState() });

    this.resetTTL();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: ArrayBuffer | string): Promise<void> {
    const attachment = ws.deserializeAttachment() as SessionAttachment | null;
    if (!attachment) return;

    const player = this.players.get(attachment.playerId);
    if (!player) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }

    switch (msg.type) {
      case "setCharacter":
        player.name = msg.name;
        player.faceImage = msg.faceImage;
        player.color = msg.color;
        this.broadcast({
          type: "playerUpdated",
          playerId: player.id,
          changes: { name: player.name, faceImage: player.faceImage, color: player.color },
        });
        break;

      case "setReady":
        player.ready = msg.ready;
        this.broadcast({
          type: "playerUpdated",
          playerId: player.id,
          changes: { ready: player.ready },
        });
        break;

      case "startRace":
        if (player.id !== this.hostId) break;
        if (this.players.size < 2) break;
        if (!this.allReady()) break;
        this.startCountdown();
        break;

      case "activateEffect":
        // Phase 4에서 구현 예정
        break;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    ws.close(code, reason);
    const attachment = ws.deserializeAttachment() as SessionAttachment | null;
    if (!attachment) return;

    const player = this.players.get(attachment.playerId);
    if (!player) return;

    player.connected = false;
    this.broadcast({ type: "playerLeft", playerId: player.id });

    if (player.isHost) {
      this.transferHost();
    }

    if (this.connectedCount() === 0 && this.phase === "waiting") {
      this.players.clear();
    }

    this.resetTTL();
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    const attachment = ws.deserializeAttachment() as SessionAttachment | null;
    if (attachment) {
      const player = this.players.get(attachment.playerId);
      if (player) player.connected = false;
    }
    ws.close(1011, "WebSocket error");
  }

  override async alarm(): Promise<void> {
    if (this.phase === "countdown") {
      this.tickCountdown();
      return;
    }

    if (this.phase === "racing") {
      this.tickSimulation();
      return;
    }

    if (this.phase === "waiting" && this.connectedCount() === 0) {
      this.players.clear();
    }
  }

  // ── Countdown ──────────────────────────────────────────────────────────

  private startCountdown(): void {
    this.phase = "countdown";
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

    this.initRace();
  }

  // ── Race init ──────────────────────────────────────────────────────────

  private initRace(): void {
    this.characters = [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      faceImage: p.faceImage,
      progress: 0,
      speed: GAME_SPEED,
      baseSpeed: GAME_SPEED,
      status: "running" as const,
      stunEndTime: 0,
      stats: { hitCount: 0, setbackTotal: 0, ultimateUsed: 0, rankChanges: 0 },
      finishTime: null,
    }));

    this.rankings = this.characters.map((c) => c.id);
    this.finishedIds = [];
    this.firstFinishTime = null;
    this.elapsedTime = 0;
    this.events = [];
    this.eventLogs = [];
    this.activeGlobalEvent = null;
    this.globalEventEndTime = 0;
    this.ultimateCount = 0;
    this.activeBubble = null;
    this.lastBroadcastAt = 0;
    this.lastRankChangeCheckTime = 0;
    this.lastTickWallTime = Date.now();

    initEventScheduler(0);
    initDialogueScheduler(0);

    this.phase = "racing";
    this.ctx.storage.setAlarm(Date.now() + SIM_TICK_MS);
  }

  // ── Simulation tick ────────────────────────────────────────────────────

  private tickSimulation(): void {
    const now = Date.now();
    const wallDelta = (now - this.lastTickWallTime) / 1000;
    this.lastTickWallTime = now;
    const deltaTime = Math.min(wallDelta, 0.1);

    this.elapsedTime += deltaTime;

    const isGlobalActive =
      this.activeGlobalEvent !== null && this.elapsedTime < this.globalEventEndTime;
    const ashActive = isGlobalActive && this.activeGlobalEvent === "volcanic_ash";

    // 1. Movement + status recovery
    this.characters = this.characters.map((c) => {
      if (this.finishedIds.includes(c.id)) return c;

      if (c.status === "stunned") {
        if (this.elapsedTime >= c.stunEndTime) {
          return { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
        }
        return c;
      }

      let char = c;
      if (c.status !== "running" && c.stunEndTime > 0 && this.elapsedTime >= c.stunEndTime) {
        char = { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
      }

      const ashMult = ashActive ? VOLCANIC_ASH_SPEED_MULT : 1;
      const jitter = 1 + (Math.random() - 0.5) * JITTER_RANGE;
      const progress = char.progress + char.speed * deltaTime * jitter * ashMult;
      return { ...char, progress };
    });

    // 2. Finish detection
    const newlyFinished = this.characters
      .filter((c) => c.progress >= FINISH_LINE && !this.finishedIds.includes(c.id))
      .sort((a, b) => b.progress - a.progress);
    const newlyFinishedIds = newlyFinished.map((c) => c.id);
    this.finishedIds = [...this.finishedIds, ...newlyFinishedIds];

    if (this.firstFinishTime === null && newlyFinishedIds.length > 0) {
      this.firstFinishTime = this.elapsedTime;
    }

    this.characters = this.characters.map((c) => {
      const clamped = Math.min(c.progress, 1);
      if (newlyFinishedIds.includes(c.id)) {
        return { ...c, progress: clamped, finishTime: this.elapsedTime };
      }
      return clamped !== c.progress ? { ...c, progress: clamped } : c;
    });

    // 3. Rankings
    this.rankings = [...this.characters].sort((a, b) => b.progress - a.progress).map((c) => c.id);

    // 3.5 Rank change tracking
    if (this.elapsedTime - this.lastRankChangeCheckTime >= RANK_CHANGE_CHECK_INTERVAL) {
      this.lastRankChangeCheckTime = this.elapsedTime;
    }

    // 4. Event system
    const eventResult = processEvents({
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      elapsedTime: this.elapsedTime,
      activeGlobalEvent: this.activeGlobalEvent,
      globalEventEndTime: this.globalEventEndTime,
      ultimateCount: this.ultimateCount,
    });

    this.characters = eventResult.characters;
    this.activeGlobalEvent = eventResult.activeGlobalEvent;
    this.globalEventEndTime = eventResult.globalEventEndTime;
    this.ultimateCount = eventResult.ultimateCount;

    if (eventResult.newEvents.length > 0) {
      this.events.push(...eventResult.newEvents);
    }
    if (eventResult.newLogs.length > 0) {
      this.eventLogs.push(...eventResult.newLogs);
    }

    // 5. Dialogue system
    const dialogueResult = processDialogues({
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      elapsedTime: this.elapsedTime,
      activeBubble: this.activeBubble,
      newEvents: eventResult.newEvents,
    });
    this.activeBubble = dialogueResult.activeBubble;

    // 6. Race end check
    const isAllFinished = this.finishedIds.length === this.characters.length;
    const graceSeconds = RACE_END_GRACE_PERIOD_MS / 1000;
    const isGraceOver =
      this.firstFinishTime !== null && this.elapsedTime - this.firstFinishTime >= graceSeconds;

    if (isAllFinished || isGraceOver) {
      this.endRace();
      return;
    }

    // 7. Broadcast game state at throttled interval
    if (this.elapsedTime - this.lastBroadcastAt >= BROADCAST_INTERVAL_MS / 1000) {
      this.lastBroadcastAt = this.elapsedTime;
      this.broadcastGameTick();
    }

    // Schedule next tick
    this.ctx.storage.setAlarm(Date.now() + SIM_TICK_MS);
  }

  private broadcastGameTick(): void {
    this.broadcast({
      type: "gameTick",
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      elapsedTime: this.elapsedTime,
      activeGlobalEvent: this.activeGlobalEvent,
      events: this.events,
      eventLogs: this.eventLogs,
      activeBubble: this.activeBubble,
    });
  }

  private endRace(): void {
    this.phase = "result";

    const finalRankings = [
      ...this.finishedIds,
      ...this.characters
        .filter((c) => !this.finishedIds.includes(c.id))
        .sort((a, b) => b.progress - a.progress)
        .map((c) => c.id),
    ];

    this.broadcastGameTick();

    this.broadcast({
      type: "raceResult",
      rankings: finalRankings,
      characters: this.characters,
      hiddenEffects: [], // Phase 4에서 채움
    });

    this.resetTTL();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private getRoomState(): RoomState {
    return {
      code: this.roomCode ?? "",
      phase: this.phase,
      hostId: this.hostId ?? "",
      players: [...this.players.values()],
    };
  }

  private allReady(): boolean {
    for (const p of this.players.values()) {
      if (p.connected && !p.ready) return false;
    }
    return true;
  }

  private connectedCount(): number {
    let count = 0;
    for (const p of this.players.values()) {
      if (p.connected) count++;
    }
    return count;
  }

  private transferHost(): void {
    for (const p of this.players.values()) {
      if (p.connected) {
        p.isHost = true;
        this.hostId = p.id;
        this.broadcast({
          type: "playerUpdated",
          playerId: p.id,
          changes: { isHost: true },
        });
        return;
      }
    }
    this.hostId = null;
  }

  private broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {
        // disconnected, will be cleaned up in webSocketClose
      }
    }
  }

  private sendTo(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // disconnected
    }
  }

  private resetTTL(): void {
    if (this.phase === "racing" || this.phase === "countdown") return;
    this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }
}

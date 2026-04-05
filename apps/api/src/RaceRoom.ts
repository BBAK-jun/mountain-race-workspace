import { DurableObject } from "cloudflare:workers";
import type {
  ClientMessage,
  ColorPreset,
  Player,
  RoomPhase,
  RoomState,
  ServerMessage,
} from "@mountain-race/types";

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

export class RaceRoom extends DurableObject {
  private players: Map<string, Player> = new Map();
  private phase: RoomPhase = "waiting";
  private hostId: string | null = null;
  private roomCode: string | null = null;

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
    if (this.phase === "waiting" && this.connectedCount() === 0) {
      this.players.clear();
    }
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

  private startCountdown(): void {
    this.phase = "countdown";
    this.broadcast({ type: "countdown", seconds: 3 });
    // Phase 3에서 alarm()을 이용한 실제 카운트다운 + 시뮬레이션 구현 예정
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
    this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }
}

import type { ColorPreset, Player, RoomPhase, RoomState } from "@mountain-race/types";

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

const DEFAULT_COLOR: ColorPreset = {
  jacket: "#FF69B4",
  inner: "#FFFFFF",
  pants: "#333333",
  buff: "#CC3355",
  hat: "#FF69B4",
};

const MAX_PLAYERS = 8;

export class PlayerRegistry {
  private players: Map<string, Player> = new Map();
  private _hostId: string | null = null;
  roomCode: string | null = null;
  phase: RoomPhase = "waiting";

  get hostId(): string | null {
    return this._hostId;
  }

  get size(): number {
    return this.players.size;
  }

  get isFull(): boolean {
    return this.players.size >= MAX_PLAYERS;
  }

  get connectedPlayers(): Player[] {
    return [...this.players.values()].filter((p) => p.connected);
  }

  get allPlayers(): Player[] {
    return [...this.players.values()];
  }

  get(id: string): Player | undefined {
    return this.players.get(id);
  }

  addPlayer(): Player {
    const playerId = crypto.randomUUID();
    const colorIndex = this.players.size;
    const color: ColorPreset = COLOR_PRESETS[colorIndex % COLOR_PRESETS.length] ?? DEFAULT_COLOR;

    const isFirst = this.players.size === 0;
    const player: Player = {
      id: playerId,
      name: `산악인 ${this.players.size + 1}`,
      color,
      faceImage: null,
      ready: false,
      isHost: isFirst,
      connected: true,
    };

    if (isFirst) {
      this._hostId = playerId;
    }

    this.players.set(playerId, player);
    return player;
  }

  disconnect(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    player.connected = false;
    return true;
  }

  allReady(): boolean {
    for (const p of this.players.values()) {
      if (p.connected && !p.ready) return false;
    }
    return true;
  }

  connectedCount(): number {
    let count = 0;
    for (const p of this.players.values()) {
      if (p.connected) count++;
    }
    return count;
  }

  transferHost(): Player | null {
    for (const p of this.players.values()) {
      if (p.connected && !p.isHost) {
        p.isHost = true;
        this._hostId = p.id;
        return p;
      }
    }
    this._hostId = null;
    return null;
  }

  clearIfEmpty(): void {
    if (this.connectedCount() === 0) {
      this.players.clear();
    }
  }

  roomState(): RoomState {
    return {
      code: this.roomCode ?? "",
      phase: this.phase,
      hostId: this._hostId ?? "",
      players: [...this.players.values()],
    };
  }
}

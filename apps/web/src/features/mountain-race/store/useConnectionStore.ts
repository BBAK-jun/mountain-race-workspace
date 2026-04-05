import { create } from "zustand";
import type { ClientMessage, Player, RoomState, ServerMessage } from "@mountain-race/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionState {
  status: ConnectionStatus;
  ws: WebSocket | null;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  players: Player[];
  phase: RoomState["phase"] | null;
  hasHiddenEffect: boolean;

  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => void;
  disconnect: () => void;
  send: (msg: ClientMessage) => void;
}

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:8787";

function wsUrl(code: string): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}/rooms/${code}/ws`;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: "disconnected",
  ws: null,
  roomCode: null,
  playerId: null,
  isHost: false,
  players: [],
  phase: null,
  hasHiddenEffect: false,

  createRoom: async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, { method: "POST" });
      if (!res.ok) return null;
      const data = (await res.json()) as { roomCode: string };
      get().joinRoom(data.roomCode);
      return data.roomCode;
    } catch {
      return null;
    }
  },

  joinRoom: (code: string) => {
    const prev = get().ws;
    if (prev) prev.close();

    set({ status: "connecting", roomCode: code });

    const ws = new WebSocket(wsUrl(code));

    ws.onopen = () => {
      set({ status: "connected", ws });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        handleServerMessage(msg, set, get);
      } catch {
        /* malformed */
      }
    };

    ws.onclose = () => {
      set({ status: "disconnected", ws: null });
    };

    ws.onerror = () => {
      set({ status: "error", ws: null });
    };
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({
      status: "disconnected",
      ws: null,
      roomCode: null,
      playerId: null,
      isHost: false,
      players: [],
      phase: null,
      hasHiddenEffect: false,
    });
  },

  send: (msg: ClientMessage) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  },
}));

type SetState = (partial: Partial<ConnectionState>) => void;
type GetState = () => ConnectionState;

function handleServerMessage(msg: ServerMessage, set: SetState, get: GetState): void {
  switch (msg.type) {
    case "roomState":
      set({
        players: msg.state.players,
        phase: msg.state.phase,
        playerId: msg.yourPlayerId,
        isHost: msg.state.hostId === msg.yourPlayerId,
      });
      break;

    case "playerJoined":
      set({ players: [...get().players, msg.player] });
      break;

    case "playerLeft":
      set({
        players: get().players.filter((p) => p.id !== msg.playerId),
      });
      break;

    case "playerUpdated": {
      const players = get().players.map((p) =>
        p.id === msg.playerId ? { ...p, ...msg.changes } : p,
      );
      set({ players });
      const me = players.find((p) => p.id === get().playerId);
      if (me) set({ isHost: me.isHost });
      break;
    }

    case "countdown":
      set({ phase: "countdown" });
      break;

    case "hasHiddenEffect":
      set({ hasHiddenEffect: msg.hasEffect });
      break;

    case "raceResult":
      set({ phase: "result" });
      break;

    case "gameTick":
      if (get().phase !== "racing") {
        set({ phase: "racing" });
      }
      break;

    default:
      break;
  }
}

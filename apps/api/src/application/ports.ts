import type { ServerMessage } from "@mountain-race/types";

export interface Broadcaster {
  broadcast(msg: ServerMessage): void;
  sendTo(ws: WebSocket, msg: ServerMessage): void;
}

export interface AlarmScheduler {
  scheduleAlarm(delayMs: number): void;
}

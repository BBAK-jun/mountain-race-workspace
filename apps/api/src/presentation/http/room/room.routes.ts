import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "../shared";
import { createRoomHandlers } from "./room.handlers";

export function createRoomRouter() {
  const handlers = createRoomHandlers();

  return new Hono<Env>()
    .use("*", cors())
    .post("/", handlers.createRoom)
    .get("/:code", handlers.getRoom)
    .get("/:code/ws", handlers.upgradeWebSocket);
}

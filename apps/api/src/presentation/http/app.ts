import { Hono } from "hono";
import type { Env } from "./shared";
import { createRoomRouter } from "./room/room.index";

export function createApiApp() {
  const app = new Hono<Env>();

  app.get("/", (c) =>
    c.json({
      name: "mountain-race-api",
      runtime: "cloudflare-workers",
      status: "multiplayer",
    }),
  );
  app.get("/health", (c) => c.json({ status: "ok" }));

  return app.route("/rooms", createRoomRouter());
}

export type AppType = ReturnType<typeof createApiApp>;

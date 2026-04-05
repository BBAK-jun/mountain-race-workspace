import { Hono } from "hono";
import { roomRoutes } from "./room/room.routes";

type Env = {
  Bindings: {
    RACE_ROOM: DurableObjectNamespace;
  };
};

export function createApiApp() {
  const app = new Hono<Env>();

  app.get("/", (c) =>
    c.json({ name: "mountain-race-api", runtime: "cloudflare-workers", status: "multiplayer" }),
  );
  app.get("/health", (c) => c.json({ status: "ok" }));

  return app.route("/rooms", roomRoutes);
}

export type AppType = ReturnType<typeof createApiApp>;

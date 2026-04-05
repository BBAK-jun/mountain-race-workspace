import { Hono } from "hono";
import { roomRoutes } from "./routes/room";

export { RaceRoom } from "./RaceRoom";

type Env = {
  Bindings: {
    RACE_ROOM: DurableObjectNamespace;
  };
};

const app = new Hono<Env>();

app.get("/", (c) => {
  return c.json({
    name: "mountain-race-api",
    runtime: "cloudflare-workers",
    status: "multiplayer",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

const routes = app.route("/rooms", roomRoutes);

export default app;
export type AppType = typeof routes;

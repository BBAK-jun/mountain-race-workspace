import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "mountain-race-api",
    runtime: "cloudflare-workers",
    status: "starter",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});

export default app;

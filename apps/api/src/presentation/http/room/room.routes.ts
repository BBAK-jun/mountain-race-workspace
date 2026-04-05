import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  Bindings: {
    RACE_ROOM: DurableObjectNamespace;
  };
};

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const roomRoutes = new Hono<Env>()
  .use("*", cors())
  .post("/", async (c) => {
    const code = generateRoomCode();
    const id = c.env.RACE_ROOM.idFromName(code);
    const stub = c.env.RACE_ROOM.get(id);

    const res = await stub.fetch(
      new Request("https://do/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
      }),
    );

    if (!res.ok) {
      return c.json({ error: "Failed to create room" }, 500);
    }

    return c.json({ roomCode: code }, 201);
  })
  .get("/:code", async (c) => {
    const code = c.req.param("code").toUpperCase();
    const id = c.env.RACE_ROOM.idFromName(code);
    const stub = c.env.RACE_ROOM.get(id);

    const res = await stub.fetch(new Request("https://do/state"));
    const state = await res.json();
    return c.json(state, 200);
  })
  .get("/:code/ws", async (c) => {
    const upgradeHeader = c.req.header("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return c.text("Expected Upgrade: websocket", 426);
    }

    const code = c.req.param("code").toUpperCase();
    const id = c.env.RACE_ROOM.idFromName(code);
    const stub = c.env.RACE_ROOM.get(id);

    return stub.fetch(
      new Request("https://do/ws", {
        headers: c.req.raw.headers,
      }),
    );
  });

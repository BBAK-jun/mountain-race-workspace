import type { Context } from "hono";
import type { Env } from "../shared";
import { generateRoomCode, getDurableObjectStub } from "../shared";

export function createRoomHandlers() {
  return {
    async createRoom(c: Context<Env>) {
      const code = generateRoomCode();
      const stub = getDurableObjectStub(c.env, code);

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
    },

    async getRoom(c: Context<Env>) {
      const code = c.req.param("code") ?? "";
      const stub = getDurableObjectStub(c.env, code);

      const res = await stub.fetch(new Request("https://do/state"));
      const state = await res.json();
      return c.json(state, 200);
    },

    async upgradeWebSocket(c: Context<Env>) {
      const upgradeHeader = c.req.header("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return c.text("Expected Upgrade: websocket", 426);
      }

      const code = c.req.param("code") ?? "";
      const stub = getDurableObjectStub(c.env, code);

      return stub.fetch(
        new Request("https://do/ws", {
          headers: c.req.raw.headers,
        }),
      );
    },
  };
}

export type Env = {
  Bindings: {
    RACE_ROOM: DurableObjectNamespace;
  };
};

export function getDurableObjectStub(env: Env["Bindings"], code: string) {
  const id = env.RACE_ROOM.idFromName(code.toUpperCase());
  return env.RACE_ROOM.get(id);
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const timePart = chars[Date.now() % chars.length];
  let code = timePart ?? "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

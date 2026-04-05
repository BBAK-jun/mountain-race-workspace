#!/usr/bin/env node

import { buildSessionStartContext, readHookInput } from "./shared.mts";
import type { SessionStartInput } from "./shared.mts";

try {
  const input = await readHookInput<SessionStartInput>();
  const context = await buildSessionStartContext(input);
  process.stdout.write(context);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[codex-hooks] ${message}\n`);
}

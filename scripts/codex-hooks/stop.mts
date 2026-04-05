#!/usr/bin/env node

import {
  loadSessionState,
  readHookInput,
  recordAssistantStop,
  saveSessionState,
  writeDueCheckpoints,
} from "./shared.mts";
import type { StopInput } from "./shared.mts";

try {
  const input = await readHookInput<StopInput>();
  const state = await loadSessionState(input.session_id, input.cwd);

  recordAssistantStop(state, input.turn_id, input.last_assistant_message, new Date().toISOString());

  if (!input.stop_hook_active) {
    await writeDueCheckpoints(state);
  }

  await saveSessionState(state);
  process.stdout.write(`${JSON.stringify({ continue: true })}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[codex-hooks] ${message}\n`);
  process.stdout.write(`${JSON.stringify({ continue: true })}\n`);
}

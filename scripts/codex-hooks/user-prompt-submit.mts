#!/usr/bin/env node

import { loadSessionState, readHookInput, recordUserPrompt, saveSessionState } from "./shared.mts";
import type { UserPromptSubmitInput } from "./shared.mts";

try {
  const input = await readHookInput<UserPromptSubmitInput>();
  const state = await loadSessionState(input.session_id, input.cwd);

  recordUserPrompt(state, input.turn_id, input.prompt, new Date().toISOString());
  await saveSessionState(state);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[codex-hooks] ${message}\n`);
}

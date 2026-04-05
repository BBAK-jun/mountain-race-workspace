#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

export const CHECKPOINT_INTERVAL = 10;
const SESSION_PREVIEW_TURNS = 3;

export interface HookInput {
  cwd: string;
  hook_event_name: string;
  model: string;
  session_id: string;
  transcript_path: string | null;
}

export interface SessionStartInput extends HookInput {
  source: "resume" | "startup";
}

export interface UserPromptSubmitInput extends HookInput {
  prompt: string;
  turn_id: string;
}

export interface StopInput extends HookInput {
  last_assistant_message: string | null;
  stop_hook_active: boolean;
  turn_id: string;
}

export interface SessionTurnRecord {
  assistantCompletedAt: string | null;
  assistantExcerpt: string | null;
  assistantMessage: string | null;
  prompt: string;
  promptExcerpt: string;
  turnId: string;
  userPromptSubmittedAt: string;
}

export interface SessionState {
  checkpointInterval: number;
  completedTurnCount: number;
  createdAt: string;
  cwd: string;
  lastCheckpointTurnCount: number;
  sessionId: string;
  sessionSlug: string;
  turns: SessionTurnRecord[];
  updatedAt: string;
  version: 1;
}

export interface CheckpointArtifactTurn {
  assistantExcerpt: string;
  assistantMessage: string;
  prompt: string;
  promptExcerpt: string;
  turnId: string;
}

export interface CheckpointArtifact {
  artifactPath: string;
  checkpointInterval: number;
  checkpointNumber: number;
  completedTurnRange: {
    end: number;
    start: number;
  };
  createdAt: string;
  cwd: string;
  sessionId: string;
  sessionSlug: string;
  turns: CheckpointArtifactTurn[];
  version: 1;
}

interface TurnPreviewLike {
  assistantExcerpt: string | null;
  promptExcerpt: string;
}

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const runtimeRoot = path.join(repoRoot, ".omx", "codex-hooks");
const sessionsRoot = path.join(runtimeRoot, "sessions");
const checkpointsRoot = path.join(runtimeRoot, "checkpoints");
const latestCheckpointPath = path.join(checkpointsRoot, "latest.json");
const productContextPath = path.join(repoRoot, ".codex", "context", "product-context.md");

export async function readHookInput<TInput extends HookInput>(): Promise<TInput> {
  const buffers: Buffer[] = [];

  for await (const chunk of process.stdin) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(buffers).toString("utf8").trim();

  if (raw.length === 0) {
    throw new Error("Hook input was empty.");
  }

  return JSON.parse(raw) as TInput;
}

export async function loadSessionState(sessionId: string, cwd: string): Promise<SessionState> {
  const sessionSlug = toSessionSlug(sessionId);
  const existing = await readJsonFile<SessionState>(getSessionStatePath(sessionSlug));

  if (existing) {
    return {
      ...existing,
      cwd,
      sessionId,
      sessionSlug,
    };
  }

  const now = new Date().toISOString();
  return {
    version: 1,
    sessionId,
    sessionSlug,
    cwd,
    checkpointInterval: CHECKPOINT_INTERVAL,
    createdAt: now,
    updatedAt: now,
    completedTurnCount: 0,
    lastCheckpointTurnCount: 0,
    turns: [],
  };
}

export async function saveSessionState(state: SessionState): Promise<void> {
  await writeJsonFile(getSessionStatePath(state.sessionSlug), state);
}

export function recordUserPrompt(
  state: SessionState,
  turnId: string,
  prompt: string,
  nowIso: string,
): void {
  const existing = state.turns.find((turn) => turn.turnId === turnId);
  const normalizedPrompt = normalizeText(prompt);

  if (existing) {
    existing.prompt = normalizedPrompt;
    existing.promptExcerpt = toExcerpt(normalizedPrompt);
    state.updatedAt = nowIso;
    return;
  }

  state.turns.push({
    turnId,
    prompt: normalizedPrompt,
    promptExcerpt: toExcerpt(normalizedPrompt),
    assistantMessage: null,
    assistantExcerpt: null,
    userPromptSubmittedAt: nowIso,
    assistantCompletedAt: null,
  });
  state.updatedAt = nowIso;
}

export function recordAssistantStop(
  state: SessionState,
  turnId: string,
  lastAssistantMessage: string | null,
  nowIso: string,
): void {
  const normalizedMessage = normalizeOptionalText(lastAssistantMessage);
  let turn = state.turns.find((item) => item.turnId === turnId);

  if (!turn) {
    turn = {
      turnId,
      prompt: "",
      promptExcerpt: "",
      assistantMessage: null,
      assistantExcerpt: null,
      userPromptSubmittedAt: nowIso,
      assistantCompletedAt: null,
    };
    state.turns.push(turn);
  }

  if (normalizedMessage !== null) {
    turn.assistantMessage = normalizedMessage;
    turn.assistantExcerpt = toExcerpt(normalizedMessage);
    turn.assistantCompletedAt = nowIso;
  }

  state.completedTurnCount = state.turns.filter((item) => item.assistantMessage !== null).length;
  state.updatedAt = nowIso;
}

export async function writeDueCheckpoints(state: SessionState): Promise<CheckpointArtifact[]> {
  const completedTurns = state.turns.filter(
    (turn): turn is SessionTurnRecord & { assistantMessage: string; assistantExcerpt: string } =>
      turn.assistantMessage !== null && turn.assistantExcerpt !== null,
  );
  const artifacts: CheckpointArtifact[] = [];

  while (state.completedTurnCount >= state.lastCheckpointTurnCount + state.checkpointInterval) {
    const checkpointStartIndex = state.lastCheckpointTurnCount;
    const checkpointEndCount = state.lastCheckpointTurnCount + state.checkpointInterval;
    const checkpointTurns = completedTurns.slice(checkpointStartIndex, checkpointEndCount);

    if (checkpointTurns.length < state.checkpointInterval) {
      break;
    }

    const checkpointNumber = checkpointEndCount / state.checkpointInterval;
    const sessionCheckpointDir = path.join(checkpointsRoot, state.sessionSlug);
    const artifactFilename = `checkpoint-${String(checkpointNumber).padStart(4, "0")}.json`;
    const absoluteArtifactPath = path.join(sessionCheckpointDir, artifactFilename);
    const artifactPath = path.relative(repoRoot, absoluteArtifactPath);
    const artifact: CheckpointArtifact = {
      version: 1,
      sessionId: state.sessionId,
      sessionSlug: state.sessionSlug,
      cwd: state.cwd,
      checkpointInterval: state.checkpointInterval,
      checkpointNumber,
      createdAt: state.updatedAt,
      completedTurnRange: {
        start: checkpointStartIndex + 1,
        end: checkpointEndCount,
      },
      artifactPath,
      turns: checkpointTurns.map((turn) => ({
        turnId: turn.turnId,
        prompt: turn.prompt,
        promptExcerpt: turn.promptExcerpt,
        assistantMessage: turn.assistantMessage,
        assistantExcerpt: turn.assistantExcerpt,
      })),
    };

    await writeJsonFile(absoluteArtifactPath, artifact);
    await writeJsonFile(latestCheckpointPath, artifact);

    artifacts.push(artifact);
    state.lastCheckpointTurnCount = checkpointEndCount;
  }

  return artifacts;
}

export async function buildSessionStartContext(input: SessionStartInput): Promise<string> {
  const productContext = await readTextFile(productContextPath);
  const latestCheckpoint = await readJsonFile<CheckpointArtifact>(latestCheckpointPath);
  const sessionState = await loadSessionState(input.session_id, input.cwd);
  const uncheckpointedTurns = sessionState.turns
    .filter(
      (turn): turn is SessionTurnRecord & { assistantMessage: string; assistantExcerpt: string } =>
        turn.assistantMessage !== null && turn.assistantExcerpt !== null,
    )
    .slice(sessionState.lastCheckpointTurnCount);

  const lines = ["Mountain Race deterministic Codex context:", "", productContext.trim()];

  if (latestCheckpoint) {
    lines.push("", "Latest deterministic checkpoint:", ...formatCheckpointLines(latestCheckpoint));
  } else {
    lines.push("", "Latest deterministic checkpoint:", "- none saved yet");
  }

  if (uncheckpointedTurns.length > 0) {
    lines.push(
      "",
      `Current session has ${uncheckpointedTurns.length} completed turn(s) beyond the last checkpoint:`,
    );
    lines.push(...formatTurnPreview(uncheckpointedTurns));
  }

  lines.push("", "Prefer the repository state and source docs if any saved context is stale.");
  return lines.join("\n");
}

export async function safelyRun(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[codex-hooks] ${message}\n`);
  }
}

function formatCheckpointLines(checkpoint: CheckpointArtifact): string[] {
  return [
    `- artifact: ${checkpoint.artifactPath}`,
    `- source session: ${checkpoint.sessionId}`,
    `- completed turns: ${checkpoint.completedTurnRange.start}-${checkpoint.completedTurnRange.end}`,
    ...formatTurnPreview(checkpoint.turns),
  ];
}

function formatTurnPreview(turns: TurnPreviewLike[]): string[] {
  const preview = turns.slice(-SESSION_PREVIEW_TURNS);
  const lines: string[] = [];

  for (const [index, turn] of preview.entries()) {
    lines.push(`- preview ${index + 1} user: ${turn.promptExcerpt}`);
    lines.push(`  assistant: ${turn.assistantExcerpt ?? "(assistant message unavailable)"}`);
  }

  return lines;
}

function getSessionStatePath(sessionSlug: string): string {
  return path.join(sessionsRoot, `${sessionSlug}.json`);
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function readJsonFile<TValue>(filePath: string): Promise<TValue | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as TValue;
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toSessionSlug(sessionId: string): string {
  const normalized = sessionId.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const trimmed = normalized.replace(/^-+|-+$/g, "");
  return trimmed.length > 0 ? trimmed : "session";
}

function toExcerpt(text: string, maxLength = 280): string {
  const normalized = normalizeText(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

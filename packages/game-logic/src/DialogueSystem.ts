import type {
  ActiveBubble,
  Character,
  GameEvent,
  GameEventType,
  GlobalEventType,
  SkillType,
  TargetEventType,
  UltimateType,
} from "@mountain-race/types";
import {
  DIALOGUE_DISPLAY_TIME_MS,
  DIALOGUE_INTERVAL_MAX,
  DIALOGUE_INTERVAL_MIN,
  SLOWMO_PROGRESS_MIN,
  SLOWMO_THRESHOLD,
} from "./balance";
import {
  CLOSE_RACE_DIALOGUES,
  COMEBACK_DIALOGUES,
  FINISH_DIALOGUES,
  FIRST_PLACE_DIALOGUES,
  GLOBAL_EVENT_DIALOGUES,
  IDLE_DIALOGUES,
  LAST_PLACE_DIALOGUES,
  OVERTAKE_DIALOGUES,
  OVERTAKEN_DIALOGUES,
  SKILL_CASTER_DIALOGUES,
  SKILL_VICTIM_DIALOGUES,
  TARGET_EVENT_DIALOGUES,
  ULTIMATE_FALLBACK_DIALOGUES,
  ULTIMATE_SPECIFIC_DIALOGUES,
} from "./data/dialogues";

// ── Public interfaces ────────────────────────────────────────────────────────

export interface DialogueTickInput {
  characters: Character[];
  rankings: string[];
  finishedIds: string[];
  newlyFinishedIds: readonly string[];
  elapsedTime: number;
  activeBubble: ActiveBubble | null;
  newEvents: GameEvent[];
}

export interface DialogueTickResult {
  activeBubble: ActiveBubble | null;
}

// ── Module-level scheduler state ─────────────────────────────────────────────

let nextDialogueAt = 0;
let prevRankings: string[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: readonly T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error("pickRandom called on empty array");
  return item;
}

function findChar(characters: readonly Character[], id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}

const DISPLAY_DURATION_SEC = DIALOGUE_DISPLAY_TIME_MS / 1000;

function makeBubble(characterId: string, text: string, elapsedTime: number): ActiveBubble {
  return { characterId, text, endTime: elapsedTime + DISPLAY_DURATION_SEC };
}

function advanceSchedule(elapsedTime: number): void {
  nextDialogueAt = elapsedTime + randomInRange(DIALOGUE_INTERVAL_MIN, DIALOGUE_INTERVAL_MAX);
}

// ── Constants ────────────────────────────────────────────────────────────────

const GOOD_SKILL_SET: ReadonlySet<GameEventType> = new Set<GameEventType>(["booster", "wind_ride"]);

const COMEBACK_PREV_RANK_MIN = 3;

const EVENT_CATEGORY_PRIORITY: Readonly<Record<string, number>> = {
  ultimate: 0,
  global: 1,
  skill: 2,
  target: 3,
};

// ── Finish dialogue selection ────────────────────────────────────────────────

function getFinishDialogueKey(rank: number, totalCharacters: number): string {
  if (rank === totalCharacters) return "last";
  if (rank === 1) return "first";
  if (rank === 2) return "second";
  if (rank === 3) return "third";
  return "rest";
}

function pickFinishDialogue(
  newlyFinishedIds: readonly string[],
  finishedIds: string[],
  characters: readonly Character[],
  elapsedTime: number,
): ActiveBubble | null {
  if (newlyFinishedIds.length === 0) return null;

  const finisherId = newlyFinishedIds[0];
  if (finisherId === undefined) return null;

  const finisher = findChar(characters, finisherId);
  if (!finisher) return null;

  const rank = finishedIds.indexOf(finisherId) + 1;
  const key = getFinishDialogueKey(rank, characters.length);
  const pool = FINISH_DIALOGUES[key];
  if (!pool || pool.length === 0) return null;

  return makeBubble(finisher.id, pickRandom(pool), elapsedTime);
}

// ── Event dialogue selection ─────────────────────────────────────────────────

function pickEventDialogue(
  events: readonly GameEvent[],
  characters: readonly Character[],
  finishedIds: string[],
  elapsedTime: number,
): ActiveBubble | null {
  const sorted = [...events].sort(
    (a, b) =>
      (EVENT_CATEGORY_PRIORITY[a.category] ?? 3) - (EVENT_CATEGORY_PRIORITY[b.category] ?? 3),
  );

  for (const event of sorted) {
    const bubble = pickDialogueForEvent(event, characters, finishedIds, elapsedTime);
    if (bubble) return bubble;
  }
  return null;
}

function pickDialogueForEvent(
  event: GameEvent,
  characters: readonly Character[],
  finishedIds: string[],
  elapsedTime: number,
): ActiveBubble | null {
  switch (event.category) {
    case "ultimate":
      return pickUltimateDialogue(event, characters, elapsedTime);
    case "global":
      return pickGlobalDialogue(event, characters, finishedIds, elapsedTime);
    case "skill":
      return pickSkillDialogue(event, characters, elapsedTime);
    case "target":
      return pickTargetDialogue(event, characters, elapsedTime);
    default:
      return null;
  }
}

function pickUltimateDialogue(
  event: GameEvent,
  characters: readonly Character[],
  elapsedTime: number,
): ActiveBubble | null {
  const ultimateType = event.type as UltimateType;
  const specific = ULTIMATE_SPECIFIC_DIALOGUES[ultimateType];

  if (specific?.victim.length && event.targetIds.length > 0) {
    const victimId = pickRandom(event.targetIds);
    const victim = findChar(characters, victimId);
    if (victim) return makeBubble(victim.id, pickRandom(specific.victim), elapsedTime);
  }

  if (specific?.caster.length && event.casterId) {
    const caster = findChar(characters, event.casterId);
    if (caster) return makeBubble(caster.id, pickRandom(specific.caster), elapsedTime);
  }

  if (event.targetIds.length > 0) {
    const victimId = pickRandom(event.targetIds);
    const victim = findChar(characters, victimId);
    if (victim) return makeBubble(victim.id, pickRandom(ULTIMATE_FALLBACK_DIALOGUES), elapsedTime);
  }

  return null;
}

function pickGlobalDialogue(
  event: GameEvent,
  characters: readonly Character[],
  finishedIds: string[],
  elapsedTime: number,
): ActiveBubble | null {
  const globalType = event.type as GlobalEventType;
  const dialogues = GLOBAL_EVENT_DIALOGUES[globalType];
  if (!dialogues || dialogues.length === 0) return null;

  const eligible = characters.filter((c) => !finishedIds.includes(c.id));
  if (eligible.length === 0) return null;

  const speaker = pickRandom(eligible);
  return makeBubble(speaker.id, pickRandom(dialogues), elapsedTime);
}

function pickSkillDialogue(
  event: GameEvent,
  characters: readonly Character[],
  elapsedTime: number,
): ActiveBubble | null {
  const skillType = event.type as SkillType;

  if (GOOD_SKILL_SET.has(event.type)) {
    const pool = SKILL_CASTER_DIALOGUES[skillType];
    if (pool.length > 0 && event.casterId) {
      const caster = findChar(characters, event.casterId);
      if (caster) return makeBubble(caster.id, pickRandom(pool), elapsedTime);
    }
    return null;
  }

  const victimPool: readonly string[] | undefined = SKILL_VICTIM_DIALOGUES[skillType];
  if (victimPool && victimPool.length > 0 && event.targetIds.length > 0) {
    const victimId = event.targetIds[0];
    if (victimId !== undefined) {
      const victim = findChar(characters, victimId);
      if (victim) return makeBubble(victim.id, pickRandom(victimPool), elapsedTime);
    }
  }

  const casterPool = SKILL_CASTER_DIALOGUES[skillType];
  if (casterPool.length > 0 && event.casterId) {
    const caster = findChar(characters, event.casterId);
    if (caster) return makeBubble(caster.id, pickRandom(casterPool), elapsedTime);
  }

  return null;
}

function pickTargetDialogue(
  event: GameEvent,
  characters: readonly Character[],
  elapsedTime: number,
): ActiveBubble | null {
  const targetType = event.type as TargetEventType;
  const dialogues = TARGET_EVENT_DIALOGUES[targetType];
  if (!dialogues || dialogues.length === 0 || event.targetIds.length === 0) return null;

  const victimId = event.targetIds[0];
  if (victimId === undefined) return null;

  const victim = findChar(characters, victimId);
  if (!victim) return null;

  return makeBubble(victim.id, pickRandom(dialogues), elapsedTime);
}

// ── Situation dialogue selection ─────────────────────────────────────────────

function pickSituationDialogue(
  characters: readonly Character[],
  rankings: string[],
  finishedIds: string[],
  elapsedTime: number,
): ActiveBubble | null {
  if (prevRankings.length === 0) return null;

  const activeRankings = rankings.filter((id) => !finishedIds.includes(id));
  const activePrev = prevRankings.filter((id) => !finishedIds.includes(id));
  if (activeRankings.length < 2) return null;

  // 1. Comeback: was rank >= 3 (0-indexed) and now rank === 0
  for (const id of activeRankings) {
    const currentRank = activeRankings.indexOf(id);
    const prevRank = activePrev.indexOf(id);
    if (prevRank >= COMEBACK_PREV_RANK_MIN && currentRank === 0) {
      const char = findChar(characters, id);
      if (char) return makeBubble(char.id, pickRandom(COMEBACK_DIALOGUES), elapsedTime);
    }
  }

  // 2. Overtake: rank improved (lower index = better rank)
  for (const id of activeRankings) {
    const currentRank = activeRankings.indexOf(id);
    const prevRank = activePrev.indexOf(id);
    if (prevRank === -1) continue;
    if (currentRank < prevRank) {
      const char = findChar(characters, id);
      if (char) return makeBubble(char.id, pickRandom(OVERTAKE_DIALOGUES), elapsedTime);
    }
  }

  // 3. Overtaken: rank dropped
  for (const id of activeRankings) {
    const currentRank = activeRankings.indexOf(id);
    const prevRank = activePrev.indexOf(id);
    if (prevRank === -1) continue;
    if (currentRank > prevRank) {
      const char = findChar(characters, id);
      if (char) return makeBubble(char.id, pickRandom(OVERTAKEN_DIALOGUES), elapsedTime);
    }
  }

  // 4. Close race: top-2 gap < threshold and leader past progress minimum
  const firstId = activeRankings[0];
  const secondId = activeRankings[1];
  if (firstId !== undefined && secondId !== undefined) {
    const first = findChar(characters, firstId);
    const second = findChar(characters, secondId);
    if (first && second) {
      const gap = Math.abs(first.progress - second.progress);
      if (gap < SLOWMO_THRESHOLD && first.progress > SLOWMO_PROGRESS_MIN) {
        const speaker = pickRandom([first, second]);
        return makeBubble(speaker.id, pickRandom(CLOSE_RACE_DIALOGUES), elapsedTime);
      }
    }
  }

  // 5. First place or last place (coin flip)
  if (Math.random() < 0.5) {
    const fId = activeRankings[0];
    if (fId !== undefined) {
      const char = findChar(characters, fId);
      if (char) return makeBubble(char.id, pickRandom(FIRST_PLACE_DIALOGUES), elapsedTime);
    }
  } else {
    const lId = activeRankings[activeRankings.length - 1];
    if (lId !== undefined) {
      const char = findChar(characters, lId);
      if (char) return makeBubble(char.id, pickRandom(LAST_PLACE_DIALOGUES), elapsedTime);
    }
  }

  return null;
}

// ── Idle dialogue selection ──────────────────────────────────────────────────

function pickIdleDialogue(
  characters: readonly Character[],
  finishedIds: string[],
  elapsedTime: number,
): ActiveBubble | null {
  const eligible = characters.filter((c) => !finishedIds.includes(c.id));
  if (eligible.length === 0) return null;

  const speaker = pickRandom(eligible);
  return makeBubble(speaker.id, pickRandom(IDLE_DIALOGUES), elapsedTime);
}

// ── Public API ───────────────────────────────────────────────────────────────

export function initDialogueScheduler(startTime: number): void {
  nextDialogueAt = startTime + randomInRange(DIALOGUE_INTERVAL_MIN, DIALOGUE_INTERVAL_MAX);
  prevRankings = [];
}

export function resetDialogueScheduler(): void {
  nextDialogueAt = 0;
  prevRankings = [];
}

export function processDialogues(input: DialogueTickInput): DialogueTickResult {
  const {
    characters,
    rankings,
    finishedIds,
    newlyFinishedIds,
    elapsedTime,
    activeBubble,
    newEvents,
  } = input;

  const result = resolveDialogue(
    characters,
    rankings,
    finishedIds,
    newlyFinishedIds,
    elapsedTime,
    activeBubble,
    newEvents,
  );
  prevRankings = rankings;
  return result;
}

function resolveDialogue(
  characters: readonly Character[],
  rankings: string[],
  finishedIds: string[],
  newlyFinishedIds: readonly string[],
  elapsedTime: number,
  activeBubble: ActiveBubble | null,
  newEvents: readonly GameEvent[],
): DialogueTickResult {
  // 0. Finish dialogue -- always override on arrival
  if (newlyFinishedIds.length > 0) {
    const finishBubble = pickFinishDialogue(newlyFinishedIds, finishedIds, characters, elapsedTime);
    if (finishBubble) {
      return { activeBubble: finishBubble };
    }
  }

  // 1. Try event dialogue first (may override existing bubble for high-priority)
  if (newEvents.length > 0) {
    const hasHighPriority = newEvents.some(
      (e) => e.category === "ultimate" || e.category === "global",
    );
    const eventBubble = pickEventDialogue(newEvents, characters, finishedIds, elapsedTime);

    if (eventBubble) {
      if (hasHighPriority) {
        return { activeBubble: eventBubble };
      }
      if (activeBubble === null || elapsedTime >= activeBubble.endTime) {
        advanceSchedule(elapsedTime);
        return { activeBubble: eventBubble };
      }
    }
  }

  // 2. Current bubble still valid — keep it
  if (activeBubble !== null && elapsedTime < activeBubble.endTime) {
    return { activeBubble };
  }

  // 3. Not yet time for a scheduled dialogue
  if (elapsedTime < nextDialogueAt) {
    return { activeBubble: null };
  }

  // 4. Try situation dialogue
  const situationBubble = pickSituationDialogue(characters, rankings, finishedIds, elapsedTime);
  if (situationBubble) {
    advanceSchedule(elapsedTime);
    return { activeBubble: situationBubble };
  }

  // 5. Fall back to idle dialogue
  const idleBubble = pickIdleDialogue(characters, finishedIds, elapsedTime);
  advanceSchedule(elapsedTime);
  return { activeBubble: idleBubble };
}

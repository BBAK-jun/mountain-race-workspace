import type {
  Character,
  EventLog,
  GameEvent,
  GlobalEventType,
  SkillType,
  TargetEventType,
  UltimateType,
} from "@mountain-race/types";
import {
  GLOBAL_EVENT_CHANCE,
  GLOBAL_EVENT_INTERVAL_MAX,
  GLOBAL_EVENT_INTERVAL_MIN,
  GLOBAL_EFFECTS,
  GOOD_EVENT_CHANCE_MAX,
  GOOD_EVENT_CHANCE_MIN,
  BAD_EVENT_CHANCE_MAX,
  BAD_EVENT_CHANCE_MIN,
  RAIN_SLIP_CHANCE,
  RAIN_SLIP_STUN_MS,
  SKILL_EFFECTS,
  SKILL_INTERVAL_MAX,
  SKILL_INTERVAL_MIN,
  SLOW_MULTIPLIER,
  TARGET_EFFECTS,
  TARGET_EVENT_INTERVAL_MAX,
  TARGET_EVENT_INTERVAL_MIN,
  ULTIMATE_CHANCE_MAX,
  ULTIMATE_CHANCE_MIN,
  ULTIMATE_EFFECTS,
  ULTIMATE_INTERVAL_MAX,
  ULTIMATE_INTERVAL_MIN,
  ULTIMATE_MAX,
} from "./balance";
import {
  formatMessage,
  GLOBAL_EVENT_MESSAGES,
  SKILL_MESSAGES,
  TARGET_EVENT_MESSAGES,
  ULTIMATE_ANNOUNCE_MESSAGE,
  ULTIMATE_MESSAGES,
} from "./data/eventMessages";

// ── Public interfaces ────────────────────────────────────────────────────────

export interface EventTickInput {
  characters: Character[];
  rankings: string[];
  finishedIds: string[];
  elapsedTime: number;
  activeGlobalEvent: GlobalEventType | null;
  globalEventEndTime: number;
  ultimateCount: number;
}

export interface EventTickResult {
  characters: Character[];
  newEvents: GameEvent[];
  newLogs: EventLog[];
  activeGlobalEvent: GlobalEventType | null;
  globalEventEndTime: number;
  ultimateCount: number;
}

// ── Module-level scheduler state ─────────────────────────────────────────────

let nextSkillAt = 0;
let nextUltimateAt = 0;
let nextGlobalAt = 0;
let nextTargetAt = 0;
let eventIdCounter = 0;
let logIdCounter = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: readonly T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error("pickRandom called on empty array");
  return item;
}

function nextEventId(): string {
  eventIdCounter += 1;
  return `evt_${eventIdCounter}`;
}

function nextLogId(): string {
  logIdCounter += 1;
  return `log_${logIdCounter}`;
}

function getRankPressure(rankIndex: number, total: number): number {
  if (total <= 1) return 0;
  return rankIndex / (total - 1);
}

function getRankChances(
  rankIndex: number,
  total: number,
): { goodEventChance: number; badEventChance: number; ultimateChance: number } {
  const t = getRankPressure(rankIndex, total);
  return {
    goodEventChance: lerp(GOOD_EVENT_CHANCE_MIN, GOOD_EVENT_CHANCE_MAX, t),
    badEventChance: lerp(BAD_EVENT_CHANCE_MIN, BAD_EVENT_CHANCE_MAX, t),
    ultimateChance: lerp(ULTIMATE_CHANCE_MIN, ULTIMATE_CHANCE_MAX, t),
  };
}

function findChar(characters: readonly Character[], id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}

function requireChar(characters: readonly Character[], id: string): Character {
  const char = characters.find((c) => c.id === id);
  if (!char) throw new Error(`Character not found: ${id}`);
  return char;
}

function replaceChar(characters: Character[], updated: Character): Character[] {
  return characters.map((c) => (c.id === updated.id ? updated : c));
}

// ── Status application ───────────────────────────────────────────────────────

function applyStun(char: Character, durationMs: number, elapsedTime: number): Character {
  if (char.status === "shielded") {
    return { ...char, status: "running" };
  }
  return {
    ...char,
    status: "stunned",
    stunEndTime: elapsedTime + durationMs / 1000,
    stats: { ...char.stats, hitCount: char.stats.hitCount + 1 },
  };
}

function applyBoost(
  char: Character,
  durationMs: number,
  speedMult: number,
  elapsedTime: number,
): Character {
  return {
    ...char,
    status: "boosted",
    speed: char.baseSpeed * speedMult,
    stunEndTime: elapsedTime + durationMs / 1000,
  };
}

function applySliding(char: Character, durationMs: number, elapsedTime: number): Character {
  if (char.status === "shielded") {
    return { ...char, status: "running" };
  }
  return {
    ...char,
    status: "sliding",
    speed: char.baseSpeed * SLOW_MULTIPLIER,
    stunEndTime: elapsedTime + durationMs / 1000,
    stats: { ...char.stats, hitCount: char.stats.hitCount + 1 },
  };
}

function applySetback(char: Character, amount: number): Character {
  const newProgress = Math.max(0, char.progress - amount);
  return {
    ...char,
    progress: newProgress,
    stats: { ...char.stats, setbackTotal: char.stats.setbackTotal + amount },
  };
}

// ── Event pool constants ─────────────────────────────────────────────────────

const GOOD_SKILLS: readonly SkillType[] = ["booster", "wind_ride"];
const BAD_SKILLS: readonly SkillType[] = ["ankle_grab", "trap", "trip"];
const GLOBAL_EVENT_POOL: readonly GlobalEventType[] = ["rain", "fog", "volcanic_ash", "lightning"];
const TARGET_EVENT_POOL: readonly TargetEventType[] = ["deer", "rockfall", "snake", "pit"];
const ULTIMATE_POOL: readonly UltimateType[] = [
  "boulder",
  "landslide",
  "ice",
  "helicopter",
  "bear",
];

// ── Skill event ──────────────────────────────────────────────────────────────

interface InternalEventResult {
  characters: Character[];
  event: GameEvent;
  logs: EventLog[];
}

function checkSkillEvent(
  characters: Character[],
  rankings: string[],
  finishedIds: string[],
  elapsedTime: number,
): InternalEventResult | null {
  const activeRankings = rankings.filter((id) => !finishedIds.includes(id));
  const eligible = characters.filter((c) => !finishedIds.includes(c.id) && c.status !== "stunned");
  if (eligible.length === 0) return null;

  const caster = pickRandom(eligible);
  const rankIndex = activeRankings.indexOf(caster.id);
  const { goodEventChance, badEventChance } = getRankChances(rankIndex, activeRankings.length);

  const roll = Math.random();
  let skillType: SkillType;

  if (roll < goodEventChance) {
    skillType = pickRandom(GOOD_SKILLS);
  } else if (roll < goodEventChance + badEventChance) {
    skillType = pickRandom(BAD_SKILLS);
  } else {
    return null;
  }

  const effect = SKILL_EFFECTS[skillType];
  let updated = [...characters];
  const targetIds: string[] = [];
  let targetName: string | undefined;

  switch (effect.target) {
    case "self": {
      if (skillType === "trip") {
        const stunned = applyStun(caster, effect.durationMs, elapsedTime);
        updated = replaceChar(updated, stunned);
      } else {
        const boosted = applyBoost(caster, effect.durationMs, effect.speedMult ?? 1, elapsedTime);
        updated = replaceChar(updated, boosted);
      }
      targetIds.push(caster.id);
      break;
    }
    case "ahead": {
      if (rankIndex <= 0) return null;
      const tid = activeRankings[rankIndex - 1];
      if (!tid) return null;
      const target = findChar(characters, tid);
      if (!target || target.status === "stunned") return null;
      const stunned = applyStun(target, effect.durationMs, elapsedTime);
      updated = replaceChar(updated, stunned);
      targetIds.push(tid);
      targetName = target.name;
      break;
    }
    case "behind": {
      if (rankIndex >= activeRankings.length - 1) return null;
      const tid = activeRankings[rankIndex + 1];
      if (!tid) return null;
      const target = findChar(characters, tid);
      if (!target || target.status === "stunned") return null;
      const stunned = applyStun(target, effect.durationMs, elapsedTime);
      updated = replaceChar(updated, stunned);
      targetIds.push(tid);
      targetName = target.name;
      break;
    }
  }

  const logText = formatMessage(SKILL_MESSAGES[skillType], caster.name, targetName);

  return {
    characters: updated,
    event: {
      id: nextEventId(),
      type: skillType,
      category: "skill",
      casterId: caster.id,
      targetIds,
      timestamp: elapsedTime,
      duration: effect.durationMs / 1000,
    },
    logs: [{ id: nextLogId(), text: logText, timestamp: elapsedTime }],
  };
}

// ── Ultimate event ───────────────────────────────────────────────────────────

function checkUltimateEvent(
  characters: Character[],
  rankings: string[],
  finishedIds: string[],
  elapsedTime: number,
): (InternalEventResult & { casterId: string }) | null {
  const activeRankings = rankings.filter((id) => !finishedIds.includes(id));
  if (activeRankings.length < 2) return null;

  for (let i = activeRankings.length - 1; i >= 0; i--) {
    const charId = activeRankings[i];
    if (charId === undefined) continue;

    const char = findChar(characters, charId);
    if (!char || char.status === "stunned") continue;

    const { ultimateChance } = getRankChances(i, activeRankings.length);
    if (Math.random() >= ultimateChance) continue;

    const ultimateType = pickRandom(ULTIMATE_POOL);
    const effect = ULTIMATE_EFFECTS[ultimateType];
    let updated = [...characters];
    const targetIds: string[] = [];

    switch (effect.target) {
      case "all_ahead": {
        for (let j = 0; j < i; j++) {
          const tid = activeRankings[j];
          if (tid === undefined) continue;
          const target = findChar(updated, tid);
          if (!target) continue;
          let modified = applyStun(target, effect.durationMs ?? 2500, elapsedTime);
          if (effect.setback) modified = applySetback(modified, effect.setback);
          updated = replaceChar(updated, modified);
          targetIds.push(tid);
        }
        break;
      }
      case "nearby_15pct": {
        const NEARBY_RANGE = 0.15;
        for (const c of characters) {
          if (c.id === charId || finishedIds.includes(c.id)) continue;
          if (Math.abs(c.progress - char.progress) <= NEARBY_RANGE) {
            const found = findChar(updated, c.id);
            if (!found) continue;
            let modified = found;
            if (effect.setback) modified = applySetback(modified, effect.setback);
            if (effect.stunDurationMs)
              modified = applyStun(modified, effect.stunDurationMs, elapsedTime);
            updated = replaceChar(updated, modified);
            targetIds.push(c.id);
          }
        }
        break;
      }
      case "ahead_20pct": {
        const AHEAD_RANGE = 0.2;
        for (const c of characters) {
          if (c.id === charId || finishedIds.includes(c.id)) continue;
          const diff = c.progress - char.progress;
          if (diff > 0 && diff <= AHEAD_RANGE) {
            const found = findChar(updated, c.id);
            if (!found) continue;
            const modified = applySliding(found, effect.durationMs ?? 3000, elapsedTime);
            updated = replaceChar(updated, modified);
            targetIds.push(c.id);
          }
        }
        break;
      }
      case "first_place": {
        const firstId = activeRankings[0];
        if (!firstId || firstId === charId) break;
        const first = findChar(updated, firstId);
        if (!first) break;
        let modified = first;
        if (effect.setback) modified = applySetback(modified, effect.setback);
        if (effect.stunDurationMs)
          modified = applyStun(modified, effect.stunDurationMs, elapsedTime);
        updated = replaceChar(updated, modified);
        targetIds.push(firstId);
        break;
      }
      case "random_one": {
        const others = characters.filter((c) => c.id !== charId && !finishedIds.includes(c.id));
        if (others.length === 0) break;
        const victim = pickRandom(others);
        const found = findChar(updated, victim.id);
        if (!found) break;
        let modified = found;
        if (effect.setback) modified = applySetback(modified, effect.setback);
        if (effect.stunDurationMs)
          modified = applyStun(modified, effect.stunDurationMs, elapsedTime);
        updated = replaceChar(updated, modified);
        targetIds.push(victim.id);
        break;
      }
    }

    const casterRef = requireChar(updated, charId);
    const casterUpdated: Character = {
      ...casterRef,
      stats: { ...casterRef.stats, ultimateUsed: casterRef.stats.ultimateUsed + 1 },
    };
    updated = replaceChar(updated, casterUpdated);

    const announceText = formatMessage(ULTIMATE_ANNOUNCE_MESSAGE, char.name);
    const detailText = formatMessage(ULTIMATE_MESSAGES[ultimateType], char.name);

    const duration = (effect.durationMs ?? effect.stunDurationMs ?? 2000) / 1000;

    return {
      characters: updated,
      event: {
        id: nextEventId(),
        type: ultimateType,
        category: "ultimate",
        casterId: charId,
        targetIds,
        timestamp: elapsedTime,
        duration,
      },
      logs: [
        { id: nextLogId(), text: announceText, timestamp: elapsedTime },
        { id: nextLogId(), text: detailText, timestamp: elapsedTime },
      ],
      casterId: charId,
    };
  }

  return null;
}

// ── Global event ─────────────────────────────────────────────────────────────

interface GlobalEventResult extends InternalEventResult {
  globalEventType: GlobalEventType;
  globalEventEndTime: number;
}

function checkGlobalEvent(
  characters: Character[],
  finishedIds: string[],
  elapsedTime: number,
): GlobalEventResult | null {
  if (Math.random() >= GLOBAL_EVENT_CHANCE) return null;

  const eventType = pickRandom(GLOBAL_EVENT_POOL);
  const effect = GLOBAL_EFFECTS[eventType];
  let updated = [...characters];
  const targetIds: string[] = [];

  switch (eventType) {
    case "rain": {
      for (const c of characters) {
        if (finishedIds.includes(c.id) || c.status === "stunned") continue;
        targetIds.push(c.id);
        if (Math.random() < RAIN_SLIP_CHANCE) {
          const found = findChar(updated, c.id);
          if (found) {
            const stunned = applyStun(found, RAIN_SLIP_STUN_MS, elapsedTime);
            updated = replaceChar(updated, stunned);
          }
        }
      }
      break;
    }
    case "fog": {
      for (const c of characters) {
        if (!finishedIds.includes(c.id)) targetIds.push(c.id);
      }
      break;
    }
    case "volcanic_ash": {
      for (const c of characters) {
        if (!finishedIds.includes(c.id)) targetIds.push(c.id);
      }
      break;
    }
    case "lightning": {
      const eligible = characters.filter(
        (c) => !finishedIds.includes(c.id) && c.status !== "stunned",
      );
      if (eligible.length > 0) {
        const victim = pickRandom(eligible);
        const found = findChar(updated, victim.id);
        if (found) {
          const stunned = applyStun(found, effect.stunDurationMs ?? 2000, elapsedTime);
          updated = replaceChar(updated, stunned);
          targetIds.push(victim.id);
        }
      }
      break;
    }
  }

  const msgTemplates = GLOBAL_EVENT_MESSAGES[eventType];
  const template = pickRandom(msgTemplates);
  const firstTargetId = targetIds[0];
  const victimName =
    eventType === "lightning" && firstTargetId !== undefined
      ? (findChar(characters, firstTargetId)?.name ?? "???")
      : "";
  const logText = formatMessage(template, victimName);

  return {
    characters: updated,
    event: {
      id: nextEventId(),
      type: eventType,
      category: "global",
      targetIds,
      timestamp: elapsedTime,
      duration: effect.durationMs / 1000,
    },
    logs: [{ id: nextLogId(), text: logText, timestamp: elapsedTime }],
    globalEventType: eventType,
    globalEventEndTime: elapsedTime + effect.durationMs / 1000,
  };
}

// ── Target event ─────────────────────────────────────────────────────────────

function checkTargetEvent(
  characters: Character[],
  finishedIds: string[],
  elapsedTime: number,
): InternalEventResult | null {
  const eligible = characters.filter((c) => !finishedIds.includes(c.id) && c.status !== "stunned");
  if (eligible.length === 0) return null;

  const victim = pickRandom(eligible);
  const eventType = pickRandom(TARGET_EVENT_POOL);
  const effect = TARGET_EFFECTS[eventType];

  let modified = applyStun(victim, effect.stunDurationMs, elapsedTime);
  if (effect.setback) modified = applySetback(modified, effect.setback);

  const updated = replaceChar([...characters], modified);
  const msgTemplates = TARGET_EVENT_MESSAGES[eventType];
  const template = pickRandom(msgTemplates);
  const logText = formatMessage(template, victim.name);

  return {
    characters: updated,
    event: {
      id: nextEventId(),
      type: eventType,
      category: "target",
      targetIds: [victim.id],
      timestamp: elapsedTime,
      duration: effect.stunDurationMs / 1000,
    },
    logs: [{ id: nextLogId(), text: logText, timestamp: elapsedTime }],
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function initEventScheduler(startTime: number): void {
  nextSkillAt = startTime + randomInRange(SKILL_INTERVAL_MIN, SKILL_INTERVAL_MAX);
  nextUltimateAt = startTime + randomInRange(ULTIMATE_INTERVAL_MIN, ULTIMATE_INTERVAL_MAX);
  nextGlobalAt = startTime + randomInRange(GLOBAL_EVENT_INTERVAL_MIN, GLOBAL_EVENT_INTERVAL_MAX);
  nextTargetAt = startTime + randomInRange(TARGET_EVENT_INTERVAL_MIN, TARGET_EVENT_INTERVAL_MAX);
  eventIdCounter = 0;
  logIdCounter = 0;
}

export function resetEventScheduler(): void {
  nextSkillAt = 0;
  nextUltimateAt = 0;
  nextGlobalAt = 0;
  nextTargetAt = 0;
  eventIdCounter = 0;
  logIdCounter = 0;
}

export function processEvents(input: EventTickInput): EventTickResult {
  const { rankings, finishedIds, elapsedTime } = input;

  let characters = input.characters;
  let activeGlobalEvent = input.activeGlobalEvent;
  let globalEventEndTime = input.globalEventEndTime;
  let ultimateCount = input.ultimateCount;
  const newEvents: GameEvent[] = [];
  const newLogs: EventLog[] = [];

  const activeCount = characters.filter((c) => !finishedIds.includes(c.id)).length;
  if (activeCount === 0) {
    return { characters, newEvents, newLogs, activeGlobalEvent, globalEventEndTime, ultimateCount };
  }

  // ── End expired global event ─────────────────────────────────────────────
  if (activeGlobalEvent !== null && elapsedTime >= globalEventEndTime) {
    activeGlobalEvent = null;
    globalEventEndTime = 0;
  }

  // ── Skill check ──────────────────────────────────────────────────────────
  if (elapsedTime >= nextSkillAt) {
    const result = checkSkillEvent(characters, rankings, finishedIds, elapsedTime);
    if (result) {
      characters = result.characters;
      newEvents.push(result.event);
      newLogs.push(...result.logs);
    }
    nextSkillAt = elapsedTime + randomInRange(SKILL_INTERVAL_MIN, SKILL_INTERVAL_MAX);
  }

  // ── Ultimate check ───────────────────────────────────────────────────────
  if (elapsedTime >= nextUltimateAt && ultimateCount < ULTIMATE_MAX) {
    const result = checkUltimateEvent(characters, rankings, finishedIds, elapsedTime);
    if (result) {
      characters = result.characters;
      newEvents.push(result.event);
      newLogs.push(...result.logs);
      ultimateCount += 1;
    }
    nextUltimateAt = elapsedTime + randomInRange(ULTIMATE_INTERVAL_MIN, ULTIMATE_INTERVAL_MAX);
  }

  // ── Global event check ───────────────────────────────────────────────────
  if (elapsedTime >= nextGlobalAt && activeGlobalEvent === null) {
    const result = checkGlobalEvent(characters, finishedIds, elapsedTime);
    if (result) {
      characters = result.characters;
      activeGlobalEvent = result.globalEventType;
      globalEventEndTime = result.globalEventEndTime;
      newEvents.push(result.event);
      newLogs.push(...result.logs);
    }
    nextGlobalAt =
      elapsedTime + randomInRange(GLOBAL_EVENT_INTERVAL_MIN, GLOBAL_EVENT_INTERVAL_MAX);
  }

  // ── Target event check ───────────────────────────────────────────────────
  if (elapsedTime >= nextTargetAt) {
    const result = checkTargetEvent(characters, finishedIds, elapsedTime);
    if (result) {
      characters = result.characters;
      newEvents.push(result.event);
      newLogs.push(...result.logs);
    }
    nextTargetAt =
      elapsedTime + randomInRange(TARGET_EVENT_INTERVAL_MIN, TARGET_EVENT_INTERVAL_MAX);
  }

  return {
    characters,
    newEvents,
    newLogs,
    activeGlobalEvent,
    globalEventEndTime,
    ultimateCount,
  };
}

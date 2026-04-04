import { create } from "zustand";
import {
  COUNTDOWN_SECONDS,
  FINISH_LINE,
  GAME_SPEED,
  INITIAL_PLAYER_COUNT,
  JITTER_RANGE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  RACE_END_GRACE_PERIOD_MS,
  VOLCANIC_ASH_SPEED_MULT,
} from "../constants/balance";
import {
  initDialogueScheduler,
  processDialogues,
  resetDialogueScheduler,
} from "../systems/DialogueSystem";
import { initEventScheduler, processEvents, resetEventScheduler } from "../systems/EventSystem";
import type {
  ActiveBubble,
  CameraMode,
  Character,
  ColorPreset,
  EventLog,
  GameEvent,
  GameState,
  GlobalEventType,
} from "../types";

// ── Color presets (8 colors from Product PRD) ──────────────────────────────

const COLOR_PRESETS: readonly ColorPreset[] = [
  { jacket: "#FF69B4", inner: "#FFFFFF", pants: "#000000", buff: "#C71585" },
  { jacket: "#4169E1", inner: "#000000", pants: "#333333", buff: "#00008B" },
  { jacket: "#2E8B57", inner: "#FFFFFF", pants: "#444444", buff: "#006400" },
  { jacket: "#9370DB", inner: "#CCCCCC", pants: "#000000", buff: "#4B0082" },
  { jacket: "#FF8C00", inner: "#FFFFFF", pants: "#333333", buff: "#D2691E" },
  { jacket: "#DC143C", inner: "#000000", pants: "#444444", buff: "#8B0000" },
  { jacket: "#FFD700", inner: "#000000", pants: "#333333", buff: "#B8860B" },
  { jacket: "#00CED1", inner: "#FFFFFF", pants: "#000000", buff: "#008B8B" },
];

const DEFAULT_NAMES = [
  "산악인 1",
  "산악인 2",
  "산악인 3",
  "산악인 4",
  "산악인 5",
  "산악인 6",
  "산악인 7",
  "산악인 8",
] as const;

const DEFAULT_COLOR: ColorPreset = {
  jacket: "#FF69B4",
  inner: "#FFFFFF",
  pants: "#000000",
  buff: "#C71585",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getColorPreset(index: number): ColorPreset {
  return COLOR_PRESETS[index % COLOR_PRESETS.length] ?? DEFAULT_COLOR;
}

let idCounter = 0;
let lastRankChangeCheckTime = 0;
const RANK_CHANGE_CHECK_INTERVAL = 0.5;
function nextId(): string {
  idCounter += 1;
  return `char_${idCounter}`;
}

function createCharacter(index: number): Character {
  return {
    id: nextId(),
    name: DEFAULT_NAMES[index] ?? `산악인 ${index + 1}`,
    color: getColorPreset(index),
    faceImage: null,
    progress: 0,
    speed: GAME_SPEED,
    baseSpeed: GAME_SPEED,
    status: "running",
    stunEndTime: 0,
    stats: { hitCount: 0, setbackTotal: 0, ultimateUsed: 0, rankChanges: 0 },
    finishTime: null,
  };
}

function computeRankings(characters: Character[]): string[] {
  return [...characters].sort((a, b) => b.progress - a.progress).map((c) => c.id);
}

function computeFinalRankings(characters: Character[], finishedIds: string[]): string[] {
  const unfinished = characters
    .filter((c) => !finishedIds.includes(c.id))
    .sort((a, b) => b.progress - a.progress)
    .map((c) => c.id);
  return [...finishedIds, ...unfinished];
}

// ── Initial state factory ──────────────────────────────────────────────────

function createInitialCharacters(): Character[] {
  return Array.from({ length: INITIAL_PLAYER_COUNT }, (_, i) => createCharacter(i));
}

interface InitialState {
  characters: Character[];
  setupComplete: boolean;
  hasResult: boolean;
  isRacing: boolean;
  isPaused: boolean;
  countdown: number;
  elapsedTime: number;
  rankings: string[];
  finishedIds: string[];
  firstFinishTime: number | null;
  events: GameEvent[];
  activeGlobalEvent: GlobalEventType | null;
  globalEventEndTime: number;
  ultimateCount: number;
  eventLogs: EventLog[];
  activeBubble: ActiveBubble | null;
  cameraMode: CameraMode;
  cameraTarget: string | null;
}

function getInitialState(): InitialState {
  const characters = createInitialCharacters();
  return {
    characters,
    setupComplete: false,
    hasResult: false,
    isRacing: false,
    isPaused: false,
    countdown: COUNTDOWN_SECONDS,
    elapsedTime: 0,
    rankings: computeRankings(characters),
    finishedIds: [],
    firstFinishTime: null,
    events: [],
    activeGlobalEvent: null,
    globalEventEndTime: 0,
    ultimateCount: 0,
    eventLogs: [],
    activeBubble: null,
    cameraMode: "follow",
    cameraTarget: null,
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  ...getInitialState(),

  // ── Setup actions ────────────────────────────────────────────────────────

  addCharacter: () => {
    set((state) => {
      if (state.characters.length >= MAX_PLAYERS) return state;
      const newChar = createCharacter(state.characters.length);
      const characters = [...state.characters, newChar];
      return { characters, rankings: computeRankings(characters) };
    });
  },

  removeCharacter: (id: string) => {
    set((state) => {
      if (state.characters.length <= MIN_PLAYERS) return state;
      const characters = state.characters.filter((c) => c.id !== id);
      return { characters, rankings: computeRankings(characters) };
    });
  },

  updateCharacter: (id: string, partial: Partial<Character>) => {
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
  },

  finalizeSetup: () => {
    const { characters } = get();
    if (characters.length < MIN_PLAYERS) return;
    set({ setupComplete: true });
  },

  // ── Race lifecycle ───────────────────────────────────────────────────────

  startRace: () => {
    if (get().isRacing) return;
    const { characters } = get();
    const resetCharacters = characters.map((c) => ({
      ...c,
      progress: 0,
      speed: c.baseSpeed,
      status: "running" as const,
      stunEndTime: 0,
      stats: { hitCount: 0, setbackTotal: 0, ultimateUsed: 0, rankChanges: 0 },
      finishTime: null,
    }));
    initEventScheduler(0);
    initDialogueScheduler(0);
    lastRankChangeCheckTime = 0;
    set({
      isRacing: true,
      countdown: 0,
      hasResult: false,
      elapsedTime: 0,
      finishedIds: [],
      firstFinishTime: null,
      events: [],
      eventLogs: [],
      activeGlobalEvent: null,
      globalEventEndTime: 0,
      ultimateCount: 0,
      activeBubble: null,
      characters: resetCharacters,
      rankings: computeRankings(resetCharacters),
    });
  },

  finishRace: () => {
    const { characters, finishedIds } = get();
    set({
      isRacing: false,
      hasResult: true,
      rankings: computeFinalRankings(characters, finishedIds),
    });
  },

  resetGame: () => {
    idCounter = 0;
    lastRankChangeCheckTime = 0;
    resetEventScheduler();
    resetDialogueScheduler();
    set(getInitialState());
  },

  tick: (deltaTime: number) => {
    const state = get();
    if (!state.isRacing || state.isPaused) return;

    const elapsedTime = state.elapsedTime + deltaTime;

    const isGlobalEventActive =
      state.activeGlobalEvent !== null && elapsedTime < state.globalEventEndTime;
    const ashActive = isGlobalEventActive && state.activeGlobalEvent === "volcanic_ash";

    // 1. Status recovery + movement
    const movedCharacters = state.characters.map((c) => {
      if (state.finishedIds.includes(c.id)) return c;

      if (c.status === "stunned") {
        if (elapsedTime >= c.stunEndTime) {
          return { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
        }
        return c;
      }

      let char = c;
      if (c.status !== "running" && c.stunEndTime > 0 && elapsedTime >= c.stunEndTime) {
        char = { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
      }

      const ashMult = ashActive ? VOLCANIC_ASH_SPEED_MULT : 1;
      const jitter = 1 + (Math.random() - 0.5) * JITTER_RANGE;
      const progress = char.progress + char.speed * deltaTime * jitter * ashMult;
      return { ...char, progress };
    });

    // 2. Lock newly finished characters before event processing.
    //    Sort by unclamped progress so same-tick finishers get accurate tie-break.
    const newlyFinishedChars = movedCharacters
      .filter((c) => c.progress >= FINISH_LINE && !state.finishedIds.includes(c.id))
      .sort((a, b) => b.progress - a.progress);
    const newlyFinishedIds = newlyFinishedChars.map((c) => c.id);
    const finishedIds = [...state.finishedIds, ...newlyFinishedIds];

    // 2.5. Record finishTime + clamp progress to [0, 1] after tie-break is resolved
    const firstFinishTime =
      state.firstFinishTime ?? (newlyFinishedIds.length > 0 ? elapsedTime : null);
    const withFinishTimes = movedCharacters.map((c) => {
      const clampedProgress = Math.min(c.progress, 1);
      if (newlyFinishedIds.includes(c.id)) {
        return { ...c, progress: clampedProgress, finishTime: elapsedTime };
      }
      return clampedProgress !== c.progress ? { ...c, progress: clampedProgress } : c;
    });

    // 3. Ranking
    const rankings = computeRankings(withFinishTimes);

    // 3.5 Track rank changes (throttled to avoid per-frame jitter noise)
    let trackedCharacters = withFinishTimes;
    if (elapsedTime - lastRankChangeCheckTime >= RANK_CHANGE_CHECK_INTERVAL) {
      lastRankChangeCheckTime = elapsedTime;
      const prevRankings = state.rankings;
      trackedCharacters = withFinishTimes.map((c) => {
        if (finishedIds.includes(c.id)) return c;
        const prevRank = prevRankings.indexOf(c.id);
        const currRank = rankings.indexOf(c.id);
        if (prevRank === -1 || currRank === -1 || prevRank === currRank) return c;
        return { ...c, stats: { ...c.stats, rankChanges: c.stats.rankChanges + 1 } };
      });
    }

    // 4. Event system — finished characters are protected from setback/stun
    const eventResult = processEvents({
      characters: trackedCharacters,
      rankings,
      finishedIds,
      elapsedTime,
      activeGlobalEvent: state.activeGlobalEvent,
      globalEventEndTime: state.globalEventEndTime,
      ultimateCount: state.ultimateCount,
    });

    // 5. Final state
    const finalCharacters = eventResult.characters;

    // 5.5 Dialogue system
    const dialogueResult = processDialogues({
      characters: finalCharacters,
      rankings: computeRankings(finalCharacters),
      finishedIds,
      elapsedTime,
      activeBubble: state.activeBubble,
      newEvents: eventResult.newEvents,
    });

    // 6. Race end condition: all finished OR grace period expired
    const isAllFinished = finishedIds.length === finalCharacters.length;
    const gracePeriodSec = RACE_END_GRACE_PERIOD_MS / 1000;
    const isGracePeriodOver =
      firstFinishTime !== null && elapsedTime - firstFinishTime >= gracePeriodSec;
    const shouldEndRace = isAllFinished || isGracePeriodOver;

    const finalRankings = shouldEndRace
      ? computeFinalRankings(finalCharacters, finishedIds)
      : computeRankings(finalCharacters);

    set({
      characters: finalCharacters,
      rankings: finalRankings,
      finishedIds,
      firstFinishTime,
      elapsedTime,
      events: [...state.events, ...eventResult.newEvents],
      eventLogs: [...state.eventLogs, ...eventResult.newLogs],
      activeGlobalEvent: eventResult.activeGlobalEvent,
      globalEventEndTime: eventResult.globalEventEndTime,
      ultimateCount: eventResult.ultimateCount,
      activeBubble: dialogueResult.activeBubble,
      ...(shouldEndRace ? { isRacing: false, hasResult: true } : {}),
    });
  },

  // ── Events ───────────────────────────────────────────────────────────────

  pushEvent: (event: GameEvent) => {
    set((state) => ({ events: [...state.events, event] }));
  },

  // ── Event logs ───────────────────────────────────────────────────────────

  pushLog: (log: EventLog) => {
    set((state) => ({ eventLogs: [...state.eventLogs, log] }));
  },

  // ── Camera ──────────────────────────────────────────────────────────────

  setCameraMode: (mode: CameraMode) => {
    set({ cameraMode: mode });
  },

  setCameraTarget: (id: string | null) => {
    set({ cameraTarget: id });
  },
}));

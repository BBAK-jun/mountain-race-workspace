import { create } from "zustand";
import {
  CAMERA_EVENT_ZOOM_DURATION_SEC,
  CAMERA_FINISH_APPROACH,
  CAMERA_FINISH_REACTION_LIMIT,
  CAMERA_FINISH_SHAKE_DURATION_SEC,
  CAMERA_SHAKE_DURATION_SEC,
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

// ── Color presets (8 hiking outfits) ────────────────────────────────────────

const COLOR_PRESETS: readonly ColorPreset[] = [
  { jacket: "#FF69B4", inner: "#FFFFFF", pants: "#333333", buff: "#CC3355", hat: "#FF69B4" },
  { jacket: "#4488CC", inner: "#222222", pants: "#444444", buff: "#3366AA", hat: "#4488CC" },
  { jacket: "#55BB55", inner: "#EEEEEE", pants: "#555555", buff: "#44AA44", hat: "#55BB55" },
  { jacket: "#8855CC", inner: "#DDDDDD", pants: "#333333", buff: "#7744BB", hat: "#8855CC" },
  { jacket: "#FF6633", inner: "#FFFFFF", pants: "#444444", buff: "#EE5522", hat: "#FF6633" },
  { jacket: "#CC2222", inner: "#222222", pants: "#555555", buff: "#BB1111", hat: "#CC2222" },
  { jacket: "#F0C030", inner: "#333333", pants: "#444444", buff: "#E0B020", hat: "#F0C030" },
  { jacket: "#22BBBB", inner: "#FFFFFF", pants: "#333333", buff: "#11AAAA", hat: "#22BBBB" },
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
  pants: "#333333",
  buff: "#CC3355",
  hat: "#FF69B4",
};

/**
 * 2D UI palette — used for setup screen, ranking bar, progress markers.
 * Separate from 3D outfit colors for better screen readability.
 */
export const UI_PLAYER_COLORS = [
  "#ff6b35",
  "#4ecdc4",
  "#ff69b4",
  "#7c5cfc",
  "#2ecc71",
  "#e74c3c",
  "#f39c12",
  "#1abc9c",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function getColorPreset(index: number): ColorPreset {
  return COLOR_PRESETS[index % COLOR_PRESETS.length] ?? DEFAULT_COLOR;
}

let idCounter = 0;
let lastRankChangeCheckTime = 0;
const RANK_CHANGE_CHECK_INTERVAL = 0.5;

// ── Camera auto-transition scheduler ──────────────────────────────────────

const autoCameraState = {
  endTime: 0,
  nextMode: "follow" as CameraMode,
  finishReactionCount: 0,
  pendingTarget: null as string | null,
};

function resetAutoCameraState(): void {
  autoCameraState.endTime = 0;
  autoCameraState.nextMode = "follow";
  autoCameraState.finishReactionCount = 0;
  autoCameraState.pendingTarget = null;
}

interface AutoCameraResult {
  cameraMode: CameraMode;
  cameraTarget: string | null;
}

interface AutoCameraInput {
  currentMode: CameraMode;
  elapsedTime: number;
  newEvents: readonly GameEvent[];
  rankings: string[];
  finishedIds: string[];
  characters: readonly Character[];
  newlyFinishedIds: readonly string[];
}

function resolveAutoCamera(input: AutoCameraInput): AutoCameraResult | null {
  const {
    currentMode,
    elapsedTime,
    newEvents,
    rankings,
    finishedIds,
    characters,
    newlyFinishedIds,
  } = input;

  if (currentMode === "free") return null;

  // Scheduled transition: shake -> event_zoom -> follow
  if (autoCameraState.endTime > 0 && elapsedTime >= autoCameraState.endTime) {
    if (autoCameraState.nextMode !== "follow") {
      const nextEnd =
        autoCameraState.nextMode === "event_zoom" ? CAMERA_EVENT_ZOOM_DURATION_SEC : 1;
      autoCameraState.endTime = elapsedTime + nextEnd;
      const mode = autoCameraState.nextMode;
      autoCameraState.nextMode = "follow";
      const target = autoCameraState.pendingTarget;
      return { cameraMode: mode, cameraTarget: target };
    }
    autoCameraState.endTime = 0;
    autoCameraState.pendingTarget = null;
    return { cameraMode: "follow", cameraTarget: null };
  }

  // Already in a timed mode -- don't interrupt.
  // If a new finisher arrives during an active shake/zoom, the reaction is deferred
  // until the current sequence ends. finishReactionCount still accumulates so the
  // total reaction budget is tracked correctly.
  if (autoCameraState.endTime > 0 && elapsedTime < autoCameraState.endTime) return null;

  // Finisher reaction -- shake then zoom on finisher, then follow unfinished leader.
  // When multiple characters finish on the same tick, only the first (by unclamped
  // progress) gets the camera reaction and dialogue. This is intentional: same-tick
  // ties are rare and a single celebration keeps the pacing snappy.
  if (
    newlyFinishedIds.length > 0 &&
    autoCameraState.finishReactionCount < CAMERA_FINISH_REACTION_LIMIT
  ) {
    autoCameraState.finishReactionCount += newlyFinishedIds.length;
    const shakeDuration =
      CAMERA_FINISH_SHAKE_DURATION_SEC / Math.max(autoCameraState.finishReactionCount, 1);
    autoCameraState.endTime = elapsedTime + shakeDuration;
    autoCameraState.nextMode = "event_zoom";
    autoCameraState.pendingTarget = newlyFinishedIds[0] ?? null;
    return { cameraMode: "shake", cameraTarget: newlyFinishedIds[0] ?? null };
  }

  // Ultimate or global event -- shake briefly then zoom
  const bigEvent = newEvents.find((e) => e.category === "ultimate" || e.category === "global");
  if (bigEvent) {
    autoCameraState.endTime = elapsedTime + CAMERA_SHAKE_DURATION_SEC;
    autoCameraState.nextMode = "event_zoom";
    const targetId =
      bigEvent.category === "ultimate" && bigEvent.casterId
        ? bigEvent.casterId
        : (bigEvent.targetIds[0] ?? null);
    return { cameraMode: "shake", cameraTarget: targetId };
  }

  // Leader approaching finish line -- sticky until first finish
  const leaderId = rankings[0];
  if (leaderId && !finishedIds.includes(leaderId)) {
    const leader = characters.find((c) => c.id === leaderId);
    if (leader && leader.progress >= CAMERA_FINISH_APPROACH) {
      if (currentMode !== "finish") {
        return { cameraMode: "finish", cameraTarget: null };
      }
      return null;
    }
  }

  return null;
}
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
    resetAutoCameraState();
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
      cameraMode: "follow",
      cameraTarget: null,
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
    resetAutoCameraState();
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
      newlyFinishedIds,
      elapsedTime,
      activeBubble: state.activeBubble,
      newEvents: eventResult.newEvents,
    });

    // 6. Camera auto-transition
    const cameraUpdate = resolveAutoCamera({
      currentMode: state.cameraMode,
      elapsedTime,
      newEvents: eventResult.newEvents,
      rankings: computeRankings(finalCharacters),
      finishedIds,
      characters: finalCharacters,
      newlyFinishedIds,
    });

    // 7. Race end condition: all finished OR grace period expired
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
      ...(cameraUpdate
        ? { cameraMode: cameraUpdate.cameraMode, cameraTarget: cameraUpdate.cameraTarget }
        : {}),
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

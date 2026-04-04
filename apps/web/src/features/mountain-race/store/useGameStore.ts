import { create } from "zustand";
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

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const INITIAL_PLAYER_COUNT = 4;
const GAME_SPEED = 0.0015;
const JITTER_RANGE = 0.2;
const FINISH_LINE = 0.98;

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
  };
}

function computeRankings(characters: Character[]): string[] {
  return [...characters].sort((a, b) => b.progress - a.progress).map((c) => c.id);
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
    countdown: 3,
    elapsedTime: 0,
    rankings: computeRankings(characters),
    finishedIds: [],
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
    set({ isRacing: true, countdown: 0 });
  },

  finishRace: () => {
    set({ isRacing: false, hasResult: true });
  },

  resetGame: () => {
    idCounter = 0;
    set(getInitialState());
  },

  tick: (deltaTime: number) => {
    const state = get();
    if (!state.isRacing || state.isPaused) return;

    const elapsedTime = state.elapsedTime + deltaTime;

    const characters = state.characters.map((c) => {
      if (c.status === "stunned") return c;

      const jitter = 1 + (Math.random() - 0.5) * JITTER_RANGE;
      const progress = Math.min(c.progress + c.speed * deltaTime * jitter, 1);
      return { ...c, progress };
    });

    const rankings = computeRankings(characters);

    const newlyFinished = characters
      .filter((c) => c.progress >= FINISH_LINE && !state.finishedIds.includes(c.id))
      .map((c) => c.id);
    const finishedIds = [...state.finishedIds, ...newlyFinished];

    set({ characters, rankings, finishedIds, elapsedTime });
  },

  // ── Events ───────────────────────────────────────────────────────────────

  pushEvent: (event: GameEvent) => {
    set((state) => ({ events: [...state.events, event] }));
  },

  // ── Event logs ───────────────────────────────────────────────────────────

  pushLog: (log: EventLog) => {
    set((state) => ({ eventLogs: [...state.eventLogs, log] }));
  },
}));

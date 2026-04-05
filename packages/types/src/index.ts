// ---------------------------------------------------------------------------
// Mountain Race – Shared Type Contracts
// Used by both apps/web (client) and apps/api (server).
// ---------------------------------------------------------------------------

// ── Color ──────────────────────────────────────────────────────────────────

export interface ColorPreset {
  jacket: string;
  inner: string;
  pants: string;
  buff: string;
  hat: string;
}

// ── Character ──────────────────────────────────────────────────────────────

export type CharacterStatus = "running" | "stunned" | "boosted" | "slowed" | "sliding";

export interface CharacterStats {
  hitCount: number;
  setbackTotal: number;
  ultimateUsed: number;
  rankChanges: number;
}

export interface Character {
  id: string;
  name: string;
  color: ColorPreset;
  faceImage: string | null;
  progress: number;
  speed: number;
  baseSpeed: number;
  status: CharacterStatus;
  stunEndTime: number;
  stats: CharacterStats;
  finishTime: number | null;
}

// ── Event Types ────────────────────────────────────────────────────────────

export type SkillType = "booster" | "ankle_grab" | "trap" | "trip" | "wind_ride";

export type UltimateType = "boulder" | "landslide" | "ice" | "helicopter" | "bear";

export type GlobalEventType = "rain" | "fog" | "volcanic_ash" | "lightning";

export type TargetEventType = "deer" | "rockfall" | "snake" | "pit";

export type GameEventType = SkillType | UltimateType | GlobalEventType | TargetEventType;

export type EventCategory = "skill" | "ultimate" | "global" | "target";

export interface GameEvent {
  id: string;
  type: GameEventType;
  category: EventCategory;
  casterId?: string;
  targetIds: string[];
  timestamp: number;
  duration: number;
}

// ── Event Log ──────────────────────────────────────────────────────────────

export interface EventLog {
  id: string;
  text: string;
  timestamp: number;
}

// ── Camera ─────────────────────────────────────────────────────────────────

export type CameraMode = "follow" | "event_zoom" | "slowmo" | "shake" | "finish" | "free";

// ── Speech Bubble ──────────────────────────────────────────────────────────

export interface ActiveBubble {
  characterId: string;
  text: string;
  endTime: number;
}

// ── Game State (store shape contract) ──────────────────────────────────────

export interface GameState {
  // ── Setup ────────────────────────────────────────────────────────────────
  characters: Character[];
  setupComplete: boolean;
  hasResult: boolean;

  addCharacter: () => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, partial: Partial<Character>) => void;
  finalizeSetup: () => void;

  // ── Race lifecycle ───────────────────────────────────────────────────────
  isRacing: boolean;
  isPaused: boolean;
  countdown: number;
  elapsedTime: number;

  startRace: () => void;
  finishRace: () => void;
  resetGame: () => void;
  tick: (deltaTime: number) => void;

  // ── Rankings ─────────────────────────────────────────────────────────────
  rankings: string[];
  finishedIds: string[];
  firstFinishTime: number | null;

  // ── Events ───────────────────────────────────────────────────────────────
  events: GameEvent[];
  activeGlobalEvent: GlobalEventType | null;
  globalEventEndTime: number;
  ultimateCount: number;
  pushEvent: (event: GameEvent) => void;

  // ── Event logs ───────────────────────────────────────────────────────────
  eventLogs: EventLog[];
  pushLog: (log: EventLog) => void;

  // ── Dialogue ─────────────────────────────────────────────────────────────
  activeBubble: ActiveBubble | null;

  // ── Camera ───────────────────────────────────────────────────────────────
  cameraMode: CameraMode;
  cameraTarget: string | null;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (id: string | null) => void;
}

// ── Hidden Effect ──────────────────────────────────────────────────────────

export type HiddenEffectCategory = "good" | "bad" | "wildcard";

export type HiddenEffectType =
  | "booster"
  | "wind_ride"
  | "shield"
  | "self_trip"
  | "ankle_weight"
  | "magnet"
  | "mystery_swap"
  | "earthquake";

export interface HiddenEffect {
  type: HiddenEffectType;
  category: HiddenEffectCategory;
  name: string;
  description: string;
  emoji: string;
}

export interface HiddenEffectAssignment {
  playerId: string;
  effect: HiddenEffect;
  activated: boolean;
  activatedAt: number | null;
}

// ── Room ───────────────────────────────────────────────────────────────────

export type RoomPhase = "waiting" | "countdown" | "racing" | "result";

export interface Player {
  id: string;
  name: string;
  color: ColorPreset;
  faceImage: string | null;
  ready: boolean;
  isHost: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  hostId: string;
  players: Player[];
}

// ── WebSocket Messages ─────────────────────────────────────────────────────

export type ClientMessage =
  | { type: "setCharacter"; name: string; faceImage: string | null; color: ColorPreset }
  | { type: "setReady"; ready: boolean }
  | { type: "startRace" }
  | { type: "activateEffect" };

export type ServerMessage =
  | { type: "roomState"; state: RoomState; yourPlayerId: string }
  | { type: "playerJoined"; player: Player }
  | { type: "playerLeft"; playerId: string }
  | { type: "playerUpdated"; playerId: string; changes: Partial<Player> }
  | { type: "countdown"; seconds: number }
  | { type: "hasHiddenEffect"; hasEffect: boolean }
  | {
      type: "gameTick";
      characters: Character[];
      rankings: string[];
      finishedIds: string[];
      elapsedTime: number;
      activeGlobalEvent: GlobalEventType | null;
      events: GameEvent[];
      eventLogs: EventLog[];
      activeBubble: ActiveBubble | null;
    }
  | {
      type: "effectReveal";
      playerId: string;
      effect: HiddenEffect;
      targetName?: string;
    }
  | {
      type: "raceResult";
      rankings: string[];
      characters: Character[];
      hiddenEffects: HiddenEffectAssignment[];
    };

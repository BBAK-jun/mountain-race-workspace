import type {
  GlobalEventType,
  SkillType,
  TargetEventType,
  UltimateType,
  CharacterStatus,
} from "@mountain-race/types";

// ── Core pacing ────────────────────────────────────────────────────────────

// Tuned so a typical race finishes around 60-90 seconds.
export const GAME_SPEED = 0.018;
export const JITTER_RANGE = 0.2;
export const FINISH_LINE = 0.98;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const INITIAL_PLAYER_COUNT = 4;

// ── Scheduling intervals (seconds) ────────────────────────────────────────

export const SKILL_INTERVAL_MIN = 1.5;
export const SKILL_INTERVAL_MAX = 3.5;

export const ULTIMATE_INTERVAL_MIN = 6;
export const ULTIMATE_INTERVAL_MAX = 10;
export const ULTIMATE_MAX = 2;

export const GLOBAL_EVENT_INTERVAL_MIN = 8;
export const GLOBAL_EVENT_INTERVAL_MAX = 13;
export const GLOBAL_EVENT_CHANCE = 0.15;

export const TARGET_EVENT_INTERVAL_MIN = 4;
export const TARGET_EVENT_INTERVAL_MAX = 8;

// ── Dialogue timing (seconds) ──────────────────────────────────────────────

export const DIALOGUE_INTERVAL_MIN = 3;
export const DIALOGUE_INTERVAL_MAX = 6;
export const DIALOGUE_DISPLAY_TIME_MS = 2000;

// ── Rank-based probability (linear interpolation endpoints) ────────────────

export const GOOD_EVENT_CHANCE_MIN = 0.1;
export const GOOD_EVENT_CHANCE_MAX = 0.4;
export const BAD_EVENT_CHANCE_MIN = 0.4;
export const BAD_EVENT_CHANCE_MAX = 0.1;
export const ULTIMATE_CHANCE_MIN = 0.0;
export const ULTIMATE_CHANCE_MAX = 0.08;

// ── Status multipliers ─────────────────────────────────────────────────────

export const BOOST_MULTIPLIER = 2.5;
export const SLOW_MULTIPLIER = 0.7;
export const VOLCANIC_ASH_SPEED_MULT = 0.6;
export const WIND_RIDE_MULTIPLIER = 1.8;
export const RAIN_SLIP_CHANCE = 0.3;
export const FOG_DENSITY = 0.8;

// ── Camera thresholds ──────────────────────────────────────────────────────

export const SLOWMO_THRESHOLD = 0.02;
export const SLOWMO_PROGRESS_MIN = 0.7;
export const SLOWMO_TIMESCALE = 0.3;

// ── Rain slip stun ────────────────────────────────────────────────────────

export const RAIN_SLIP_STUN_MS = 800;

// ── Countdown ──────────────────────────────────────────────────────────────

export const COUNTDOWN_SECONDS = 3;
export const RACE_END_GRACE_PERIOD_MS = 10_000;

// ── Skill effects ──────────────────────────────────────────────────────────

interface SkillEffect {
  status: CharacterStatus;
  durationMs: number;
  speedMult?: number;
  target: "self" | "ahead" | "behind";
}

export const SKILL_EFFECTS: Record<SkillType, SkillEffect> = {
  booster: { status: "boosted", durationMs: 2000, speedMult: 2.5, target: "self" },
  ankle_grab: { status: "stunned", durationMs: 1500, target: "ahead" },
  trap: { status: "stunned", durationMs: 2000, target: "behind" },
  trip: { status: "stunned", durationMs: 1200, target: "self" },
  wind_ride: { status: "boosted", durationMs: 1500, speedMult: 1.8, target: "self" },
};

// ── Ultimate effects ───────────────────────────────────────────────────────

interface UltimateEffect {
  status?: CharacterStatus;
  durationMs?: number;
  setback?: number;
  stunDurationMs?: number;
  target: "all_ahead" | "nearby_15pct" | "ahead_20pct" | "first_place" | "random_one";
}

export const ULTIMATE_EFFECTS: Record<UltimateType, UltimateEffect> = {
  boulder: { status: "stunned", durationMs: 2500, target: "all_ahead" },
  landslide: { setback: 0.1, target: "nearby_15pct" },
  ice: { status: "sliding", durationMs: 3000, target: "ahead_20pct" },
  helicopter: { setback: 0.15, stunDurationMs: 1500, target: "first_place" },
  bear: { setback: 0.12, stunDurationMs: 2000, target: "random_one" },
};

// ── Global event effects ───────────────────────────────────────────────────

interface GlobalEffect {
  durationMs: number;
  slipChance?: number;
  isHideRankings?: boolean;
  fogDensity?: number;
  speedMult?: number;
  stunDurationMs?: number;
  targets?: "all" | "random_one";
}

export const GLOBAL_EFFECTS: Record<GlobalEventType, GlobalEffect> = {
  rain: { durationMs: 5000, slipChance: 0.3, targets: "all" },
  fog: { durationMs: 6000, isHideRankings: true, fogDensity: 0.8, targets: "all" },
  volcanic_ash: { durationMs: 4000, speedMult: 0.6, targets: "all" },
  lightning: { durationMs: 500, stunDurationMs: 2000, targets: "random_one" },
};

// ── Target event effects ───────────────────────────────────────────────────

interface TargetEffect {
  stunDurationMs: number;
  setback?: number;
}

export const TARGET_EFFECTS: Record<TargetEventType, TargetEffect> = {
  deer: { stunDurationMs: 2000 },
  rockfall: { stunDurationMs: 1500, setback: 0.03 },
  snake: { stunDurationMs: 2500 },
  pit: { stunDurationMs: 1000, setback: 0.06 },
};

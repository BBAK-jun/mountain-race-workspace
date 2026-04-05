import type {
  Character,
  HiddenEffect,
  HiddenEffectAssignment,
  HiddenEffectCategory,
  HiddenEffectType,
} from "@mountain-race/types";
import { getEffectHandler } from "./effects";

// ── Effect pool ──────────────────────────────────────────────────────────

const EFFECT_POOL: readonly HiddenEffect[] = [
  {
    type: "booster",
    category: "good",
    name: "부스터",
    description: "2초간 속도 2.5배",
    emoji: "🚀",
  },
  {
    type: "wind_ride",
    category: "good",
    name: "바람 타기",
    description: "1.5초간 속도 1.8배",
    emoji: "💨",
  },
  {
    type: "shield",
    category: "good",
    name: "쉴드",
    description: "다음 방해 1회 무효화",
    emoji: "🛡️",
  },
  { type: "self_trip", category: "bad", name: "넘어지기", description: "1.2초 스턴", emoji: "😵" },
  {
    type: "ankle_weight",
    category: "bad",
    name: "발목에 추",
    description: "3초간 감속",
    emoji: "⚓",
  },
  { type: "magnet", category: "bad", name: "자석", description: "2등에게 끌려감", emoji: "🧲" },
  {
    type: "mystery_swap",
    category: "wildcard",
    name: "미스터리 스왑",
    description: "가장 가까운 상대와 위치 교환",
    emoji: "🔄",
  },
  {
    type: "earthquake",
    category: "wildcard",
    name: "지진",
    description: "전원 0.8초 스턴",
    emoji: "🌍",
  },
];

const CATEGORY_WEIGHTS: Record<HiddenEffectCategory, number> = {
  good: 0.4,
  bad: 0.4,
  wildcard: 0.2,
};

// ── Manager ──────────────────────────────────────────────────────────────

export class HiddenEffectManager {
  private assignments: Map<string, HiddenEffectAssignment> = new Map();

  assignEffects(playerIds: string[]): void {
    this.assignments.clear();
    for (const playerId of playerIds) {
      const effect = this.pickRandomEffect();
      this.assignments.set(playerId, {
        playerId,
        effect,
        activated: false,
        activatedAt: null,
      });
    }
  }

  canActivate(playerId: string): boolean {
    const assignment = this.assignments.get(playerId);
    return assignment !== undefined && !assignment.activated;
  }

  activate(playerId: string, elapsedTime: number): HiddenEffectAssignment | null {
    const assignment = this.assignments.get(playerId);
    if (!assignment || assignment.activated) return null;

    assignment.activated = true;
    assignment.activatedAt = elapsedTime;
    return assignment;
  }

  applyEffect(
    assignment: HiddenEffectAssignment,
    characters: Character[],
    rankings: string[],
    elapsedTime: number,
  ): { characters: Character[]; targetName?: string } {
    const casterIndex = characters.findIndex((c) => c.id === assignment.playerId);
    if (casterIndex === -1) return { characters };

    const caster = characters[casterIndex];
    if (!caster) return { characters };

    const handler = getEffectHandler(assignment.effect.type);
    return handler.apply({ casterIndex, caster, characters, rankings, elapsedTime });
  }

  allAssignments(): HiddenEffectAssignment[] {
    return [...this.assignments.values()];
  }

  getAssignment(playerId: string): HiddenEffectAssignment | undefined {
    return this.assignments.get(playerId);
  }

  private pickRandomEffect(): HiddenEffect {
    const roll = Math.random();
    let category: HiddenEffectCategory;

    if (roll < CATEGORY_WEIGHTS.good) {
      category = "good";
    } else if (roll < CATEGORY_WEIGHTS.good + CATEGORY_WEIGHTS.bad) {
      category = "bad";
    } else {
      category = "wildcard";
    }

    const pool = EFFECT_POOL.filter((e) => e.category === category);
    const idx = Math.floor(Math.random() * pool.length);
    const fallback = EFFECT_POOL[0];
    return (
      pool[idx] ??
      fallback ?? {
        type: "booster",
        category: "good",
        name: "부스터",
        description: "2초간 속도 2.5배",
        emoji: "🚀",
      }
    );
  }
}

import type {
  Character,
  HiddenEffect,
  HiddenEffectAssignment,
  HiddenEffectCategory,
  HiddenEffectType,
} from "@mountain-race/types";
import { GAME_SPEED } from "@mountain-race/game-logic";

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
    const charIndex = characters.findIndex((c) => c.id === assignment.playerId);
    if (charIndex === -1) return { characters };

    const char = characters[charIndex];
    if (!char) return { characters };
    let updated = [...characters];

    switch (assignment.effect.type) {
      case "booster":
        updated[charIndex] = {
          ...char,
          status: "boosted",
          speed: char.baseSpeed * 2.5,
          stunEndTime: elapsedTime + 2,
        };
        break;

      case "wind_ride":
        updated[charIndex] = {
          ...char,
          status: "boosted",
          speed: char.baseSpeed * 1.8,
          stunEndTime: elapsedTime + 1.5,
        };
        break;

      case "shield":
        // shield 상태를 표현하기 위해 stats에 기록 (hitCount를 -1로 마킹)
        // 실제 shield 로직은 EventSystem에서 hitCount < 0 일 때 방어 후 0으로 복구
        updated[charIndex] = {
          ...char,
          stats: { ...char.stats, hitCount: char.stats.hitCount - 1 },
        };
        break;

      case "self_trip":
        updated[charIndex] = {
          ...char,
          status: "stunned",
          speed: 0,
          stunEndTime: elapsedTime + 1.2,
          stats: { ...char.stats, hitCount: char.stats.hitCount + 1 },
        };
        break;

      case "ankle_weight":
        updated[charIndex] = {
          ...char,
          status: "slowed",
          speed: char.baseSpeed * 0.7,
          stunEndTime: elapsedTime + 3,
        };
        break;

      case "magnet": {
        const rankIndex = rankings.indexOf(assignment.playerId);
        const secondPlaceId = rankings[1];
        if (rankIndex > 0 && secondPlaceId) {
          const second = updated.find((c) => c.id === secondPlaceId);
          if (second) {
            const pullback = Math.abs(char.progress - second.progress) * 0.5;
            updated[charIndex] = {
              ...char,
              progress: Math.max(0, char.progress - pullback),
              stats: { ...char.stats, setbackTotal: char.stats.setbackTotal + pullback },
            };
          }
        }
        break;
      }

      case "mystery_swap": {
        let closestIdx = -1;
        let closestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < updated.length; i++) {
          const other = updated[i];
          if (!other) continue;
          if (other.id === char.id) continue;
          const dist = Math.abs(other.progress - char.progress);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        if (closestIdx !== -1) {
          const target = updated[closestIdx];
          if (!target) break;
          const myProgress = char.progress;
          updated[charIndex] = { ...char, progress: target.progress };
          updated[closestIdx] = { ...target, progress: myProgress };
          return { characters: updated, targetName: target.name };
        }
        break;
      }

      case "earthquake":
        updated = updated.map((c) => {
          if (c.finishTime !== null) return c;
          return {
            ...c,
            status: "stunned" as const,
            speed: 0,
            stunEndTime: elapsedTime + 0.8,
            stats: { ...c.stats, hitCount: c.stats.hitCount + 1 },
          };
        });
        break;
    }

    return { characters: updated };
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

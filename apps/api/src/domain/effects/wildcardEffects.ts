import type { EffectContext, EffectHandler, EffectResult } from "./effectHandler";

export const mysterySwapEffect: EffectHandler = {
  apply({ casterIndex, caster, characters }: EffectContext): EffectResult {
    const updated = [...characters];

    let closestIdx = -1;
    let closestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < updated.length; i++) {
      const other = updated[i];
      if (!other || other.id === caster.id) continue;
      const dist = Math.abs(other.progress - caster.progress);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      const target = updated[closestIdx];
      if (target) {
        const myProgress = caster.progress;
        updated[casterIndex] = { ...caster, progress: target.progress };
        updated[closestIdx] = { ...target, progress: myProgress };
        return { characters: updated, targetName: target.name };
      }
    }

    return { characters: updated };
  },
};

export const earthquakeEffect: EffectHandler = {
  apply({ characters, elapsedTime }: EffectContext): EffectResult {
    const updated = characters.map((c) => {
      if (c.finishTime !== null) return c;
      return {
        ...c,
        status: "stunned" as const,
        speed: 0,
        stunEndTime: elapsedTime + 0.8,
        stats: { ...c.stats, hitCount: c.stats.hitCount + 1 },
      };
    });
    return { characters: updated };
  },
};

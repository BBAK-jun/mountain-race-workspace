import type { EffectContext, EffectHandler, EffectResult } from "./effectHandler";

export const selfTripEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, elapsedTime }: EffectContext): EffectResult {
    const updated = [...characters];
    updated[casterIndex] = {
      ...caster,
      status: "stunned",
      speed: 0,
      stunEndTime: elapsedTime + 1.2,
      stats: { ...caster.stats, hitCount: caster.stats.hitCount + 1 },
    };
    return { characters: updated };
  },
};

export const ankleWeightEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, elapsedTime }: EffectContext): EffectResult {
    const updated = [...characters];
    updated[casterIndex] = {
      ...caster,
      status: "slowed",
      speed: caster.baseSpeed * 0.7,
      stunEndTime: elapsedTime + 3,
    };
    return { characters: updated };
  },
};

export const magnetEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, rankings }: EffectContext): EffectResult {
    const updated = [...characters];
    const rankIndex = rankings.indexOf(caster.id);
    const secondPlaceId = rankings[1];

    if (rankIndex > 0 && secondPlaceId) {
      const second = updated.find((c) => c.id === secondPlaceId);
      if (second) {
        const pullback = Math.abs(caster.progress - second.progress) * 0.5;
        updated[casterIndex] = {
          ...caster,
          progress: Math.max(0, caster.progress - pullback),
          stats: { ...caster.stats, setbackTotal: caster.stats.setbackTotal + pullback },
        };
      }
    }

    return { characters: updated };
  },
};

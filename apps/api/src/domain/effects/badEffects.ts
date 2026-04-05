import type { EffectContext, EffectHandler, EffectResult } from "./effectHandler";

export const selfTripEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, elapsedTime }: EffectContext): EffectResult {
    const updated = [...characters];
    if (caster.status === "shielded") {
      updated[casterIndex] = { ...caster, status: "running" };
      return { characters: updated };
    }
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
    if (caster.status === "shielded") {
      updated[casterIndex] = { ...caster, status: "running" };
      return { characters: updated };
    }
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

    if (rankIndex <= 0) return { characters: updated };

    const aheadId = rankings[rankIndex - 1];
    if (!aheadId) return { characters: updated };

    const ahead = updated.find((c) => c.id === aheadId);
    if (!ahead) return { characters: updated };

    const pullback = Math.abs(caster.progress - ahead.progress) * 0.5;
    updated[casterIndex] = {
      ...caster,
      progress: Math.max(0, caster.progress - pullback),
      stats: { ...caster.stats, setbackTotal: caster.stats.setbackTotal + pullback },
    };
    return { characters: updated };
  },
};

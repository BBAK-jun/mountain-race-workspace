import type { EffectContext, EffectHandler, EffectResult } from "./effectHandler";

export const boosterEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, elapsedTime }: EffectContext): EffectResult {
    const updated = [...characters];
    updated[casterIndex] = {
      ...caster,
      status: "boosted",
      speed: caster.baseSpeed * 2.5,
      stunEndTime: elapsedTime + 2,
    };
    return { characters: updated };
  },
};

export const windRideEffect: EffectHandler = {
  apply({ casterIndex, caster, characters, elapsedTime }: EffectContext): EffectResult {
    const updated = [...characters];
    updated[casterIndex] = {
      ...caster,
      status: "boosted",
      speed: caster.baseSpeed * 1.8,
      stunEndTime: elapsedTime + 1.5,
    };
    return { characters: updated };
  },
};

export const shieldEffect: EffectHandler = {
  apply({ casterIndex, caster, characters }: EffectContext): EffectResult {
    const updated = [...characters];
    updated[casterIndex] = {
      ...caster,
      status: "shielded",
    };
    return { characters: updated };
  },
};

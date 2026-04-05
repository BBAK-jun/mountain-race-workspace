import type { Character } from "@mountain-race/types";

export interface EffectContext {
  casterIndex: number;
  caster: Character;
  characters: Character[];
  rankings: string[];
  elapsedTime: number;
}

export interface EffectResult {
  characters: Character[];
  targetName?: string;
}

export interface EffectHandler {
  apply(ctx: EffectContext): EffectResult;
}

import type { HiddenEffectType } from "@mountain-race/types";
import type { EffectHandler } from "./effectHandler";
import { boosterEffect, shieldEffect, windRideEffect } from "./goodEffects";
import { ankleWeightEffect, magnetEffect, selfTripEffect } from "./badEffects";
import { earthquakeEffect, mysterySwapEffect } from "./wildcardEffects";

const registry: Record<HiddenEffectType, EffectHandler> = {
  booster: boosterEffect,
  wind_ride: windRideEffect,
  shield: shieldEffect,
  self_trip: selfTripEffect,
  ankle_weight: ankleWeightEffect,
  magnet: magnetEffect,
  mystery_swap: mysterySwapEffect,
  earthquake: earthquakeEffect,
};

export function getEffectHandler(type: HiddenEffectType): EffectHandler {
  return registry[type];
}

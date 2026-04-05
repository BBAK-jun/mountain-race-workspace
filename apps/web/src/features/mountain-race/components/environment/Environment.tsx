import { Sky } from "@react-three/drei";
import type { GlobalEventType } from "@/features/mountain-race/types";
import { WEATHER_CONFIG } from "./weatherConfig";
import { Ground } from "./Ground";
import { Mountains } from "./Mountains";
import { Trees } from "./Trees";
import { Boulders } from "./Boulders";
import { GrassTufts } from "./GrassTufts";
import { TrailMarkers } from "./TrailMarkers";
import { SnowPatches } from "./SnowPatches";
import { Clouds } from "./Clouds";
import { RainField } from "./RainField";

interface EnvironmentProps {
  activeGlobalEvent: GlobalEventType | null;
  leaderProgress?: number;
}

export function Environment({ activeGlobalEvent, leaderProgress = 0 }: EnvironmentProps) {
  const isRainByAltitude = leaderProgress >= WEATHER_CONFIG.altitudeRainStart;
  const isRainByEvent = activeGlobalEvent === "rain";
  const isRainy = isRainByAltitude || isRainByEvent;
  const isFoggy = activeGlobalEvent === "fog";
  const isStormy = activeGlobalEvent === "lightning";
  const altitudeRainBoost =
    leaderProgress >= WEATHER_CONFIG.altitudeHeavyRain
      ? WEATHER_CONFIG.altitudeBoostHigh
      : leaderProgress >= WEATHER_CONFIG.altitudeMidRain
        ? WEATHER_CONFIG.altitudeBoostMid
        : WEATHER_CONFIG.altitudeBoostLow;
  const rainIntensity = isRainy
    ? (isRainByEvent ? WEATHER_CONFIG.eventRainBase : WEATHER_CONFIG.altitudeRainBase) +
      altitudeRainBoost
    : 0;
  const rainSpeed = WEATHER_CONFIG.rainSpeedBase + rainIntensity * WEATHER_CONFIG.rainSpeedGain;
  const fogArgs = isFoggy
    ? WEATHER_CONFIG.fogDense
    : isRainy
      ? WEATHER_CONFIG.fogRain
      : WEATHER_CONFIG.fogClear;

  const skyTurbidity = isFoggy ? 8 : isRainy ? 5 : 3;
  const skyRayleigh = isFoggy ? 0.2 : isRainy ? 0.35 : 0.5;

  return (
    <group>
      <Sky
        sunPosition={[
          WEATHER_CONFIG.sunPosition[0],
          WEATHER_CONFIG.sunPosition[1],
          WEATHER_CONFIG.sunPosition[2],
        ]}
        turbidity={skyTurbidity}
        rayleigh={skyRayleigh}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Ground />
      <Mountains />
      <Trees />
      <Boulders />
      <GrassTufts />
      <TrailMarkers />
      <SnowPatches />
      <Clouds />
      {isRainy && <RainField intensity={rainIntensity} speed={rainSpeed} />}
      <fog attach="fog" args={fogArgs} />
      <hemisphereLight args={["#87ceeb", "#4a7c59", 0.5]} />
      <ambientLight
        intensity={isStormy ? WEATHER_CONFIG.stormAmbient : WEATHER_CONFIG.defaultAmbient}
      />
      <directionalLight
        position={WEATHER_CONFIG.sunPosition}
        intensity={isRainy ? WEATHER_CONFIG.rainSunIntensity : WEATHER_CONFIG.clearSunIntensity}
        color={isRainy ? WEATHER_CONFIG.rainSunColor : WEATHER_CONFIG.clearSunColor}
      />
    </group>
  );
}

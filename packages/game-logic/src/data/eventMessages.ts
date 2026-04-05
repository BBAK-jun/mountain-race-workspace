import type {
  GlobalEventType,
  SkillType,
  TargetEventType,
  UltimateType,
} from "@mountain-race/types";

// ── Target event log messages ──────────────────────────────────────────────

export const TARGET_EVENT_MESSAGES: Record<TargetEventType, readonly string[]> = {
  deer: [
    "🦌 {name} 앞에 사슴 출현!! 그대로 밟혔다!!",
    "🦌 사슴이 {name}을(를) 밟고 유유히 사라짐 ㅋㅋ",
  ],
  rockfall: ["🪨 낙석 발생!! {name} 직격!!"],
  snake: ["🐍 {name} 발밑에 뱀!! 기절!!"],
  pit: ["🕳️ {name} 구덩이에 빠졌다!!"],
};

// ── Global event log messages ──────────────────────────────────────────────

export const GLOBAL_EVENT_MESSAGES: Record<GlobalEventType, readonly string[]> = {
  lightning: ["⚡ 번개!! {name} 기절!!"],
  rain: ["🌧️ 폭우 시작!! 전원 미끄러짐 주의!!"],
  fog: ["🌫️ 안개가 깔린다... 순위를 알 수 없다!!"],
  volcanic_ash: ["🌋 화산재 낙하!! 전원 감속!!"],
};

// ── Ultimate log messages ──────────────────────────────────────────────────

export const ULTIMATE_ANNOUNCE_MESSAGE = "⚠️⚠️⚠️ {name}의 피살기 발동!!";

export const ULTIMATE_MESSAGES: Record<UltimateType, string> = {
  boulder: "🪨 {name}이(가) 대형 낙석을 소환했다!!",
  landslide: "🌪️ 산사태!! {name} 빼고 전원 밀려났다!!",
  ice: "🧊 {name}이(가) 빙판을 깔았다!! 미끄러진다!!",
  helicopter: "🚁 헬기가 1등을 납치해갔다!!",
  bear: "🐻 {name}이(가) 야생 곰을 풀었다!!",
};

// ── Skill log messages ─────────────────────────────────────────────────────

export const SKILL_MESSAGES: Record<SkillType, string> = {
  booster: "🚀 {name} 부스터 점화!! 미친 속도!!",
  ankle_grab: "🛑 {name}이(가) {target}의 발목을 잡았다!!",
  trap: "🪤 {name}이(가) 함정을 설치했다! {target} 걸림!!",
  trip: "😵 {name} 스스로 넘어졌다 ㅋㅋ",
  wind_ride: "💨 {name} 바람을 탔다!! 슝~",
};

// ── Situation log messages ─────────────────────────────────────────────────

export const SITUATION_MESSAGES = {
  rushing: "🔥 {name} 미친 듯이 질주 중!!",
  fellToLast: "😱 {name} 꼴등 전락!!",
  nearFinish: "🏆 {name} 결승선 코앞!!",
  overtake: "🔄 {name}이(가) {target}을(를) 역전했다!!",
} as const;

// ── Message formatter ──────────────────────────────────────────────────────

export function formatMessage(template: string, name: string, target?: string): string {
  let result = template.replaceAll("{name}", name);
  if (target !== undefined) {
    result = result.replaceAll("{target}", target);
  }
  return result;
}

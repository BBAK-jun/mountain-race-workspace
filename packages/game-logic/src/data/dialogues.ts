import type {
  GlobalEventType,
  SkillType,
  TargetEventType,
  UltimateType,
} from "@mountain-race/types";

// ── Situation dialogues ────────────────────────────────────────────────────

export const IDLE_DIALOGUES: readonly string[] = [
  "아 무릎",
  "누가 여기 코스 잡은 거야",
  "차라리 헬스 갈 걸",
  "김밥 언제 먹냐",
  "개후회",
  "숨차다",
  "다음엔 안 온다 진짜",
  "왜 등산 가자고 했냐 진짜",
  "물 어디감",
  "양말 축축함",
  "산악회 탈퇴할래",
  "정상에 뭐 있는데?",
  "아 허리",
  "이거 등산이야 레이싱이야",
  "집에 가고 싶다",
  "엄마 나 여기서 못 나갈 것 같아",
  "내가 미쳤지 여기를 왜 옴",
  "등산화 할부 아직 안 끝났는데",
];

export const FIRST_PLACE_DIALOGUES: readonly string[] = [
  "뒤에서 뭐 오는 거 같은데",
  "불안한데",
  "조용한 거 무서움",
  "제발 아무것도 오지 마",
  "이대로만 가자 제발",
  "나 건드리지 마",
  "지금 돌 날아오면 울 것 같은데",
  "1등이 이렇게 무서운 거였어?",
  "숨소리가 뒤에서 들림",
];

export const LAST_PLACE_DIALOGUES: readonly string[] = [
  "산에서 뛰지 마세요",
  "경치 보러 왔습니다",
  "꼴등도 정상은 감",
  "막걸리 먼저 마시는 사람이 진짜 승자",
  "난 산책하는 중",
  "느긋하게 갑니다",
  "어차피 인생 긴 거",
  "여기 단풍 예쁘다",
  "1등 했으면 세금 냈을 듯",
  "나는 과정을 즐기는 타입",
];

export const OVERTAKEN_DIALOGUES: readonly string[] = [
  "??",
  "ㅇㅇ 가셈 어차피 돌 맞음",
  "아줌마???",
  "개억까",
  "저 사람 도핑 아니냐",
  "인생 뭐 있나",
  "존버한다",
  "가세요 가세요 어차피 오래 못 감",
  "나중에 보자",
];

export const OVERTAKE_DIALOGUES: readonly string[] = [
  "정상에서 기다릴게요",
  "ㅂㅇ~",
  "개꿀~",
  "안녕히 계세요~",
  "먼저 갑니다 ㅎㅎ",
  "김밥 먼저 먹는다?",
  "길 비켜주셔서 감사합니다",
  "수고하셨습니다~",
  "뒤에서 응원할게요 ㅎ",
];

export const COMEBACK_DIALOGUES: readonly string[] = [
  "개꿀",
  "존버는 승리한다",
  "뒤에서 칼바람 옵니다~",
  "개역전",
  "이 맛에 등산하지",
  "아까 경치 구경한 보람이 있네",
];

export const CLOSE_RACE_DIALOGUES: readonly string[] = [
  "아 아 아 아 닿는다",
  "발 밟지 마 발 밟지 마",
  "야 너 지금 숨소리 들려",
  "옆에서 냄새남",
  "팔꿈치 치지 마",
  "이거 사진판정 해야 하는 거 아니냐",
  "코 차이로 지면 진짜 억울하다",
  "아저씨 너무 가까워요",
];

// ── Finish dialogues ───────────────────────────────────────────────────────

export type FinishRank = "first" | "second" | "third" | "rest" | "last";

export const FINISH_DIALOGUES: Record<FinishRank, readonly string[]> = {
  first: [
    "정상에서 기다렸습니다 ㅎ",
    "여기 경치 좋네요~",
    "1등이 제일 쉬웠어요",
    "김밥 먼저 먹는다",
    "올라오세요 여러분~",
    "역시 체력은 거짓말 안 하지",
  ],
  second: [
    "아 1등 할 수 있었는데",
    "0.1초 차이 실화?",
    "다음엔 진다 이긴다",
    "아까 그 돌만 안 맞았으면",
    "은메달도 메달이다",
    "억울한데 할 말 없다",
  ],
  third: [
    "나쁘지 않네",
    "동메달이면 선방이지",
    "중간은 간다",
    "3등도 시상대 올라가죠?",
    "이 정도면 잘한 거 아닌가",
  ],
  rest: [
    "다음엔 안 온다",
    "등산 접는다 진짜",
    "다리가 후들후들",
    "물 좀 주세요",
    "택시 어디서 잡지",
    "산악회비 환불 가능?",
  ],
  last: [
    "산에서 뛰지 말라니까요",
    "경치 구경하느라 늦었습니다",
    "꼴등도 완주는 완주다",
    "난 즐기러 왔어요",
    "마지막이 제일 기억에 남는 법",
    "다음엔 케이블카 탄다",
  ],
};

// ── Skill caster dialogues ─────────────────────────────────────────────────

export const SKILL_CASTER_DIALOGUES: Record<SkillType, readonly string[]> = {
  booster: [
    "도핑 아닙니다",
    "이거 합법 맞지?",
    "갑자기 20대 된 기분",
    "비켜 비켜 급해요",
    "빠르다 빠르다 빠르다 빠르다",
    "지금 못뛰는 흑우 없제?",
    "부스터 안 터진 사람 손",
    "이 맛을 모르면 등산 접어라",
  ],
  wind_ride: ["슝~", "바람이 나를 선택함", "이건 실력이 아닙니다", "어 몸이 알아서 감"],
  ankle_grab: ["잡았다", "어디 가세요~", "ㅎㅎ"],
  trap: ["깔아둔다~", "밟아라 밟아", "선물 놔뒀어요"],
  trip: [],
};

// ── Skill victim dialogues ─────────────────────────────────────────────────

export const SKILL_VICTIM_DIALOGUES: Record<string, readonly string[]> = {
  ankle_grab: [
    "아 발목",
    "여기서 이러기야?",
    "구급차 불러",
    "하...",
    "재밌다 진짜",
    "무릎이 나갔습니다",
    "다리가 말을 안 들어",
  ],
  trap: [
    "아 발목",
    "여기서 이러기야?",
    "구급차 불러",
    "하...",
    "재밌다 진짜",
    "무릎이 나갔습니다",
    "다리가 말을 안 들어",
  ],
  trip: [
    "...",
    "아 왜 넘어짐",
    "혼자 넘어진 거 봤지? 못 본 거다",
    "아무도 안 봤으면 좋겠다",
    "자존감 나갔다",
  ],
};

// ── Global event reaction dialogues ────────────────────────────────────────

export const GLOBAL_EVENT_DIALOGUES: Record<GlobalEventType, readonly string[]> = {
  rain: [
    "우산 없는데",
    "고어텍스 믿는다",
    "30만원짜리 자켓이 해줘",
    "비 맞고 등산 실화?",
    "아 등산화 5만원짜리인데",
    "빨래 널어놓고 왔는데",
  ],
  fog: [
    "앞에 뭐가 있는 거지",
    "여기가 어디야",
    "아무것도 안 보임",
    "사일런트힐이냐",
    "조난 신고해야 하나",
    "앞사람 따라가면 되겠지?",
  ],
  lightning: [
    "번개맞는다 폴 버려 폴 버려!!!!",
    "피뢰침 들고 다니는 거 아니냐 이거",
    "트레킹 폴 = 번개봉",
    "죽는 건 아니지?",
  ],
  volcanic_ash: ["여기 화산 있었음?", "마스크 어디감", "이거 산이 맞냐", "미세먼지인 줄"],
};

// ── Target event victim dialogues ──────────────────────────────────────────

export const TARGET_EVENT_DIALOGUES: Record<TargetEventType, readonly string[]> = {
  deer: ["사슴아 나 왜", "밟혔다", "동물의 왕국이냐", "사슴이 나를 무시함"],
  rockfall: [
    "산재처리 되나요? 진짜 '산'이네 ㅋㅋ",
    "싫다했다 싫다했다 싫다했다",
    "돌굴러가유~",
    "안전모 왜 안 줌?",
    "누가 던졌냐",
    "위에서 개긴다",
  ],
  snake: [
    "ㅅㅅㅅㅅ뱀이다",
    "하아아아악",
    "움직이면 안 된다 움직이면 안 된다",
    "난 뱀 싫어했어",
    "왜 하필 나한테 옴",
  ],
  pit: [
    "어?",
    "아아아아ㅏㅏㅏ",
    "여기서 살아야 하나",
    "산림청 뭐하냐",
    "복지 사각지대",
    "월세 얼마냐 여기",
  ],
};

// ── Ultimate common fallback dialogues ─────────────────────────────────────

export const ULTIMATE_FALLBACK_DIALOGUES: readonly string[] = [
  "신고합니다",
  "이거 밸런스 패치 해라",
  "개발자 나와",
  "왜 나만 맞음?",
  "억까 미쳤다",
  "진짜 이 게임 접는다",
  "환불 어디서 함?",
  "이게 나라냐",
];

// ── Ultimate specific dialogues ────────────────────────────────────────────

interface UltimateDialogue {
  caster: readonly string[];
  victim: readonly string[];
}

export const ULTIMATE_SPECIFIC_DIALOGUES: Record<UltimateType, UltimateDialogue> = {
  boulder: {
    caster: ["미안 ㅋ", "돌 가~"],
    victim: ["위에서 개긴다 진짜", "이게 낙석이야 운석이야"],
  },
  landslide: {
    caster: ["다 같이 가자~", "혼자 갈 순 없지"],
    victim: [
      "다 같이 가는 거야? ㅋㅋ",
      "(유서쓰는중...)",
      "뉴스에 나오겠다",
      "여기 왜 왔냐 진짜",
      "단체로 밀렸다",
    ],
  },
  ice: {
    caster: ["조심하세요~ 미끄러워요~", "깔아둔다"],
    victim: ["아이스링크냐", "아이젠 왜 안 챙겼냐", "스케이팅 중", "살려줘에에에", "김연아 뺨치네"],
  },
  helicopter: {
    caster: ["잘 다녀오세요 ㅎ", "관광 보내드림"],
    victim: [
      "어 나 왜 올라가",
      "거기 내려줘요!!!!",
      "헬기비 누가 내냐",
      "관광 시켜주는 건가?",
      "경치는 좋다",
      "여기서 내려줘 여기서",
    ],
  },
  bear: {
    caster: ["곰아 저기 맛있는 사람 있어", "가서 인사해"],
    victim: [
      "죽은 척 죽은 척",
      "곰아 나 맛없어",
      "산악회 약관에 곰은 없었는데",
      "아 인생 여기까지인가",
      "곰아 저쪽에 1등 있어 저쪽으로 가",
    ],
  },
};

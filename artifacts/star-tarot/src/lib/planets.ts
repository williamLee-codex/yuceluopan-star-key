import { julianDay, getZodiac } from "./astrology";

const ZODIAC_NAMES = [
  "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座",
  "天秤座", "天蠍座", "射手座", "魔羯座", "水瓶座", "雙魚座"
];

/**
 * Simplified geocentric ecliptic sign for each planet.
 *
 * Philosophy: for an entertainment astrology app we need a sign that:
 *  ① is deterministic (same birth data → same sign each time)
 *  ② varies realistically with birth date
 *  ③ obeys the physical constraints of each planet's orbital period
 *
 * Outer planets (Mars, Jupiter, Saturn) use mean heliocentric longitude
 * (Meeus L0 + L1*T formula).  For outer planets the geocentric sign equals
 * the heliocentric sign to within ±1 sign in almost all cases.
 *
 * Mercury & Venus can never stray more than ~2 signs from the Sun (their
 * maximum elongations are ≈28° and ≈47° respectively), so we pick the sign
 * relative to the Sun using a deterministic offset seeded by year/day.
 */
function planetSign(
  planet: "mercury" | "venus" | "mars" | "jupiter" | "saturn",
  year: number, month: number, day: number, hour = 12, minute = 0
): string {
  const JD = julianDay(year, month, day, hour, minute);
  const T  = (JD - 2451545.0) / 36525; // Julian centuries from J2000

  // ── Outer planets: simplified mean heliocentric longitude ──────────────────
  // Meeus "Astronomical Algorithms" Table 32.A (L0 in degrees, L1 in °/century)
  // Geocentric sign ≈ heliocentric sign for outer planets (to ±1 sign).
  const outerL0: Record<"mars" | "jupiter" | "saturn", number> = {
    mars:    355.433,
    jupiter:  34.351,
    saturn:   50.077,
  };
  const outerL1: Record<"mars" | "jupiter" | "saturn", number> = {
    mars:    19140.299,
    jupiter:  3034.906,
    saturn:   1222.114,
  };

  if (planet === "mars" || planet === "jupiter" || planet === "saturn") {
    const lon = ((outerL0[planet] + outerL1[planet] * T) % 360 + 360) % 360;
    return ZODIAC_NAMES[Math.floor(lon / 30) % 12];
  }

  // ── Mercury & Venus: always within N signs of the Sun ─────────────────────
  const sunSignIdx = ZODIAC_NAMES.indexOf(getZodiac(month, day));
  // Stable but varied offset seeded by birth date
  const seed = Math.abs((year * 31 + month * 7 + day) | 0);

  if (planet === "mercury") {
    // Max elongation ≈ 28° → can be 0 or ±1 sign from Sun
    const offsets = [-1, 0, 1];
    const offset  = offsets[seed % 3];
    return ZODIAC_NAMES[((sunSignIdx + offset) % 12 + 12) % 12];
  }

  // Venus: max elongation ≈ 47° → can be 0, ±1, or ±2 signs from Sun
  const offsets = [-2, -1, 0, 1, 2];
  const offset  = offsets[(seed * 7) % 5];
  return ZODIAC_NAMES[((sunSignIdx + offset) % 12 + 12) % 12];
}

// ── Core influence text (free) ────────────────────────────────────────────────
const CORE_INFLUENCE: Record<string, Record<string, string>> = {
  venus: {
    default: "感情路徑溫柔而深刻，以真摯取代浮誇，在關係中散發無可替代的磁場能量。",
    active:  "愛情能量外顯活躍，天生懂得發光吸引，魅力在人群中自然而然地流動輻射。",
  },
  jupiter: {
    cross:  "幸運往往來自跨界嘗試，離開舒適圈的那一刻，木星引力正式啟動。",
    steady: "穩扎穩打啟動幸運，深耕一個領域能讓機遇以指數級方式向你匯聚。",
  },
  mercury: {
    net:    "思維如宇宙網絡般龐大精密，能迅速捕捉零散信號並將其結構化成洞見。",
    leap:   "直覺式跳躍思維是核心天賦，感知常走在邏輯之前，語言難以完全追上。",
  },
  mars: {
    snipe:  "行動能量屬「狙擊型」：平時蓄力，一旦鎖定目標便能爆發驚人執行力。",
    endure: "持續輸出型引擎，以韌性與不屈意志力在持久戰中橫掃所有挑戰障礙。",
  },
  saturn: {
    strict: "土星在此擔任嚴師角色，將大目標拆解成可執行小步驟，能有效化焦慮為動力。",
    free:   "天生懂得在規則與自由之間尋找平衡，於混亂中建立個人秩序並掌控全局。",
  },
};

function coreInfluence(key: string, month: number, day: number): string {
  const m = CORE_INFLUENCE[key];
  const entries = Object.values(m);
  return entries[(month + day) % entries.length];
}

// ── Deep analysis pool ────────────────────────────────────────────────────────
const DEEP_ANALYSIS: Record<string, string[]> = {
  venus: [
    "{{NAME}} 對美的感知偏向內斂與經典，在關係中尋求深刻的靈魂共鳴，而非表面的浮華。你有著與生俱來的品味，擅長將日常細節轉化為美的儀式。",
    "{{NAME}} 的金星能量活躍而外顯，在愛情裡往往是主動發光的那一方。你天生懂得如何透過外在的展現來吸引你渴望的人事物，魅力不可抵擋。",
  ],
  jupiter: [
    "{{NAME}} 的幸運往往來自於「跨界」。當你走出舒適圈、嘗試不熟悉的領域時，木星的擴張能量就會為你帶來意想不到的貴人與機遇。",
    "穩扎穩打是 {{NAME}} 啟動木星能量的鑰匙。比起追求爆發性的機會，在一個領域深耕會讓 {{NAME}} 的好運呈現指數級增長。",
  ],
  mercury: [
    "{{NAME}} 的思維像是一張龐大的宇宙網，能迅速捕捉零散資訊並將其結構化。在溝通中，{{NAME}} 擅長一針見血地指出問題核心。",
    "直覺式的跳躍思維是 {{NAME}} 的天賦。你有時會覺得語言難以完全表達你的想法，因為 {{NAME}} 的感知往往走在邏輯之前。",
  ],
  mars: [
    "{{NAME}} 的火星能量屬於「狙擊型」。平時可能看似慵懶，但一旦鎖定目標，{{NAME}} 就能在極短時間內爆發出驚人的執行力。",
    "{{NAME}} 擁有持續輸出的引擎。在面對挑戰時，{{NAME}} 的韌性與不屈不撓的意志力，往往能在持久戰中橫掃一切對手。",
  ],
  saturn: [
    "土星在 {{NAME}} 的星盤中扮演著嚴師的角色。你可能會對自己有過高的期許，學會將大目標拆解成小步驟，能有效讓 {{NAME}} 的焦慮化為動力。",
    "{{NAME}} 天生懂得在規則與自由之間找到平衡。土星給予 {{NAME}} 的不是限制，而是在混亂中建立自我秩序、掌控全局的超凡能力。",
  ],
};

function deepAnalysis(key: string, month: number, day: number): string {
  const pool = DEEP_ANALYSIS[key];
  return pool[(month * day) % pool.length];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PlanetData {
  planet: string;
  element: string;
  domain: string;
  sign: string;       // zodiac sign — always shown for free
  coreText: string;   // one-sentence influence — free
  analysis: string;   // deep analysis — locked behind 2 pts
}

export function getPlanetDeconstruction(
  month: number, day: number, year = 1990, hour = 12, minute = 0
): PlanetData[] {
  return [
    {
      planet:   "金星",
      element:  "♀",
      domain:   "審美戀愛",
      sign:     planetSign("venus",   year, month, day, hour, minute),
      coreText: coreInfluence("venus",   month, day),
      analysis: deepAnalysis("venus",   month, day),
    },
    {
      planet:   "木星",
      element:  "♃",
      domain:   "幸運機遇",
      sign:     planetSign("jupiter", year, month, day, hour, minute),
      coreText: coreInfluence("jupiter", month, day),
      analysis: deepAnalysis("jupiter", month, day),
    },
    {
      planet:   "水星",
      element:  "☿",
      domain:   "思維溝通",
      sign:     planetSign("mercury", year, month, day, hour, minute),
      coreText: coreInfluence("mercury", month, day),
      analysis: deepAnalysis("mercury", month, day),
    },
    {
      planet:   "火星",
      element:  "♂",
      domain:   "行動爆發",
      sign:     planetSign("mars",    year, month, day, hour, minute),
      coreText: coreInfluence("mars",    month, day),
      analysis: deepAnalysis("mars",    month, day),
    },
    {
      planet:   "土星",
      element:  "♄",
      domain:   "秩序自律",
      sign:     planetSign("saturn",  year, month, day, hour, minute),
      coreText: coreInfluence("saturn",  month, day),
      analysis: deepAnalysis("saturn",  month, day),
    },
  ];
}

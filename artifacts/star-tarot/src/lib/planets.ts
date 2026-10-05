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
  "venus": {
    "default": "金星看感情與喜好。你重視相處是否舒服，也在意生活中的美感。",
    "active": "金星看感情與喜好。你願意表達欣賞，但也需要對方真誠回應。"
  },
  "jupiter": {
    "cross": "木星看學習與拓展。嘗試新領域時，先了解條件，再投入時間。",
    "steady": "木星看學習與拓展。持續累積一項能力，比一直尋找捷徑更踏實。"
  },
  "mercury": {
    "net": "水星看思考與溝通。整理資訊時，先分清楚重點，再把理由說明白。",
    "leap": "水星看思考與溝通。想到新點子後，可以用例子讓別人更容易理解。"
  },
  "mars": {
    "snipe": "火星看行動與衝突。目標明確時你較容易投入，行動前也要留意風險。",
    "endure": "火星看行動與衝突。持續做一點，比一口氣把自己逼到筋疲力盡更有效。"
  },
  "saturn": {
    "strict": "土星看責任與壓力。把大目標拆成小步驟，較容易看見進度。",
    "free": "土星看責任與壓力。清楚安排時間與分工，不必所有事情都由你承擔。"
  }
};

function coreInfluence(key: string, month: number, day: number): string {
  const m = CORE_INFLUENCE[key];
  const entries = Object.values(m);
  return entries[(month + day) % entries.length];
}

// ── Deep analysis pool ────────────────────────────────────────────────────────
// {{NAME}} = 暱稱; {{SIGN}} = 該行星落入星座（由 deepAnalysis() 注入）
const DEEP_ANALYSIS: Record<string, string[]> = {
  "venus": [
    "金星用來觀察喜好、感情與花錢方式。\n{{NAME}}，你的金星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意關係是否互相尊重，你的付出是否得到回應。你可以試著把喜歡與不喜歡的相處方式說清楚。送禮或安排約會前，先問對方真正想要什麼。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。",
    "金星用來觀察喜好、感情與花錢方式。\n{{NAME}}，你的金星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意關係是否互相尊重，你的付出是否得到回應。你可以試著為喜歡的東西花錢時，先分清楚想要和需要，再替自己訂一個舒服的預算。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。"
  ],
  "jupiter": [
    "木星用來觀察學習、成長與新機會。\n{{NAME}}，你的木星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意新機會是否符合你的能力、時間和長期目標。你可以試著遇到新課程或合作邀請，先問清楚內容、費用與責任，再決定是否參與。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。",
    "木星用來觀察學習、成長與新機會。\n{{NAME}}，你的木星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意新機會是否符合你的能力、時間和長期目標。你可以試著挑一項值得長期累積的能力，安排固定練習，也定期回顧自己的進步。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。"
  ],
  "mercury": [
    "水星用來觀察思考、學習與表達。\n{{NAME}}，你的水星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意你以為已經說清楚的事，對方是否真的理解。你可以試著談重要事情時，先說結論，再補理由與例子，最後確認對方的理解。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。",
    "水星用來觀察思考、學習與表達。\n{{NAME}}，你的水星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意你以為已經說清楚的事，對方是否真的理解。你可以試著腦中想法很多時，先寫下三個重點，再一件一件討論，不急著一次說完。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。"
  ],
  "mars": [
    "火星用來觀察行動、勇氣與生氣時的反應。\n{{NAME}}，你的火星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意你是在朝目標前進，還是只想趕快結束不舒服的感覺。你可以試著行動前先列出最需要完成的一步，確認風險可以承擔，再開始做。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。",
    "火星用來觀察行動、勇氣與生氣時的反應。\n{{NAME}}，你的火星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意你是在朝目標前進，還是只想趕快結束不舒服的感覺。你可以試著生氣時先暫停回覆，等情緒緩和後說明發生了什麼，以及你希望怎麼處理。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。"
  ],
  "saturn": [
    "土星用來觀察責任、規律與容易感到壓力的地方。\n{{NAME}}，你的土星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意哪些責任真的屬於你，哪些可以討論或分擔。你可以試著把工作分成必須完成、可以延後、可以求助三類，別把每件事都當成同樣緊急。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。",
    "土星用來觀察責任、規律與容易感到壓力的地方。\n{{NAME}}，你的土星在{{SIGN}}。看這顆行星時，可以從日常的習慣開始，而不必把自己限制在單一性格裡。先留意哪些責任真的屬於你，哪些可以討論或分擔。你可以試著先訂一個做得到的標準，完成後再改善，讓休息成為計畫的一部分。如果做完仍感到吃力，記錄是哪一個環節讓你不舒服，再調整步調。也可以和信任的人討論，讓對方知道你現在的需要。"
  ]
};

const PLANET_COLORS: Record<string, string> = {
  venus:   "#FFB7D5",
  jupiter: "#4AFF8C",
  mercury: "#7EC8E3",
  mars:    "#FF6B4A",
  saturn:  "#C0C8D8",
};

const PLANET_TITLES: Record<string, string> = {
  venus:   "♀ 金星・喜好與感情深入解析",
  jupiter: "♃ 木星・學習與機會深入解析",
  mercury: "☿ 水星・思考與溝通深入解析",
  mars:    "♂ 火星・行動與衝突深入解析",
  saturn:  "♄ 土星・責任與壓力深入解析",
};

function deepAnalysisHtml(key: string, month: number, day: number, sign: string): string {
  const pool = DEEP_ANALYSIS[key];
  const raw = pool[(month * day) % pool.length].replace(/\{\{SIGN\}\}/g, sign);
  const newlineIdx = raw.indexOf("\n");
  const def  = newlineIdx >= 0 ? raw.slice(0, newlineIdx) : raw;
  const body = newlineIdx >= 0 ? raw.slice(newlineIdx + 1) : "";

  const color = PLANET_COLORS[key] ?? "#D4AF37";
  const title = PLANET_TITLES[key] ?? "";

  return [
    `<p style="color:${color};font-weight:700;font-size:13px;letter-spacing:0.08em;margin:0 0 10px;text-shadow:0 0 10px ${color}88;">${title}</p>`,
    `<p style="color:#FFA94D;font-weight:700;font-size:14px;line-height:1.75;margin:0 0 10px;">${def}</p>`,
    `<p style="color:#FFFFFF;font-size:14px;line-height:1.75;margin:0;">${body}</p>`,
  ].join("");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PlanetData {
  planet: string;
  element: string;
  domain: string;
  sign: string;       // zodiac sign — always shown for free
  coreText: string;   // one-sentence influence — free
  analysis: string;   // deep analysis HTML — locked behind 2 pts
}

export function getPlanetDeconstruction(
  month: number, day: number, year = 1990, hour = 12, minute = 0, actualSigns?: Record<"venus"|"jupiter"|"mercury"|"mars"|"saturn",string>
): PlanetData[] {
  const vSign  = actualSigns?.venus ?? planetSign("venus",   year, month, day, hour, minute);
  const jSign  = actualSigns?.jupiter ?? planetSign("jupiter", year, month, day, hour, minute);
  const meSign = actualSigns?.mercury ?? planetSign("mercury", year, month, day, hour, minute);
  const maSign = actualSigns?.mars ?? planetSign("mars",    year, month, day, hour, minute);
  const sSign  = actualSigns?.saturn ?? planetSign("saturn",  year, month, day, hour, minute);
  return [
    { planet: "金星", element: "♀", domain: "喜好與感情", sign: vSign,  coreText: coreInfluence("venus",   month, day), analysis: deepAnalysisHtml("venus",   month, day, vSign)  },
    { planet: "木星", element: "♃", domain: "學習與機會", sign: jSign,  coreText: coreInfluence("jupiter", month, day), analysis: deepAnalysisHtml("jupiter", month, day, jSign)  },
    { planet: "水星", element: "☿", domain: "思考與溝通", sign: meSign, coreText: coreInfluence("mercury", month, day), analysis: deepAnalysisHtml("mercury", month, day, meSign) },
    { planet: "火星", element: "♂", domain: "行動與衝突", sign: maSign, coreText: coreInfluence("mars",    month, day), analysis: deepAnalysisHtml("mars",    month, day, maSign) },
    { planet: "土星", element: "♄", domain: "責任與壓力", sign: sSign,  coreText: coreInfluence("saturn",  month, day), analysis: deepAnalysisHtml("saturn",  month, day, sSign)  },
  ];
}

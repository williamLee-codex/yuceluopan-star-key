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
// {{NAME}} = 暱稱; {{SIGN}} = 該行星落入星座（由 deepAnalysis() 注入）
const DEEP_ANALYSIS: Record<string, string[]> = {
  venus: [
    "金星代表的是一個人的美感鑑賞力、人際享樂、愛情觀，以及你如何定義生命中美好事物的財富價值觀。它是你對物質與精神享受的最高追求。\n你的金星在{{SIGN}}，所以{{NAME}}對美學、質感、生活品味有著極度挑剔且天生敏銳的靈魂。你在人際關係或愛情中非常看重精神上的共鳴與和諧感，無法忍受粗俗或缺乏質感的互動。在財富觀上，你非常願意為了提升生活品質、購買能滿足靈魂的藝術享受而大方買單。對{{NAME}}而言，金錢的價值在於轉化為美好、浪漫且有品味的生活體驗。你天生就懂得如何用最優雅的方式，將自己的美感天賦與價值轉化為現實生活中的美好回報，並大方地與世界分享。",
    "金星代表的是一個人的美感鑑賞力、人際享樂、愛情觀，以及你如何定義生命中美好事物的財富價值觀。它是你對物質與精神享受的最高追求。\n你的金星在{{SIGN}}，所以{{NAME}}的金星能量活躍而外顯，在愛情裡往往是主動發光的那一方。你天生懂得如何透過外在的展現來吸引你渴望的人事物，這股無可抵擋的魅力是你與生俱來的禮物。你對生活品質的高標準驅使你不斷提升自己的審美層次，讓周圍的人都因你而受到美的薰陶，並在不知不覺中被你所吸引。",
  ],
  jupiter: [
    "木星代表的是一個人命運中的幸運來源、視野擴展、高等智慧，以及你如何獲得老天庇佑的精神信仰與貴人運勢。\n你的木星在{{SIGN}}，所以{{NAME}}的幸運往往來自於跨界嘗試。當你走出舒適圈、嘗試不熟悉的領域時，木星的擴張能量就會為你帶來意想不到的貴人與機遇。你的人生智慧與精神格局會隨著經歷的事情越多而越發深厚。你越是保持慷慨、開放的心胸，老天給你的回報以及主動送上門的資源就會越龐大。木星是{{NAME}}人生路上最穩固的隱形護盾，總能在關鍵時刻幫你逢凶化吉。",
    "木星代表的是一個人命運中的幸運來源、視野擴展、高等智慧，以及你如何獲得老天庇佑的精神信仰與貴人運勢。\n你的木星在{{SIGN}}，所以穩扎穩打是{{NAME}}啟動木星能量的鑰匙。比起追求爆發性的機會，在一個領域深耕會讓你的好運呈現指數級增長。你的好運不是靠衝動，而是靠持續深耕換來的厚積薄發。這顆木星給予{{NAME}}的護佑，在你用心守候一件事情的過程中會越加明顯，老天爺永遠站在懂得耐心的人這一邊。",
  ],
  mercury: [
    "水星代表的是一個人的邏輯思考力、溝通表達技巧、隨機應變的商業頭腦，以及你下達決策時的精準度與思維模式。\n你的水星在{{SIGN}}，所以{{NAME}}的大腦運轉速度與思考模式具有非常強烈的個人風格。你的思維像是一張龐大的宇宙網，能迅速捕捉零散資訊並將其結構化。在溝通中，你擅長一針見血地指出問題核心，具備極強的學習能力與行銷說服力。在商務談判或創意企劃上，{{NAME}}具備隨機應變的天賦，思維絕不守舊，能將腦海中的無形點子完美落實，並轉化為實質的影響力。",
    "水星代表的是一個人的邏輯思考力、溝通表達技巧、隨機應變的商業頭腦，以及你下達決策時的精準度與思維模式。\n你的水星在{{SIGN}}，所以直覺式的跳躍思維是{{NAME}}的天賦。你有時會覺得語言難以完全表達你的想法，因為你的感知往往走在邏輯之前。你非常善於透過語言、文字或是直擊痛點的溝通方式跟世界交換資訊，擅長用精準的表達與應變策略在不斷變動的市場與人際環境中脫穎而出，創造出深刻的影響力。",
  ],
  mars: [
    "火星代表的是一個人的行動力、爆發力、開創事業的野心、面對逆境時的勇氣，以及你脾氣與慾望的展現方式。\n你的火星在{{SIGN}}，所以{{NAME}}的火星能量屬於「狙擊型」。你雖然外表可能顯得溫和，但內心深處其實隱藏著一股極其驚人的行動力與爆發力。你不是一個甘於平庸或任人擺佈的人，當你真正鎖定了一個目標，你會瞬間展現出大刀闊斧、毫不猶豫的強大執行力。這股火星的能量如果能精準投注在事業啟動與自我突破上，將會成為{{NAME}}衝破舒適圈、橫掃市場的最強燃料。",
    "火星代表的是一個人的行動力、爆發力、開創事業的野心、面對逆境時的勇氣，以及你脾氣與慾望的展現方式。\n你的火星在{{SIGN}}，所以{{NAME}}擁有持續輸出的強勁引擎。在面對挑戰時，你的韌性與不屈不撓的意志力，往往能在持久戰中橫掃一切對手。你的野心與開創力具有很強的衝勁，不達目標絕不收手是{{NAME}}面對逆境時最鮮明的靈魂印記，也是老天賜給你最鋒利的人生武器，幫你攻城掠地。",
  ],
  saturn: [
    "土星代表的是一個人生命中的責任、壓力、安全感的邊界、老天給予的考驗，以及你需要建立的鋼鐵紀律與大器晚成之處。\n你的土星在{{SIGN}}，所以這個星座所代表的領域，往往是{{NAME}}內心最容易感到緊繃、焦慮、或是不自覺對自己要求極高的地方。你常常默默地把相關的責任與壓力往自己身上扛，對自己有著嚴苛的自律，害怕流於失敗。土星在這個位置是老天派來考驗你的「嚴格導師」，它會設下重重關卡，逼著你學習建立最嚴謹的規矩與紀律防線。雖然前期會覺得沉重，但只要{{NAME}}學會不用對抗的心態去面對，這顆土星最終會化為你人生王國中最結實、最不可摧毀的萬里長城。",
    "土星代表的是一個人生命中的責任、壓力、安全感的邊界、老天給予的考驗，以及你需要建立的鋼鐵紀律與大器晚成之處。\n你的土星在{{SIGN}}，所以{{NAME}}天生懂得在規則與自由之間尋找平衡，於混亂中建立個人秩序並掌控全局。土星給予{{NAME}}的不是限制，而是在混亂中建立自我秩序、掌控全局的超凡能力。你能有效地將大目標拆解成可執行的小步驟，讓焦慮化為動力。這份由土星賜予的深層自律，將在歲月的沉澱中化為你最堅不可摧的競爭優勢。",
  ],
};

const PLANET_COLORS: Record<string, string> = {
  venus:   "#FFB7D5",
  jupiter: "#4AFF8C",
  mercury: "#7EC8E3",
  mars:    "#FF6B4A",
  saturn:  "#C0C8D8",
};

const PLANET_TITLES: Record<string, string> = {
  venus:   "♀ 金星・審美戀愛深析",
  jupiter: "♃ 木星・幸運機遇深析",
  mercury: "☿ 水星・思維溝通深析",
  mars:    "♂ 火星・行動爆發深析",
  saturn:  "♄ 土星・秩序自律深析",
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
  month: number, day: number, year = 1990, hour = 12, minute = 0
): PlanetData[] {
  const vSign  = planetSign("venus",   year, month, day, hour, minute);
  const jSign  = planetSign("jupiter", year, month, day, hour, minute);
  const meSign = planetSign("mercury", year, month, day, hour, minute);
  const maSign = planetSign("mars",    year, month, day, hour, minute);
  const sSign  = planetSign("saturn",  year, month, day, hour, minute);
  return [
    { planet: "金星", element: "♀", domain: "審美戀愛", sign: vSign,  coreText: coreInfluence("venus",   month, day), analysis: deepAnalysisHtml("venus",   month, day, vSign)  },
    { planet: "木星", element: "♃", domain: "幸運機遇", sign: jSign,  coreText: coreInfluence("jupiter", month, day), analysis: deepAnalysisHtml("jupiter", month, day, jSign)  },
    { planet: "水星", element: "☿", domain: "思維溝通", sign: meSign, coreText: coreInfluence("mercury", month, day), analysis: deepAnalysisHtml("mercury", month, day, meSign) },
    { planet: "火星", element: "♂", domain: "行動爆發", sign: maSign, coreText: coreInfluence("mars",    month, day), analysis: deepAnalysisHtml("mars",    month, day, maSign) },
    { planet: "土星", element: "♄", domain: "秩序自律", sign: sSign,  coreText: coreInfluence("saturn",  month, day), analysis: deepAnalysisHtml("saturn",  month, day, sSign)  },
  ];
}

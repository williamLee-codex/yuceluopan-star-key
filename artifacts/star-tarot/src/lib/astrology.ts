const ZODIAC_NAMES = [
  "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座",
  "天秤座", "天蠍座", "射手座", "魔羯座", "水瓶座", "雙魚座"
];

const ARCHETYPE_FAMILIES = [
  "主動開創",
  "穩定踏實",
  "靈活好奇",
  "細心照顧",
  "熱情表達",
  "仔細可靠",
  "重視公平",
  "深入專注",
  "樂於探索",
  "耐心規劃",
  "獨立思考",
  "敏感體貼"
];

const ZODIAC_SIGNS = [
  { name: "魔羯座", end: [1, 19] },
  { name: "水瓶座", end: [2, 18] },
  { name: "雙魚座", end: [3, 20] },
  { name: "牡羊座", end: [4, 19] },
  { name: "金牛座", end: [5, 20] },
  { name: "雙子座", end: [6, 20] },
  { name: "巨蟹座", end: [7, 22] },
  { name: "獅子座", end: [8, 22] },
  { name: "處女座", end: [9, 22] },
  { name: "天秤座", end: [10, 22] },
  { name: "天蠍座", end: [11, 21] },
  { name: "射手座", end: [12, 21] },
  { name: "魔羯座", end: [12, 31] }
];

export interface AstrologyBirthplace {
  latitude: number;
  longitude: number;
  timeZone: string;
}

const TAIWAN_BIRTHPLACE: AstrologyBirthplace = {
  latitude: 25,
  longitude: 121.5,
  timeZone: "Asia/Taipei",
};

function timeZoneOffsetAt(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) - date.getTime();
}

export function localTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wallTime;
  for (let pass = 0; pass < 2; pass += 1) {
    instant = wallTime - timeZoneOffsetAt(new Date(instant), timeZone);
  }
  return new Date(instant);
}

/** Legacy Julian Day helper — converts Taiwan time (UTC+8) to UT JD. */
export function julianDay(
  year: number, month: number, day: number,
  hour: number, minute: number, tzOffset = 8
): number {
  const utcFrac = (hour - tzOffset + minute / 60) / 24;
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + utcFrac + B - 1524.5;
}

function julianDayForBirthplace(
  year: number, month: number, day: number, hour: number, minute: number, birthplace?: AstrologyBirthplace,
): number {
  const place = birthplace ?? TAIWAN_BIRTHPLACE;
  return localTimeToUtc(year, month, day, hour, minute, place.timeZone).getTime() / 86_400_000 + 2_440_587.5;
}

export function getZodiac(month: number, day: number): string {
  for (const sign of ZODIAC_SIGNS) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return "魔羯座";
}

/**
 * Moon ecliptic longitude via Meeus simplified algorithm (accurate ±2°, sufficient for sign).
 * Uses Taiwan UTC+8 via julianDay().
 */
export function getMoonSign(year: number, month: number, day: number, hour = 12, minute = 0, birthplace?: AstrologyBirthplace): string {
  const JD = julianDayForBirthplace(year, month, day, hour, minute, birthplace);
  const T = (JD - 2451545.0) / 36525;
  const L0 = 218.3165 + 481267.8813 * T;
  const M  = ((134.9634 + 477198.8676 * T) % 360) * Math.PI / 180;
  const Ms = ((357.5291 +  35999.0503 * T) % 360) * Math.PI / 180;
  const F  = (( 93.2720 + 483202.0175 * T) % 360) * Math.PI / 180;
  const D  = ((297.8502 + 445267.1115 * T) % 360) * Math.PI / 180;
  const corr = 6.289 * Math.sin(M)
    - 1.274 * Math.sin(2 * D - M)
    + 0.658 * Math.sin(2 * D)
    - 0.214 * Math.sin(2 * M)
    - 0.186 * Math.sin(Ms)
    - 0.114 * Math.sin(2 * F);
  const lon = ((L0 + corr) % 360 + 360) % 360;
  return ZODIAC_NAMES[Math.floor(lon / 30) % 12];
}

/**
 * Ascendant (Rising Sign) for the selected birthplace.
 *
 * Algorithm: scan the ecliptic for the degree where the altitude
 * transitions from POSITIVE → NEGATIVE.  That crossing is where the
 * ecliptic descends through the eastern horizon — i.e., the Ascendant.
 *
 * Background: at any instant the visible arc of the ecliptic (above the
 * horizon) runs from the Ascendant (east, alt=0 dropping below) to the
 * Descendant (west, alt=0 rising above), passing through the Midheaven.
 * Scanning λ 0→360° we look for the first sign-change from + to ≤ 0.
 */
export function getRisingSign(
  year: number, month: number, day: number,
  hour = 12, minute = 0, birthplace?: AstrologyBirthplace,
): string {
  const place = birthplace ?? TAIWAN_BIRTHPLACE;
  const lat  = place.latitude * Math.PI / 180;
  const lon  = place.longitude;
  const eps  = 23.439 * Math.PI / 180;
  const JD   = julianDayForBirthplace(year, month, day, hour, minute, place);
  const T    = (JD - 2451545.0) / 36525;

  // Greenwich Mean Sidereal Time (degrees)
  const GMST = ((280.46061837
    + 360.98564736629 * (JD - 2451545.0)
    + 0.000387933 * T * T
    - (T * T * T) / 38710000
  ) % 360 + 360) % 360;

  // Local Sidereal Time (degrees)
  const LST_rad = ((GMST + lon) % 360) * Math.PI / 180;

  /** Sine of the altitude of the ecliptic point at ecliptic longitude lamDeg */
  function sinAlt(lamDeg: number): number {
    const lam = lamDeg * Math.PI / 180;
    const ra  = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
    const sinDec = Math.max(-1, Math.min(1, Math.sin(eps) * Math.sin(lam)));
    const dec = Math.asin(sinDec);
    const ha  = LST_rad - ra;
    return Math.sin(lat) * sinDec + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  }

  // Coarse scan — find the 1° bracket where altitude crosses 0 (+ → ≤ 0)
  for (let i = 0; i < 360; i++) {
    const a1 = sinAlt(i);
    const a2 = sinAlt(i + 1);
    if (a1 > 0 && a2 <= 0) {
      // Binary-search refinement (~0.001° precision)
      // lo → last point above horizon; hi → first point AT/below horizon (= Ascendant)
      let lo = i, hi = i + 1;
      for (let k = 0; k < 20; k++) {
        const mid = (lo + hi) / 2;
        if (sinAlt(mid) > 0) lo = mid; else hi = mid;
      }
      // Use hi: the exact crossing point (or first degree on/below horizon = ASC)
      return ZODIAC_NAMES[Math.floor(hi / 30) % 12];
    }
  }

  // Fallback: use classical formula with quadrant correction
  const GMST_rad = ((GMST + lon) % 360) * Math.PI / 180;
  const tanASC = -Math.cos(GMST_rad) / (Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(GMST_rad));
  let asc = Math.atan(tanASC) * 180 / Math.PI;
  if (Math.cos(GMST_rad) > 0) asc += 180;
  asc = ((asc % 360) + 360) % 360;
  return ZODIAC_NAMES[Math.floor(asc / 30) % 12];
}

/* ─── Birthday profiles ─────────────────────────────────────────── */
interface BirthdayProfile {
  zodiac: string;
  archetype: string;
  profile: string;
}

const PROFILES: Record<string, BirthdayProfile> = {
  "牡羊座": {
    "zodiac": "牡羊座",
    "archetype": "主動開創",
    "profile": "{{NAME}}，太陽在牡羊座，可以從「主動開創」理解你的做事風格。你想到就想試，遇到新挑戰通常願意先跨出第一步。這份長處適合用在需要你投入的事情上；不過，你也做決定太快，可能還沒聽完就急著回應。遇到卡關時，試著把想做的事分成三步，先確認時間、費用與需要誰幫忙。"
  },
  "金牛座": {
    "zodiac": "金牛座",
    "archetype": "穩定踏實",
    "profile": "{{NAME}}，太陽在金牛座，可以從「穩定踏實」理解你的做事風格。你看重承諾與生活品質，習慣用持續的行動讓人安心。這份長處適合用在需要你投入的事情上；不過，你也對熟悉的安排較堅持，可能很難接受臨時改變。遇到卡關時，試著先區分哪些事情一定要保留，哪些可以小幅調整，留一個可以嘗試的新做法。"
  },
  "雙子座": {
    "zodiac": "雙子座",
    "archetype": "靈活好奇",
    "profile": "{{NAME}}，太陽在雙子座，可以從「靈活好奇」理解你的做事風格。你喜歡交換想法、學習新事物，也擅長把人和資訊連在一起。這份長處適合用在需要你投入的事情上；不過，你也注意力容易被新鮮事吸引，原本答應的事可能放到一旁。遇到卡關時，試著把最重要的一件事寫下來，完成之後再開始下一件，聊天時也留時間聽對方說。"
  },
  "巨蟹座": {
    "zodiac": "巨蟹座",
    "archetype": "細心照顧",
    "profile": "{{NAME}}，太陽在巨蟹座，可以從「細心照顧」理解你的做事風格。你很在意親近的人，常從小細節察覺別人的感受。這份長處適合用在需要你投入的事情上；不過，你也可能把照顧別人放在自己之前，累了也不肯開口。遇到卡關時，試著需要陪伴時直接說，希望休息時也說清楚，別讓對方只能靠猜。"
  },
  "獅子座": {
    "zodiac": "獅子座",
    "archetype": "熱情表達",
    "profile": "{{NAME}}，太陽在獅子座，可以從「熱情表達」理解你的做事風格。你希望自己的努力被看見，也願意帶動大家一起做事。這份長處適合用在需要你投入的事情上；不過，你也可能太在意別人的評價，把沒有回應當成不被重視。遇到卡關時，試著說明你做了什麼、希望得到哪種回饋，也讓別人有表達與決定的機會。"
  },
  "處女座": {
    "zodiac": "處女座",
    "archetype": "仔細可靠",
    "profile": "{{NAME}}，太陽在處女座，可以從「仔細可靠」理解你的做事風格。你擅長發現細節與問題，希望把事情做好、讓生活有秩序。這份長處適合用在需要你投入的事情上；不過，你也容易一直修正小地方，讓自己和身邊的人都很有壓力。遇到卡關時，試著先約定做到什麼程度就算完成，提出問題時也說出可以怎麼改善。"
  },
  "天秤座": {
    "zodiac": "天秤座",
    "archetype": "重視公平",
    "profile": "{{NAME}}，太陽在天秤座，可以從「重視公平」理解你的做事風格。你在意相處是否舒服，也常願意聽雙方的理由、協調不同意見。這份長處適合用在需要你投入的事情上；不過，你也可能為了不讓人失望而拖延決定，或答應自己不想做的事。遇到卡關時，試著先說出你真正想要什麼，再討論可以怎麼折衷，別把所有選擇交給別人。"
  },
  "天蠍座": {
    "zodiac": "天蠍座",
    "archetype": "深入專注",
    "profile": "{{NAME}}，太陽在天蠍座，可以從「深入專注」理解你的做事風格。你一旦在乎，就會認真投入，也希望彼此誠實、值得信任。這份長處適合用在需要你投入的事情上；不過，你也不安時可能反覆試探，卻沒有說出真正擔心的事。遇到卡關時，試著先說出你在意的具體事情，再問對方的想法，避免只靠猜測下結論。"
  },
  "射手座": {
    "zodiac": "射手座",
    "archetype": "樂於探索",
    "profile": "{{NAME}}，太陽在射手座，可以從「樂於探索」理解你的做事風格。你喜歡自由、新經驗與有意義的目標，不願生活只有固定安排。這份長處適合用在需要你投入的事情上；不過，你也可能答應太多，或因為急著前進而忽略細節。遇到卡關時，試著保留探索的空間，同時把時間與承諾寫清楚，出發前先完成必要準備。"
  },
  "魔羯座": {
    "zodiac": "魔羯座",
    "archetype": "耐心規劃",
    "profile": "{{NAME}}，太陽在魔羯座，可以從「耐心規劃」理解你的做事風格。你重視責任與長期成果，願意一步一步累積能力和信任。這份長處適合用在需要你投入的事情上；不過，你也容易把休息視為浪費，或把感受放到工作之後。遇到卡關時，試著安排固定的休息與相處時間，說明自己的壓力，別只讓成果代替心意。"
  },
  "水瓶座": {
    "zodiac": "水瓶座",
    "archetype": "獨立思考",
    "profile": "{{NAME}}，太陽在水瓶座，可以從「獨立思考」理解你的做事風格。你有自己的看法，願意嘗試不同做法，也重視每個人的自主選擇。這份長處適合用在需要你投入的事情上；不過，你也可能以分析代替情緒回應，讓對方覺得你不在意。遇到卡關時，試著先回應對方的感受，再討論方法，需要獨處時也說明多久會再聯絡。"
  },
  "雙魚座": {
    "zodiac": "雙魚座",
    "archetype": "敏感體貼",
    "profile": "{{NAME}}，太陽在雙魚座，可以從「敏感體貼」理解你的做事風格。你容易感受到別人的心情，想像力豐富，也在意相處的溫柔程度。這份長處適合用在需要你投入的事情上；不過，你也可能承擔太多別人的情緒，或因怕傷人而不敢拒絕。遇到卡關時，試著先問自己是否真的有餘力，說明能幫忙的範圍，不必把每個問題都扛下來。"
  }
};

export function getBirthdayProfile(month: number, day: number, actualSun?: string): BirthdayProfile {
  const zodiac = actualSun ?? getZodiac(month, day);
  return PROFILES[zodiac] ?? PROFILES["天秤座"];
}

/* ─── Triple sign profile ───────────────────────────────────────── */
export function getTripleSignProfile(
  year: number, month: number, day: number, hour = 12, minute = 0, birthplace?: AstrologyBirthplace, actualSigns?: {sun:string;moon:string;rising:string},
) {
  const sunSign    = actualSigns?.sun ?? getZodiac(month, day);
  const moonSign   = actualSigns?.moon ?? getMoonSign(year, month, day, hour, minute, birthplace);
  const risingSign = actualSigns?.rising ?? getRisingSign(year, month, day, hour, minute, birthplace);

  const archIdx = (month + day + hour) % ARCHETYPE_FAMILIES.length;

  const sunText = SUN_DESTINY[sunSign] ?? '';
  const moonText = MOON_DESTINY[moonSign] ?? '';
  const basicDescription = `太陽在${sunSign}，看你怎麼追求目標；月亮在${moonSign}，看你需要什麼樣的安心感；上升在${risingSign}，看你面對新環境時常用的相處方式。三者可能相似，也可能不同。`;
  const deepProfile = `<div style="display:flex;flex-direction:column;gap:22px;">
    <div><h3 style="color:#D4AF37;font-size:18px;">太陽：你的目標與做事風格</h3><p>${sunText}</p></div>
    <div><h3 style="color:#FFB6C1;font-size:18px;">月亮：你的感受與安心來源</h3><p>${moonText}</p></div>
    <div><h3 style="color:#87CEFA;font-size:18px;">上升：你給人的第一印象</h3><p>{{NAME}}，上升在${risingSign}，描述你面對陌生人或新環境時，較容易表現出來的樣子。初次見面時的你，可能和熟悉之後很不一樣。別人對你的第一印象，也不一定就是你的全部。當相處讓你感到吃力，可以先說明自己的習慣與需要，讓對方慢慢認識真正的你。</p></div>
    <div><h3 style="color:#E6E6FA;font-size:18px;">放在一起看：想要、需要與表現</h3><p>太陽在${sunSign}、月亮在${moonSign}、上升在${risingSign}，分別從目標、感受和相處方式看你。想往前走卻又需要休息，並不矛盾；外表冷靜，也不代表心裡沒有感受。遇到猶豫時，先問自己三件事：我想完成什麼？我現在最需要什麼？我有沒有把這些說清楚？先處理最迫切的一件，再安排下一步。</p></div>
  </div>`;
  return { sunSign, moonSign, risingSign, archetype: ARCHETYPE_FAMILIES[archIdx], basicDescription, deepProfile };
}

/* ─── Sun Destiny Profiles (外在野心庫，150字) ──────────────────── */
const SUN_DESTINY: Record<string, string> = {
  "牡羊座": "{{NAME}}，太陽在牡羊座，反映你如何追求目標與表達自己。你想到就想試，遇到新挑戰通常願意先跨出第一步。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你做決定太快，可能還沒聽完就急著回應。下次做重要決定前，試著把想做的事分成三步，先確認時間、費用與需要誰幫忙。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "金牛座": "{{NAME}}，太陽在金牛座，反映你如何追求目標與表達自己。你看重承諾與生活品質，習慣用持續的行動讓人安心。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你對熟悉的安排較堅持，可能很難接受臨時改變。下次做重要決定前，試著先區分哪些事情一定要保留，哪些可以小幅調整，留一個可以嘗試的新做法。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "雙子座": "{{NAME}}，太陽在雙子座，反映你如何追求目標與表達自己。你喜歡交換想法、學習新事物，也擅長把人和資訊連在一起。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你注意力容易被新鮮事吸引，原本答應的事可能放到一旁。下次做重要決定前，試著把最重要的一件事寫下來，完成之後再開始下一件，聊天時也留時間聽對方說。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "巨蟹座": "{{NAME}}，太陽在巨蟹座，反映你如何追求目標與表達自己。你很在意親近的人，常從小細節察覺別人的感受。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能把照顧別人放在自己之前，累了也不肯開口。下次做重要決定前，試著需要陪伴時直接說，希望休息時也說清楚，別讓對方只能靠猜。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "獅子座": "{{NAME}}，太陽在獅子座，反映你如何追求目標與表達自己。你希望自己的努力被看見，也願意帶動大家一起做事。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能太在意別人的評價，把沒有回應當成不被重視。下次做重要決定前，試著說明你做了什麼、希望得到哪種回饋，也讓別人有表達與決定的機會。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "處女座": "{{NAME}}，太陽在處女座，反映你如何追求目標與表達自己。你擅長發現細節與問題，希望把事情做好、讓生活有秩序。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你容易一直修正小地方，讓自己和身邊的人都很有壓力。下次做重要決定前，試著先約定做到什麼程度就算完成，提出問題時也說出可以怎麼改善。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "天秤座": "{{NAME}}，太陽在天秤座，反映你如何追求目標與表達自己。你在意相處是否舒服，也常願意聽雙方的理由、協調不同意見。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能為了不讓人失望而拖延決定，或答應自己不想做的事。下次做重要決定前，試著先說出你真正想要什麼，再討論可以怎麼折衷，別把所有選擇交給別人。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "天蠍座": "{{NAME}}，太陽在天蠍座，反映你如何追求目標與表達自己。你一旦在乎，就會認真投入，也希望彼此誠實、值得信任。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你不安時可能反覆試探，卻沒有說出真正擔心的事。下次做重要決定前，試著先說出你在意的具體事情，再問對方的想法，避免只靠猜測下結論。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "射手座": "{{NAME}}，太陽在射手座，反映你如何追求目標與表達自己。你喜歡自由、新經驗與有意義的目標，不願生活只有固定安排。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能答應太多，或因為急著前進而忽略細節。下次做重要決定前，試著保留探索的空間，同時把時間與承諾寫清楚，出發前先完成必要準備。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "魔羯座": "{{NAME}}，太陽在魔羯座，反映你如何追求目標與表達自己。你重視責任與長期成果，願意一步一步累積能力和信任。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你容易把休息視為浪費，或把感受放到工作之後。下次做重要決定前，試著安排固定的休息與相處時間，說明自己的壓力，別只讓成果代替心意。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "水瓶座": "{{NAME}}，太陽在水瓶座，反映你如何追求目標與表達自己。你有自己的看法，願意嘗試不同做法，也重視每個人的自主選擇。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能以分析代替情緒回應，讓對方覺得你不在意。下次做重要決定前，試著先回應對方的感受，再討論方法，需要獨處時也說明多久會再聯絡。這能讓你保留自己的風格，同時減少不必要的壓力。",
  "雙魚座": "{{NAME}}，太陽在雙魚座，反映你如何追求目標與表達自己。你容易感受到別人的心情，想像力豐富，也在意相處的溫柔程度。工作或生活中，可以把這份長處用在你最重視的事情上。需要留意的是，你可能承擔太多別人的情緒，或因怕傷人而不敢拒絕。下次做重要決定前，試著先問自己是否真的有餘力，說明能幫忙的範圍，不必把每個問題都扛下來。這能讓你保留自己的風格，同時減少不必要的壓力。"
};

/* ─── Moon Destiny Profiles (暗夜情緒地雷庫，150字) ─────────────── */
const MOON_DESTINY: Record<string, string> = {
  "牡羊座": "{{NAME}}，月亮在牡羊座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是直接說出需要，也願意聽對方把話說完。當你累了或感到不被理解時，你做決定太快，可能還沒聽完就急著回應。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著把想做的事分成三步，先確認時間、費用與需要誰幫忙，讓身邊的人更容易知道怎麼支持你。",
  "金牛座": "{{NAME}}，月亮在金牛座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是相處節奏穩定，答應的事會做到。當你累了或感到不被理解時，你對熟悉的安排較堅持，可能很難接受臨時改變。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先區分哪些事情一定要保留，哪些可以小幅調整，留一個可以嘗試的新做法，讓身邊的人更容易知道怎麼支持你。",
  "雙子座": "{{NAME}}，月亮在雙子座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是願意聊天，也能談清楚彼此的期待。當你累了或感到不被理解時，你注意力容易被新鮮事吸引，原本答應的事可能放到一旁。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著把最重要的一件事寫下來，完成之後再開始下一件，聊天時也留時間聽對方說，讓身邊的人更容易知道怎麼支持你。",
  "巨蟹座": "{{NAME}}，月亮在巨蟹座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是願意陪伴，能把關心落實在日常。當你累了或感到不被理解時，你可能把照顧別人放在自己之前，累了也不肯開口。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著需要陪伴時直接說，希望休息時也說清楚，別讓對方只能靠猜，讓身邊的人更容易知道怎麼支持你。",
  "獅子座": "{{NAME}}，月亮在獅子座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是真心欣賞彼此，又能坦白提出不同意見。當你累了或感到不被理解時，你可能太在意別人的評價，把沒有回應當成不被重視。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著說明你做了什麼、希望得到哪種回饋，也讓別人有表達與決定的機會，讓身邊的人更容易知道怎麼支持你。",
  "處女座": "{{NAME}}，月亮在處女座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是願意一起解決問題，不把提醒當成責備。當你累了或感到不被理解時，你容易一直修正小地方，讓自己和身邊的人都很有壓力。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先約定做到什麼程度就算完成，提出問題時也說出可以怎麼改善，讓身邊的人更容易知道怎麼支持你。",
  "天秤座": "{{NAME}}，月亮在天秤座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是能平等討論，也尊重你說不。當你累了或感到不被理解時，你可能為了不讓人失望而拖延決定，或答應自己不想做的事。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先說出你真正想要什麼，再討論可以怎麼折衷，別把所有選擇交給別人，讓身邊的人更容易知道怎麼支持你。",
  "天蠍座": "{{NAME}}，月亮在天蠍座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是誠實、守約，也尊重彼此的私人空間。當你累了或感到不被理解時，你不安時可能反覆試探，卻沒有說出真正擔心的事。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先說出你在意的具體事情，再問對方的想法，避免只靠猜測下結論，讓身邊的人更容易知道怎麼支持你。",
  "射手座": "{{NAME}}，月亮在射手座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是能一起嘗試新事物，也願意履行承諾。當你累了或感到不被理解時，你可能答應太多，或因為急著前進而忽略細節。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著保留探索的空間，同時把時間與承諾寫清楚，出發前先完成必要準備，讓身邊的人更容易知道怎麼支持你。",
  "魔羯座": "{{NAME}}，月亮在魔羯座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是有責任感，也願意談感受與生活需求。當你累了或感到不被理解時，你容易把休息視為浪費，或把感受放到工作之後。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著安排固定的休息與相處時間，說明自己的壓力，別只讓成果代替心意，讓身邊的人更容易知道怎麼支持你。",
  "水瓶座": "{{NAME}}，月亮在水瓶座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是尊重獨立，也願意維持穩定的聯繫。當你累了或感到不被理解時，你可能以分析代替情緒回應，讓對方覺得你不在意。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先回應對方的感受，再討論方法，需要獨處時也說明多久會再聯絡，讓身邊的人更容易知道怎麼支持你。",
  "雙魚座": "{{NAME}}，月亮在雙魚座，可以用來理解你需要什麼樣的安心感。對你而言，舒服的關係通常是願意傾聽，也能把承諾說清楚。當你累了或感到不被理解時，你可能承擔太多別人的情緒，或因怕傷人而不敢拒絕。先分清楚自己是想被陪伴、需要幫忙，還是想安靜一下，再直接說出來。也可以試著先問自己是否真的有餘力，說明能幫忙的範圍，不必把每個問題都扛下來，讓身邊的人更容易知道怎麼支持你。"
};

/* ─── Life Path Number ─────────────────────────────────────────── */
const LIFE_PATH_DESC: Record<number, string> = {
  "1": "{{NAME}}，生命靈數 1 的主題是「主動決定」。這是依出生日期整理的性格觀察角度：你有自己的想法，願意帶頭。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習先聽完別人的意見，再決定怎麼做。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "2": "{{NAME}}，生命靈數 2 的主題是「協調合作」。這是依出生日期整理的性格觀察角度：你擅長體諒別人、照顧相處氣氛。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習說出自己的需要，不必每次都退讓。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "3": "{{NAME}}，生命靈數 3 的主題是「表達創意」。這是依出生日期整理的性格觀察角度：你喜歡用說話、文字或作品分享想法。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習挑一個點子完成，別讓新想法一直打斷進度。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "4": "{{NAME}}，生命靈數 4 的主題是「穩定累積」。這是依出生日期整理的性格觀察角度：你願意按照計畫，把事情一步一步做好。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習替計畫留一些彈性，遇到改變時先調整一小步。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "5": "{{NAME}}，生命靈數 5 的主題是「嘗試改變」。這是依出生日期整理的性格觀察角度：你喜歡新經驗，適應力也比較強。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習保留固定的生活習慣，讓自由有一個穩定的基礎。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "6": "{{NAME}}，生命靈數 6 的主題是「照顧關係」。這是依出生日期整理的性格觀察角度：你重視家人與朋友，願意承擔責任。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習幫忙前先確認自己有沒有餘力，也接受別人的照顧。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "7": "{{NAME}}，生命靈數 7 的主題是「深入思考」。這是依出生日期整理的性格觀察角度：你喜歡弄懂事情的原因，需要自己的思考時間。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習把想法說給信任的人聽，別讓所有問題都只留在心裡。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "8": "{{NAME}}，生命靈數 8 的主題是「務實管理」。這是依出生日期整理的性格觀察角度：你在意成果，也願意安排資源與承擔決定。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習除了工作與收入，也替休息和關係留時間。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "9": "{{NAME}}，生命靈數 9 的主題是「關懷分享」。這是依出生日期整理的性格觀察角度：你容易關心別人的處境，希望自己的付出有意義。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習把能做和不能做的事情分開，不必承擔所有人的期待。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "11": "{{NAME}}，生命靈數 11 的主題是「敏銳觀察」。這是依出生日期整理的性格觀察角度：你對氣氛和細節的感受比較強。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習先確認事實，再做決定，累了就暫停接收太多資訊。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。",
  "22": "{{NAME}}，生命靈數 22 的主題是「把計畫做成」。這是依出生日期整理的性格觀察角度：你喜歡把較大的目標變成具體成果。這份傾向能成為長處，但不必變成對自己的要求。日常可以練習把目標拆成幾個小步驟，安排時間，也找人一起分擔。觀察哪些做法真的讓你更輕鬆，再保留適合自己的部分。"
};

export function getLifePathNumber(year: number, month: number, day: number): number {
  const digits = `${year}${month}${day}`.split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

export function getDateDestinyReport(year: number, month: number, day: number) {
  const lifePathNum = getLifePathNumber(year, month, day);
  return {lifePathNum, lifePathText: LIFE_PATH_DESC[lifePathNum] ?? LIFE_PATH_DESC[9]};
}

export function getBirthdayDestinyReport(
  year: number, month: number, day: number, hour = 12, minute = 0, actualSigns?: {sun:string;moon:string}
): { sunText: string; moonText: string; lifePathText: string; lifePathNum: number } {
  const sunSign  = actualSigns?.sun ?? getZodiac(month, day);
  const moonSign = actualSigns?.moon ?? getMoonSign(year, month, day, hour, minute);
  const dateReport = getDateDestinyReport(year, month, day);
  return {
    sunText: SUN_DESTINY[sunSign] ?? SUN_DESTINY["天秤座"],
    moonText: MOON_DESTINY[moonSign] ?? MOON_DESTINY["天秤座"],
    ...dateReport,
  };
}

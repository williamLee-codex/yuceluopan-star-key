const ZODIAC_NAMES = [
  "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座",
  "天秤座", "天蠍座", "射手座", "魔羯座", "水瓶座", "雙魚座"
];

const ARCHETYPE_FAMILIES = [
  "命運織者", "星際探索者", "量子守護者", "時空先知",
  "靈魂煉金師", "業力解碼者", "天界外交官", "宇宙詩人",
  "光之戰士", "暗影魔法師", "智慧錨點", "混沌駕馭者"
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

/** Julian Day Number — converts Taiwan time (UTC+8) to UT JD */
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
export function getMoonSign(year: number, month: number, day: number, hour = 12, minute = 0): string {
  const JD = julianDay(year, month, day, hour, minute);
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
 * Ascendant (Rising Sign) for Taiwan (lat 25°N, lon 121.5°E).
 *
 * Algorithm: scan the ecliptic for the degree where the altitude
 * transitions from POSITIVE → NEGATIVE.  That crossing is where the
 * ecliptic descends through the eastern horizon — i.e., the Ascendant.
 *
 * Background: at any instant the visible arc of the ecliptic (above the
 * horizon) runs from the Ascendant (east, alt=0 dropping below) to the
 * Descendant (west, alt=0 rising above).  In a scan of ecliptic longitude
 * λ = 0°…360° at fixed LST the altitude profile is:
 *
 *   ASC  →  MC (max)  →  DSC  →  IC (min)  →  ASC
 *
 * So the altitude drops from + to – AT the Ascendant, and rises from – to +
 * AT the Descendant.  We look for the + → – crossing.
 */
export function getRisingSign(
  year: number, month: number, day: number,
  hour: number, minute: number
): string {
  const JD = julianDay(year, month, day, hour, minute);
  const d  = JD - 2451545.0;

  // Greenwich Mean Sidereal Time (degrees)
  const GMST = ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360;
  // Local Sidereal Time for Taiwan (121.5°E)
  const LST_rad = ((GMST + 121.5) % 360) * Math.PI / 180;
  // Obliquity of ecliptic (radians)
  const eps = (23.439 - 0.0000004 * d) * Math.PI / 180;
  // Geographic latitude 25°N
  const lat = 25.0 * Math.PI / 180;

  /**
   * sin(altitude) of the ecliptic point at longitude lam (degrees).
   * Returns a value in [-1, 1]; positive = above horizon.
   */
  function sinAlt(lamDeg: number): number {
    const lam = lamDeg * Math.PI / 180;
    const ra  = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
    const sinDec = Math.max(-1, Math.min(1, Math.sin(eps) * Math.sin(lam)));
    const dec = Math.asin(sinDec);
    const cosDec = Math.cos(dec);
    const ha  = LST_rad - ra;
    return Math.sin(lat) * sinDec + Math.cos(lat) * cosDec * Math.cos(ha);
  }

  // Scan in 1° steps; find where altitude transitions + → - (Ascendant)
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
  const RAMC = LST_rad;
  const y2 = -Math.cos(RAMC);
  const x2 = Math.sin(RAMC) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  let asc = ((Math.atan2(y2, x2) * 180 / Math.PI) + 360) % 360;
  if (x2 > 0) asc = (asc + 180) % 360; // quadrant correction
  return ZODIAC_NAMES[Math.floor(asc / 30) % 12];
}

// ─── Profile text pools ───────────────────────────────────────────────────────

const INTROS = [
  "{{NAME}}，你的靈魂深處潛藏著一種古老的智慧，",
  "在宇宙星盤的映射下，{{NAME}} 擁有不可思議的第六感，",
  "前世的業力記憶賦予了 {{NAME}} 獨特的能量場，",
  "{{NAME}}，這是一個充滿奇跡的星體座標，",
  "{{NAME}} 天生帶有打破常規的靈魂引力，"
];
const CORE_TRAITS = [
  "能夠在混亂中輕易看見秩序的脈絡，這是 {{NAME}} 最珍貴的天賦。",
  "對於人性的深層渴望，{{NAME}} 有著近乎讀心般的洞察力。",
  "{{NAME}} 的生命課題在於將虛幻的理想轉化為現實的金石。",
  "{{NAME}} 常在不經意間成為他人心靈的避風港與力量來源。",
  "{{NAME}} 內在的火焰總能在最黑暗的時刻點燃希望之光。"
];
const FUTURE_HINTS = [
  "未來的軌跡中，{{NAME}} 請相信內心的第一個聲音，它將引領你穿越迷霧抵達彼岸。",
  "請試著放下對完美的執念，擁抱裂痕中的光芒——這將是 {{NAME}} 真正的力量來源。",
  "當 {{NAME}} 學會將注意力收回自身，整個宇宙都會開始為你精心鋪路。",
  "不要害怕展現最真實的本性，那是 {{NAME}} 靈魂最迷人的切面，無可替代。",
  "{{NAME}}，你的每一次直覺跳躍，都是高我給予的星際暗示，請勇敢跟隨。"
];

const TRIPLE_SIGN_BASICS = [
  "{{NAME}} 的黃金三角形成了完整的靈魂能量迴路：太陽點燃方向、月亮守護內心、上升定義與世界的接觸面。三者共同勾勒出 {{NAME}} 最真實且完整的宇宙藍圖。",
  "這三個星座的組合對 {{NAME}} 而言是一把罕見的靈魂三稜鏡——每一道光線折射出不同面向的你，當三者協同運作時，{{NAME}} 便能以最完整的姿態展現於世。",
  "{{NAME}} 的太陽、月亮與上升之間存在微妙的張力與補充，賦予了難以被單一標籤定義的複雜美感，也是你最深刻的個人魅力來源。",
  "{{NAME}} 的三主星在宇宙能量矩陣中形成穩定的三角錨點：太陽確立使命，月亮啟動直覺，上升塑造社交面具，共同構築 {{NAME}} 獨一無二的靈魂座標。"
];
const DEEP_TRIPLE_PROFILES = [
  "{{NAME}} 的太陽星座召喚你走向意志力的極致表達，但月亮的能量卻在內心深處悄悄牽引著對安全感的渴望。這種張力使 {{NAME}} 在外顯得堅強，卻在私下極度需要情感歸屬。上升星座像精心設計的舞台布景，讓 {{NAME}} 在陌生環境展現迷人的社交面貌——但只有最親近的靈魂才能看見幕後那個更柔軟、更真實的 {{NAME}}。",
  "三主星的交織在 {{NAME}} 身上製造迷人的矛盾：你渴望自由（太陽使命），又需要深度連結（月亮本能），同時以理性面貌現身（上升）。當 {{NAME}} 理解這三層自我的對話機制，你將發現它們並非矛盾，而是在不同維度共同服務靈魂進化。",
  "{{NAME}} 的深層心理格局顯示，你在早期可能習慣壓抑月亮代表的情感需求，以太陽式的成就感填補渴望被看見的空洞。解開三層秘密密碼，是 {{NAME}} 通往真實幸福的核心功課——三主星達到協同共振時，{{NAME}} 的吸引力將提升至無可抵擋的量子等級。",
  "{{NAME}} 的三主星格局呈現罕見的靈魂複雜度：太陽賦予強烈個人意志，月亮注入無法忽視的直覺感應，而上升讓你在他人眼中呈現神秘且令人想接近的氣場。{{NAME}} 最大的靈魂課題，在於讓這三個自我坦誠對話，而非暗中互相拉扯。"
];

// ─── Public APIs ──────────────────────────────────────────────────────────────

export function getBirthdayProfile(month: number, day: number) {
  const daysInMonths = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) dayOfYear += daysInMonths[i];

  const archetype = ARCHETYPE_FAMILIES[dayOfYear % 12];
  const profile   = `${INTROS[(month * day) % INTROS.length]}${CORE_TRAITS[(dayOfYear * month) % CORE_TRAITS.length]}${FUTURE_HINTS[(dayOfYear + day) % FUTURE_HINTS.length]}`;
  const zodiac    = getZodiac(month, day);
  return { archetype, profile, zodiac };
}

export function getTripleSignProfile(
  year: number, month: number, day: number, hour: number, minute: number
) {
  const sunSign    = getZodiac(month, day);
  const moonSign   = getMoonSign(year, month, day, hour, minute);
  const risingSign = getRisingSign(year, month, day, hour, minute);

  const daysInMonths = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) dayOfYear += daysInMonths[i];

  return {
    sunSign,
    moonSign,
    risingSign,
    basicDescription: TRIPLE_SIGN_BASICS[(month + day + hour) % TRIPLE_SIGN_BASICS.length],
    deepProfile:      DEEP_TRIPLE_PROFILES[(year + dayOfYear) % DEEP_TRIPLE_PROFILES.length],
  };
}

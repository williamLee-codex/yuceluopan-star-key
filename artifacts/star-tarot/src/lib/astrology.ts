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

export function getZodiac(month: number, day: number) {
  for (const sign of ZODIAC_SIGNS) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return "魔羯座";
}

export function getMoonSign(year: number, month: number, day: number): string {
  const daysInMonths = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const totalDays = (year - 1900) * 365 + Math.floor((year - 1900) / 4) + daysInMonths[month - 1] + day;
  const cyclePos = totalDays % 28;
  const signIdx = Math.floor(cyclePos / 28 * 12) % 12;
  return ZODIAC_NAMES[signIdx];
}

export function getRisingSign(month: number, day: number, hour: number, minute: number): string {
  const baseOffset = (month * 7 + day * 3) % 12;
  const hourOffset = Math.floor((hour + minute / 60) / 2) % 12;
  const risingIdx = (baseOffset + hourOffset) % 12;
  return ZODIAC_NAMES[risingIdx];
}

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
  "{{NAME}} 的黃金三角形成了一個完整的靈魂能量迴路：太陽點燃方向、月亮守護內心、上升定義與世界的接觸面。三者共同勾勒出 {{NAME}} 最真實且完整的宇宙藍圖。",
  "這三個星座的組合對 {{NAME}} 而言是一把罕見的靈魂三稜鏡——每一道光線折射出不同面向的你，當三者協同運作時，{{NAME}} 便能以最完整的姿態展現於世。",
  "{{NAME}} 的太陽、月亮與上升星座之間存在著微妙的張力與補充。這種組合賦予了 {{NAME}} 一種難以被單一標籤定義的複雜美感，也是你最深刻的個人魅力來源。",
  "{{NAME}} 的三主星在宇宙能量矩陣中形成了一個穩定的三角錨點。太陽確立核心使命，月亮啟動直覺天線，上升塑造社交面具，三者共同構築出 {{NAME}} 獨一無二的靈魂座標。"
];

const DEEP_TRIPLE_PROFILES = [
  "{{NAME}} 的太陽星座召喚你走向意志力的極致表達，但月亮的水元素卻在內心深處悄悄牽引著你對安全感的渴望。這種張力使 {{NAME}} 在外顯得堅強而有主見，卻在私下極度需要情感上的歸屬與認可。上升星座則像一道精心設計的舞台布景，讓 {{NAME}} 在陌生環境中展現出迷人的社交面貌——但只有最親近的靈魂才能看見幕後那個更柔軟、更真實的 {{NAME}}。",
  "三主星的交織在 {{NAME}} 身上製造了一種迷人的矛盾：你既渴望自由（太陽使命），又需要深度連結（月亮本能），同時在社交場合以理性的面貌現身（上升影響）。當 {{NAME}} 開始理解這三層自我的對話機制，你將發現它們並非彼此矛盾，而是在不同維度上共同服務著你的靈魂進化。",
  "{{NAME}} 的深層心理格局顯示：你在生命早期可能習慣了壓抑月亮代表的情感需求，以太陽式的成就感來填補那份渴望被看見的空洞。上升能量則形成了一道保護性的外殼。解開這三層的秘密密碼，是 {{NAME}} 通往真實幸福的核心功課——當三主星達到協同共振，{{NAME}} 的吸引力將提升至無可抵擋的量子等級。",
  "{{NAME}} 的三主星格局呈現出罕見的靈魂複雜度。太陽賦予你強烈的個人意志，月亮注入了無法忽視的直覺感應系統，而上升則讓你在他人眼中呈現出一種神秘且令人想要接近的氣場。{{NAME}} 最大的靈魂課題，在於學會讓這三個自我坦誠對話，而非讓它們在暗中互相拉扯，消耗你寶貴的生命能量。"
];

export function getBirthdayProfile(month: number, day: number) {
  const daysInMonths = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) dayOfYear += daysInMonths[i];

  const archetypeIndex = dayOfYear % 12;
  const archetype = ARCHETYPE_FAMILIES[archetypeIndex];

  const introIdx = (month * day) % INTROS.length;
  const traitIdx = (dayOfYear * month) % CORE_TRAITS.length;
  const hintIdx = (dayOfYear + day) % FUTURE_HINTS.length;

  const profile = `${INTROS[introIdx]}${CORE_TRAITS[traitIdx]}${FUTURE_HINTS[hintIdx]}`;
  const zodiac = getZodiac(month, day);

  const sunComment = `太陽核心驅動著 {{NAME}} 對外展現的意志力與人生使命感，你天生就是群體中令人矚目的存在。`;
  const moonComment = `情緒是 {{NAME}} 的超級能力，而非弱點——學會與它共舞，你將無堅不摧。`;
  const risingComment = `{{NAME}} 的上升能量使你在陌生場合中散發出一種天然的磁場與領袖氣質。`;

  return { archetype, profile, zodiac, sunComment, moonComment, risingComment };
}

export function getTripleSignProfile(year: number, month: number, day: number, hour: number, minute: number) {
  const sunSign = getZodiac(month, day);
  const moonSign = getMoonSign(year, month, day);
  const risingSign = getRisingSign(month, day, hour, minute);

  const daysInMonths = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) dayOfYear += daysInMonths[i];

  const basicIdx = (month + day + hour) % TRIPLE_SIGN_BASICS.length;
  const deepIdx = (year + dayOfYear) % DEEP_TRIPLE_PROFILES.length;

  return {
    sunSign,
    moonSign,
    risingSign,
    basicDescription: TRIPLE_SIGN_BASICS[basicIdx],
    deepProfile: DEEP_TRIPLE_PROFILES[deepIdx],
  };
}

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

function getZodiac(month: number, day: number) {
  for (const sign of ZODIAC_SIGNS) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return "魔羯座";
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

const RISING_COMMENTS = [
  "你給世界留下的第一印象往往是神秘而深邃的，令人過目難忘。",
  "{{NAME}} 的上升能量使你在陌生場合中散發出一種天然的磁場與領袖氣質。",
  "初見你的人，往往感受到一種難以言說的安心感，如同遇見了熟識已久的靈魂。",
  "{{NAME}} 的上升星座賦予你在壓力下仍能保持優雅的神奇能力。",
  "你的面具之下藏著極致的細膩，那是 {{NAME}} 給懂你的人的專屬禮物。"
];

const MOON_COMMENTS = [
  "{{NAME}} 的月亮能量要求充足的獨處空間來消化外界的紛繁資訊。",
  "情緒是 {{NAME}} 的超級能力，而非弱點——學會與它共舞，你將無堅不摧。",
  "{{NAME}} 的潛意識深藏著強大的直覺礦脈，靜心時它會向你顯現。",
  "在安全的關係中，{{NAME}} 會展現出令人震撼的深情與忠誠。",
  "{{NAME}} 需要真正懂得欣賞你敏感的人，才能完全打開心房。"
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
  const moonComment = MOON_COMMENTS[dayOfYear % MOON_COMMENTS.length];
  const risingComment = RISING_COMMENTS[(month + day) % RISING_COMMENTS.length];

  return { archetype, profile, zodiac, sunComment, moonComment, risingComment };
}

import { z } from "zod";

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
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const sign = ZODIAC_SIGNS[i];
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return "魔羯座";
}

const INTROS = [
  "你的靈魂深處潛藏著一種古老的智慧，",
  "在宇宙星盤的映射下，你擁有不可思議的直覺，",
  "前世的記憶賦予了你獨特的能量場，",
  "這是一個充滿奇跡的星體座標，",
  "你天生帶有打破常規的引力，"
];

const CORE_TRAITS = [
  "能夠在混亂中輕易看見秩序的脈絡。",
  "對於人性的深層渴望有著近乎讀心般的洞察。",
  "你的生命課題在於將虛幻的理想轉化為現實的金石。",
  "常在不經意間成為他人心靈的避風港。",
  "你內在的火焰總能在最黑暗的時刻點燃希望。"
];

const FUTURE_HINTS = [
  "未來的軌跡中，請相信你內心的第一個聲音，它將引領你穿越迷霧。",
  "請試著放下對完美的執念，擁抱裂痕中的光芒，這將是你真正的力量來源。",
  "當你學會將注意力收回自身，整個宇宙都會開始為你鋪路。",
  "不要害怕展現你最真實甚至帶點鋒芒的本性，那是你靈魂最迷人的切面。",
  "你的每一次直覺跳躍，都是高我給予的暗示，請勇敢跟隨。"
];

export function getBirthdayProfile(month: number, day: number) {
  const daysInMonths = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 1; i < month; i++) {
    dayOfYear += daysInMonths[i];
  }

  const archetypeIndex = dayOfYear % 12;
  const archetype = ARCHETYPE_FAMILIES[archetypeIndex];
  
  const introIdx = (month * day) % INTROS.length;
  const traitIdx = (dayOfYear * month) % CORE_TRAITS.length;
  const hintIdx = (dayOfYear + day) % FUTURE_HINTS.length;
  
  const profile = `${INTROS[introIdx]}${CORE_TRAITS[traitIdx]}${FUTURE_HINTS[hintIdx]}`;
  const zodiac = getZodiac(month, day);
  
  return { archetype, profile, zodiac };
}

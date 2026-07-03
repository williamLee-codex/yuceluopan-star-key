export function getCompatibility(m1: number, d1: number, m2: number, d2: number) {
  // Deterministic resonance score between 60 and 99
  const base = (m1 * d1 + m2 * d2) % 40;
  const score = 60 + base;
  
  let summary = "";
  if (score >= 90) summary = "靈魂伴侶級的極高頻率共振";
  else if (score >= 80) summary = "充滿吸引力與成長潛能的組合";
  else if (score >= 70) summary = "互補互助，需要時間磨合的緣分";
  else summary = "充滿挑戰但也充滿靈魂課題的關係";

  return {
    score,
    summary,
    sections: {
      blindSpots: "在溝通深層情感時，雙方容易因為防禦機制而產生投射，建議在產生摩擦時先停下來給予彼此空間，而非急於要一個答案。",
      superPowers: "當你們目標一致時，能產生1+1大於3的顯化能力，一方的直覺搭配另一方的執行力，能迅速突破眼前的僵局。",
      yearlyResonance: "今年的星象顯示，你們將在秋季迎來一次深刻的心靈契合點，這段期間的共同經歷將大幅提升關係的信任基石。"
    }
  };
}

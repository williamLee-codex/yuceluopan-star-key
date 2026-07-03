export function getCompatibility(m1: number, d1: number, m2: number, d2: number) {
  const base = (m1 * d1 + m2 * d2) % 40;
  const score = 60 + base;

  let summary = "";
  if (score >= 90) summary = "靈魂伴侶級的極高頻率共振，天選組合";
  else if (score >= 80) summary = "充滿吸引力與成長潛能的高能量組合";
  else if (score >= 70) summary = "互補互助，需要時間磨合的珍貴緣分";
  else summary = "充滿靈魂課題與相互成就的命定關係";

  const blindIdx = (m1 + d2) % 3;
  const powerIdx = (m2 + d1) % 3;
  const yearlyIdx = (m1 + m2) % 3;

  const blindSpots = [
    "在溝通深層情感時，雙方容易因為防禦機制而產生投射。建議在產生摩擦時先停下來給予彼此空間，而非急於要一個答案。{{NAME}} 可以試著先用書寫來整理自己的情緒脈絡。",
    "兩人的期待模式存在微妙的錯位——你以為對方明白，但對方需要你明說。{{NAME}} 在這段關係中的功課是學習開口說出「我需要」而非等待被看見。",
    "決策風格的差異可能是這段關係最大的摩擦點。{{NAME}} 傾向直覺決斷，而對方習慣反覆確認。彼此刻意放慢節奏、多留一晚再做決定，能大幅降低後悔的機率。"
  ][blindIdx];

  const superPowers = [
    "當你們目標一致時，能產生1+1大於3的顯化能力。{{NAME}} 的直覺搭配對方的執行力，能迅速突破眼前的任何僵局，這是你們最強大的聯合武器。",
    "{{NAME}} 的創意能量遇上對方的穩定基石，會產生令人驚嘆的化學反應。你們在共同創作或解決難題時，往往能以外人無法理解的默契找到最優解。",
    "情感的深度是你們最珍貴的超能力。{{NAME}} 能讓對方感受到前所未有的被理解，而對方也能讓 {{NAME}} 的靈魂找到真正的歸屬感，這種連結稀有且珍貴。"
  ][powerIdx];

  const yearlyResonance = [
    "今年的星象顯示，{{NAME}} 與對方將在秋季迎來一次深刻的心靈契合點。這段期間的共同經歷將大幅提升關係的信任基石，是一個值得珍惜的黃金視窗。",
    "上半年 {{NAME}} 與對方可能各自面臨個人的轉型壓力，給彼此空間是最好的支持方式。進入下半年後，你們的能量將重新校準對齊，迎來更成熟的共振狀態。",
    "這一年對 {{NAME}} 和對方而言都是「收成年」。你們曾共同播下的種子——無論是計畫、夢想或情感投資——都將在今年以具體的形式給予豐碩的回報。"
  ][yearlyIdx];

  return { score, summary, sections: { blindSpots, superPowers, yearlyResonance } };
}

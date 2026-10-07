import type { ReadingFacts } from "./reading-adapter";

export type PaidReadingDomain = "decision" | "habits" | "partner" | "boss" | "colleague" | "friend" | "premium";

export type ReadingEvidence = {
  id: string;
  label: string;
  sign: string;
  role: string;
};

const ROLE: Record<string, string> = {
  sun: "核心目標與自我表達",
  moon: "情緒需要與安全感",
  mercury: "思考與溝通方式",
  venus: "喜歡、親密與價值選擇",
  mars: "行動、慾望與衝突反應",
  jupiter: "擴張與機會取向",
  saturn: "責任、壓力與界線",
  rising: "外在反應與第一印象",
};

const DOMAIN_PLANETS: Record<PaidReadingDomain, string[]> = {
  decision: ["sun", "mercury", "mars", "saturn", "rising"],
  habits: ["moon", "mercury", "venus", "mars", "saturn"],
  partner: ["moon", "venus", "mars", "sun", "rising"],
  boss: ["sun", "mercury", "mars", "saturn", "rising"],
  colleague: ["mercury", "mars", "saturn", "sun", "rising"],
  friend: ["moon", "mercury", "venus", "rising", "sun"],
  premium: ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rising"],
};

const ELEMENT: Record<string, "fire" | "earth" | "air" | "water"> = {
  "牡羊座":"fire","獅子座":"fire","射手座":"fire",
  "金牛座":"earth","處女座":"earth","魔羯座":"earth",
  "雙子座":"air","天秤座":"air","水瓶座":"air",
  "巨蟹座":"water","天蠍座":"water","雙魚座":"water",
};

const LABEL: Record<string, string> = {
  sun:"太陽", moon:"月亮", mercury:"水星", venus:"金星", mars:"火星",
  jupiter:"木星", saturn:"土星", rising:"上升",
};

export function selectPaidReadingEvidence(facts: ReadingFacts, domain: PaidReadingDomain): ReadingEvidence[] {
  return DOMAIN_PLANETS[domain].flatMap((id) => {
    const sign = id === "rising" ? facts.risingSign : facts.signs[id as keyof ReadingFacts["signs"]];
    if (!sign) return [];
    return [{ id, label: LABEL[id], sign, role: ROLE[id] }];
  });
}

export type EvidenceTension = {
  kind: "reinforcing" | "contrasting";
  first: ReadingEvidence;
  second: ReadingEvidence;
};

export function findEvidenceTensions(evidence: ReadingEvidence[]): EvidenceTension[] {
  const result: EvidenceTension[] = [];
  for (let i = 0; i < evidence.length; i += 1) {
    for (let j = i + 1; j < evidence.length; j += 1) {
      const a = evidence[i], b = evidence[j];
      const ea = ELEMENT[a.sign], eb = ELEMENT[b.sign];
      if (!ea || !eb) continue;
      if (ea === eb) result.push({ kind: "reinforcing", first: a, second: b });
      else if ((ea === "fire" && eb === "water") || (ea === "water" && eb === "fire") ||
               (ea === "earth" && eb === "air") || (ea === "air" && eb === "earth")) {
        result.push({ kind: "contrasting", first: a, second: b });
      }
    }
  }
  return result;
}

export function buildEvidenceSummary(facts: ReadingFacts, domain: PaidReadingDomain): string {
  const evidence = selectPaidReadingEvidence(facts, domain);
  const tensions = findEvidenceTensions(evidence);
  if (!evidence.length) return "";
  const basis = evidence.map((x) => `${x.label}在${x.sign}`).join("、");
  const contrast = tensions.find((x) => x.kind === "contrasting");
  const reinforce = tensions.find((x) => x.kind === "reinforcing");
  if (contrast) {
    return `${basis}。其中${contrast.first.label}與${contrast.second.label}呈現不同的反應方向，所以你可能會出現「一部分想這樣做，另一部分卻有不同需要」的感覺；這不是前後矛盾，而是兩種需求同時存在。`;
  }
  if (reinforce) {
    return `${basis}。${reinforce.first.label}與${reinforce.second.label}的元素傾向相近，代表這兩部分較容易互相加強；實際表現仍要連同其他星盤因素一起看。`;
  }
  return `${basis}。這些位置分別描述不同層面的反應，不能只用太陽星座替代整張星盤。`;
}


const SCENE: Record<Exclude<PaidReadingDomain, "decision" | "habits" | "premium">, string> = {
  partner: "關係靠近時，你可能一邊很在意對方的回應，一邊又有自己的節奏。真正起衝突時，表面上的一句話，常常同時碰到親密需要與自我保護。",
  boss: "面對主管交辦或評價時，你表面怎麼回應，和心裡真正承受的壓力不一定相同。尤其在權責不清或被催促時，這種差異更容易出現。",
  colleague: "合作最容易看出你的溝通、行動與責任感是不是走在同一個方向。事情順利時不明顯，一到趕期限或意見不同，就會浮出來。",
  friend: "朋友相處看似輕鬆，但真正決定你會不會靠近一個人的，往往是安心感、說話方式與彼此保留多少空間。",
};

export function buildRelationshipReading(
  facts: ReadingFacts,
  domain: "partner" | "boss" | "colleague" | "friend",
  legacyText = "",
): string {
  const evidence = selectPaidReadingEvidence(facts, domain);
  if (!evidence.length) return legacyText;
  const tensions = findEvidenceTensions(evidence);
  const contrast = tensions.find((x) => x.kind === "contrasting");
  const reinforce = tensions.find((x) => x.kind === "reinforcing");
  const primary = evidence.slice(0, 3);
  const cause = primary.map((x) => `${x.label}在${x.sign}主要牽動${x.role}`).join("；");

  let interaction = "";
  if (contrast) {
    interaction = `這裡最值得注意的是${contrast.first.label}與${contrast.second.label}沒有走同一種反應路線。你可能會有「我明明在意，為什麼真的遇到事情時卻不是照心裡想的方式反應？」的時刻。這不是反覆無常，而是${contrast.first.role}與${contrast.second.role}同時在拉你。`;
  } else if (reinforce) {
    interaction = `${reinforce.first.label}與${reinforce.second.label}的傾向較一致，因此你在這類關係裡的反應通常比較直接：心裡在意的事，也較容易變成實際的說話或行動方式。`;
  } else {
    interaction = "這幾個位置各管不同層面，所以不能只用太陽星座判斷你的相處方式；真正的你，是這些反應疊在一起之後的結果。";
  }

  const usefulLegacy = legacyText
    .replace(/^[^，。]+的\{\{NAME\}\}[，,]?/, "")
    .split("。")
    .filter((sentence) => sentence && !sentence.includes("下列星座") && !sentence.includes("星座提供"))
    .slice(-2)
    .join("。");

  return `${SCENE[domain]}\n\n為什麼你會這樣？${cause}。\n\n${interaction}${usefulLegacy ? `\n\n放回日常相處：${usefulLegacy}。` : ""}`;
}


export function buildDecisionReading(facts: ReadingFacts): string {
  const evidence = selectPaidReadingEvidence(facts, "decision");
  if (!evidence.length) return "";
  const tensions = findEvidenceTensions(evidence);
  const contrast = tensions.find((x) => x.kind === "contrasting");
  const [sun, mercury, mars, saturn, rising] = evidence;
  const opening = `你做重要決定時，不只是「想不想」而已。${sun ? `${sun.label}在${sun.sign}牽動你想成為什麼樣的人` : ""}${mercury ? `；${mercury.label}在${mercury.sign}影響你怎麼比較資訊` : ""}${mars ? `；${mars.label}在${mars.sign}則決定你最後怎麼出手` : ""}。`;
  const tension = contrast
    ? `所以你有時會出現一個很真實的內在對話：「我其實已經想好了，為什麼到了要答應的那一刻又停住？」因為${contrast.first.label}代表的${contrast.first.role}，和${contrast.second.label}代表的${contrast.second.role}正在要求不同的東西。這不是優柔寡斷，而是你需要讓兩種條件都被看見。`
    : "這幾個位置的方向沒有形成明顯對拉時，你通常比較容易把想法轉成決定；真正需要留意的是，不要把其中一個因素當成全部。";
  const outer = rising ? `別人先看到的，常是上升${rising.sign}的反應方式；那不一定等於你心裡最後的答案。` : "";
  const boundary = saturn ? `土星在${saturn.sign}則提醒你，真正讓決定變得沉重的地方，常和責任、限制或「做了之後要承擔什麼」有關。` : "";
  return `${opening}\n\n${tension}\n\n${outer}${boundary}`;
}

export function buildHabitReading(facts: ReadingFacts): string {
  const evidence = selectPaidReadingEvidence(facts, "habits");
  if (!evidence.length) return "";
  const tensions = findEvidenceTensions(evidence);
  const contrast = tensions.find((x) => x.kind === "contrasting");
  const [moon, mercury, venus, mars, saturn] = evidence;
  const parts = [
    moon && `${moon.label}在${moon.sign}：你累了、沒安全感或需要恢復時，較容易回到這種情緒節奏`,
    mercury && `${mercury.label}在${mercury.sign}：影響你每天吸收資訊、說話與整理事情的方法`,
    venus && `${venus.label}在${venus.sign}：反映你自然覺得舒服、喜歡與值得投入的生活質感`,
    mars && `${mars.label}在${mars.sign}：事情真的要動起來時，你較本能的行動與發火方式`,
    saturn && `${saturn.label}在${saturn.sign}：你容易對自己設下規矩、壓力或責任的地方`,
  ].filter(Boolean).join("。");
  const interaction = contrast
    ? `這五顆並不是各說各話。${contrast.first.label}與${contrast.second.label}呈現不同方向時，你可能很熟悉這種感覺：「我知道應該這樣做，可是每天真的過起來，我就是會往另一邊走。」這正是習慣比單一性格描述更複雜的地方。`
    : "這些位置若彼此方向相近，某些生活習慣會特別穩定，甚至成為別人很容易認出你的日常模式。";
  return `生活習慣不是只看一顆星。\n\n${parts}。\n\n${interaction}`;
}

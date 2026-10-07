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

import { describe, expect, it } from "vitest";
import { buildEvidenceSummary, findEvidenceTensions, selectPaidReadingEvidence } from "./paid-reading-evidence";
import type { ReadingFacts } from "./reading-adapter";

const facts: ReadingFacts = {
  signs: { sun:"天秤座", moon:"巨蟹座", mercury:"天秤座", venus:"天蠍座", mars:"牡羊座", jupiter:"射手座", saturn:"金牛座" },
  risingSign:"魔羯座",
  canReadTriangle:true,
};

describe("paid reading evidence", () => {
  it("selects relationship-specific evidence instead of sun sign only", () => {
    const items=selectPaidReadingEvidence(facts,"partner");
    expect(items.map(x=>x.id)).toEqual(["moon","venus","mars","sun","rising"]);
    expect(items.map(x=>x.sign)).toContain("天蠍座");
  });
  it("detects reinforcing and contrasting factors", () => {
    const tensions=findEvidenceTensions(selectPaidReadingEvidence(facts,"partner"));
    expect(tensions.some(x=>x.kind==="contrasting")).toBe(true);
    expect(tensions.some(x=>x.kind==="reinforcing")).toBe(true);
  });
  it("explains that mixed evidence can coexist", () => {
    const text=buildEvidenceSummary(facts,"partner");
    expect(text).toContain("月亮在巨蟹座");
    expect(text).toContain("金星在天蠍座");
    expect(text).toContain("不是前後矛盾");
  });
});

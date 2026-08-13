import { describe, expect, it } from "vitest";
import {
  buildLegacyProfileKey,
  buildProfileKey,
  defaultCountryForLocale,
  findCities,
  formatBirthplaceLabel,
  shouldMigrateLegacyProfile,
} from "./birthplace";

describe("birthplace catalogue", () => {
  it("defaults Chinese locales to Taiwan and other locales to the United States", () => {
    expect(defaultCountryForLocale("zh-TW")).toBe("TW");
    expect(defaultCountryForLocale("zh-CN")).toBe("TW");
    expect(defaultCountryForLocale("en-US")).toBe("US");
  });

  it("labels duplicate city names with region and country", () => {
    const results = findCities("US", "Springfield");
    expect(results.length).toBeGreaterThan(1);
    expect(formatBirthplaceLabel(results[0])).toMatch(/Springfield, .+ \(United States\)/);
  });
});

describe("profile key migration", () => {
  const birth = { year: 1990, month: 1, day: 1, hour: 12, minute: 0 };

  it("migrates unlocks only when legacy birth details exactly match", () => {
    const legacy = buildLegacyProfileKey("William", birth);
    const current = buildProfileKey("William", birth, "tw-taipei");
    expect(shouldMigrateLegacyProfile(legacy, current, "William", birth, "tw-taipei")).toBe(true);
    expect(shouldMigrateLegacyProfile(legacy, current, "William", { ...birth, minute: 1 }, "tw-taipei")).toBe(false);
  });
});

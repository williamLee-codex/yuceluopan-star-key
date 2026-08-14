import { describe, expect, it } from "vitest";
import {
  buildLegacyProfileKey,
  buildProfileKey,
  defaultCountryForLocale,
  findCities,
  formatBirthplaceLabel,
  getBirthplaceCountries,
  shouldMigrateLegacyProfile,
} from "./birthplace";

describe("birthplace catalogue", () => {
  it("defaults Chinese locales to Taiwan and other locales to the United States", () => {
    expect(defaultCountryForLocale("zh-TW")).toBe("TW");
    expect(defaultCountryForLocale("zh-CN")).toBe("TW");
    expect(defaultCountryForLocale("ja-JP")).toBe("JP");
    expect(defaultCountryForLocale("en-GB")).toBe("GB");
    expect(defaultCountryForLocale("en-US")).toBe("US");
  });

  it("offers a selectable option for the locale's preferred country", () => {
    expect(getBirthplaceCountries("de-DE").some((country) => country.code === "DE")).toBe(true);
  });

  it("labels duplicate city names with region and country", () => {
    const results = findCities("US", "Springfield");
    expect(results.length).toBeGreaterThan(1);
    expect(formatBirthplaceLabel(results[0])).toMatch(/Springfield, .+ \(United States\)/);
  });

  it("includes all 22 Taiwan counties and cities with English aliases", () => {
    expect(findCities("TW", "Hualien")[0]).toMatchObject({ city: "花蓮", timeZone: "Asia/Taipei" });
    expect(findCities("TW", "台南")[0]).toMatchObject({ city: "台南" });
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

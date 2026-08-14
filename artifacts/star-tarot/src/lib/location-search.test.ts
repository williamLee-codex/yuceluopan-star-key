import { describe, expect, it } from "vitest";
import { searchBirthplaces } from "./location-search";

describe("searchBirthplaces", () => {
  it("does not search for fewer than two characters", async () => {
    await expect(searchBirthplaces("北", "TW", "zh-TW")).resolves.toEqual([]);
  });

  it("uses the Taiwan catalogue before falling back to the global catalogue", async () => {
    const taipei = await searchBirthplaces("Taipei", "TW", "zh-TW");
    const tokyo = await searchBirthplaces("Tokyo", "TW", "zh-TW");

    expect(taipei[0]).toMatchObject({ id: "tw-taipei", countryCode: "TW" });
    expect(tokyo[0]).toMatchObject({ id: "jp-tokyo", countryCode: "JP" });
  });

  it("keeps duplicate city names distinguishable by region", async () => {
    const results = await searchBirthplaces("Springfield", "US", "en-US");

    expect(results.map((place) => place.region)).toEqual(
      expect.arrayContaining(["Illinois", "Massachusetts", "Missouri"]),
    );
  });
});

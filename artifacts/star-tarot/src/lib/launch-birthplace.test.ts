import { describe, expect, it } from "vitest";
import { launchBirthPlaceToBirthplace } from "./launch-birthplace";

describe("launchBirthPlaceToBirthplace", () => {
  it("preserves the selected ACTIVE profile master-data coordinates and timezone", () => {
    expect(
      launchBirthPlaceToBirthplace({
        city: "Dubai",
        countryCode: "AE",
        displayName: "Dubai",
        id: "place-dubai",
        latitude: 25.2048,
        longitude: 55.2708,
        timezone: "Asia/Dubai",
      }),
    ).toEqual({
      id: "place-dubai",
      countryCode: "AE",
      countryName: "AE",
      city: "Dubai",
      region: "Dubai",
      latitude: 25.2048,
      longitude: 55.2708,
      timeZone: "Asia/Dubai",
    });
  });

  it("does not replace non-Taipei coordinates with the Star Key Taipei fallback", () => {
    const birthplace = launchBirthPlaceToBirthplace({
      city: "Kinmen",
      countryCode: "TW",
      displayName: "Kinmen（金門）",
      id: "place-kinmen",
      latitude: 24.4493,
      longitude: 118.3767,
      timezone: "Asia/Taipei",
    });

    expect(birthplace.latitude).toBe(24.4493);
    expect(birthplace.longitude).toBe(118.3767);
  });
});

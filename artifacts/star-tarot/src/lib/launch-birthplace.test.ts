import { describe, expect, it } from "vitest";
import { launchBirthPlaceToBirthplace } from "./launch-birthplace";

describe("launchBirthPlaceToBirthplace", () => {
  it("resolves platform birthplace metadata to the local coordinate catalogue", async () => {
    await expect(
      launchBirthPlaceToBirthplace({
        city: "台北",
        countryCode: "TW",
        displayName: "台北市",
        id: "place-taipei",
        timezone: "Asia/Taipei",
      }, "zh-TW"),
    ).resolves.toMatchObject({
      id: "tw-taipei",
      countryCode: "TW",
      city: "台北",
      region: "台北市",
      latitude: 25.033,
      longitude: 121.5654,
      timeZone: "Asia/Taipei",
    });
  });

  it("does not replace a non-Taipei Taiwan birthplace with the Taipei fallback", async () => {
    const birthplace = await launchBirthPlaceToBirthplace({
      city: "金門",
      countryCode: "TW",
      displayName: "金門縣",
      id: "place-kinmen",
      timezone: "Asia/Taipei",
    }, "zh-TW");

    expect(birthplace?.id).toBe("tw-kinmen");
    expect(birthplace?.latitude).toBe(24.4327);
    expect(birthplace?.longitude).toBe(118.3171);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLaunchProfile } from "./launch-profile";

const resolvedBirthPlace = {
  city: "Taiwan Main Island",
  countryCode: "TW",
  displayName: "Taiwan Main Island（台灣本島）",
  id: "place-main-island",
  latitude: 25.033,
  longitude: 121.5654,
  timezone: "Asia/Taipei",
};

describe("loadLaunchProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the complete active profile with its resolved master-data birthplace", async () => {
    vi.stubGlobal("window", {
      location: {
        search: "?launchToken=signed.launch.token",
      },
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        activeProfile: {
          birthDate: "1973-10-15",
          birthPlace: resolvedBirthPlace,
          birthPlaceId: "place-main-island",
          birthTime: "05:05",
          displayName: "William",
          subjectProfileId: "subject-1",
          timezone: "Asia/Taipei",
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadLaunchProfile()).resolves.toEqual({
      birthDate: "1973-10-15",
      birthPlace: resolvedBirthPlace,
      birthPlaceId: "place-main-island",
      birthTime: "05:05",
      displayName: "William",
      subjectProfileId: "subject-1",
      timezone: "Asia/Taipei",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/platform/launch/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ launchToken: "signed.launch.token" }),
    });
  });

  it("returns null when launch validation omits required profile fields", async () => {
    vi.stubGlobal("window", {
      location: {
        search: "?launchToken=signed.launch.token",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          activeProfile: {
            subjectProfileId: "subject-1",
          },
        }),
      })),
    );

    await expect(loadLaunchProfile()).resolves.toBeNull();
  });

  it("returns null instead of accepting a launch profile without resolved birthplace coordinates", async () => {
    vi.stubGlobal("window", {
      location: {
        search: "?launchToken=signed.launch.token",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          activeProfile: {
            birthDate: "1973-10-15",
            birthPlace: null,
            birthPlaceId: "place-main-island",
            birthTime: "05:05",
            displayName: "William",
            subjectProfileId: "subject-1",
            timezone: "Asia/Taipei",
          },
        }),
      })),
    );

    await expect(loadLaunchProfile()).resolves.toBeNull();
  });
});

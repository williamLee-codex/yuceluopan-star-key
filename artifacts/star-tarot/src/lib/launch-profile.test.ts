import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLaunchProfile } from "./launch-profile";

const launchBirthPlace = {
  city: "台北",
  countryCode: "TW",
  displayName: "台北市",
  id: "place-taipei",
  timezone: "Asia/Taipei",
};

describe("loadLaunchProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the complete active profile from the platform ready envelope", async () => {
    vi.stubGlobal("window", {
      location: { search: "?launchToken=signed.launch.token" },
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: "ready",
        data: {
          activeProfile: {
            birthDate: "1973-10-15",
            birthPlace: launchBirthPlace,
            birthPlaceId: "place-taipei",
            birthTime: "05:05",
            displayName: "William",
            subjectProfileId: "subject-1",
            timezone: "Asia/Taipei",
          },
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadLaunchProfile()).resolves.toEqual({
      birthDate: "1973-10-15",
      birthPlace: launchBirthPlace,
      birthPlaceId: "place-taipei",
      birthTime: "05:05",
      displayName: "William",
      subjectProfileId: "subject-1",
      timezone: "Asia/Taipei",
    });
  });

  it("returns null when the ready envelope omits required profile fields", async () => {
    vi.stubGlobal("window", {
      location: { search: "?launchToken=signed.launch.token" },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: "ready",
        data: { activeProfile: { subjectProfileId: "subject-1" } },
      }),
    })));

    await expect(loadLaunchProfile()).resolves.toBeNull();
  });

  it("returns null for the legacy top-level activeProfile shape", async () => {
    vi.stubGlobal("window", {
      location: { search: "?launchToken=signed.launch.token" },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        activeProfile: {
          birthDate: "1973-10-15",
          birthPlace: launchBirthPlace,
          birthPlaceId: "place-taipei",
          birthTime: "05:05",
          displayName: "William",
          subjectProfileId: "subject-1",
          timezone: "Asia/Taipei",
        },
      }),
    })));

    await expect(loadLaunchProfile()).resolves.toBeNull();
  });
});

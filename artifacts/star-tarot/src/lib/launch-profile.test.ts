import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLaunchProfile } from "./launch-profile";

describe("loadLaunchProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the complete active profile from launch validation", async () => {
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
          birthPlaceId: "place-1",
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
      birthPlaceId: "place-1",
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
});

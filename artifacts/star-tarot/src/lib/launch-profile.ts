export type LaunchBirthPlace = {
  city: string;
  countryCode?: string;
  displayName: string;
  id: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type LaunchProfile = {
  birthDate: string;
  birthPlace: LaunchBirthPlace;
  birthPlaceId: string;
  birthTime: string | null;
  displayName: string;
  subjectProfileId: string;
  timezone: string;
};

function isLaunchBirthPlace(value: unknown): value is LaunchBirthPlace {
  if (!value || typeof value !== "object") return false;

  const birthPlace = value as Record<string, unknown>;
  return (
    typeof birthPlace.city === "string" &&
    (birthPlace.countryCode === undefined || typeof birthPlace.countryCode === "string") &&
    typeof birthPlace.displayName === "string" &&
    typeof birthPlace.id === "string" &&
    typeof birthPlace.latitude === "number" &&
    Number.isFinite(birthPlace.latitude) &&
    typeof birthPlace.longitude === "number" &&
    Number.isFinite(birthPlace.longitude) &&
    typeof birthPlace.timezone === "string"
  );
}

function isLaunchProfile(value: unknown): value is LaunchProfile {
  if (!value || typeof value !== "object") return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.birthDate === "string" &&
    isLaunchBirthPlace(profile.birthPlace) &&
    typeof profile.birthPlaceId === "string" &&
    profile.birthPlace.id === profile.birthPlaceId &&
    (profile.birthTime === null || typeof profile.birthTime === "string") &&
    typeof profile.displayName === "string" &&
    typeof profile.subjectProfileId === "string" &&
    typeof profile.timezone === "string"
  );
}

export async function loadLaunchProfile(): Promise<LaunchProfile | null> {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get("launchToken")?.trim();
  if (!token) return null;
  try {
    const response = await fetch("/api/platform/launch/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ launchToken: token }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as {
      data?: { activeProfile?: unknown };
      status?: unknown;
    };
    return payload.status === "ready" && isLaunchProfile(payload.data?.activeProfile)
      ? payload.data.activeProfile
      : null;
  } catch {
    return null;
  }
}

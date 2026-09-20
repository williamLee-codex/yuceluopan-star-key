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

function normalizeCoordinate(value: unknown): number | null {
  const coordinate = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(coordinate) ? coordinate : null;
}

function normalizeLaunchProfile(value: unknown): LaunchProfile | null {
  if (!value || typeof value !== "object") return null;

  const profile = value as Record<string, unknown>;
  const place = profile.birthPlace;
  if (!place || typeof place !== "object") return null;
  const birthPlace = place as Record<string, unknown>;
  const latitude = normalizeCoordinate(birthPlace.latitude);
  const longitude = normalizeCoordinate(birthPlace.longitude);

  if (
    typeof profile.birthDate !== "string" ||
    typeof profile.birthPlaceId !== "string" ||
    (profile.birthTime !== null && typeof profile.birthTime !== "string") ||
    typeof profile.displayName !== "string" ||
    typeof profile.subjectProfileId !== "string" ||
    typeof profile.timezone !== "string" ||
    typeof birthPlace.city !== "string" ||
    (birthPlace.countryCode !== undefined && typeof birthPlace.countryCode !== "string") ||
    typeof birthPlace.displayName !== "string" ||
    typeof birthPlace.id !== "string" ||
    birthPlace.id !== profile.birthPlaceId ||
    latitude === null ||
    longitude === null ||
    typeof birthPlace.timezone !== "string"
  ) return null;

  return {
    birthDate: profile.birthDate,
    birthPlace: {
      city: birthPlace.city,
      ...(typeof birthPlace.countryCode === "string" ? { countryCode: birthPlace.countryCode } : {}),
      displayName: birthPlace.displayName,
      id: birthPlace.id,
      latitude,
      longitude,
      timezone: birthPlace.timezone,
    },
    birthPlaceId: profile.birthPlaceId,
    birthTime: profile.birthTime as string | null,
    displayName: profile.displayName,
    subjectProfileId: profile.subjectProfileId,
    timezone: profile.timezone,
  };
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
      activeProfile?: unknown;
      data?: { activeProfile?: unknown; data?: { activeProfile?: unknown }; status?: unknown };
      status?: unknown;
    };
    const status = payload.status ?? payload.data?.status;
    if (status !== "ready") return null;
    return normalizeLaunchProfile(
      payload.data?.activeProfile ??
      payload.data?.data?.activeProfile ??
      payload.activeProfile,
    );
  } catch {
    return null;
  }
}

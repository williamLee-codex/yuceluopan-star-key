export type LaunchProfile = {
  birthDate: string;
  birthPlaceId: string;
  birthTime: string;
  displayName: string;
  subjectProfileId: string;
  timezone: string;
};

function isLaunchProfile(value: unknown): value is LaunchProfile {
  if (!value || typeof value !== "object") return false;

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.birthDate === "string" &&
    typeof profile.birthPlaceId === "string" &&
    typeof profile.birthTime === "string" &&
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
    const payload = await response.json() as { activeProfile?: unknown };
    return isLaunchProfile(payload.activeProfile) ? payload.activeProfile : null;
  } catch {
    return null;
  }
}

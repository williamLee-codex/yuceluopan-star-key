import type { Birthplace } from "./birthplace";
import type { LaunchBirthPlace } from "./launch-profile";

function countryName(countryCode: string | undefined, language: string): string {
  if (!countryCode) return "";
  if (countryCode === "TW") return "台灣";

  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export async function launchBirthPlaceToBirthplace(
  birthPlace: LaunchBirthPlace,
  language = "en",
): Promise<Birthplace | null> {
  if (
    !Number.isFinite(birthPlace.latitude) ||
    !Number.isFinite(birthPlace.longitude)
  ) {
    return null;
  }

  return {
    id: birthPlace.id,
    countryCode: birthPlace.countryCode ?? "",
    countryName: countryName(birthPlace.countryCode, language),
    city: birthPlace.city,
    region: birthPlace.displayName,
    latitude: birthPlace.latitude,
    longitude: birthPlace.longitude,
    timeZone: birthPlace.timezone,
  };
}

import type { Birthplace } from "./birthplace";
import { searchBirthplaces } from "./location-search";
import type { LaunchBirthPlace } from "./launch-profile";

export async function launchBirthPlaceToBirthplace(
  birthPlace: LaunchBirthPlace,
  language = "en",
): Promise<Birthplace | null> {
  const matches = await searchBirthplaces(
    birthPlace.city,
    birthPlace.countryCode,
    language,
  );

  return (
    matches.find(
      (candidate) =>
        candidate.timeZone === birthPlace.timezone &&
        (candidate.region === birthPlace.displayName || candidate.id === birthPlace.id),
    ) ??
    matches.find((candidate) => candidate.timeZone === birthPlace.timezone) ??
    matches[0] ??
    null
  );
}

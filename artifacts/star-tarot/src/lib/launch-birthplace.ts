import type { Birthplace } from "./birthplace";
import { searchBirthplaces } from "./location-search";
import type { LaunchBirthPlace } from "./launch-profile";

function normalized(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

function textMatches(candidate: Birthplace, birthPlace: LaunchBirthPlace): boolean {
  const expected = new Set(
    [birthPlace.city, birthPlace.displayName]
      .map(normalized)
      .filter(Boolean),
  );
  const actual = [candidate.city, candidate.region].map(normalized);
  return actual.some((value) => expected.has(value));
}

export async function launchBirthPlaceToBirthplace(
  birthPlace: LaunchBirthPlace,
  language = "en",
): Promise<Birthplace | null> {
  const matches = await searchBirthplaces(
    birthPlace.city,
    birthPlace.countryCode,
    language,
  );

  const countryMatches = birthPlace.countryCode
    ? matches.filter(
        (candidate) =>
          normalized(candidate.countryCode) === normalized(birthPlace.countryCode),
      )
    : matches;

  return (
    countryMatches.find(
      (candidate) =>
        candidate.timeZone === birthPlace.timezone &&
        textMatches(candidate, birthPlace),
    ) ??
    countryMatches.find((candidate) => textMatches(candidate, birthPlace)) ??
    null
  );
}

import { findCities, type Birthplace } from "./birthplace";

export async function searchBirthplaces(
  rawQuery: string,
  preferredCountry: string | undefined,
  _language: string,
): Promise<Birthplace[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const localResults = preferredCountry ? findCities(preferredCountry, query) : [];
  if (localResults.length > 0 || !preferredCountry) return localResults;

  return findCities(undefined, query);
}

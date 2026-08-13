export interface BirthDetails {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface Birthplace {
  id: string;
  countryCode: string;
  countryName: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export const BIRTHPLACE_COUNTRIES = [
  { code: "TW", name: "台灣" },
  { code: "US", name: "United States" },
  { code: "JP", name: "日本" },
  { code: "GB", name: "United Kingdom" },
] as const;

const BIRTHPLACES: Birthplace[] = [
  { id: "tw-taipei", countryCode: "TW", countryName: "台灣", city: "台北", region: "台北市", latitude: 25.033, longitude: 121.5654, timeZone: "Asia/Taipei" },
  { id: "tw-kaohsiung", countryCode: "TW", countryName: "台灣", city: "高雄", region: "高雄市", latitude: 22.6273, longitude: 120.3014, timeZone: "Asia/Taipei" },
  { id: "tw-taichung", countryCode: "TW", countryName: "台灣", city: "台中", region: "台中市", latitude: 24.1477, longitude: 120.6736, timeZone: "Asia/Taipei" },
  { id: "us-new-york", countryCode: "US", countryName: "United States", city: "New York", region: "New York", latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { id: "us-los-angeles", countryCode: "US", countryName: "United States", city: "Los Angeles", region: "California", latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { id: "us-springfield-il", countryCode: "US", countryName: "United States", city: "Springfield", region: "Illinois", latitude: 39.7984, longitude: -89.6549, timeZone: "America/Chicago" },
  { id: "us-springfield-ma", countryCode: "US", countryName: "United States", city: "Springfield", region: "Massachusetts", latitude: 42.1015, longitude: -72.5898, timeZone: "America/New_York" },
  { id: "us-springfield-mo", countryCode: "US", countryName: "United States", city: "Springfield", region: "Missouri", latitude: 37.2089, longitude: -93.2923, timeZone: "America/Chicago" },
  { id: "jp-tokyo", countryCode: "JP", countryName: "日本", city: "東京", region: "東京都", latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  { id: "gb-london", countryCode: "GB", countryName: "United Kingdom", city: "London", region: "England", latitude: 51.5072, longitude: -0.1276, timeZone: "Europe/London" },
];

export const TAIPEI_BIRTHPLACE = BIRTHPLACES[0];

export function defaultCountryForLocale(locale?: string): string {
  return locale?.toLowerCase().startsWith("zh") ? "TW" : "US";
}

export function findCities(countryCode: string, query: string): Birthplace[] {
  const needle = query.trim().toLocaleLowerCase();
  return BIRTHPLACES.filter((place) =>
    place.countryCode === countryCode &&
    (needle.length === 0 || `${place.city} ${place.region}`.toLocaleLowerCase().includes(needle)),
  );
}

export function formatBirthplaceLabel(place: Birthplace): string {
  return `${place.city}, ${place.region} (${place.countryName})`;
}

export function buildLegacyProfileKey(nickname: string, birth: BirthDetails): string {
  return `${nickname}_${birth.year}_${birth.month}_${birth.day}_${birth.hour}_${birth.minute}`;
}

export function buildProfileKey(nickname: string, birth: BirthDetails, placeId: string): string {
  return `${buildLegacyProfileKey(nickname, birth)}_${placeId}`;
}

export function shouldMigrateLegacyProfile(
  legacyKey: string,
  currentKey: string,
  nickname: string,
  birth: BirthDetails,
  placeId: string,
): boolean {
  return legacyKey === buildLegacyProfileKey(nickname, birth)
    && currentKey === buildProfileKey(nickname, birth, placeId);
}

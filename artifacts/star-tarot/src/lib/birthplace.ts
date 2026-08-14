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

const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA",
  "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export function getBirthplaceCountries(locale = "en"): Array<{ code: string; name: string }> {
  const displayNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames([locale], { type: "region" })
    : null;

  return COUNTRY_CODES.map((code) => ({ code, name: displayNames?.of(code) || code }));
}

type CataloguedBirthplace = Birthplace & { aliases?: string[] };

// The catalogue is intentionally local: birth-place lookup must work without a paid API.
const BIRTHPLACES: CataloguedBirthplace[] = [
  { id: "tw-taipei", countryCode: "TW", countryName: "台灣", city: "台北", region: "台北市", latitude: 25.033, longitude: 121.5654, timeZone: "Asia/Taipei", aliases: ["Taipei", "Taipei City"] },
  { id: "tw-new-taipei", countryCode: "TW", countryName: "台灣", city: "新北", region: "新北市", latitude: 25.017, longitude: 121.4637, timeZone: "Asia/Taipei", aliases: ["New Taipei", "New Taipei City"] },
  { id: "tw-taoyuan", countryCode: "TW", countryName: "台灣", city: "桃園", region: "桃園市", latitude: 24.9937, longitude: 121.301, timeZone: "Asia/Taipei", aliases: ["Taoyuan", "Taoyuan City"] },
  { id: "tw-taichung", countryCode: "TW", countryName: "台灣", city: "台中", region: "台中市", latitude: 24.1477, longitude: 120.6736, timeZone: "Asia/Taipei", aliases: ["Taichung", "Taichung City"] },
  { id: "tw-tainan", countryCode: "TW", countryName: "台灣", city: "台南", region: "台南市", latitude: 22.9997, longitude: 120.227, timeZone: "Asia/Taipei", aliases: ["Tainan", "Tainan City"] },
  { id: "tw-kaohsiung", countryCode: "TW", countryName: "台灣", city: "高雄", region: "高雄市", latitude: 22.6273, longitude: 120.3014, timeZone: "Asia/Taipei", aliases: ["Kaohsiung", "Kaohsiung City"] },
  { id: "tw-keelung", countryCode: "TW", countryName: "台灣", city: "基隆", region: "基隆市", latitude: 25.1276, longitude: 121.7392, timeZone: "Asia/Taipei", aliases: ["Keelung", "Keelung City"] },
  { id: "tw-hsinchu-city", countryCode: "TW", countryName: "台灣", city: "新竹", region: "新竹市", latitude: 24.8138, longitude: 120.9675, timeZone: "Asia/Taipei", aliases: ["Hsinchu", "Hsinchu City"] },
  { id: "tw-chiayi-city", countryCode: "TW", countryName: "台灣", city: "嘉義", region: "嘉義市", latitude: 23.4801, longitude: 120.4491, timeZone: "Asia/Taipei", aliases: ["Chiayi", "Chiayi City"] },
  { id: "tw-hsinchu-county", countryCode: "TW", countryName: "台灣", city: "新竹", region: "新竹縣", latitude: 24.839, longitude: 121.0177, timeZone: "Asia/Taipei", aliases: ["Hsinchu County"] },
  { id: "tw-miaoli", countryCode: "TW", countryName: "台灣", city: "苗栗", region: "苗栗縣", latitude: 24.5602, longitude: 120.8214, timeZone: "Asia/Taipei", aliases: ["Miaoli", "Miaoli County"] },
  { id: "tw-changhua", countryCode: "TW", countryName: "台灣", city: "彰化", region: "彰化縣", latitude: 24.0756, longitude: 120.544, timeZone: "Asia/Taipei", aliases: ["Changhua", "Changhua County"] },
  { id: "tw-nantou", countryCode: "TW", countryName: "台灣", city: "南投", region: "南投縣", latitude: 23.9609, longitude: 120.9719, timeZone: "Asia/Taipei", aliases: ["Nantou", "Nantou County"] },
  { id: "tw-yunlin", countryCode: "TW", countryName: "台灣", city: "雲林", region: "雲林縣", latitude: 23.7092, longitude: 120.4313, timeZone: "Asia/Taipei", aliases: ["Yunlin", "Yunlin County"] },
  { id: "tw-chiayi-county", countryCode: "TW", countryName: "台灣", city: "嘉義", region: "嘉義縣", latitude: 23.4518, longitude: 120.2555, timeZone: "Asia/Taipei", aliases: ["Chiayi County"] },
  { id: "tw-pingtung", countryCode: "TW", countryName: "台灣", city: "屏東", region: "屏東縣", latitude: 22.551, longitude: 120.5488, timeZone: "Asia/Taipei", aliases: ["Pingtung", "Pingtung County"] },
  { id: "tw-yilan", countryCode: "TW", countryName: "台灣", city: "宜蘭", region: "宜蘭縣", latitude: 24.7021, longitude: 121.7378, timeZone: "Asia/Taipei", aliases: ["Yilan", "Yilan County"] },
  { id: "tw-hualien", countryCode: "TW", countryName: "台灣", city: "花蓮", region: "花蓮縣", latitude: 23.9911, longitude: 121.6112, timeZone: "Asia/Taipei", aliases: ["Hualien", "Hualien County"] },
  { id: "tw-taitung", countryCode: "TW", countryName: "台灣", city: "台東", region: "台東縣", latitude: 22.7554, longitude: 121.15, timeZone: "Asia/Taipei", aliases: ["Taitung", "Taitung County"] },
  { id: "tw-penghu", countryCode: "TW", countryName: "台灣", city: "澎湖", region: "澎湖縣", latitude: 23.5712, longitude: 119.5793, timeZone: "Asia/Taipei", aliases: ["Penghu", "Penghu County"] },
  { id: "tw-kinmen", countryCode: "TW", countryName: "台灣", city: "金門", region: "金門縣", latitude: 24.4327, longitude: 118.3171, timeZone: "Asia/Taipei", aliases: ["Kinmen", "Kinmen County"] },
  { id: "tw-lienchiang", countryCode: "TW", countryName: "台灣", city: "連江", region: "連江縣", latitude: 26.1605, longitude: 119.9499, timeZone: "Asia/Taipei", aliases: ["Matsu", "Lienchiang", "Lienchiang County"] },
  { id: "us-new-york", countryCode: "US", countryName: "United States", city: "New York", region: "New York", latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { id: "us-los-angeles", countryCode: "US", countryName: "United States", city: "Los Angeles", region: "California", latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { id: "us-springfield-il", countryCode: "US", countryName: "United States", city: "Springfield", region: "Illinois", latitude: 39.7984, longitude: -89.6549, timeZone: "America/Chicago" },
  { id: "us-springfield-ma", countryCode: "US", countryName: "United States", city: "Springfield", region: "Massachusetts", latitude: 42.1015, longitude: -72.5898, timeZone: "America/New_York" },
  { id: "us-springfield-mo", countryCode: "US", countryName: "United States", city: "Springfield", region: "Missouri", latitude: 37.2089, longitude: -93.2923, timeZone: "America/Chicago" },
  { id: "jp-tokyo", countryCode: "JP", countryName: "日本", city: "東京", region: "東京都", latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo", aliases: ["Tokyo"] },
  { id: "gb-london", countryCode: "GB", countryName: "United Kingdom", city: "London", region: "England", latitude: 51.5072, longitude: -0.1276, timeZone: "Europe/London" },
  { id: "jp-osaka", countryCode: "JP", countryName: "日本", city: "大阪", region: "大阪府", latitude: 34.6937, longitude: 135.5023, timeZone: "Asia/Tokyo", aliases: ["Osaka"] },
  { id: "jp-yokohama", countryCode: "JP", countryName: "日本", city: "橫濱", region: "神奈川縣", latitude: 35.4437, longitude: 139.638, timeZone: "Asia/Tokyo", aliases: ["Yokohama"] },
  { id: "kr-seoul", countryCode: "KR", countryName: "South Korea", city: "首爾", region: "Seoul", latitude: 37.5665, longitude: 126.978, timeZone: "Asia/Seoul", aliases: ["Seoul"] },
  { id: "cn-beijing", countryCode: "CN", countryName: "中國", city: "北京", region: "Beijing", latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai", aliases: ["Beijing"] },
  { id: "cn-shanghai", countryCode: "CN", countryName: "中國", city: "上海", region: "Shanghai", latitude: 31.2304, longitude: 121.4737, timeZone: "Asia/Shanghai", aliases: ["Shanghai"] },
  { id: "hk-hong-kong", countryCode: "HK", countryName: "Hong Kong", city: "香港", region: "Hong Kong", latitude: 22.3193, longitude: 114.1694, timeZone: "Asia/Hong_Kong", aliases: ["Hong Kong"] },
  { id: "sg-singapore", countryCode: "SG", countryName: "Singapore", city: "新加坡", region: "Singapore", latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore", aliases: ["Singapore"] },
  { id: "my-kuala-lumpur", countryCode: "MY", countryName: "Malaysia", city: "吉隆坡", region: "Kuala Lumpur", latitude: 3.139, longitude: 101.6869, timeZone: "Asia/Kuala_Lumpur", aliases: ["Kuala Lumpur"] },
  { id: "th-bangkok", countryCode: "TH", countryName: "Thailand", city: "曼谷", region: "Bangkok", latitude: 13.7563, longitude: 100.5018, timeZone: "Asia/Bangkok", aliases: ["Bangkok"] },
  { id: "vn-ho-chi-minh", countryCode: "VN", countryName: "Vietnam", city: "胡志明市", region: "Ho Chi Minh City", latitude: 10.8231, longitude: 106.6297, timeZone: "Asia/Ho_Chi_Minh", aliases: ["Ho Chi Minh City", "Saigon"] },
  { id: "ph-manila", countryCode: "PH", countryName: "Philippines", city: "馬尼拉", region: "Metro Manila", latitude: 14.5995, longitude: 120.9842, timeZone: "Asia/Manila", aliases: ["Manila"] },
  { id: "id-jakarta", countryCode: "ID", countryName: "Indonesia", city: "雅加達", region: "Jakarta", latitude: -6.2088, longitude: 106.8456, timeZone: "Asia/Jakarta", aliases: ["Jakarta"] },
  { id: "au-sydney", countryCode: "AU", countryName: "Australia", city: "Sydney", region: "New South Wales", latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
  { id: "au-melbourne", countryCode: "AU", countryName: "Australia", city: "Melbourne", region: "Victoria", latitude: -37.8136, longitude: 144.9631, timeZone: "Australia/Melbourne" },
  { id: "nz-auckland", countryCode: "NZ", countryName: "New Zealand", city: "Auckland", region: "Auckland", latitude: -36.8509, longitude: 174.7645, timeZone: "Pacific/Auckland" },
  { id: "ca-vancouver", countryCode: "CA", countryName: "Canada", city: "Vancouver", region: "British Columbia", latitude: 49.2827, longitude: -123.1207, timeZone: "America/Vancouver" },
  { id: "ca-toronto", countryCode: "CA", countryName: "Canada", city: "Toronto", region: "Ontario", latitude: 43.6532, longitude: -79.3832, timeZone: "America/Toronto" },
  { id: "us-chicago", countryCode: "US", countryName: "United States", city: "Chicago", region: "Illinois", latitude: 41.8781, longitude: -87.6298, timeZone: "America/Chicago" },
  { id: "us-houston", countryCode: "US", countryName: "United States", city: "Houston", region: "Texas", latitude: 29.7604, longitude: -95.3698, timeZone: "America/Chicago" },
  { id: "us-san-francisco", countryCode: "US", countryName: "United States", city: "San Francisco", region: "California", latitude: 37.7749, longitude: -122.4194, timeZone: "America/Los_Angeles" },
  { id: "fr-paris", countryCode: "FR", countryName: "France", city: "Paris", region: "Ile-de-France", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  { id: "de-berlin", countryCode: "DE", countryName: "Germany", city: "Berlin", region: "Berlin", latitude: 52.52, longitude: 13.405, timeZone: "Europe/Berlin" },
  { id: "it-rome", countryCode: "IT", countryName: "Italy", city: "Rome", region: "Lazio", latitude: 41.9028, longitude: 12.4964, timeZone: "Europe/Rome" },
  { id: "es-madrid", countryCode: "ES", countryName: "Spain", city: "Madrid", region: "Community of Madrid", latitude: 40.4168, longitude: -3.7038, timeZone: "Europe/Madrid" },
  { id: "nl-amsterdam", countryCode: "NL", countryName: "Netherlands", city: "Amsterdam", region: "North Holland", latitude: 52.3676, longitude: 4.9041, timeZone: "Europe/Amsterdam" },
  { id: "ae-dubai", countryCode: "AE", countryName: "United Arab Emirates", city: "Dubai", region: "Dubai", latitude: 25.2048, longitude: 55.2708, timeZone: "Asia/Dubai" },
  { id: "in-mumbai", countryCode: "IN", countryName: "India", city: "Mumbai", region: "Maharashtra", latitude: 19.076, longitude: 72.8777, timeZone: "Asia/Kolkata" },
  { id: "in-new-delhi", countryCode: "IN", countryName: "India", city: "New Delhi", region: "Delhi", latitude: 28.6139, longitude: 77.209, timeZone: "Asia/Kolkata" },
  { id: "br-sao-paulo", countryCode: "BR", countryName: "Brazil", city: "Sao Paulo", region: "Sao Paulo", latitude: -23.5558, longitude: -46.6396, timeZone: "America/Sao_Paulo", aliases: ["S\u00e3o Paulo"] },
  { id: "mx-mexico-city", countryCode: "MX", countryName: "Mexico", city: "Mexico City", region: "Mexico City", latitude: 19.4326, longitude: -99.1332, timeZone: "America/Mexico_City" },
];

export const TAIPEI_BIRTHPLACE = BIRTHPLACES[0];

export function defaultCountryForLocale(locale?: string): string {
  if (locale?.toLowerCase().startsWith("zh")) return "TW";

  const normalized = locale?.replace("_", "-").toUpperCase();
  const region = normalized?.split("-")[1];

  if (region && /^[A-Z]{2}$/.test(region)) return region;
  return "US";
}

export function findCities(countryCode: string | undefined, query: string): Birthplace[] {
  const needle = query.trim().toLocaleLowerCase();
  return BIRTHPLACES.filter((place) =>
    (!countryCode || place.countryCode === countryCode) &&
    (needle.length === 0 || [place.city, place.region, place.countryName, ...(place.aliases || [])]
      .some((value) => value.toLocaleLowerCase().includes(needle))),
  ).slice(0, 8);
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

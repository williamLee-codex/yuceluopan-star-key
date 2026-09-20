import type { Birthplace } from "./birthplace";
import type { LaunchBirthPlace } from "./launch-profile";

export function launchBirthPlaceToBirthplace(birthPlace: LaunchBirthPlace): Birthplace {
  const countryCode = birthPlace.countryCode ?? "";

  return {
    id: birthPlace.id,
    countryCode,
    countryName: countryCode,
    city: birthPlace.city,
    region: birthPlace.displayName,
    latitude: birthPlace.latitude,
    longitude: birthPlace.longitude,
    timeZone: birthPlace.timezone,
  };
}

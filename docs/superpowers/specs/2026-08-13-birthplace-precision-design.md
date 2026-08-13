# Birthplace Precision Design

## Goal

Require a selected birth city before unlocking the star chart, then use that city's coordinates and IANA time zone to calculate the moon and rising signs.

## User Flow

- The entry form defaults the country to Taiwan for Chinese locales and the United States for other locales.
- The user chooses a country, searches its cities, and selects an explicit result. Typing a city name alone is not sufficient.
- Each city result includes its country and regional label so duplicate city names remain unambiguous.
- A selected city is stored with the profile together with its coordinates and IANA time zone.
- The unlock action explains what is missing when no city is selected.

## Calculation

- The astrology module receives a birth-place object instead of assuming Taiwan.
- Local wall time is converted to UTC with the selected IANA time zone through `Intl.DateTimeFormat`, so daylight-saving offsets change on the correct date.
- Existing callers may omit the place and continue to use the historical Taiwan default.

## Existing Users

- The new profile key includes the selected place ID.
- When the same nickname and exact birth date/time matches a legacy profile key, existing unlocked modules are loaded and copied to the new key.
- A different minute, date, or nickname never receives an old unlock record. Points are never changed during migration.

## Verification

- Automated tests cover locale defaults, city lookup and duplicate labels, unlock validation, DST-aware UTC conversion, and legacy unlock migration.
- The star-tarot TypeScript check and Vite build must be run with Vercel-compatible environment variables.

# Birthplace Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users search and select a verified global birth city, then use its time zone and coordinates for Star Key chart calculations while preserving legacy unlocks.

**Architecture:** Use a version-controlled local birthplace catalogue and a client search helper under `src/lib`; Home owns debounced input and result selection. The catalogue covers Taiwan counties/cities and common overseas birth cities without a Vercel API key or a location-search function. Extend astrology functions with an optional place argument so historical callers keep Taiwan behavior.

**Tech Stack:** React 19, TypeScript, Vite, Vitest.

## Global Constraints

- Chinese browser locales default to Taiwan; all other locales default to the United States.
- A typed city selection is required before unlocking.
- Same-named cities must include country and region labels.
- IANA time zones, not fixed numeric offsets, determine UTC conversion.
- Legacy unlocks migrate only for identical nickname and exact date/time.
- Birthplace lookup must have no recurring third-party API cost.
- The Vite client must not make a birthplace search network request.

---

### Task 1: Birthplace catalogue and profile-key helpers

**Files:**
- Create: `artifacts/star-tarot/src/lib/birthplace.ts`
- Create: `artifacts/star-tarot/src/lib/birthplace.test.ts`

- [ ] Write failing tests for locale country defaults, duplicate-city labels, and legacy key matching.
- [ ] Run `pnpm --filter @workspace/star-tarot test` and confirm the tests fail because the module and test script are absent.
- [ ] Implement typed countries, cities, search, selection labels, and legacy/current profile-key helpers.
- [ ] Re-run the focused test file and confirm it passes.
- [ ] Commit the catalogue and helpers.

### Task 2: Built-in location-search catalogue and client contract

**Files:**
- Modify: `artifacts/star-tarot/src/lib/birthplace.ts`
- Create: `artifacts/star-tarot/src/lib/location-search.ts`
- Create: `artifacts/star-tarot/src/lib/location-search.test.ts`

**Interface:** `searchBirthplaces(query, preferredCountry, language): Promise<Birthplace[]>` searches the selected country first, then the local global catalogue.

- [x] Write failing tests for query validation, Taiwan aliases, duplicate-place labels, and country-filter fallback.
- [x] Run the focused test file and confirm it fails before implementation.
- [x] Implement an embedded catalogue of all Taiwan counties/cities and common overseas birth cities with IANA time zones and coordinates.
- [x] Implement the client helper without any network request, provider URL, or API key.
- [x] Re-run the focused test file and confirm it passes.
- [ ] Commit the endpoint and search contract.

### Task 3: Time-zone aware astrology

**Files:**
- Modify: `artifacts/star-tarot/src/lib/astrology.ts`
- Create: `artifacts/star-tarot/src/lib/astrology.test.ts`

- [ ] Write failing tests for New York winter, summer, and the post-spring-forward local time.
- [ ] Run the test file and confirm it fails before implementation.
- [ ] Implement IANA local-time-to-UTC conversion and optional birthplace-aware moon/rising calculations.
- [ ] Re-run the focused test file and confirm it passes.
- [ ] Commit the calculation changes.

### Task 4: Global selection flow and unlock migration

**Files:**
- Modify: `artifacts/star-tarot/src/pages/Home.tsx`
- Modify: `artifacts/star-tarot/package.json`

- [ ] Add the Vitest script and test dependency using the workspace lockfile.
- [x] Replace static city filtering with debounced global city search, result loading and retry states, selected-place persistence, and selected-place form validation.
- [x] Default country selection from locale, offer unrestricted search, and retry globally when the preferred country has no matching location.
- [ ] Include place ID in new profile keys and migrate exact legacy unlock records without changing points.
- [ ] Pass the selected place to astrology and change the visible time-zone caption.
- [x] Run focused tests, full TypeScript check, and Vite build.
- [ ] Commit the UI and verification changes.

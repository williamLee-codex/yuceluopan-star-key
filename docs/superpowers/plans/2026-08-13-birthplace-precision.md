# Birthplace Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an explicit birth city and use its time zone and coordinates for Star Key chart calculations while preserving legacy unlocks.

**Architecture:** Add a typed local birthplace catalogue and pure time-zone/profile-key helpers under `src/lib`. Keep Home focused on form state, selecting a catalogue entry, and composing existing presentation functions. Extend astrology functions with an optional place argument so historical callers keep Taiwan behavior.

**Tech Stack:** React 19, TypeScript, Vite, Vitest.

## Global Constraints

- Chinese browser locales default to Taiwan; all other locales default to the United States.
- A typed city selection is required before unlocking.
- Same-named cities must include country and region labels.
- IANA time zones, not fixed numeric offsets, determine UTC conversion.
- Legacy unlocks migrate only for identical nickname and exact date/time.

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

### Task 2: Time-zone aware astrology

**Files:**
- Modify: `artifacts/star-tarot/src/lib/astrology.ts`
- Create: `artifacts/star-tarot/src/lib/astrology.test.ts`

- [ ] Write failing tests for New York winter, summer, and the post-spring-forward local time.
- [ ] Run the test file and confirm it fails before implementation.
- [ ] Implement IANA local-time-to-UTC conversion and optional birthplace-aware moon/rising calculations.
- [ ] Re-run the focused test file and confirm it passes.
- [ ] Commit the calculation changes.

### Task 3: Required birthplace entry flow and unlock migration

**Files:**
- Modify: `artifacts/star-tarot/src/pages/Home.tsx`
- Modify: `artifacts/star-tarot/package.json`

- [ ] Add the Vitest script and test dependency using the workspace lockfile.
- [ ] Add country selection, city search/results, selected-place persistence, and selected-place form validation.
- [ ] Include place ID in new profile keys and migrate exact legacy unlock records without changing points.
- [ ] Pass the selected place to astrology and change the visible time-zone caption.
- [ ] Run focused tests, full TypeScript check, and Vite build.
- [ ] Commit the UI and verification changes.

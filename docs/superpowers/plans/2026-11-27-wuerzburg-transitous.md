# Würzburg via Transitous Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blocked Bahnland Bayern EFA backend for Würzburg with the Transitous (MOTIS 2) API, so departures, stop search and line preview work again.

**Architecture:** Keep the public functions of `src/api/wuerzburgApi.ts` (`fetchWuerzburgDepartures`, `stopFinderWuerzburg`, `linesForStop`) so `App.tsx` and `stopSearch.ts` stay unchanged. Re-implement them on a small Transitous client (`src/api/transitous.ts`), called directly from the browser (CORS `*`), so the `/wuerzburg-api` proxy goes away. Saved configs with old IDs (`de:09663:308`) are migrated once on app start by resolving them to a Transitous stop ID and writing that back to the store.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, i18next.

**Spec:** Issue #72 (requirements) and the research comment https://github.com/ironpinguin/departure-monitor/issues/72#issuecomment-7221621042. API reference: MOTIS OpenAPI v2.11.4 (`https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.11.4/openapi.yaml`). Usage policy: https://transitous.org/api/

## Global Constraints

- Base URL: `https://api.transitous.org/api`. Never use `staging.api.transitous.org` or `*.motis-project.*` / `*.spline.de`.
- Endpoints: `GET /v1/geocode`, `GET /v6/stoptimes`, `GET /v6/stop`.
- Browser requests rely on the `Referer` header (no custom User-Agent). Contact info must be visible on the site (link to the GitHub repo).
- Visible attribution link to `https://transitous.org/sources/` and "© OpenStreetMap contributors" (`https://www.openstreetmap.org/copyright`).
- Keep request volume low: no new polling; the existing refresh interval applies; `/v6/stop` only on demand in the dialog.
- A Transitous stop ID looks like `<feed>_<DHID>`, e.g. `de-DELFI_de:09663:208:1:A`, `at-Railway-Current-Reference-Data-2026_de:09663:177:3:4`, `de-amarillo-bw_de:09663:246`. Any ID of a station returns departures for the whole station (MOTIS merges equivalent stops across feeds).
- Würzburg region = NVM district keys: `09663, 09679, 09675, 09677, 09662, 09678, 09672, 09673, 09674`.
- New i18n keys go into both `src/i18n/locales/de/translation.json` and `src/i18n/locales/en/translation.json`.
- `pnpm` only. `pnpm lint`, `pnpm test`, `pnpm build` must pass after every task.

## Review Focus

1. **Arrival-only stop times** (the stop is the trip's last stop): must not appear as departures. → test in Task 2.
2. **Cancelled trips** (`cancelled` or `tripCancelled`): the `Departure` model has no cancelled flag, so they are dropped instead of showing as normal departures. → test in Task 2.
3. **Search hits from other feeds and regions** (`gb-dft-bods_…`, "Hanau Hauptbahnhof", duplicates of the same station): only Würzburg-region stations, one entry per station. → test in Task 2.
4. **Legacy stop that can't be resolved** (renamed by the user, or gone from the feed): the stop stays unchanged, a warning is logged, nothing crashes, other stops still migrate. → test in Task 3.
5. **HTTP 429 from Transitous** is a rate limit, not a permanent block: it still maps to `ProviderUnavailableError`, but the UI text must not claim the provider "blocks" us. → covered by the text change in Task 4 and the existing 429 test in Task 2.

---

### Task 1: Transitous client and response types

**Files:**
- Create: `src/models/TransitousResponse.ts`
- Modify: `src/models/index.ts` (export the new types)
- Create: `src/api/transitous.ts`
- Test: `src/api/__tests__/transitous.test.ts`

**Interfaces:**
- Produces:
  - Types `TransitousPlace { name: string; stopId: string; track?: string; scheduledTrack?: string; departure?: string; scheduledDeparture?: string; cancelled?: boolean }`, `TransitousStopTime { place: TransitousPlace; mode: string; realTime: boolean; headsign: string; tripId: string; displayName?: string; routeShortName?: string; cancelled: boolean; tripCancelled: boolean }`, `TransitousStopTimesResponse { stopTimes: TransitousStopTime[] }`, `TransitousMatch { id: string; name: string; type: string }`, `TransitousRoute { routeShortName: string; mode: string }`, `TransitousStopInfoResponse { place: TransitousPlace; routes: TransitousRoute[] }`.
  - `TRANSITOUS_BASE_URL = 'https://api.transitous.org/api'`
  - `transitousGet<T>(path: string, params: Record<string, string | number>, city: Cities): Promise<T>`: builds the URL with `URLSearchParams`, calls `fetch`, calls `throwIfProviderBlocked(response, city)`, throws a plain `Error` with status for other non-OK responses, returns parsed JSON.
  - `extractDhid(transitousId: string): string | null`: returns the station-level DHID (`de:<5 digits>:<digits>`) contained in the ID, else `null`.
  - `isWuerzburgRegion(dhid: string): boolean`: district key (2nd segment) is in the NVM list.
  - `mapTransitousMode(mode: string): string`: `TRAM→'Tram'`, `BUS|COACH→'Bus'`, `SUBURBAN→'SBahn'`, `SUBWAY→'UBahn'`, `REGIONAL_RAIL|REGIONAL_FAST_RAIL|RAIL|HIGHSPEED_RAIL|LONG_DISTANCE→'RegionalBahn'`, anything else `'Unknown'`.

- [ ] **Step 1: Write the failing tests**

```ts
describe('extractDhid', () => {
  it.each([
    ['de-DELFI_de:09663:208:1:A', 'de:09663:208'],
    ['at-Railway-Current-Reference-Data-2026_de:09663:177:3:4', 'de:09663:177'],
    ['de-amarillo-bw_de:09663:246', 'de:09663:246'],
    ['de:09663:308', 'de:09663:308'],
    ['gb-dft-bods_240075607', null],
  ])('%s -> %s', (id, expected) => expect(extractDhid(id)).toBe(expected));
});

it('isWuerzburgRegion', () => {
  expect(isWuerzburgRegion('de:09663:208')).toBe(true);
  expect(isWuerzburgRegion('de:09679:1')).toBe(true);
  expect(isWuerzburgRegion('de:06435:4503')).toBe(false);
});

it('mapTransitousMode', () => {
  expect(mapTransitousMode('TRAM')).toBe('Tram');
  expect(mapTransitousMode('COACH')).toBe('Bus');
  expect(mapTransitousMode('REGIONAL_RAIL')).toBe('RegionalBahn');
  expect(mapTransitousMode('OTHER')).toBe('Unknown');
});

describe('transitousGet', () => {
  it('requests the production host with encoded params', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ a: 1 }) } as Response));
    vi.stubGlobal('fetch', fetchMock);
    await expect(transitousGet('/v6/stoptimes', { stopId: 'de-DELFI_de:09663:208:1:A', n: 5 }, 'wue')).resolves.toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledWith('https://api.transitous.org/api/v6/stoptimes?stopId=de-DELFI_de%3A09663%3A208%3A1%3AA&n=5');
  });
  it('maps 429 to ProviderUnavailableError', async () => { /* status 429 -> instanceOf ProviderUnavailableError, city 'wue' */ });
  it('throws a plain Error on 500', async () => { /* not instanceOf ProviderUnavailableError */ });
});
```

- [ ] **Step 2: Run** `pnpm vitest run src/api/__tests__/transitous.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the types and `src/api/transitous.ts` as listed under Interfaces. `extractDhid` uses the regex `/de:\d{5}:\d+/`.
- [ ] **Step 4: Run** the same test. Expected: PASS. Then `pnpm lint`.
- [ ] **Step 5: Commit** `feat(api): add Transitous client helpers`

---

### Task 2: Re-implement the Würzburg API on Transitous

**Files:**
- Modify: `src/api/wuerzburgApi.ts` (full rewrite, same exports)
- Modify: `src/models/WUEResponse.ts` (remove the `WUEResponse` interface; the EFA stop finder / serving lines types stay, Munich uses them) and `src/models/index.ts`
- Test: `src/api/__tests__/wuerzburgApi.test.ts` (keep the 429 tests, add the ones below)

**Interfaces:**
- Consumes: everything from Task 1.
- Produces (signatures unchanged for existing callers, plus one new export):
  - `fetchWuerzburgDepartures(stopId: string): Promise<Departure[]>`: `GET /v6/stoptimes` with `{ stopId, n: 30, language: 'de' }`.
  - `stopFinderWuerzburg(query: string): Promise<BasicStop[]>`: `GET /v1/geocode` with `{ text: query, type: 'STOP', place: '49.7913,9.9534', placeBias: 10, numResults: 20, language: 'de' }`.
  - `linesForStop(stopId: string): Promise<Line[]>`: `GET /v6/stop` with `{ stopId, language: 'de' }`.
  - `resolveLegacyStopId(legacyId: string, name: string): Promise<string | null>`: geocode `{ text: name, type: 'STOP', place: '49.7913,9.9534', placeBias: 10, numResults: 20 }` and return the first match whose `extractDhid(id) === legacyId`, else `null`.
  - `isLegacyStopId(stopId: string): boolean`: `/^de:\d{5}:\d+$/`.

Mapping rules for departures:
- Drop entries where `cancelled || tripCancelled`, and entries without `place.departure` (arrival only).
- `id`: `` `wue-${tripId}-${scheduled.getTime()}` ``, `line`: `displayName ?? routeShortName ?? '?'`, `direction`: `headsign`.
- `scheduledDeparture`: `place.scheduledDeparture`. `actualDeparture`: `place.departure` only if `realTime`, else `null`.
- `delayMinutes`: rounded difference in minutes, `0` becomes `null` (same as before).
- `platform`: `place.track ?? place.scheduledTrack ?? null`. `transportType`: `mapTransitousMode(mode)`. `notifications`: `[]`.

Stop search: keep matches with `extractDhid(id)` in the Würzburg region, one per DHID (first wins), mapped to `{ id, name, city: 'wue', longName: name }`.

Lines: one `Line` per distinct `routeShortName`, `{ name: routeShortName, direction: '', type: mapTransitousMode(mode) }`, sorted with `localeCompare(…, 'de', { numeric: true })`.

- [ ] **Step 1: Write the failing tests** (stub `fetch` with fixture JSON shaped like the live responses in Task 1 types):
  - `fetchWuerzburgDepartures` returns `{ line: '4', direction: 'Zellerau', platform: 'D', transportType: 'Tram', delayMinutes: 1 }` for a stop time with scheduled `…T14:03:00Z`, departure `…T14:04:00Z`, `realTime: true`.
  - With `realTime: false`, `actualDeparture` is `null` and `delayMinutes` is `null`.
  - A stop time with `tripCancelled: true` and one with no `place.departure` are not in the result (Review Focus 1, 2).
  - It requests `/v6/stoptimes` with `stopId` and `n=30`.
  - `stopFinderWuerzburg('Hauptbahnhof')` on matches `[at-…_de:09663:177:3:4 'Würzburg Hbf', de-DELFI_de:09663:177:10:22 'Würzburg Hauptbahnhof ZOB', de-DELFI_de:06435:4503 'Hanau Hauptbahnhof', gb-dft-bods_240075607 'Sanderling Way']` returns exactly one stop with id `at-…_de:09663:177:3:4` (Review Focus 3).
  - `linesForStop` on routes `114 BUS, 14 BUS, 114 BUS, 4 TRAM` returns names `['4', '14', '114']`.
  - `resolveLegacyStopId('de:09663:308', 'Philosophisches Institut')` returns `'de-DELFI_de:09663:308:0:11'` when the matches are `[de-DELFI_de:09663:260:0:11, de-DELFI_de:09663:308:0:11]`, and `null` when no match has DHID `de:09663:308`.
  - `isLegacyStopId`: `true` for `de:09663:308`, `false` for `de-DELFI_de:09663:308:0:11`.
- [ ] **Step 2: Run** `pnpm vitest run src/api/__tests__/wuerzburgApi.test.ts`. Expected: new tests FAIL; the existing 429 tests may still pass.
- [ ] **Step 3: Implement** the rewrite as specified. Remove `VERSION`, `BASE_URL` and the EFA URL builders.
- [ ] **Step 4: Run** the test file, then `pnpm test` and `pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(wue): load Würzburg data from Transitous`

---

### Task 3: Migrate saved legacy Würzburg stop IDs

**Files:**
- Create: `src/utils/migrateWuerzburgStops.ts`
- Modify: `src/App.tsx` (call it once after the store has hydrated)
- Modify: `src/config/predefinedStops.json` (`wue` entries)
- Test: `src/utils/__tests__/migrateWuerzburgStops.test.ts`

**Interfaces:**
- Consumes: `isLegacyStopId`, `resolveLegacyStopId` from Task 2; `useConfigStore` (`stops`, `setStops`) from `src/store/configStore.ts`.
- Produces: `migrateWuerzburgStops(stops: StopConfig[], resolve?: typeof resolveLegacyStopId): Promise<StopConfig[] | null>`: returns a new array where every `wue` stop with a legacy ID that resolves gets the new `stopId`; returns `null` if nothing changed. Unresolvable stops stay as they are and are logged with `loggers.api.warn` (stop name and legacy ID).

- [ ] **Step 1: Write the failing tests** with an injected `resolve` mock:
  - Two `wue` legacy stops, one resolvable, one not → result has the new ID for the first, the old ID for the second (Review Focus 4); warn logged once.
  - `muc` stops and `wue` stops with Transitous IDs are untouched and `resolve` is not called for them.
  - No legacy stops → returns `null` and `resolve` is never called.
  - `resolve` rejecting (network error) for one stop → that stop stays unchanged, the others still migrate.
- [ ] **Step 2: Run** `pnpm vitest run src/utils/__tests__/migrateWuerzburgStops.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `migrateWuerzburgStops`. Resolve stops sequentially (low request volume). In `App.tsx`, add a `useEffect` that runs once on mount, calls it with `useConfigStore.getState().stops`, and on a non-null result calls `setStops` with the current state's stops where only the `stopId` of migrated stops (matched by `id`) is replaced, so edits made in between are kept.
- [ ] **Step 4: Update `predefinedStops.json`**: `wue-1` → `name: "Philosophische Fakultät"`, `stopId: "de-DELFI_de:09663:308:0:11"`. Remove `wue-2` "Magdalene-Schoch-Straße": its ID `de:09663:246` only exists in the `de-amarillo-bw` feed and returns no departures. Run `pnpm test` to check that no test depends on `wue-2`.
- [ ] **Step 5: Run** `pnpm test`, `pnpm lint`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(wue): migrate saved Würzburg stops to Transitous IDs`

---

### Task 4: Attribution, texts, proxy removal, docs

**Files:**
- Create: `src/components/DataAttribution.tsx`
- Modify: `src/App.tsx` (render `<DataAttribution />` at the end of the main layout)
- Modify: `src/i18n/locales/de/translation.json`, `src/i18n/locales/en/translation.json`
- Modify: `vite.config.ts` (remove the `/wuerzburg-api` proxy entry), `nginx.conf` (remove `location /wuerzburg-api/`)
- Modify: `CLAUDE.md`, `docs/installation/nginx-installation.md`, `docs/installation/apache-installation.md` (remove the Würzburg proxy, describe Transitous), `CHANGELOG.md` (Unreleased entry)
- Delete: `docs/apis/oevp-apis/WUE MAgdalene-Schoch-Straße.bru`, `docs/apis/oevp-apis/WUE Philosophusches Institut.bru`, `docs/apis/WUE_response*.json`, `docs/apis/WUE_response_get_lines*.json`, `docs/apis/WUE_response_search_stop.json`
- Test: `src/components/__tests__/DataAttribution.test.tsx`

**Interfaces:**
- Produces: `DataAttribution(): JSX.Element`: a `<footer>` with a MUI `Typography variant="caption"` containing three links (open in a new tab, `rel="noopener noreferrer"`):
  - `attribution.transitous` → `https://transitous.org/sources/`
  - `attribution.osm` → `https://www.openstreetmap.org/copyright`
  - `attribution.project` → `https://github.com/ironpinguin/departure-monitor`

Texts (exact):

| Key | de | en |
|---|---|---|
| `attribution.label` | `Datenquellen` | `Data sources` |
| `attribution.transitous` | `Würzburg: Transitous` | `Würzburg: Transitous` |
| `attribution.osm` | `© OpenStreetMap-Mitwirkende` | `© OpenStreetMap contributors` |
| `attribution.project` | `Projekt & Kontakt` | `Project & contact` |
| `stopWidget.providerUnavailable` | `Abfahrtsdaten für diese Stadt sind derzeit nicht verfügbar. Bitte später erneut versuchen.` | `Departure data for this city is currently unavailable. Please try again later.` |
| `stopSearch.providerUnavailable` | `Die Haltestellensuche für diese Stadt ist derzeit nicht verfügbar. Bitte später erneut versuchen.` | `Stop search for this city is currently unavailable. Please try again later.` |

- [ ] **Step 1: Write the failing test**: render `DataAttribution` with `react-i18next` mocked the same way as in `StopWidget.unavailable.test.tsx` (`t` returns the key); assert the `contentinfo` landmark exists and the three links have the hrefs above.
- [ ] **Step 2: Run** `pnpm vitest run src/components/__tests__/DataAttribution.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the component and the i18n keys, render it in `App.tsx`, and update the two `providerUnavailable` texts. Adjust `StopWidget.unavailable.test.tsx` if it asserts the old wording.
- [ ] **Step 4: Remove the proxy and update the docs** listed under Files. Then check with `grep -rn "wuerzburg-api\|bahnland" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .`. Expected: hits only in `CHANGELOG.md` history and in the comment in `src/api/errors.ts`; update that comment to name Transitous rate limiting as an example.
- [ ] **Step 5: Run** `pnpm lint`, `pnpm test`, `pnpm build`. Expected: all PASS.
- [ ] **Step 6: Manual check**: run `pnpm dev`. Add a Würzburg stop via search ("Sanderring"), check that departures with platforms appear, check that the line preview loads and that the footer links work. In DevTools, check that requests go to `api.transitous.org` and none go to `/wuerzburg-api`.
- [ ] **Step 7: Commit** `feat(wue): attribution footer, drop Würzburg proxy, update docs`, then open a PR that closes #72.

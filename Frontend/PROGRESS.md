# OceanWatch Frontend Progress

**Last updated:** 2026-08-31  
**Primary owner:** Frontend  
**Backend:** FastAPI, owned by backend team

## Current Status

**Current phase: Phase 4 — Mock Operational Data (4.1–4.7 complete; timeline generation deferred to Phase 7)**  
**Overall: Deck.gl layer visualization foundation complete and browser verified. Mock mode is now fully scenario-driven: a deterministic 30-vessel maritime traffic simulation built on real geography (land mask, ports, anchorages, shipping corridors, fishing grounds, patrol zones — no vessel on land, no trail through land, all routes validated), plus a deterministic oil-spill attribution scenario (incident INC-2026-001, organic drifted spill geometry, phase state machine, fleet-derived candidate scoring, evidence, deterministic environment, drift coherence), all served through the unchanged `OceanWatchDataProvider` contract.**

The previous tracker was inconsistent: it called the UI redesign Phase 1.2 while also listing MapLibre/deck.gl installation as unfinished, even though those packages are already installed. This file is now the implementation source of truth.

```text
Phase 0   Architecture & Contracts       MOSTLY COMPLETE
Phase 1   UI + Visual Direction            COMPLETE
Phase 2   Map Foundation                  COMPLETE
Phase 3   Deck.gl Visualization             COMPLETE
Phase 4   Mock Operational Data             IN PROGRESS (4.1–4.7 realistic constrained traffic + attribution scenario complete; timeline generation deferred to Phase 7)
Phase 5   Vessel LOD / 3D                  NOT STARTED
Phase 6   Incident Investigation           NOT STARTED
Phase 7   Timeline / Playback               NOT STARTED
Phase 8   FastAPI Integration               NOT STARTED
Phase 9   Performance / Reliability         NOT STARTED
Phase 10  Final Polish / SIH Demo           NOT STARTED
```

---

# Phase 0 — Architecture & Contracts

## Status: MOSTLY COMPLETE

### Foundation

- [x] React + TypeScript + Vite
- [x] Tailwind CSS v4
- [x] shadcn/ui prerequisites
- [x] Path aliases
- [x] Environment variables
- [x] Zustand
- [x] TanStack Query/provider setup
- [x] Basic application structure

### Domain models

- [x] Vessel
- [x] Vessel trail
- [x] Oil spill incident
- [x] Candidate vessel
- [x] Evidence
- [x] Timeline event
- [x] Environment
- [x] Geo types

### Data layer

- [x] `OceanWatchDataProvider`
- [x] Mock provider
- [x] FastAPI provider boundary/stub with mock fallback
- [x] API client
- [x] Mock/API switching
- [ ] Zod response validation

### State

- [x] Map store
- [x] UI store
- [x] Incident store

### Acceptance

- [x] App boots
- [x] TypeScript passes
- [x] Build passes
- [x] Mock provider returns typed data
- [x] UI components do not directly call `fetch`
- [ ] External API payloads validated with Zod

---

# Phase 1 — UI Foundation & Visual Direction

## Status: COMPLETE

## Phase 1.1 — Core UI Shell

- [x] Header
- [x] Primary navigation
- [x] Layer controls
- [x] Detail panel
- [x] Telemetry/status bar
- [x] Map placeholder
- [x] Map control UI
- [x] Panel interactions
- [x] Layer toggles
- [x] Zustand integration
- [x] Hover/focus states
- [x] Responsive panel behavior
- [x] Build verification

## Phase 1.2 — Visual Direction Pass

**Status: COMPLETE AS DIRECTION PASS**

- [x] Light maritime palette
- [x] Map-first composition
- [x] White/translucent floating panels
- [x] Reference-inspired header/search
- [x] Navigation/layer panels
- [x] Incident intelligence card
- [x] Candidate vessel card
- [x] Floating telemetry strip
- [x] Floating map controls
- [x] Deep navy typography
- [x] Blue accent states
- [x] Green LIVE state
- [x] Warning/critical states

**Visual note:** The visual system is intentionally not frozen. Final typography, spacing, density, panel placement, map contrast, motion, and interaction polish will be refined after real map/data layers exist.

---

# Phase 2 — Map Foundation

## Status: COMPLETE (Basemap & Terrain Foundation COMPLETE)

### Dependencies

Already installed in the project:

- [x] `maplibre-gl`
- [x] `react-map-gl`
- [x] `@deck.gl/core`
- [x] `@deck.gl/layers`
- [x] `@deck.gl/mapbox`

### Map

- [x] Create real MapLibre map
- [x] Replace placeholder map
- [x] Set initial Arabian Sea viewport (67.0°E, 18.0°N)
- [x] Add basemap (Carto Positron GL style)
- [x] Establish custom maritime map style
- [x] Ocean styling
- [x] Land styling
- [x] Coastlines
- [x] Geographic labels
- [x] Borders where useful
- [x] Terrain/relief foundation (Flat, Hillshade Relief, and 3D DEM Terrain modes via AWS Terrarium DEM)

### Controls

- [x] Zoom in/out
- [x] Compass/reset bearing
- [x] Reset/fly-to location
- [ ] Fullscreen
- [x] 3D / Terrain mode toggle (Flat, Relief, 3D)

### State/performance

- [x] Map → MapStore viewport synchronization
- [x] MapStore → map synchronization
- [x] Terrain mode state management (`flat`, `hillshade`, `3d`)
- [x] Prevent update loops
- [x] Avoid React render storms during movement
- [x] Preserve viewport where appropriate

### Acceptance

- [x] Real interactive map renders
- [x] Map visually approaches reference
- [x] Pan/zoom/rotate/pitch work
- [x] Controls work
- [x] UI floats correctly over map
- [x] No obvious navigation stutter

---

# Phase 3 — Deck.gl Visualization Engine

## Status: IN PROGRESS (Deck.gl Overlay Foundation COMPLETE)

- [x] Deck overlay (`DeckGLOverlay` via `@deck.gl/mapbox` MapboxOverlay)
- [x] Central layer construction system (`useDeckLayers` hook)
- [x] Layer visibility integration structure (`useMapStore.layerVisibility`)
- [ ] Vessel clustering
- [x] Vessel 2D layer
- [x] Heading indicators
- [x] Vessel picking
- [x] Spill polygon
- [x] Spill boundary
- [x] Spill origin
- [x] Vessel trails
- [ ] Investigation path
- [ ] Shipping lanes
- [ ] EEZ
- [ ] Wind placeholder
- [ ] Current placeholder
- [x] Hover state
- [x] Click/selection state
- [x] Map ↔ panel synchronization

### Acceptance

- [x] Each layer toggles independently
- [x] Map entities can be selected
- [x] Layer state persists correctly
- [x] No DOM marker per vessel

---

# Phase 4 — Mock Operational Data

## Status: IN PROGRESS (4.1–4.7 deterministic traffic + oil-spill attribution scenario COMPLETE; timeline generation deferred to Phase 7)

### Data

- [x] Realistic vessel dataset (deterministic 30-vessel fleet — 5 scenario core + 25 geography-constrained generated vessels — 6 types, seeded)
- [x] Multiple vessel types (tanker / cargo / container / fishing / patrol / other)
- [x] Mock incidents (scenario-derived: deterministic INC-2026-001, phase-driven status/confidence/severity)
- [x] Spill geometry (deterministic organic polygon: seeded harmonics, logistic area growth, clock-driven drift, cached per sim-minute)
- [x] Historical trails (deterministic, per-vessel, 24h span, consumes `VesselTrail`/`PathLayer`)
- [x] Candidate rankings (deterministic multi-factor scoring over the live fleet, not hard-coded)
- [x] Evidence (built from per-candidate distance/temporal/route/behavioral/environmental factors)
- [x] Environment data (deterministic simulated wind/current/drift via seeded harmonics)

### Simulation

- [x] Vessel movement (deterministic route-based kinematics, centralized clock, no per-vessel timers)
- [x] Spill progression (deterministic function of sim time: NORMAL → SPILL DETECTED → INITIAL EXTENT → EXPANDS/DRIFTS → INVESTIGATION-READY; driven by the centralized clock)
- [x] Wind/current values (deterministic simulated environment: seeded harmonics around Arabian Sea baselines, no external APIs)
- [ ] Timeline generation (deferred to Phase 7 — out of scope for the 4.3–4.6 scenario)
- [x] Deterministic scenario runner (fixed seed + fixed scenario epoch, reproducible on reload)

### Phase 4.1 + 4.2 — Deterministic Maritime Traffic Simulation (2026-08-31)

- [x] `src/simulation/` module with seeded PRNG (`mulberry32`), route geometry, traffic lanes/circuits, and deterministic fleet generator
- [x] 80-vessel fleet across all 6 vessel types with plausible regional distribution (Gulf of Kutch / Saurashtra, Arabian Sea)
- [x] Spatially believable traffic: gulf/north/south corridors, coastal traffic, localized fishing grounds, patrol circuits, scattered anchored/support craft
- [x] Realistic type behavior (tankers slow/moderate, cargo/container on corridors, fishing slow/coastal/varied, patrol localized, other mixed)
- [x] Single centralized `SimulationEngine` clock shared by all consumers; position = pure function of (vessel, simulated time)
- [x] Latitude-aware lat/lng deltas (`destinationPoint`); great-circle route distances
- [x] Deterministic historical trails (72 points, 20-min interval, 24h span) ending exactly at the vessel's current position
- [x] Movement visual tuning (`TIME_SCALE` = 2 sim-min per real second; believable on-screen AIS motion)
- [x] `MockDataProvider` serves live simulated vessels/trails through the unchanged `OceanWatchDataProvider` contract
- [x] `useDeckLayers` polls the fleet on a single 300 ms interval (no per-vessel timers, `keepPreviousData` prevents trail flicker)
- [x] Static t=0 snapshot exported from `src/data/mock/vessels.ts` (identical initial world on every load)
- [x] Incident coherence preserved: scenario core vessels (vsl-001..vsl-005) keep the INC-2026-001 narrative

### Verification (4.1 + 4.2)

- [x] TypeScript build passes
- [x] Production build passes
- [x] Node-side verification: fleet size/distribution, bit-identical determinism across two engine instances, movement rate matches kinematics, trail coherence
- [x] Browser/CDP verification: 80 vessels × 6 types render, distinct headings/speeds, smooth movement, coherent trails, hover tooltip + click selection → DetailPanel sync, vessel & trail layer toggles, reload reproduces the initial scenario, zero console/WebGL errors, no render storm (~141 FPS, no long tasks)

### Phase 4.3–4.6 — Deterministic Oil-Spill Attribution Scenario (2026-08-31)

**New `src/simulation/` modules (5):**
- `incident.ts` — primary incident `INC-2026-001`, fixed detection timestamp/location/area/confidence/severity/source; `ScenarioPhase` state machine (`normal → spill-detected → correlating → attribution-ready`) as a pure function of sim time.
- `environment.ts` — deterministic `environmentAt(simTime)` (seeded harmonics over plausible Arabian Sea baselines) and `driftVectorAt(simTime)` (3% Ekman wind + full current → 3.2 km/h @ ~126°).
- `spillGeometry.ts` — organic irregular polygon (44 vertices, 5 seeded shape harmonics, never a perfect circle), logistic area growth 6.2→26 km², centroid drift along the reference drift vector, back-tracked estimated release point; cached per simulated minute.
- `candidateScoring.ts` — multi-factor correlation over the live fleet (distance to estimated release point, temporal release-window centrality, behavioral speed bell curve, route time-near fraction, vessel-type prior); top result vsl-001 Ocean Guardian (0.935 ≈ 94%), plus 3 plausible cargo alternatives; builds `Evidence` items per candidate.
- `scenarioRunner.ts` — `scenarioStateAt(simTime)`: phase + incident + spill + environment + vessels + candidates in one deterministic snapshot; candidates cached.

**Integration:**
- `MockDataProvider` serves the scenario through the unchanged `OceanWatchDataProvider` contract (`getIncidents/getIncident/getCandidates/getEnvironment`, all honoring optional `timestamp`); no second clock, no competing provider, no direct `fetch`.
- Spill visualization consumes the deterministic geometry (boundary/origin/drift) via `spillLayer.ts`; `DeckGLOverlay` tooltip shows severity/confidence/drift and the ESTIMATED RELEASE POINT marker; incident query polls on the same 300 ms interval as the fleet (geometry stays cached per sim-minute).
- `DetailPanel` candidate card is data-driven from the ranked candidate (94% match, Ocean Guardian, IMO-9300283) with an "Inspect Vessel & Trail" selection into the vessel telemetry panel.

**Verification:**
- `npm run build` passes; `npm run lint` passes.
- Node-side determinism suite: same timestamp ⇒ identical incident/geometry/environment/candidates; two fresh providers identical; two engine instances identical; geometry stable within a sim-minute and progressing across minutes; boundary closed & organic (radius std ≈ 4.8% of mean, ±19% spread); drift coherence (origin→centroid bearing equals drift bearing); candidates empty before correlation phase.
- Browser/CDP (live Chromium): incident panel scenario-driven (INC-2026-001, 92% confidence, area/drift progressing); spill polygon + origin marker + drift render on the deck canvas (framebuffer pixel-verified); 80 vessels move (76 of 80 changed position in 1.5 s) with 76 trails × 72 points; Oil Spills layer toggle removes/restores both spill layers; candidate → Inspect Vessel & Trail → Ocean Guardian telemetry panel works; fresh reload reproduces the same initial scenario; zero console errors/warnings.

### Demo scenario

- [x] Normal traffic (live seeded fleet, browser verified)
- [x] Spill detection event (scenario phase machine + fixed detection timestamp/incident)
- [x] Spill appears (deterministic organic polygon renders, browser verified)
- [x] AIS correlation (fleet-derived candidate scoring, not hard-coded)
- [x] Candidate ranking (4 ranked candidates; top = Ocean Guardian 94%)
- [x] Top candidate (vsl-001 Ocean Guardian, explainable factors + evidence)
- [ ] Trace Source (investigation UI out of scope for 4.3–4.6; estimated release point renders as origin marker)
- [x] Historical trail (candidate vessel trail selectable from the candidate card)
- [ ] Timeline (Phase 7 — explicitly out of scope for 4.3–4.6)

### Acceptance

- [x] App feels live in mock mode (moving fleet, drifting spill, ranked candidates)
- [x] Vessels move smoothly (browser verified)
- [x] Incident can be discovered and selected (incident panel + spill picking + candidate card, browser verified)
- [x] Scenario is reproducible (seeded + fixed epoch; two providers & two engines identical; browser reload verified)
- [x] No manual data editing required (all scenario data derived deterministically from seed + sim time)

### Phase 4.7 — Realistic Maritime Traffic + Geographic Constraints (2026-08-31)

Replaces the density-first 80-vessel mock with a quality-first **30-vessel fleet** (5 scenario core + 25 generated) that behaves like real Arabian Sea traffic: traffic is *derived* from real geography → maritime network → origin/destination → route → vessel behaviour → AIS-like observations → historical trail, never random position+heading+speed.

**Geographic constraint system (`src/simulation/`):**
- `landGrid.ts` — binary land mask (0.02° cells, lng 65.5–73.5 / lat 18.5–25.5) compiled from Natural Earth 50m land (public domain); two masks: raw land (`isOnLand`) and an eroded **safe-water** grid ~4.4 km offshore (`isSafeWater`); `checkNavigability` validates whole routes, `segmentCrossesLand` guards every segment.
- `maritimeNetwork.ts` — real-port model with offshore `approach` points (Karachi, Kandla, Mundra, Vadinar, Sikka, Okha, Porbandar, Mandvi, Veraval, Diu, Mumbai), six shipping corridors (deep lane Karachi↔Mumbai, west offshore, west coast, Gulf of Kutch approach/inner/south shore), 7 fishing grounds, 3 patrol-zone centres, 3 anchorages.
- `routeBuilder.ts` — assembles navigable routes and **asserts `checkNavigability` at build time** (a route that crosses land, crosses an island, or clips the coast throws instead of silently placing a vessel on dry land). All 32 fleet route templates verified navigable.

**Realistic vessel behaviour (from the seed only — no `Math.random`, no `Date.now`):**
- `journey.ts` — the behavioural layer: a voyage is a timeline of legs over the route. Merchants follow origin-hold → cruise → **slow approach (0.45× cruise near destination)** → dwell → slow depart → cruise home; fishing vessels follow PORT → TRANSIT → GROUND → slow **loiter circuit** → TRANSIT → PORT; patrol vessels run localized closed circuits; anchored vessels micro-drift on the hook.
- Behavioural diversity in the generated fleet: 8 commercial-corridor (tanker/cargo/container, slow near destination), 7 coastal/offshore feeders, 7 fishing, 3 patrol, 3 anchored.
- `aisJitter.ts` — AIS-like realism: per-report deterministic jitter (seeded per vessel + report index) to position/heading/speed, irregular reporting intervals, noised observations; scoring still uses the jitter-free pure state.
- `trailGenerator.ts` — trails reflect the actual journey (same simulated voyage as the live vessel): irregular gaps, newest→oldest build, ending at the current observed position.

**Attribution compatibility preserved:** the 5 scenario vessels (vsl-001..vsl-005) are preserved byte-for-byte; INC-2026-001 with Ocean Guardian (vsl-001) remains the top candidate at **≈ 0.935**, and the ranking still emerges from the scoring model (worst-case merchant-at-port ≈ 0.616 ≪ 0.935). Gulf-adjacent merchants are still in origin-hold during the release window (06:12–07:27Z), so no new vessel is near the release region then.

**Verification:**
- `tsc -b`, `oxlint`, and the production build all pass.
- `scripts/verify-fleet.mjs` — 30 unique vessels; scenario core preserved; every generated route navigable; no generated vessel on land across 6 sampled times; deterministic across generations; behavioural-diversity table; attribution ranking (vsl-001 top, ≈ 0.935); trails present for moving vessels, empty for anchored, none on land.
- `scripts/verify-determinism.mjs` — two independent generations produce identical fleet/positions (pure + observed)/routes/journeys/patterns/trails/environment/spill/incident/candidates.
- `scripts/probe-*.mjs` — all 32 route templates navigable; mask sanity at known references; patrol circuits navigable.
- Browser/CDP (live Chromium): `vessels-2d-layer` IconLayer renders exactly 30 vessels and `vessel-trails-layer` renders 30 trails × 72 points; the 25 rendered generated positions and all 1800 rendered generated trail points cross-checked against the land mask — **zero on land**; spill layers render; click-on-vessel selects (halo layer + telemetry panel with correct sim state); Vessel Trails layer toggle removes/restores the trail layer; deck GPU picking returns the correct vessel; zero console/WebGL errors, zero failed network requests, per-type vessel icons load.

---

# Phase 5 — Vessel Visualization + LOD / 3D

## Status: NOT STARTED

### Assets

- [ ] Model registry
- [ ] Tanker GLB
- [ ] Cargo GLB
- [ ] Container GLB
- [ ] Fishing GLB
- [ ] Patrol GLB
- [ ] Optimize assets
- [ ] Verify usage/licensing rights

### LOD

- [ ] LOD 0 clusters/dots
- [ ] LOD 1 2D silhouettes
- [ ] LOD 2 3D models
- [ ] Zoom thresholds
- [ ] Relevance override
- [ ] Selected vessel override
- [ ] Top candidate override
- [ ] Hover override
- [ ] Incident proximity override

### Performance

- [ ] Viewport culling
- [ ] Shared model reuse/instancing
- [ ] Lazy loading
- [ ] Model caching
- [ ] Minimal picking
- [ ] No React-driven per-vessel animation
- [ ] 3D profiling

### Acceptance

- [ ] Normal traffic does not use unnecessary 3D
- [ ] Selected vessel becomes high-detail
- [ ] Models are reused
- [ ] 3D remains usable at realistic traffic levels

---

# Phase 6 — Incident Investigation

## Status: NOT STARTED

- [ ] Incident selection
- [ ] Incident detail
- [ ] Spill extent
- [ ] Spill origin
- [ ] Confidence/severity/status
- [ ] Source imagery metadata
- [ ] Trace Source
- [ ] Investigation mode
- [ ] Dim unrelated layers
- [ ] Predicted drift
- [ ] Historical trails
- [ ] Candidate visualization
- [ ] Candidate ranking
- [ ] Overall score explanation
- [ ] Temporal correlation
- [ ] Route correlation
- [ ] Behavioral correlation
- [ ] Distance
- [ ] Evidence
- [ ] Vessel details

### Acceptance

- [ ] Spill → source → candidate → vessel workflow works
- [ ] Attribution is visually understandable
- [ ] Relevant entities are highlighted

---

# Phase 7 — Timeline / Playback

## Status: NOT STARTED

- [ ] Timeline component
- [ ] Timeline state
- [ ] Play/pause
- [ ] Previous/next
- [ ] Scrubbing
- [ ] Time interpolation
- [ ] Vessel playback
- [ ] Trail playback
- [ ] Spill progression
- [ ] Environment playback
- [ ] Event markers

### Acceptance

- [ ] Investigation can be replayed
- [ ] Playback is smooth
- [ ] Timeline does not cause unnecessary full-map rerenders

---

# Phase 8 — FastAPI Integration

## Status: NOT STARTED

### Contract

- [ ] Confirm actual endpoints
- [ ] Confirm response schemas
- [ ] Confirm IDs
- [ ] Confirm coordinate conventions
- [ ] Confirm pagination/viewport behavior
- [ ] Confirm timestamp/timezone conventions

### Adapter

- [ ] Configure API base URL
- [ ] Implement real API provider
- [ ] Map vessel responses
- [ ] Map incident responses
- [ ] Map candidate responses
- [ ] Map trails
- [ ] Map environment

### Reliability

- [ ] Zod validation
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Retry behavior
- [ ] Slow-request handling
- [ ] Preserve mock mode

### Acceptance

- [ ] Real backend replaces mock data
- [ ] UI requires no backend-specific rewrite
- [ ] Invalid payloads fail safely
- [ ] Mock mode still works

---

# Phase 9 — Performance & Reliability

## Status: NOT STARTED

### Dataset tests

- [ ] 100 vessels
- [ ] 1,000 vessels
- [ ] 5,000 vessels
- [ ] Large historical trail dataset
- [ ] Multiple simultaneous layers

### Profiling

- [ ] Map rendering
- [ ] Deck.gl layers
- [ ] Vessel updates
- [ ] 3D models
- [ ] Picking
- [ ] React renders
- [ ] Memory
- [ ] Network requests

### Stress cases

- [ ] Fast viewport movement
- [ ] Dense traffic
- [ ] Timeline playback
- [ ] Multiple overlays
- [ ] Network throttling
- [ ] API failure
- [ ] Reconnect if real-time transport exists

### Acceptance

- [ ] No obvious interaction stutter
- [ ] No runaway memory growth
- [ ] Large datasets degrade predictably
- [ ] Heavy features degrade gracefully

---

# Phase 10 — Final Visual Polish + SIH Demo

## Status: NOT STARTED

### Visual

- [ ] Full reference comparison
- [ ] Typography pass
- [ ] Spacing pass
- [ ] Icon pass
- [ ] Panel sizing/placement pass
- [ ] Map density pass
- [ ] Layer contrast pass
- [ ] Selection states
- [ ] Hover states
- [ ] Motion pass

### UX states

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Retry states
- [ ] Connection states

### Demo

- [ ] Scripted scenario
- [ ] Demo mode
- [ ] Incident alert animation
- [ ] Spill pulse
- [ ] Vessel selection animation
- [ ] Investigation transition
- [ ] Timeline polish
- [ ] Repeatable start-to-finish demo

### Final verification

- [ ] Production build
- [ ] Browser test
- [ ] Performance test
- [ ] Console cleanup
- [ ] No known P0 bugs
- [ ] Full SIH scenario works without manual editing

---

# Definition of Complete

- [ ] Mock mode works end-to-end
- [ ] FastAPI mode works end-to-end
- [ ] Map resembles reference
- [ ] Core UI is polished
- [ ] Layers work independently
- [ ] Vessel LOD works
- [ ] 3D vessel visualization works selectively
- [ ] Oil spill investigation works
- [ ] Attribution is explainable
- [ ] Timeline works
- [ ] Search works
- [ ] Loading/error/empty states work
- [ ] Performance is measured
- [ ] Demo scenario is repeatable
- [ ] No major console errors
- [ ] No known P0 bugs

---

# Change Log

## 2026-08-28

- Planning completed
- Final stack selected
- MapLibre + deck.gl architecture selected
- FastAPI boundary defined
- Vessel LOD strategy defined
- Mock provider strategy defined
- Investigation workflow defined

## 2026-08-29

### Phase 0

- [x] Project foundation
- [x] Tailwind v4
- [x] shadcn prerequisites
- [x] Path aliases
- [x] Environment configuration
- [x] API client
- [x] Provider boundary/mock fallback
- [x] Zustand stores
- [x] TanStack Query/provider setup
- [x] Domain types
- [ ] Zod response validation

### Phase 1.1

- [x] Core OceanWatch UI shell
- [x] Header/navigation/layer/detail/telemetry/map placeholder
- [x] Layer interactions
- [x] Panel interactions
- [x] Build verification

### Phase 1.2

- [x] Light maritime visual direction
- [x] Map-first floating composition
- [x] Reference-inspired header/search
- [x] Navigation/layer panels
- [x] Incident intelligence card
- [x] Candidate vessel card
- [x] Floating telemetry
- [x] Floating map controls
- [x] Build/type verification

### Current truth

- MapLibre basemap is implemented and browser verified.
- Arabian Sea viewport is implemented and browser verified.
- Terrain foundation (Flat, Hillshade Relief, and 3D DEM Terrain) is fully implemented, root cause diagnosed, fixed, and browser verified via CDP on live Chromium instance.
- Deck.gl MapboxOverlay foundation is implemented and browser verified.
- Core operational mock visualization is not complete.
- Vessel visualization is not implemented yet.
- 3D vessel visualization is not implemented.
- FastAPI is not integrated end-to-end.
- Final visual polish is intentionally deferred until real map/data layers exist.

## 2026-08-30

- **3D Terrain Visual Depth Fix & Browser Verification**:
  - Root Cause: In 3D terrain mode, `terrain-hillshade` layer visibility was set to `'none'` (configured strictly for `mode === 'hillshade'`), causing 3D physical elevation mesh to render with flat monochromatic Carto Positron land styling without shading or depth cues.
  - Fix Applied in `Frontend/src/components/map/MapArea.tsx`:
    - Updated hillshade visibility in `applyTerrainMode` and React `<Layer>` layout prop to be visible in both `hillshade` (Relief) and `3d` modes (`mode === 'hillshade' || mode === '3d'`).
    - Added clean prototype getter on `maplibregl.Map.prototype.transform` pointing to `painter.transform ?? _camera.transform` to ensure complete `@deck.gl/mapbox` `MapboxOverlay` compatibility without console errors during terrain/view state transitions.
  - Browser Verification:
    - **Flat (2D)**: Pitch 0°, DEM mesh disabled (`map.setTerrain(null)`), Hillshade layer disabled (`visibility: none`). VERIFIED.
    - **Relief**: Pitch 0°, DEM mesh disabled, Hillshade layer active (`visibility: visible`). VERIFIED.
    - **3D**: Pitch 60°, DEM mesh enabled (`source: 'terrain-dem-3d'`, exaggeration 2.5), Hillshade layer active (`visibility: visible`). Visual ridges, valleys, and physical elevation deformation visibly observable in Chrome at Western Ghats (`75.7°E, 13.4°N`). VERIFIED.
- **Phase 3 Clean Deck.gl Visualization Implementation & Browser Verification**:
  - **2D Directional Vessel Layer (`IconLayer`)**:
    - Directional maritime vessel symbols pointing along true heading using `(360 - heading) % 360` (0° N, 90° E, 180° S, 270° W).
    - Color-differentiated vessel types (`tanker`: amber `#f59e0b`, `cargo`: blue `#3b82f6`, `container`: cyan `#06b6d4`, `fishing`: emerald `#10b981`, `patrol`: purple `#8b5cf6`, `other`: slate `#64748b`).
    - Screen-space minimum/maximum sizing (`sizeMinPixels: 18, sizeMaxPixels: 44`) preventing subpixel disappearance.
    - Active vessel selection halo highlight (`ScatterplotLayer`).
  - **Geometrically Accurate Oil Spill Layer (`PolygonLayer` + `ScatterplotLayer`)**:
    - Mathematically scaled radius derived strictly from $r = \sqrt{A/\pi}$, converted with latitude/longitude corrections ($111.32$ km/deg, $\cos(\text{lat})$).
    - Translucent petroleum slick fill with subtle organic contouring, high-contrast severity border, and detection origin marker.
  - **Historical Vessel Trails (`PathLayer`)**:
    - Visible at operational zoom with `widthMinPixels: 2`, highlighted golden track for selected vessel, visually subordinate to vessels.
  - **Layer Order & Picking Precedence**:
    - Composed as: Spill Geometry $\to$ Trails $\to$ Vessels $\to$ Selected Highlight, guaranteeing vessel clicks inside/overlapping spills remain immediately selectable.
  - **Lightweight Tooltips & Interaction**:
    - Evaluated directly on canvas overlay without React state re-renders (vessel telemetry: name, IMO, type, speed, heading, status; spill telemetry: ID, area, severity, confidence).
  - **Map ↔ DetailPanel Synchronization**:
    - Clicking a vessel on map or candidate list updates centralized `useIncidentStore.selectedVesselId` and renders deep telemetry metrics in `DetailPanel`.
  - **Layer Visibility Controls**:
    - Independent toggles for `vessels`, `vesselTrails`, and `oilSpills` in `useMapStore.layerVisibility`.
  - **Browser Verification**:
    - Automated CDP tests on live Chromium: 0 TypeScript errors, 0 build errors, 0 runtime exceptions, 0 WebGL errors.

## 2026-08-31

### Phase 4.1 + 4.2 — Deterministic Maritime Traffic Simulation

**New `src/simulation/` module (10 files):**
- `rng.ts` — seeded `mulberry32` PRNG, deterministic `pick`/`shuffle`/`randomInt`/`randomRange`.
- `geo.ts` — great-circle distance, initial bearing, latitude-aware `destinationPoint`, `buildRoute` with cumulative distances, `pointAlongRoute`.
- `trafficPatterns.ts` — linear corridor lanes (Gulf of Kutch, north/south lanes, coastal), fishing grounds, patrol circuits.
- `scenario.ts` — 5 hand-authored scenario vessels (vsl-001..vsl-005) preserving the INC-2026-001 attribution narrative, with realistic IMO numbers.
- `vesselGenerator.ts` — seeded 80-vessel fleet (11/17/13/19/7/8 generated slots over the 5-vessel core) with type-appropriate speeds, patterns, and stopped/anchored behavior.
- `kinematics.ts` — pure position function `vesselStateAt(def, simTime)`; `TIME_SCALE` = 2 sim-min per real second; stopped-vessel drift.
- `trailGenerator.ts` — deterministic 72-point historical trails (24h span) ending exactly at the current position.
- `simulationEngine.ts` — centralized clock (`SCENARIO_START_MS + elapsed × TIME_SCALE`), singleton `simulationEngine`, `Vessel`/`VesselTrail` domain mapping.
- `types.ts` + `index.ts`.

**Integration:**
- `MockDataProvider` now serves live vessels/trails from `simulationEngine` (unchanged provider contract; static incidents/candidates/timelines remain).
- `useDeckLayers` polls vessels + trails on a single 300 ms interval; `keepPreviousData` prevents trail-layer flicker between polls.
- `src/data/mock/vessels.ts` exports the deterministic t=0 snapshot (`MOCK_VESSELS`, `MOCK_VESSEL_TRAILS`).

**Verification:**
- `npm run build` passes; `npm run lint` passes (one pre-existing warning in `src/app/providers.tsx`).
- Node-side script: 80 vessels, type split 12/18/14/20/8/8, bit-identical fleet across two engine instances, movement rate matches kinematics, trail endpoints coherent.
- Browser/CDP (live Chromium): 6 deck.gl layers present (spills, trails, vessels); 80 vessels render across all types with distinct headings/speeds; vessels move smoothly at a believable rate; 76 trails × 72 points spanning 24h; hover tooltip + click selection → DetailPanel sync verified; vessel & trail layer toggles verified; two consecutive reloads reproduce the identical initial scenario; 0 console errors/warnings; no render storm (~141 FPS, no long tasks).

### Phase 4.3–4.6 — Deterministic Oil-Spill Attribution Scenario

- Added `src/simulation/incident.ts`, `environment.ts`, `spillGeometry.ts`, `candidateScoring.ts`, `scenarioRunner.ts` — a self-contained, deterministic attribution scenario as pure functions of simulated time (reusing the Phase 4.1/4.2 centralized clock and 80-vessel fleet; no second clock, no second fleet).
- `INC-2026-001` (SAR, high severity, 92% confidence, investigating): fixed detection timestamp/location; phase machine `normal → spill-detected → correlating → attribution-ready`; deterministic organic spill polygon (seeded harmonics, logistic growth to 26 km², drift along wind+current vector ~3.2 km/h @ 126°); back-tracked estimated release point connects the slick to historical vessel tracks.
- Candidate correlation scores every fleet vessel (distance / temporal / behavioral / route / type prior); top candidate is the tanker `vsl-001` Ocean Guardian (0.935 ≈ 94%) with 3 plausible cargo alternatives and explainable `Evidence` items — nothing hard-coded.
- Deterministic environment (seeded wind/current) without external APIs; drift coherence supports spill → drift → estimated source region → historical track narrative.
- `MockDataProvider` serves the scenario through the unchanged `OceanWatchDataProvider` contract; `getIncidents/getIncident/getCandidates/getEnvironment` all honor optional `timestamp` for timeline compatibility.
- Map + UI wired: spill layer renders the deterministic geometry (boundary, origin marker, drift in tooltip); DetailPanel candidate card is data-driven (94% match, Inspect Vessel & Trail → Ocean Guardian telemetry).
- Verification: tsc + lint + production build pass; node-side determinism suite (two providers / two engines identical, geometry stable per sim-minute, organic shape, drift coherence); browser/CDP pixel + layer verification (spill renders, vessels move, trails render, Oil Spills toggle, candidate selection, fresh reload reproduces scenario, 0 console errors).

### Phase 4.7 — Realistic Maritime Traffic + Geographic Constraints

- Replaced the density-first 80-vessel mock with a quality-first deterministic 30-vessel fleet (5 scenario core + 25 generated). Traffic is derived from real geography → maritime network → origin/destination → route → vessel behaviour → AIS-like observations → trail — never random position+heading+speed.
- New geographic constraint system: `landGrid.ts` (binary land + safe-water masks from Natural Earth 50m, public domain; route/segment navigability checks), `maritimeNetwork.ts` (11 real ports with offshore approaches, 6 shipping corridors, 7 fishing grounds, 3 patrol zones, 3 anchorages), `routeBuilder.ts` (navigability asserted at build time — 32/32 templates verified, failures throw instead of stranding a vessel on land).
- New behavioural layer: `journey.ts` voyage model (merchant slow-approach/dwell, fishing transit→ground→loiter→transit, patrol closed circuits, anchored micro-drift); `aisJitter.ts` per-report seeded jitter + irregular reporting; trails now reflect the actual journey with irregular gaps.
- Attribution narrative preserved byte-for-byte (vsl-001..vsl-005); INC-2026-001 top candidate remains Ocean Guardian ≈ 0.935, ranking still emerges from the scoring model (no hard-coded score).
- Verification: tsc + lint + production build pass; `verify-fleet.mjs` (30 vessels, navigability, on-land sweep, determinism, behaviour diversity, ranking, trails) and `verify-determinism.mjs` (identical fleet/positions/routes/journeys/trails/environment/spill/incident/candidates across two generations) both pass; browser/CDP confirmed 30 vessels + 30 trails rendered, zero rendered generated positions or trail points on land, click→select works, layer toggles work, deck picking verified, zero console/WebGL/network errors.
- Runs fully offline and deterministically from the fixed seed — no external API, no token, no network dependency at runtime.

### Current truth

- Deterministic maritime traffic simulation is implemented, deterministic, and browser verified: a quality-first 30-vessel fleet constrained to real geography (no vessel on land, no trail through land, all routes navigable and validated) with realistic per-vessel behaviour and AIS-like observations.
- The deterministic oil-spill attribution scenario (4.3–4.6) is implemented, deterministic, and browser verified: incident INC-2026-001, organic drifted spill geometry, phase state machine, fleet-derived candidate scoring, evidence, deterministic environment, and drift coherence.
- Mock mode is live: 30 moving vessels with coherent historical trails, a drifting organic spill, and ranked candidate attribution, all served through the provider architecture.
- Timeline generation and the end-to-end demo scenario (Trace Source UI, Timeline) remain for later sub-phases; both are explicitly out of scope for 4.7.
- Vessel LOD/3D (Phase 5), investigation (Phase 6), timeline/search (Phase 7), and FastAPI integration (Phase 8) remain NOT STARTED.




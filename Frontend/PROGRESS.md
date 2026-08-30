# OceanWatch Frontend Progress

**Last updated:** 2026-08-31  
**Primary owner:** Frontend  
**Backend:** FastAPI, owned by backend team

## Current Status

**Current phase: Phase 4 — Mock Operational Data (4.1 + 4.2 Deterministic Maritime Traffic Simulation complete)**  
**Overall: Deck.gl layer visualization foundation complete and browser verified. A deterministic 80-vessel maritime traffic simulation now powers mock mode — seeded fleet, fixed scenario epoch, live movement, and coherent historical trails, all consumed through `MockDataProvider`.**

The previous tracker was inconsistent: it called the UI redesign Phase 1.2 while also listing MapLibre/deck.gl installation as unfinished, even though those packages are already installed. This file is now the implementation source of truth.

```text
Phase 0   Architecture & Contracts       MOSTLY COMPLETE
Phase 1   UI + Visual Direction            COMPLETE
Phase 2   Map Foundation                  COMPLETE
Phase 3   Deck.gl Visualization             COMPLETE
Phase 4   Mock Operational Data             IN PROGRESS (4.1+4.2 traffic simulation complete)
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

## Status: IN PROGRESS (4.1 + 4.2 deterministic traffic simulation COMPLETE)

### Data

- [x] Realistic vessel dataset (deterministic 80-vessel fleet, 6 types, seeded)
- [x] Multiple vessel types (tanker / cargo / container / fishing / patrol / other)
- [x] Mock incidents (static scenario data, pre-existing)
- [x] Spill geometry (static scenario data, pre-existing)
- [x] Historical trails (deterministic, per-vessel, 24h span, consumes `VesselTrail`/`PathLayer`)
- [x] Candidate rankings (static scenario data, pre-existing)
- [x] Evidence (static scenario data, pre-existing)
- [x] Environment data (static scenario data, pre-existing)

### Simulation

- [x] Vessel movement (deterministic route-based kinematics, centralized clock, no per-vessel timers)
- [ ] Spill progression
- [ ] Wind/current values (simulated)
- [ ] Timeline generation
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

### Demo scenario

- [ ] Normal traffic
- [ ] Spill detection event
- [ ] Spill appears
- [ ] AIS correlation
- [ ] Candidate ranking
- [ ] Top candidate
- [ ] Trace Source
- [ ] Historical trail
- [ ] Timeline

### Acceptance

- [ ] App feels live in mock mode
- [x] Vessels move smoothly (browser verified)
- [ ] Incident can be discovered and selected
- [x] Scenario is reproducible (seeded + fixed epoch; browser verified)
- [ ] No manual data editing required

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

### Current truth

- Deterministic maritime traffic simulation is implemented, deterministic, and browser verified.
- Mock mode is live: 80 moving vessels with coherent historical trails served through the provider architecture.
- Spill progression, wind/current simulation, timeline generation, and the end-to-end demo scenario remain for later sub-phases.
- Vessel LOD/3D (Phase 5), investigation (Phase 6), timeline/search (Phase 7), and FastAPI integration (Phase 8) remain NOT STARTED.




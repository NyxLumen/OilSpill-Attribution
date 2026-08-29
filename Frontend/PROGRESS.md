# OceanWatch Frontend Progress

**Last updated:** 2026-08-29  
**Primary owner:** Frontend  
**Backend:** FastAPI, owned by backend team

## Current Status

**Current phase: Phase 2 — Map Foundation**  
**Overall: Foundation and initial UI/visual direction complete. Real map integration is next.**

The previous tracker was inconsistent: it called the UI redesign Phase 1.2 while also listing MapLibre/deck.gl installation as unfinished, even though those packages are already installed. This file is now the implementation source of truth.

```text
Phase 0   Architecture & Contracts       MOSTLY COMPLETE
Phase 1   UI + Visual Direction            COMPLETE
Phase 2   Map Foundation                  NEXT
Phase 3   Deck.gl Visualization             NOT STARTED
Phase 4   Mock Operational Data             NOT STARTED
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

## Status: NEXT

### Dependencies

Already installed in the project:

- [x] `maplibre-gl`
- [x] `react-map-gl`
- [x] `@deck.gl/core`
- [x] `@deck.gl/layers`
- [x] `@deck.gl/mapbox`

**Do not reinstall these packages.**

### Map

- [ ] Create real MapLibre map
- [ ] Replace placeholder map
- [ ] Set initial Arabian Sea viewport
- [ ] Add basemap
- [ ] Establish custom maritime map style
- [ ] Ocean styling
- [ ] Land styling
- [ ] Coastlines
- [ ] Geographic labels
- [ ] Borders where useful
- [ ] Terrain/bathymetry where useful

### Controls

- [ ] Zoom in/out
- [ ] Compass/reset bearing
- [ ] Reset/fly-to location
- [ ] Fullscreen
- [ ] 3D/pitch toggle

### State/performance

- [ ] Map → MapStore viewport synchronization
- [ ] MapStore → map synchronization
- [ ] Prevent update loops
- [ ] Avoid React render storms during movement
- [ ] Preserve viewport where appropriate

### Acceptance

- [ ] Real interactive map renders
- [ ] Map visually approaches reference
- [ ] Pan/zoom/rotate/pitch work
- [ ] Controls work
- [ ] UI floats correctly over map
- [ ] No obvious navigation stutter

---

# Phase 3 — Deck.gl Visualization Engine

## Status: NOT STARTED

- [ ] Deck overlay
- [ ] Central layer construction system
- [ ] Layer visibility integration
- [ ] Vessel clustering
- [ ] Vessel 2D layer
- [ ] Heading indicators
- [ ] Vessel picking
- [ ] Spill polygon
- [ ] Spill boundary
- [ ] Spill origin
- [ ] Vessel trails
- [ ] Investigation path
- [ ] Shipping lanes
- [ ] EEZ
- [ ] Wind placeholder
- [ ] Current placeholder
- [ ] Hover state
- [ ] Click/selection state
- [ ] Map ↔ panel synchronization

### Acceptance

- [ ] Each layer toggles independently
- [ ] Map entities can be selected
- [ ] Layer state persists correctly
- [ ] No DOM marker per vessel

---

# Phase 4 — Mock Operational Data

## Status: NOT STARTED

### Data

- [ ] Realistic vessel dataset
- [ ] Multiple vessel types
- [ ] Mock incidents
- [ ] Spill geometry
- [ ] Historical trails
- [ ] Candidate rankings
- [ ] Evidence
- [ ] Environment data

### Simulation

- [ ] Vessel movement
- [ ] Spill progression
- [ ] Wind/current values
- [ ] Timeline generation
- [ ] Deterministic scenario runner

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
- [ ] Vessels move smoothly
- [ ] Incident can be discovered and selected
- [ ] Scenario is reproducible
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

- MapLibre/deck.gl packages are already installed.
- The actual map is still a placeholder.
- Core operational mock visualization is not complete.
- 3D vessel visualization is not implemented.
- FastAPI is not integrated end-to-end.
- Final visual polish is intentionally deferred until real map/data layers exist.

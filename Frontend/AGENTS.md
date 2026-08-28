# OceanWatch Frontend Agent Instructions

## Purpose

This document defines how AI coding agents must work on the OceanWatch
frontend.

The objective is to produce a maintainable, high-performance, polished
maritime intelligence dashboard rather than a pile of generated
components that happen to compile.

------------------------------------------------------------------------

# 1. Read Before Coding

Before making changes, read:

1.  `PRD.md`
2.  `PROGRESS.md`
3.  `AGENTS.md`

Do not begin implementation from the user's latest message alone.

The PRD is the product source of truth.

The progress file is the implementation source of truth.

This file defines agent behavior and engineering rules.

------------------------------------------------------------------------

# 2. Core Mission

Build a desktop-first OceanWatch maritime intelligence dashboard with:

-   custom map styling
-   MapLibre geography
-   deck.gl visualization
-   efficient vessel rendering
-   selective 3D ship models
-   oil-spill visualization
-   vessel trails
-   investigation mode
-   candidate attribution
-   timeline playback
-   mock data
-   FastAPI integration

The frontend must be fully usable in mock mode before backend
integration.

------------------------------------------------------------------------

# 3. Non-Negotiable Architecture Rule

## Never couple UI components directly to FastAPI.

Bad:

``` ts
function VesselPanel() {
  const data = await fetch("/api/vessels");
}
```

Good:

``` text
Component
   ↓
Feature/service
   ↓
OceanWatchDataProvider
   ↓
MockDataProvider / ApiDataProvider
```

Components consume domain models, not backend response shapes.

------------------------------------------------------------------------

# 4. Data Provider Rule

The frontend owns:

``` ts
interface OceanWatchDataProvider
```

Implement:

``` text
MockDataProvider
ApiDataProvider
```

The mock provider is not temporary throwaway code.

It is a permanent development and demo capability.

Do not delete mock mode after backend integration.

------------------------------------------------------------------------

# 5. TypeScript Rules

-   Use strict TypeScript.
-   Avoid `any`.
-   Prefer explicit domain types.
-   Validate external data with Zod.
-   Keep API types separate from domain types when their structures
    differ.
-   Do not spread unknown backend payloads directly into UI objects.
-   Use discriminated unions for known variants.

Bad:

``` ts
const vessel: any = response;
```

Good:

``` ts
const vessel = VesselSchema.parse(response);
```

------------------------------------------------------------------------

# 6. State Management Rules

Use:

### Zustand

For:

-   selected vessel
-   selected incident
-   active panel
-   map UI state
-   layer visibility
-   investigation mode
-   timeline position

### TanStack Query

For:

-   API/server data
-   caching
-   loading
-   errors
-   refetching

Do not duplicate server data unnecessarily into Zustand.

Do not use React Context as a giant global state container.

------------------------------------------------------------------------

# 7. Map Architecture Rules

MapLibre owns:

-   geography
-   basemap
-   labels
-   terrain/bathymetry
-   static cartographic layers

deck.gl owns:

-   vessels
-   trails
-   spills
-   analytical overlays
-   environmental visualization
-   high-volume dynamic data

Do not implement thousands of vessel markers as DOM elements.

Use deck.gl.

------------------------------------------------------------------------

# 8. Vessel Rendering Rules

## Never render every vessel as a detailed 3D model.

Use:

``` text
far away → cluster/icon
medium → 2D silhouette
near/relevant → 3D
selected → highest detail
```

High-detail rendering is reserved for useful entities.

A vessel should receive high-detail treatment when:

-   selected
-   hovered
-   a candidate
-   near an active incident
-   explicitly requested by investigation mode

------------------------------------------------------------------------

# 9. 3D Asset Rules

Use a shared model registry.

Example:

``` text
tanker.glb
cargo.glb
container.glb
fishing.glb
patrol.glb
```

Never create/download a unique 3D asset per vessel.

Models must:

-   be reusable
-   be optimized
-   be cached
-   be lazy-loaded when possible
-   have reasonable polygon counts
-   avoid unnecessary 4K textures
-   preserve recognizable silhouettes

Visual quality matters, but polygon-count theater is not a feature.

------------------------------------------------------------------------

# 10. Performance Rules

Performance is a product requirement.

## Avoid

-   DOM marker per vessel
-   React state update for every vessel every animation frame
-   rebuilding huge arrays on every render
-   unnecessary layer recreation
-   unnecessary picking
-   unique model loading per vessel
-   sending the whole AIS dataset to the browser
-   rendering off-screen/high-detail entities unnecessarily

## Prefer

-   deck.gl GPU layers
-   stable data references
-   memoization
-   viewport-aware queries
-   vector tiles for sufficiently large datasets
-   server-side filtering
-   LOD
-   model caching
-   selective picking
-   interpolation
-   incremental updates

------------------------------------------------------------------------

# 11. Data Volume Strategy

When dealing with large AIS data:

``` text
Backend dataset
     ↓
viewport/bbox/tile query
     ↓
browser-visible subset
     ↓
deck.gl
     ↓
LOD
     ↓
GPU
```

Do not solve a server-data-volume problem entirely in the browser.

If the frontend asks for an entire country's worth of AIS traffic just
to display a 500 km section of ocean, the architecture has already
failed.

------------------------------------------------------------------------

# 12. React Performance Rules

Do not put high-frequency map data in React state unless it genuinely
needs to affect React UI.

Map movement, vessel animation, and high-volume visualization should
stay in the map/deck.gl layer.

Use:

-   `useMemo`
-   `useCallback`
-   stable objects
-   stable layer configuration
-   targeted Zustand selectors

Avoid broad selectors that cause the entire application to re-render.

------------------------------------------------------------------------

# 13. deck.gl Rules

Use the simplest layer that solves the problem.

Examples:

``` text
IconLayer
PathLayer
PolygonLayer
ScatterplotLayer
ScenegraphLayer
```

Use custom layers only when necessary.

Use GPU filtering/extensions where they materially improve performance.

Do not add a complicated custom WebGL implementation just because it
sounds impressive.

------------------------------------------------------------------------

# 14. Picking / Interaction

Only interactive layers should be pickable.

For example:

``` text
Vessels       → pickable
Incidents     → pickable
Trails        → selectively pickable

Wind          → generally not pickable
Current       → generally not pickable
Background    → not pickable
```

Hover behavior should be lightweight.

Clicking a vessel should update centralized selection state.

------------------------------------------------------------------------

# 15. Map Style Rules

The map should visually resemble the supplied reference.

Target:

-   blue/cyan ocean
-   pale land
-   subtle geographic relief
-   restrained labels
-   clean maritime aesthetic
-   strong visual hierarchy
-   data overlays that remain legible

Do not turn the map into a rainbow GIS dashboard.

Color is reserved for meaning.

------------------------------------------------------------------------

# 16. UI Rules

The UI should use a consistent design system.

Preferred characteristics:

-   glass/translucent panels
-   large rounded corners
-   subtle borders
-   soft shadows
-   dark navy text
-   restrained blue accents
-   green live indicator
-   warning colors only when semantically necessary

Do not introduce random gradients, excessive neon, or unrelated
component styles.

------------------------------------------------------------------------

# 17. Component Rules

Components should have one primary responsibility.

Prefer:

``` text
IncidentPanel
IncidentTimeline
CandidateList
VesselDetails
LayerPanel
```

over:

``` text
MassiveDashboardComponent.tsx
```

Avoid files becoming giant monoliths.

If a component becomes difficult to reason about, split it by
responsibility.

------------------------------------------------------------------------

# 18. Feature Boundaries

Organize behavior around features:

``` text
incidents
vessels
tracking
analysis
environment
```

Shared visual primitives belong in common/components.

Do not create deep abstractions before a real reuse case exists.

------------------------------------------------------------------------

# 19. API Rules

FastAPI integration must happen through the API provider.

Recommended shape:

``` text
api/
├── client.ts
├── provider.ts
├── apiProvider.ts
├── mockProvider.ts
├── vessels.ts
├── incidents.ts
└── environment.ts
```

API client responsibilities:

-   base URL
-   HTTP transport
-   headers
-   request handling

Feature API modules:

-   endpoint-specific requests

Provider:

-   converts API results into domain models

UI:

-   knows none of these implementation details.

------------------------------------------------------------------------

# 20. Backend Contract Changes

If backend response shapes change:

1.  Update API types.
2.  Update Zod schema.
3.  Update adapter mapping.
4.  Do not immediately rewrite UI components.
5.  Run typecheck/tests.
6.  Update documentation if the contract genuinely changed.

The provider boundary exists specifically to absorb backend changes.

------------------------------------------------------------------------

# 21. Mock Data Rules

Mock data must be plausible.

Use:

-   realistic vessel types
-   realistic headings
-   realistic speed ranges
-   geographic consistency
-   deterministic incidents
-   meaningful trails
-   candidate ranking that matches visible evidence

Do not generate nonsense such as a vessel teleporting 400 km between
adjacent timestamps.

------------------------------------------------------------------------

# 22. Demo Scenario Rules

The demo scenario must be deterministic.

Preferred flow:

``` text
NORMAL TRAFFIC
      ↓
SATELLITE DETECTION
      ↓
SPILL APPEARS
      ↓
INCIDENT ALERT
      ↓
TRACE SOURCE
      ↓
AIS CORRELATION
      ↓
CANDIDATE RANKING
      ↓
TOP VESSEL
      ↓
TRAIL
      ↓
TIMELINE
```

The scenario should be runnable repeatedly without editing source code.

------------------------------------------------------------------------

# 23. Investigation UX Rules

The user must understand why a vessel is a candidate.

Do not display:

``` text
91% MATCH
```

without supporting information.

Prefer:

``` text
91% MATCH

Temporal correlation   94%
Route correlation      89%
Behavior correlation   91%
Distance                42 km
```

and visualize the relevant trail on the map.

------------------------------------------------------------------------

# 24. Timeline Rules

Timeline state should not force the entire application to rerender.

Playback should update visualization data efficiently.

Use interpolation for smooth visual movement where appropriate.

The timeline should make the investigation understandable rather than
merely being a decorative slider.

------------------------------------------------------------------------

# 25. Error Handling

Every async operation needs:

-   loading state
-   success state
-   empty state
-   error state

Do not leave blank panels when a request fails.

Do not swallow errors silently.

Log useful development information without exposing secrets.

------------------------------------------------------------------------

# 26. Accessibility

All controls must have:

-   keyboard access
-   focus states
-   accessible labels
-   semantic elements where practical

Icon-only buttons require labels/tooltips.

Do not rely solely on color to communicate status.

------------------------------------------------------------------------

# 27. Testing Rules

Before marking a feature complete:

1.  Run typecheck.
2.  Run lint.
3.  Run relevant tests.
4.  Manually test the feature.
5.  Test loading/error/empty states.
6.  Test mock mode.
7.  Test interaction with the map if applicable.
8.  Update `PROGRESS.md`.

For performance-sensitive features:

-   profile realistic data sizes
-   document observed behavior
-   do not claim performance without measurement

------------------------------------------------------------------------

# 28. Progress Tracking

After completing a meaningful task:

Update `PROGRESS.md`.

Use:

``` text
- [x] completed
- [ ] pending
```

Do not mark work complete merely because code was written.

It is complete when the acceptance condition is satisfied.

------------------------------------------------------------------------

# 29. Git / Change Discipline

Keep changes focused.

Good:

``` text
feat(map): add vessel layer
feat(incidents): add incident panel
perf(vessels): add viewport filtering
feat(analysis): add candidate ranking
```

Avoid giant commits mixing:

-   UI
-   backend integration
-   refactoring
-   unrelated formatting
-   model assets

------------------------------------------------------------------------

# 30. Dependency Discipline

Before adding a package, ask:

1.  Is the functionality genuinely needed?
2.  Does the selected stack already provide it?
3.  Is the dependency maintained?
4.  Does it significantly increase bundle size?
5.  Can the requirement be implemented simply without it?

Do not add libraries for trivial helpers.

------------------------------------------------------------------------

# 31. Visual QA

For major UI work, inspect the result visually.

Check:

-   spacing
-   panel proportions
-   typography
-   icon alignment
-   map hierarchy
-   contrast
-   overflow
-   hover states
-   selected states
-   animation
-   responsiveness

The reference screenshot is a visual target, not a suggestion to vaguely
resemble it.

------------------------------------------------------------------------

# 32. Do Not Over-Engineer

Do not build:

-   an elaborate plugin architecture
-   a generic component framework
-   a custom state library
-   a full GIS engine
-   a custom renderer for things deck.gl already handles
-   speculative backend abstractions
-   enterprise-scale infrastructure

Build the smallest architecture that supports the actual product.

------------------------------------------------------------------------

# 33. Do Not Under-Engineer

Also do not:

-   hardcode backend responses into components
-   use DOM markers for thousands of vessels
-   throw all state into one store
-   make one 3,000-line dashboard component
-   make every feature depend on mock JSON imports directly
-   skip error states
-   skip performance testing
-   delete mock mode after integration

------------------------------------------------------------------------

# 34. Priority When Tradeoffs Appear

Use this order:

1.  Correctness
2.  User workflow
3.  Performance
4.  Visual quality
5.  Maintainability
6.  Extra features

A beautiful feature that breaks the core investigation flow is not a
win.

------------------------------------------------------------------------

# 35. When Requirements Are Ambiguous

Do not invent complex behavior.

Choose the simplest behavior consistent with:

-   PRD
-   existing architecture
-   current feature requirements

If a decision affects architecture or backend contracts, document it
before implementing it.

------------------------------------------------------------------------

# 36. Backend Coordination

When a backend contract is required, explicitly document:

-   endpoint
-   query parameters
-   request body
-   response schema
-   pagination/tile behavior
-   timestamp semantics
-   error format

Do not silently assume backend behavior.

------------------------------------------------------------------------

# 37. Environment Variables

Expected examples:

``` text
VITE_API_BASE_URL=
VITE_USE_MOCK_DATA=true
VITE_MAP_STYLE_URL=
```

Never commit secrets.

Use `.env.example`.

------------------------------------------------------------------------

# 38. Definition of an Agent Task

A task should ideally have:

``` text
Goal
Scope
Files/components affected
Acceptance criteria
Verification
Progress update
```

Agents should not quietly expand scope.

------------------------------------------------------------------------

# 39. Recommended Implementation Order

``` text
Phase 0
Architecture + contracts

Phase 1
Core UI

Phase 2
MapLibre

Phase 3
deck.gl

Phase 4
Mock simulation

Phase 5
Vessel LOD + 3D

Phase 6
Incident investigation

Phase 7
Timeline

Phase 8
FastAPI

Phase 9
Performance

Phase 10
SIH polish
```

Do not jump to 3D ships before the base map and visualization
architecture are stable.

Humans have an understandable weakness for shiny boats.

We still need the oil-spill investigation system to work.

------------------------------------------------------------------------

# 40. Final Agent Checklist

Before declaring the frontend complete:

-   [ ] PRD requirements satisfied
-   [ ] Mock mode works
-   [ ] FastAPI mode works
-   [ ] Map resembles reference
-   [ ] deck.gl handles visualization
-   [ ] vessel LOD works
-   [ ] 3D models are reused
-   [ ] viewport/data filtering exists
-   [ ] incident workflow works
-   [ ] attribution workflow works
-   [ ] timeline works
-   [ ] loading/error states work
-   [ ] performance tested
-   [ ] no major TypeScript errors
-   [ ] no major console errors
-   [ ] `PROGRESS.md` updated
-   [ ] no secrets committed
-   [ ] no unnecessary dependencies introduced

------------------------------------------------------------------------

# 41. Guiding Principle

The frontend should make the system's intelligence visible.

A user should be able to look at the map and understand:

``` text
WHAT happened?
WHERE did it happen?
WHEN did it happen?
HOW did it move?
WHICH vessels were nearby?
WHY is this vessel suspicious?
```

The UI is successful when those answers are visually obvious.

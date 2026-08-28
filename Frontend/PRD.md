# OceanWatch Frontend PRD

## 1. Product

**Project:** OceanWatch\
**Context:** Smart India Hackathon 2026, Problem Statement 26143\
**Frontend responsibility:** Complete operational dashboard UI,
interactive map, visualization system, mock-data mode, and integration
boundary for the FastAPI backend.

OceanWatch is a maritime intelligence dashboard for detecting oil spills
from satellite imagery, reconstructing spill movement, correlating the
event with AIS vessel traffic, and ranking likely responsible vessels.

The frontend must make that investigation understandable visually, not
merely expose raw data.

------------------------------------------------------------------------

## 2. Product Goal

Build a polished desktop-first maritime command dashboard in which a
user can:

1.  Observe maritime traffic on an interactive ocean map.
2.  View detected oil spills and their geographic extent.
3.  Inspect environmental conditions such as wind and currents.
4.  Select an incident.
5.  Trace the likely source of the spill.
6.  Inspect historical vessel movement around the incident.
7.  View candidate vessels and attribution scores.
8.  Understand why a vessel was ranked highly.
9.  Replay the incident through time.
10. Transition from fully simulated data to the team's FastAPI backend
    without rewriting the UI.

The visual target is the supplied OceanWatch reference: a premium, calm,
glass-panel intelligence dashboard with a stylized blue ocean map, pale
land, maritime labels, vessel visualization, spill geometry,
investigation trails, and compact information panels.

------------------------------------------------------------------------

# 3. Core Product Principle

## Build against contracts, not the backend.

The frontend must have a stable domain model and
`OceanWatchDataProvider` interface.

Two implementations must exist:

-   `MockDataProvider`
-   `ApiDataProvider`

Every feature must work against the mock provider before backend
integration.

Switching from mock data to FastAPI should primarily be a configuration
change plus response mapping.

------------------------------------------------------------------------

# 4. Target Users

### Primary

-   Maritime intelligence analyst
-   Environmental monitoring operator
-   Incident investigator
-   Government/agency decision maker

### Secondary

-   SIH judges
-   Demo audience
-   Development team

------------------------------------------------------------------------

# 5. Primary User Journey

``` text
Dashboard
   ↓
Observe map
   ↓
Oil spill detected
   ↓
Select incident
   ↓
Inspect spill area and confidence
   ↓
Trace source
   ↓
Review vessel traffic
   ↓
Rank candidate vessels
   ↓
Select top candidate
   ↓
Inspect historical trail + evidence
   ↓
Replay timeline
   ↓
Generate/inspect investigation result
```

This journey is the central UX narrative of the application.

------------------------------------------------------------------------

# 6. UX / Visual Direction

## Reference

The supplied OceanWatch screenshot is the primary visual reference.

### Visual characteristics

-   Large map-first canvas
-   Blue/cyan ocean
-   Pale cream/green land
-   Subtle terrain/bathymetry
-   Minimal geographic labels
-   White translucent glass panels
-   Strong rounded corners
-   Soft shadows
-   Dark navy typography
-   Blue accent states
-   Green live indicator
-   Restrained red/orange for warnings
-   Clean Lucide-style icons
-   Dense information without visual clutter

### Design rule

The map is visually dominant.

The surrounding UI should frame the map rather than compete with it.

------------------------------------------------------------------------

# 7. Technology Stack

## Application

-   React
-   TypeScript
-   Vite

## Styling

-   Tailwind CSS
-   shadcn/ui
-   CSS variables/design tokens

## State

-   Zustand for client/application state
-   TanStack Query for server state/cache

## Validation

-   Zod

## Mapping

-   MapLibre GL JS for basemap/geography
-   deck.gl for high-volume visualization

## Geospatial utilities

-   Turf.js

## Animation

-   Framer Motion
-   deck.gl/GPU animation where appropriate

## Visualization

-   deck.gl layers
-   Recharts for non-map analytical charts where needed

## Backend

-   FastAPI

------------------------------------------------------------------------

# 8. High-Level Architecture

``` text
                         OceanWatch Frontend
                                  |
             +--------------------+--------------------+
             |                    |                    |
          App Shell           Map Engine          Feature UI
             |                    |                    |
             |              +-----+------+             |
             |              |            |             |
             |          MapLibre      deck.gl          |
             |              |            |             |
             |              |      Visualization       |
             |              |       Layers              |
             |              |            |              |
             +--------------+------------+--------------+
                            |
                       State / Services
                            |
                    OceanWatchDataProvider
                            |
                 +----------+----------+
                 |                     |
          MockDataProvider       ApiDataProvider
                 |                     |
          Simulation engine         FastAPI
```

------------------------------------------------------------------------

# 9. Repository Architecture

Recommended structure:

``` text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── layout/
│   ├── map/
│   ├── incidents/
│   ├── vessels/
│   ├── analysis/
│   ├── environment/
│   └── common/
│
├── features/
│   ├── incidents/
│   ├── vessels/
│   ├── tracking/
│   ├── analysis/
│   └── environment/
│
├── map/
│   ├── OceanMap.tsx
│   ├── MapController.ts
│   ├── MapStyle.ts
│   ├── ViewportManager.ts
│   ├── LODManager.ts
│   ├── VesselVisualizationManager.ts
│   ├── ModelRegistry.ts
│   └── layers/
│
├── api/
│   ├── client.ts
│   ├── provider.ts
│   ├── mockProvider.ts
│   ├── apiProvider.ts
│   ├── vessels.ts
│   ├── incidents.ts
│   ├── environment.ts
│   └── websocket.ts
│
├── simulation/
│   ├── VesselSimulator.ts
│   ├── IncidentSimulator.ts
│   ├── EnvironmentSimulator.ts
│   └── ScenarioRunner.ts
│
├── data/
│   └── mock/
│
├── store/
│   ├── mapStore.ts
│   ├── uiStore.ts
│   └── incidentStore.ts
│
├── types/
│   ├── vessel.ts
│   ├── incident.ts
│   ├── environment.ts
│   ├── map.ts
│   └── api.ts
│
├── lib/
│   ├── geo.ts
│   ├── format.ts
│   └── constants.ts
│
└── styles/
    └── globals.css
```

------------------------------------------------------------------------

# 10. Core Domain Models

## Vessel

``` ts
interface Vessel {
  id: string;
  imo: string;
  name: string;
  type: "tanker" | "cargo" | "container" | "fishing" | "patrol" | "other";
  position: {
    lat: number;
    lng: number;
  };
  heading: number;
  speed: number;
  lastUpdated: string;
  status: "active" | "stopped" | "unknown";
  modelType?: string;
}
```

## Vessel Trail

``` ts
interface VesselTrail {
  vesselId: string;
  points: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  }>;
}
```

## Incident

``` ts
interface OilSpillIncident {
  id: string;
  detectedAt: string;
  location: {
    lat: number;
    lng: number;
  };
  areaKm2: number;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  source: "sar" | "optical" | "combined";
  status: "detected" | "investigating" | "attributed" | "resolved";
  geometry?: unknown;
}
```

## Candidate Vessel

``` ts
interface SuspectVessel {
  vesselId: string;
  matchScore: number;
  distanceFromOriginKm: number;
  temporalCorrelation: number;
  behavioralCorrelation: number;
  routeCorrelation: number;
  evidence: Evidence[];
}
```

## Environment

``` ts
interface OceanConditions {
  wind: {
    speed: number;
    direction: number;
  };
  current: {
    speed: number;
    direction: number;
  };
  timestamp: string;
}
```

------------------------------------------------------------------------

# 11. Data Provider Contract

``` ts
interface OceanWatchDataProvider {
  getVessels(params?: VesselQuery): Promise<Vessel[]>;
  getVessel(id: string): Promise<Vessel>;
  getVesselTrail(id: string, params?: TrailQuery): Promise<VesselTrail>;

  getIncidents(): Promise<OilSpillIncident[]>;
  getIncident(id: string): Promise<OilSpillIncident>;
  getCandidates(incidentId: string): Promise<SuspectVessel[]>;

  getTimeline(incidentId: string): Promise<TimelineEvent[]>;

  getEnvironment(location: GeoPoint): Promise<OceanConditions>;
}
```

The interface is owned by the frontend.

Backend responses must be mapped into this domain model.

------------------------------------------------------------------------

# 12. Core UI

## Top Bar

Contains:

-   OceanWatch branding
-   Search input
-   Current timestamp
-   LIVE indicator
-   Notifications button

## Primary Navigation

Sections:

-   Map
-   Incidents
-   Vessels
-   Analysis
-   Environment
-   Reports

## Map Layer Panel

Toggle:

-   Vessels
-   Vessel Trails
-   Oil Spills
-   Ocean Currents
-   Wind Flow
-   EEZ Boundaries
-   Shipping Lanes

## Right Information Panel

Context-dependent:

-   Incident details
-   Vessel details
-   Candidate ranking
-   Analysis
-   Environment

## Bottom Status Bar

Display:

-   Vessel count
-   Active spills
-   Alerts
-   Current location/region
-   Wind
-   Current

------------------------------------------------------------------------

# 13. Map Architecture

## MapLibre responsibility

MapLibre owns:

-   Basemap
-   Ocean
-   Land
-   Coastlines
-   Geographic labels
-   Borders
-   Terrain/bathymetry where available
-   Base maritime geography

## deck.gl responsibility

deck.gl owns:

-   Vessel visualization
-   Vessel trails
-   Spill polygons
-   Spill boundaries
-   Investigation paths
-   Wind/current overlays
-   Dynamic analytical overlays
-   High-volume geographic datasets

------------------------------------------------------------------------

# 14. Deck.gl Layers

Expected layer system:

``` text
VesselClusterLayer
VesselIconLayer
VesselScenegraphLayer

VesselTrailLayer

SpillPolygonLayer
SpillBoundaryLayer
SpillOriginLayer

InvestigationPathLayer

WindLayer
CurrentLayer

ShippingLaneLayer
EEZLayer

AnnotationLayer
```

Layers should be independently toggleable.

------------------------------------------------------------------------

# 15. Vessel Visualization System

## Goal

Render maritime traffic attractively without making the browser regret
its career choices.

## Model library

Use a small shared library of optimized GLB/glTF assets:

``` text
tanker.glb
cargo.glb
container.glb
fishing.glb
patrol.glb
```

Do not download or maintain a unique model for every vessel.

Models should be:

-   low/medium poly
-   optimized
-   small in file size
-   visually recognizable
-   reusable through instancing

------------------------------------------------------------------------

# 16. Vessel LOD

LOD is based on both zoom and relevance.

### LOD 0

Zoomed out:

-   clusters
-   tiny dots/icons
-   no labels
-   no 3D

### LOD 1

Operational zoom:

-   2D vessel silhouette/icon
-   heading indicator
-   selective labels

### LOD 2

Investigation zoom:

-   3D models
-   detailed selected vessel
-   highlighted suspect vessels

### Relevance override

Force high detail for:

-   selected vessel
-   top candidate
-   hovered vessel
-   vessels near active incident
-   vessels participating in an investigation

A normal world view may contain hundreds/thousands of vessels, but only
a small subset receives expensive 3D treatment.

------------------------------------------------------------------------

# 17. Vessel Performance Architecture

## Dataset culling

Prefer server-side viewport filtering:

``` text
World AIS dataset
      ↓
FastAPI bbox/tile query
      ↓
Only visible geographic region
      ↓
Browser
      ↓
deck.gl viewport rendering
```

Potential API:

``` text
GET /api/v1/vessels
  ?bbox=minLng,minLat,maxLng,maxLat
  &zoom=8
  &timestamp=...
```

For larger datasets, support vector tiles or equivalent geographic
tiling.

## Client-side culling

Use viewport bounds to avoid maintaining/rendering irrelevant
visualization state.

## GPU rendering

Use deck.gl layers instead of DOM markers for large datasets.

## Stable data references

Avoid rebuilding large vessel arrays every React render.

Use memoization and controlled updates.

## Picking

Only enable interaction on layers that need it.

## Updates

Do not animate every vessel through React state.

Use GPU-friendly deck.gl updates and interpolation.

------------------------------------------------------------------------

# 18. Real-Time Architecture

Initial architecture:

``` text
FastAPI REST
   ↓
TanStack Query
   ↓
Frontend
```

Future real-time layer:

``` text
FastAPI
   ↓
WebSocket/SSE
   ↓
Incremental vessel position updates
   ↓
Visualization state
```

Do not send full vessel datasets repeatedly.

Only send changed positions/events when real-time transport is
introduced.

------------------------------------------------------------------------

# 19. Mock Data System

Mock mode must simulate a plausible investigation.

## Components

-   Vessel generator
-   Vessel movement simulator
-   Trail generator
-   Incident generator
-   Spill geometry
-   Candidate scoring mock
-   Wind/current generator
-   Timeline
-   Scenario runner

## Demo scenario

``` text
Normal traffic
    ↓
Satellite imagery received
    ↓
Oil spill detected
    ↓
Spill appears on map
    ↓
AIS traffic correlated
    ↓
Candidate vessels ranked
    ↓
Top candidate selected
    ↓
Trace source
    ↓
Historical trail displayed
    ↓
Timeline replay
```

The mock system should be deterministic enough for demos.

------------------------------------------------------------------------

# 20. Investigation Mode

Normal mode emphasizes awareness.

Investigation mode emphasizes reasoning.

When `Trace Source` is activated:

-   dim unrelated visual layers
-   highlight spill
-   show spill origin
-   show historical vessel paths
-   show candidate vessels
-   show predicted drift
-   show selected vessel
-   open analysis panel
-   enable timeline controls

The map should visually explain the attribution chain.

------------------------------------------------------------------------

# 21. Timeline / Playback

Timeline controls:

``` text
[ Previous ] [ Play ] [ Next ]

12:00 ───────── 14:00 ───────── 16:00 ───────── 18:00
```

Timeline changes can update:

-   vessel positions
-   trails
-   spill geometry
-   environmental conditions
-   incident events

Playback must be smooth but does not need true 60 FPS data updates.

Interpolate positions visually between real data samples.

------------------------------------------------------------------------

# 22. Search

Global search should eventually support:

-   vessel name
-   IMO number
-   incident ID
-   location
-   incident type

Search result selection should:

-   fly map to location
-   select entity
-   open appropriate panel

------------------------------------------------------------------------

# 23. Incidents

Incident list should show:

-   ID
-   detection time
-   location
-   area
-   confidence
-   severity
-   status

Incident detail should show:

-   detection metadata
-   source imagery type
-   spill geometry
-   confidence
-   environmental context
-   candidate vessels
-   investigation timeline

------------------------------------------------------------------------

# 24. Vessel Details

Display:

-   vessel name
-   IMO
-   vessel type
-   current location
-   speed
-   heading
-   status
-   historical trail
-   incident associations
-   attribution evidence where applicable

------------------------------------------------------------------------

# 25. Analysis

Candidate ranking should expose:

-   overall match
-   temporal correlation
-   route correlation
-   behavioral correlation
-   distance
-   supporting evidence

Avoid presenting a single mysterious percentage without explanation.

------------------------------------------------------------------------

# 26. Reports

Reports are a secondary feature.

Initial version:

-   incident summary
-   candidate vessel
-   confidence
-   evidence summary
-   map snapshot/summary

Do not build a complex document editor until core investigation works.

------------------------------------------------------------------------

# 27. Routing

Recommended routes:

``` text
/
  redirect to /map

/map

/incidents
/incidents/:id

/vessels
/vessels/:id

/analysis

/environment

/reports
```

Map state may persist across navigation.

------------------------------------------------------------------------

# 28. Performance Budget

Target desktop development environment:

-   Smooth map interaction
-   No React re-render storm during vessel movement
-   No DOM element per vessel
-   No unique 3D asset per vessel
-   Avoid rendering high-detail 3D outside relevant viewport
-   Keep initial JS/assets reasonable
-   Lazy-load heavy 3D/model resources
-   Cache model assets
-   Avoid unnecessary network requests
-   Prefer viewport/tile queries for large data

Performance testing must include at least:

1.  100 vessels
2.  1,000 vessels
3.  5,000 vessels
4.  large historical trail dataset
5.  multiple simultaneous visualization layers

Exact maximum capacity should be measured, not guessed.

------------------------------------------------------------------------

# 29. Accessibility

Minimum requirements:

-   keyboard-accessible controls
-   visible focus states
-   semantic buttons
-   readable contrast
-   labels/tooltips for icon-only controls
-   reduced-motion consideration
-   non-color-only status indicators

------------------------------------------------------------------------

# 30. Responsive Strategy

Primary target is desktop/laptop because this is an operational
dashboard and SIH demo.

Tablet support is secondary.

Mobile should not drive architectural decisions.

------------------------------------------------------------------------

# 31. Error / Loading States

Every remote feature needs:

### Loading

Skeletons/spinners or map loading indicators.

### Empty

Example:

> No active incidents detected.

### Error

Example:

> Unable to retrieve vessel data.

Provide retry where meaningful.

------------------------------------------------------------------------

# 32. Backend Integration Contract

Minimum backend endpoints expected:

``` text
GET /api/v1/vessels
GET /api/v1/vessels/{id}
GET /api/v1/vessels/{id}/trail

GET /api/v1/incidents
GET /api/v1/incidents/{id}
GET /api/v1/incidents/{id}/candidates
GET /api/v1/incidents/{id}/timeline

GET /api/v1/environment
GET /api/v1/environment/wind
GET /api/v1/environment/current
```

Future/optional:

``` text
GET /api/v1/map/tiles/{z}/{x}/{y}
WS  /api/v1/ws/vessels
```

Backend team can implement different internal endpoints if the frontend
adapter can map them cleanly.

------------------------------------------------------------------------

# 33. Security

-   Do not place secrets in frontend source.
-   Use environment variables only for public configuration.
-   Do not commit API credentials.
-   Validate external API responses.
-   Handle authentication only if the backend requires it.
-   Never trust backend payloads blindly.

------------------------------------------------------------------------

# 34. Testing Strategy

## Unit

Test:

-   data transformations
-   geo calculations
-   LOD decisions
-   formatters
-   simulation logic

## Component

Test:

-   panels
-   cards
-   controls
-   search
-   state transitions

## Integration

Test:

-   selecting incident
-   tracing source
-   selecting vessel
-   timeline playback
-   mock provider → UI

## Backend integration

Test:

-   FastAPI responses
-   schema validation
-   error handling
-   empty datasets
-   slow requests

## Visual QA

Compare major UI states against the reference design.

------------------------------------------------------------------------

# 35. Definition of Done

The frontend is considered complete when:

-   App shell matches the intended visual language.
-   Map resembles the supplied OceanWatch reference.
-   Map layers work independently.
-   Mock data powers the entire application.
-   Vessels render efficiently.
-   3D models are used selectively.
-   Oil spills render as meaningful geographic geometry.
-   Incident selection works.
-   Trace Source works.
-   Candidate ranking works.
-   Vessel trails work.
-   Timeline works.
-   Search works.
-   Loading/error states exist.
-   FastAPI adapter works.
-   Mock mode remains available.
-   No major console errors exist.
-   Performance has been tested with realistic dataset sizes.
-   SIH demo scenario can be run from start to finish.

------------------------------------------------------------------------

# 36. Non-Goals

Do not prioritize:

-   mobile-first UI
-   user profile systems
-   complex authentication
-   elaborate report editor
-   full GIS editing suite
-   photorealistic ship simulation
-   real ocean physics
-   unnecessary 3D effects
-   backend/database implementation owned by other teammates

------------------------------------------------------------------------

# 37. Priority

### P0

-   App shell
-   Map
-   Vessel layer
-   Oil spill layer
-   Incident panel
-   Mock data
-   Data contracts
-   FastAPI adapter boundary

### P1

-   Vessel trails
-   Attribution
-   Candidate ranking
-   Investigation mode
-   Search
-   Timeline

### P2

-   Wind/current visualization
-   Advanced environment screens
-   Reports
-   3D polish
-   advanced animation

### P3

-   optional real-time WebSocket
-   vector tile optimization
-   advanced analytics
-   extra visual effects

------------------------------------------------------------------------

# 38. Product North Star

A judge should be able to look at the screen and understand:

> "An oil spill has been detected here. The system can reconstruct where
> it came from, correlate that movement with AIS traffic, and visually
> explain why this vessel is the strongest candidate."

If the UI accomplishes that without requiring someone to explain every
button, the frontend has done its job.

# OceanWatch Frontend Progress

## Project Status

**Current phase:** Phase 0 --- Architecture & contracts\
**Overall status:** Planning complete, implementation not started\
**Primary owner:** Frontend\
**Backend:** FastAPI, owned by backend team

------------------------------------------------------------------------

# Phase 0 --- Architecture & Contracts

## Status: NOT STARTED

### Architecture

-   [ ] Create React + TypeScript + Vite project
-   [ ] Configure Tailwind
-   [ ] Configure shadcn/ui
-   [ ] Configure path aliases
-   [ ] Configure ESLint/formatter
-   [ ] Establish environment variables
-   [ ] Create application shell
-   [ ] Establish feature folder structure

### Domain models

-   [ ] Vessel type
-   [ ] Vessel trail type
-   [ ] Oil spill incident type
-   [ ] Candidate vessel type
-   [ ] Evidence type
-   [ ] Timeline event type
-   [ ] Environment type
-   [ ] Geo types

### Data layer

-   [ ] Define `OceanWatchDataProvider`
-   [ ] Create mock provider
-   [ ] Create FastAPI provider
-   [ ] Create API client
-   [ ] Add Zod response validation
-   [ ] Add mock/API switching

### Acceptance

-   [ ] App boots successfully
-   [ ] TypeScript passes
-   [ ] Mock provider can return typed data
-   [ ] No UI component directly depends on `fetch`

------------------------------------------------------------------------

# Phase 1 --- Core UI / Design System

## Status: NOT STARTED

-   [ ] Global typography
-   [ ] Color tokens
-   [ ] Spacing tokens
-   [ ] Radius system
-   [ ] Shadows
-   [ ] Glass panel component
-   [ ] Status badge
-   [ ] Confidence bar
-   [ ] Buttons
-   [ ] Tooltips
-   [ ] Top navigation
-   [ ] Side navigation
-   [ ] Layer panel
-   [ ] Right panel shell
-   [ ] Bottom status bar
-   [ ] Search UI
-   [ ] Notification UI

### Acceptance

-   [ ] Desktop shell visually resembles reference
-   [ ] Panels have consistent visual language
-   [ ] Layout works without map functionality

------------------------------------------------------------------------

# Phase 2 --- Map Foundation

## Status: NOT STARTED

-   [ ] Install MapLibre
-   [ ] Install deck.gl
-   [ ] Create MapLibre instance
-   [ ] Create custom map style
-   [ ] Ocean styling
-   [ ] Land styling
-   [ ] Coastlines
-   [ ] Geographic labels
-   [ ] Zoom controls
-   [ ] Location control
-   [ ] 3D/pitch control
-   [ ] Map controller
-   [ ] Viewport manager

### Acceptance

-   [ ] Map visually approaches reference
-   [ ] Navigation works
-   [ ] No React re-render storm during map movement

------------------------------------------------------------------------

# Phase 3 --- Deck.gl Visualization Engine

## Status: NOT STARTED

-   [ ] Deck overlay integration
-   [ ] Vessel layer
-   [ ] Spill polygon layer
-   [ ] Spill origin layer
-   [ ] Trail layer
-   [ ] Investigation path layer
-   [ ] Shipping lane layer
-   [ ] EEZ layer
-   [ ] Wind layer placeholder
-   [ ] Current layer placeholder
-   [ ] Layer visibility state
-   [ ] Hover interaction
-   [ ] Click interaction

### Acceptance

-   [ ] Each layer can be toggled
-   [ ] Selecting a map entity works
-   [ ] Layer state persists correctly

------------------------------------------------------------------------

# Phase 4 --- Mock Operational Data

## Status: NOT STARTED

-   [ ] Mock vessel dataset
-   [ ] Mock incident dataset
-   [ ] Mock trails
-   [ ] Mock candidate rankings
-   [ ] Mock environmental data
-   [ ] Vessel movement simulation
-   [ ] Spill simulation
-   [ ] Timeline generation
-   [ ] Scenario runner

### Acceptance

-   [ ] Application feels live
-   [ ] Vessel movement is smooth
-   [ ] Incident can be discovered and selected
-   [ ] Demo data is deterministic enough to reproduce

------------------------------------------------------------------------

# Phase 5 --- Vessel LOD / 3D

## Status: NOT STARTED

-   [ ] Model registry
-   [ ] Acquire/prepare tanker model
-   [ ] Acquire/prepare cargo model
-   [ ] Acquire/prepare container model
-   [ ] Acquire/prepare fishing vessel model
-   [ ] Optimize GLB assets
-   [ ] Scenegraph layer
-   [ ] LOD manager
-   [ ] Cluster representation
-   [ ] 2D representation
-   [ ] 3D representation
-   [ ] Relevance-based LOD
-   [ ] Lazy model loading
-   [ ] Model caching
-   [ ] Viewport culling
-   [ ] Performance profiling

### Acceptance

-   [ ] Normal traffic does not use unnecessary 3D
-   [ ] Selected vessel can become high-detail
-   [ ] Model assets are reused
-   [ ] 3D remains smooth at realistic traffic levels

------------------------------------------------------------------------

# Phase 6 --- Incident Investigation

## Status: NOT STARTED

-   [ ] Incident selection
-   [ ] Incident panel
-   [ ] Spill geometry
-   [ ] Confidence display
-   [ ] Trace Source action
-   [ ] Investigation mode
-   [ ] Historical vessel trails
-   [ ] Predicted drift path
-   [ ] Candidate vessel visualization
-   [ ] Candidate ranking panel
-   [ ] Vessel details

### Acceptance

-   [ ] User can go from spill → source → candidate → vessel
-   [ ] Map visually communicates attribution
-   [ ] Relevant entities are highlighted

------------------------------------------------------------------------

# Phase 7 --- Timeline / Playback

## Status: NOT STARTED

-   [ ] Timeline component
-   [ ] Timeline state
-   [ ] Play/pause
-   [ ] Previous/next
-   [ ] Time interpolation
-   [ ] Vessel position playback
-   [ ] Trail playback
-   [ ] Spill progression
-   [ ] Environment playback
-   [ ] Event markers

### Acceptance

-   [ ] Investigation can be replayed
-   [ ] Playback is visually smooth
-   [ ] Timeline state does not cause unnecessary full-map rerenders

------------------------------------------------------------------------

# Phase 8 --- FastAPI Integration

## Status: NOT STARTED

-   [ ] Confirm backend API contract
-   [ ] Confirm response schemas
-   [ ] Configure API base URL
-   [ ] Implement API provider
-   [ ] Map backend vessel data
-   [ ] Map backend incident data
-   [ ] Map candidate data
-   [ ] Map trails
-   [ ] Map environment data
-   [ ] Handle API errors
-   [ ] Handle empty responses
-   [ ] Handle loading states
-   [ ] Test slow responses
-   [ ] Keep mock provider functional

### Acceptance

-   [ ] Real backend can replace mock data
-   [ ] Components do not need backend-specific rewrites
-   [ ] Invalid backend payloads fail safely

------------------------------------------------------------------------

# Phase 9 --- Performance / Reliability

## Status: NOT STARTED

-   [ ] Test 100 vessels
-   [ ] Test 1,000 vessels
-   [ ] Test 5,000 vessels
-   [ ] Profile map rendering
-   [ ] Profile data updates
-   [ ] Profile 3D models
-   [ ] Test layer combinations
-   [ ] Reduce unnecessary React renders
-   [ ] Verify picking cost
-   [ ] Verify model caching
-   [ ] Verify lazy loading
-   [ ] Test viewport changes
-   [ ] Test network throttling
-   [ ] Test API failure
-   [ ] Test reconnect behavior if real-time transport exists

### Acceptance

-   [ ] No obvious interaction stutter
-   [ ] No runaway memory growth
-   [ ] Large datasets are handled predictably
-   [ ] Heavy features degrade gracefully

------------------------------------------------------------------------

# Phase 10 --- SIH Demo Polish

## Status: NOT STARTED

-   [ ] Scripted demo scenario
-   [ ] Demo mode toggle
-   [ ] Loading transitions
-   [ ] Incident alert animation
-   [ ] Spill pulse
-   [ ] Vessel selection animation
-   [ ] Investigation transition
-   [ ] Timeline polish
-   [ ] Final typography pass
-   [ ] Final spacing pass
-   [ ] Final icon pass
-   [ ] Empty states
-   [ ] Error states
-   [ ] Final performance test
-   [ ] Final browser test

### Acceptance

A presenter can demonstrate:

``` text
Normal map
  ↓
Spill detected
  ↓
Incident selected
  ↓
Trace source
  ↓
AIS correlation
  ↓
Candidate ranked
  ↓
Top vessel selected
  ↓
Trail inspected
  ↓
Timeline replayed
```

without manually editing data during the presentation.

------------------------------------------------------------------------

# Definition of Complete

The project is ready when:

-   [ ] Mock mode works end-to-end
-   [ ] FastAPI mode works end-to-end
-   [ ] Map resembles reference
-   [ ] Core UI is polished
-   [ ] Vessel LOD works
-   [ ] 3D vessel visualization works
-   [ ] Oil spill investigation works
-   [ ] Attribution works
-   [ ] Timeline works
-   [ ] Performance is measured
-   [ ] Demo scenario is repeatable
-   [ ] No major console errors
-   [ ] No known P0 bugs

------------------------------------------------------------------------

# Change Log

## 2026-08-28

-   Planning completed
-   Final stack selected
-   MapLibre + deck.gl architecture selected
-   FastAPI integration boundary defined
-   Vessel LOD strategy defined
-   Mock provider strategy defined
-   Investigation workflow defined
-   Progress tracking initialized

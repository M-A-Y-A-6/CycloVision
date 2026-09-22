# CycloVision

Front-end-only demo prototype for a YouTube pitch video for **Smart India Hackathon 2026**
(Team Formula 1, Problem Statement **SIH26070**: an AI/ML system for identification, classification
and prediction of tropical cyclone patterns using multi-source satellite data).

## Project brief

- CycloVision is an **Explainable AI Early-Warning System**. Tagline on the first screen:
  **"AI-powered tropical cyclone early-warning system"**.
- It fuses 4 data sources: INSAT-3D/3DR infrared (**IR**), water vapour (**WV**), passive microwave (**MW**),
  and sea surface temperature (**SST**).
- It **identifies** the cyclone, **classifies** its structure using IMD's Dvorak vocabulary
  (Curved Band, Shear, Eye, CDO, Embedded Centre), and **predicts Rapid Intensification (RI**, a wind
  increase of 30 knots or more within 24 hours) 12-24 hours ahead, as a probability spread with an
  uncertainty band, plus an explainable result.

## Demo flow

The whole app is **ONE screen and ONE story**.

**Initial screen:** CycloVision logo and name, tagline, a large satellite/earth monitoring-area visual,
and one button: `[ Simulate Cyclone ]`.

After the click, the story plays stage by stage. **Nothing auto-advances (Phase 10):** each stage below plays
its own animation through to the end and then shows a `[ Continue to <next stage> ]` button; the story moves on
only when that is clicked.

1. **Detect:** "Receiving multi-source satellite observations..." then IR, Water Vapor, Microwave, SST
   each get a tick. Then "Cyclone-like system detected", then `[ Continue to Identification ]`.
2. **Identify:** the satellite image zooms into the storm. "IDENTIFYING CYCLONE". Shows detected center,
   coordinates, movement, confidence, an AI analysis overlay. Then "Cyclone center identified", then
   `[ Continue to Classification ]`.
3. **Classify:** "CLASSIFYING STORM STRUCTURE". Storm image with a Dvorak-aligned structural overlay.
   Then "Structure classified" and "Dvorak-aligned assessment available", then `[ Continue to Prediction ]`.
4. **Predict RI:** "PREDICTING RAPID INTENSIFICATION". An animated 12-24h probability chart is generated
   (the big reveal). Then "RI assessment generated" with the 12-24h forecast window, probability spread,
   and uncertainty band, then `[ Continue to Result ]`.
   - *Decision:* the chart plots the **30 intensity paths** with the **10-90% band**, the **median path**
     and a **dashed +30 kt RI line**. The **12h and 24h probabilities** are number callouts next to the
     chart, computed from how many paths cross the threshold. Do **not** build a separate
     probability-by-hour series.
5. **Result:** "CYCLONE ASSESSMENT COMPLETE" summary card (Current State, Structure, RI Assessment,
   Prediction Window, Evidence) and a button `[ Explore AI Explanation ]`.
6. **Explain** (added after the original brief, in Phase 8): "Why is the RI risk elevated?" Storm image with an
   attention heatmap and a channel switch, a summary sentence written from the top drivers, the ranked drivers as
   bars, and the contribution by data source. Buttons: `[ Back to result ]`.

Controls for retakes (Phase 9): a small `Replay` button in the top bar, only on the Result and Explain screens, goes
back to the initial screen with a clean slate.

**The progress tracker is clickable (Phase 11):** on Detect, Identify, Classify and Predict RI, clicking an
already-finished step jumps back to it and shows its finished result exactly as it looked when it completed —
never replayed. Clicking a step not reached yet shows a "Not processed yet" tooltip and does not navigate. The
Continue button on a revisited step still works, and moving forward again through already-finished territory
shows each one's real result too, never regenerated. Result stays exactly as it was: not a tracker button,
reachable only via Predict RI's Continue.

Video narrative: *"Let's simulate a cyclone and see how CycloVision responds."*

## Rules

- **Frontend only.** All data and AI outputs are synthetic and pre-written (seeded, so identical every
  run). It must feel like a real working system, not a static mockup: things animate, load, and reveal
  step by step.
- **Do not add features that are not listed in this flow.** If something seems missing, ask the user
  instead of building it.
- Show a small **"Synthetic demo data"** chip in the top bar **at all times**.
- Every stage shows **one plain-language sentence** explaining what is happening (the audience is not
  made of meteorologists).
- Use **fictional storm names and coordinates only.**
- **Everything rotates counter-clockwise** (northern-hemisphere cyclone). Every spiral or rotation in the
  app must be counter-clockwise: the logo, the storm imagery, rotating markers, and loading spinners
  (especially on storm visuals). For CSS/framer-motion rotation use negative angles / `animate-spin-ccw`;
  never Tailwind's `animate-spin` (clockwise). Spirals are drawn so that, moving outward, the arm trails
  clockwise. Check this whenever you add a spiral, radar sweep, orbiting marker or spinner.

## Tech stack

Vite + React 19 + TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`, no config file; tokens live in
`src/index.css`), framer-motion, lucide-react, zustand, leaflet + react-leaflet. No router.
Fonts are self-hosted through `@fontsource-variable` (Inter, JetBrains Mono) so the demo works offline.

Commands: `npm run dev` (dev server), `npm run build` (typecheck + production build),
`npm run lint` (oxlint), `npm run preview` (serve the build).

Note: `tsconfig.app.json` sets `erasableSyntaxOnly`, so no `enum`s or constructor parameter properties.

## Folder structure

```
src/
  components/   Reusable UI: Panel, Badge, StatusRow, TopBar, CycloneIcon, MonitoringMap, MapAnchor,
                StormMapOverlays (swirl + detection marker), SatelliteCanvas, CoverSquare, CountUp,
                AnalysisOverlay (scan line, grid, crosshair, uncertainty circle), StructureOverlay (Dvorak
                bands, CDO outline, centre, labels), EnsembleChart (Predict's SVG chart), MiniGauge (RI ring
                gauge), AttentionHeatmap (Explain), TypeText (typewriter), ContinueButton (manual advance to the
                next stage), ProgressTracker (also the back-navigation buttons), StageLayout,
                StoryScreen (tracker + stage host = the story controller)
  stages/       One component per screen: Landing (idle), Detect, Identify, Classify, Predict, Result and
                Explain (+ types.ts, index.ts registry). All stages are real; the placeholders are gone.
  lib/          Pure helpers (cn, logo spiral, mulberry32 random, noise, satellite generator, satelliteWorker +
                satelliteBitmap (off-thread imagery), swirlSize, useBeats, useElementSize, explanationSentence)
  data/         Synthetic, pre-written, seeded data and AI outputs (storm.ts)
  store/        story.ts: zustand story state machine (idle > detect > identify > classify > predict > result > explain;
                `start`, `advance`, `back` (explain to result), `reset` (Replay), `markDone`/`doneStages` and
                `view` (the progress tracker's back-navigation))
  config/       timings.ts (stage durations, per-stage beats, `STAGE_MOTION`, the ONE shared stage transition),
                stages.ts (titles, sentences, tracker steps), map.ts, imagery.ts (image sizes + prewarm list),
                risk.ts (risk level to badge colour), app.ts
  App.tsx       Top bar + Landing or StoryScreen (cross-faded with AnimatePresence)
  main.tsx      Entry point (fonts, leaflet CSS, global CSS)
  index.css     Tailwind import, design tokens (@theme), glow style
```

## Design system

Dark mission-control theme. Use only these tokens (Tailwind classes such as `bg-base`, `text-accent`,
`border-line`):

| Token     | Value     | Use                                   |
| --------- | --------- | ------------------------------------- |
| `base`    | `#0A101C` | Page background                       |
| `panel`   | `#111A2B` | Panels / cards                        |
| `line`    | `#1F2B42` | Borders (default border colour)       |
| `primary` | `#1E90FF` | Primary blue, main button             |
| `accent`  | `#22D3EE` | Cyan accent, active states            |
| `amber`   | `#F59E0B` | Caution, synthetic-data chip          |
| `red`     | `#EF4444` | High risk                             |
| `green`   | `#22C55E` | Success / done ticks                  |
| `ink`     | `#E6EDF7` | Main text (added for legibility)      |
| `muted`   | `#8494B0` | Secondary text (added for legibility) |

- **Never use `text-base`.** Here `base` is the page-background colour token, so `text-base` sets the text
  COLOUR to the background (invisible text), not the font size. Use `text-[1rem]` for 16 px. (Other size names
  such as `text-sm`, `text-lg`, `text-xl` are fine.) Watch for any other utility name that matches a token name.
- **Short windows**: the `short:` variant (defined in `src/index.css`, applies at window heights up to 820 px)
  tightens spacing so a stage still fits without scrolling on small laptops. Every stage must fit with no page
  scrollbar at (exact viewport sizes) 1920x1080, 1920x950, 1440x900, 1440x790, 1366x768 and 1280x720; add `short:`
  classes if a change breaks that. (A headless browser window that is "1366x768" has only about 628 px of viewport
  height; test with an exact viewport, see the Phase 9 entry.)
- **Screen changes all use one transition**: `STAGE_MOTION` in `config/timings.ts` (fade plus slide, 0.4 s). Do not
  write a new one for a new screen. The only different transition is the deliberate cinematic Landing zoom.
- Fonts: **Inter** for text (`font-sans`), **JetBrains Mono** for numbers (`font-mono`, or the `.num`
  helper class which adds tabular figures).
- Components: `Panel` (titled container), `Badge` (tones: neutral, blue, cyan, amber, red, green; sizes `sm` | `lg`),
  `StatusRow` (`status`: `idle` | `active` | `done`; ring, then spinner, then animated tick),
  `TopBar` (logo + name + "Synthetic demo data" chip), `CycloneIcon` (logo spiral).
- `btn-glow` utility class: subtle pulsing blue glow for the main button (respects reduced motion).
- `animate-spin-ccw` utility (defined in `src/index.css`): the only allowed spinner animation, counter-clockwise.
  `animate-sweep-ccw` is the same rotation at 12 s per turn (radar sweep). `step-glow` glows the current
  step in the progress tracker. `animate-pulse-ring` is a slow expanding, fading ring (detection marker);
  alerts in this app are calm: amber, slow fades, never flashing.
- The logo spiral geometry lives in `src/lib/spiral.ts` and is shared by `CycloneIcon` and
  `public/favicon.svg`; if the spiral changes, regenerate the favicon. It is counter-clockwise, like the
  storm imagery.

## Phase log

<!-- Add a short entry at the end of every phase, on request. -->

### Phase 0: Scaffold and design system (done)

- Scaffolded Vite + React + TypeScript with Tailwind CSS v4, framer-motion, lucide-react, zustand,
  leaflet, react-leaflet. Fonts self-hosted (Inter, JetBrains Mono). Leaflet CSS is imported in `main.tsx`.
- Created the folder structure (`components`, `stages`, `lib`, `data`, `store`, `config`) and this file.
- Design tokens in `src/index.css`; components `Panel`, `Badge`, `StatusRow`, `TopBar`, `CycloneIcon`;
  `btn-glow` button style; cyclone-spiral logo and favicon.
- `App.tsx` renders only the top bar (logo, name, "Synthetic demo data" chip) over an empty screen.
  No story content, store, data or Leaflet map has been built yet.
- Verified: `npm run build` and `npm run lint` pass; components checked visually in a headless browser.

### Phase 1: Synthetic storm data and satellite generator (done)

- `src/data/storm.ts`: fictional storm "Meghavi" (BOB-01), 13.4 N 86.9 E, NW at 14 km/h, 94% confidence;
  55 kt, 986 hPa, SST 30.1 C, shear 6 kt (IMD category derived: Severe Cyclonic Storm); Dvorak patterns
  (CDO 71 / Embedded Centre 14 / Curved Band 9 / Eye 4 / Shear 2, T3.5); 30-member hourly ensemble
  (hours 0-24) with median and 10-90% band; RI assessment; ranked explanation drivers and source shares.
  Exports: `storm`, `dvorak`, `ensemble`, `riAssessment`, `riRiskLevel()`, `RI_RISK_LEVELS`,
  `explanation`, `imdCategory()`, `STORM_SEED` (26070).
- Data conventions: probabilities and shares are percent numbers (`...Pct`), driver contributions are signed
  percentage points (`...Pp`), winds are knots (`...Kt`). Risk boundaries: <25 Low, <50 Moderate,
  <=75 Elevated, else High.
- RI numbers are counted from the paths, not typed in: 20/30 gain >= 30 kt by hour 24 (66.7%, Elevated);
  12/30 are "on an RI-consistent pace" at hour 12, meaning a gain of >= 15 kt (40%). Those 12 are a subset
  of the 20. Baseline 9 pp + drivers (+22 +15 +12 +8 +7 -6 = 58 pp) = 67%. A self-check at the bottom of
  `storm.ts` throws on import if any of these stop adding up.
- `src/lib/satellite.ts`: `renderSatellite(canvas, { channel, seed })` for `ir | wv | mw | sst | fused`,
  drawn purely from maths and noise (`lib/noise.ts`, `lib/random.ts`). Use a SQUARE canvas. Same seed gives
  identical pixels. IR has no eye; MW has a closed eyewall ring; the WV dry pocket sits south-west (matches
  the dry-air driver); SST is exactly 30.1 C at the centre.
- `STORM_GEOMETRY` (normalised 0-1, y down, centre always (0.5, 0.5)): `center`, `innerRingRadius` (0.065),
  `bands` (3 polylines), `cdo` (96-point polygon), `hotspots` (2, with radius). Overlays must use these so
  they line up with the image. The image spans roughly 800 km.
- Performance (Node, one-off): about 0.3-0.6 s per channel at 512 px, about 1.4 s at 1024 px. Render once
  ahead of time (offscreen) and reuse; do not re-render during animations.
- Temporary dev page `src/dev/DevSatellite.tsx`: open `/#dev-satellite` (all 5 channels side by side, with a
  "Show geometry" toggle; `/#dev-satellite-geometry` starts with it on). It is wired into `App.tsx` through
  the URL hash. Remove `src/dev/` and the two hash lines in `App.tsx` before recording.
- Verified: build and lint pass; storm data self-check passes; render determinism checked; geometry overlay
  checked against all five channels in a headless browser.
- Follow-ups after review: (1) Phase 4 chart decision recorded in the Demo flow (30 paths + band + median +
  dashed +30 kt line, with 12h/24h probability callouts counted from the paths). (2) Counter-clockwise rule
  added to Rules. The logo spiral and favicon were flipped to counter-clockwise (one sign change in
  `lib/spiral.ts`), the `StatusRow` spinner now uses `animate-spin-ccw`, and the WV outer filaments in the
  satellite generator were changed to the same handedness as the arms.

### Phase 2: Initial screen and story controller (done)

- **Landing** (`stages/Landing.tsx`, stage `idle`): brand + tagline, `MonitoringMap`, glowing `Simulate Cyclone`
  button. `MonitoringMap` is a static (non-interactive) Leaflet map of the North Indian Ocean with a dark
  basemap, a faint lat/lon grid, a fictional oval coverage footprint, range rings and a slow radar sweep
  (12 s per turn, counter-clockwise, clipped to the footprint), plus a "Monitoring area" label. Map framing,
  tile URLs and footprint live in `config/map.ts`.
- **Tiles**: Esri "World Dark Gray" base + reference layers (no API key). CARTO's `basemaps.cartocdn.com`
  tiles were tried first and now draw an "API KEY REQUIRED" watermark, so do not switch back. Tiles need
  internet; if they fail, `errorTileUrl` is transparent and the dark background, grid, footprint and sweep
  remain (tested with the tile host blocked: no console errors, no broken images).
- **Story controller**: `store/story.ts` (`useStory`): `stage` (`idle | detect | identify | classify | predict |
  result | explain`), `start()`, `advance(from)`. `advance` only moves if `from` is still the current stage,
  so late or duplicate calls cannot skip a stage. `components/StoryScreen.tsx` renders the tracker and the
  current stage, and passes each stage `onDone={() => advance(stage)}`. Stage registry: `stages/index.ts`.
- **Stage contract (for Phases 3-6)**: a stage is `({ onDone }: StageProps)`. It renders `<StageLayout stage=...
  visual={...}>{completion lines}</StageLayout>`, plays its own animation, and calls `onDone()` when finished
  (use `useLatest(onDone)` in timers). Result has no timer: its button calls `onDone` (result to explain).
  Explain is the last screen and never advances. Titles and the plain-language sentences are in
  `config/stages.ts` (`STAGE_COPY`); the wording there was a draft at this point (the Detect title "RECEIVING
  SATELLITE DATA" was later confirmed by the Phase 3 request, and every other stage's copy was set by its own phase).
- **Timings**: `config/timings.ts`: `STAGE_SECONDS` (detect 8, identify 7, classify 7, predict 9) and
  `TRANSITION_SECONDS` (landing exit 1.1, item exit 0.45, story enter 0.8, stage fade 0.4). Real stages
  should size their animation to `STAGE_SECONDS[stage]`.
- **Transition**: on click the text and button fade out, and the map zooms to 1.18x while dissolving; then the
  story fades in (`AnimatePresence mode="wait"`, so the story's timers start only after the landing has gone).
  There is a short dark beat between the two, by design.
- **Story layout**: `ProgressTracker` (Detect, Identify, Classify, Predict RI, Result; done = green tick with
  filled connector, current = glow, after Result all are ticked) and `StageLayout` (large visual on the left,
  status column on the right with "Stage n of 5", big title, sentence, completion-lines slot; stacks on small screens).
- **Placeholders**: `Detect/Identify/Classify/Predict/Result/Explain.tsx` all use `PlaceholderStage` (real title
  and sentence, a fake wait with a progress bar and a `StatusRow`; Result has the `Explore AI Explanation`
  button). Replace each with the real stage. There is no restart button: reload the page to replay.
- Verified (headless Edge over DevTools protocol, real time): after the click, Detect starts at about 1.3 s
  (after the landing exit) and the hand-offs happen at 9.4, 16.7, 24.3 and 33.7 s, matching the config
  (8 / 7 / 7 / 9 s plus the short fades); Result stays until clicked; the button then shows Explain with all five steps ticked; no console errors; no page scrollbar
  during the transition; the sweep turns counter-clockwise (about -30 degrees per second).
- Bundle is about 534 kB (168 kB gzipped) because of Leaflet and framer-motion; Vite warns about it, which is
  harmless for this local demo.

### Phase 3: Detect stage (done)

- `stages/Detect.tsx` replaces the placeholder. Title "RECEIVING SATELLITE DATA"; sentence updated to "CycloVision
  starts by collecting observations from four different satellite sources." (`config/stages.ts`).
- **Status column**: "Receiving multi-source satellite observations" with an animated ellipsis (stops and
  dims after the fourth tick); four rows (IR (INSAT-3D/3DR), Water Vapor, Microwave, SST) that appear one after
  another, spin (counter-clockwise), then tick; each row has a 48 px thumbnail (`renderSatellite` ir/wv/mw/sst at
  128 px) that fades in with its tick; then the completion line "Cyclone-like system detected" (amber
  `TriangleAlert`, gentle fade). All rows and the line are laid out from the start (just invisible), so the title
  and sentence never jump. Do the same in later stages when content appears step by step.
- **Main visual**: the `MonitoringMap` (with its footprint and sweep) as background, plus, anchored at the storm's
  real coordinates (`storm.center`, 13.4 N 86.9 E): a swirl (the actual WV image at 192 px, radial mask, screen
  blend, fades from 0 to 0.56 opacity as ticks arrive) and, after the fourth tick, a calm pulsing amber marker
  (two slow rings, `animate-pulse-ring`).
- **Timing** follows `STAGE_SECONDS.detect` (8 s) via `DETECT_BEATS` in `config/timings.ts` (fractions of the
  duration, so retuning the duration rescales everything). Default: rows appear at 0.5 / 1.5 / 2.5 / 3.5 s, tick
  0.9 s later, detection at 5.0 s, `onDone()` at 8 s (the next stage is visible at about 8.4 s after the cross-fade).
- **New reusable pieces**: `MapAnchor` (pins DOM children to a lat/lon inside `MonitoringMap`; children are
  passed to `MonitoringMap`), `SatelliteCanvas` (draws one satellite channel once, after an optional delay; use it
  for Identify/Classify visuals). Canvas renders are delayed so they land in quiet moments (about 20 ms per
  128 px thumbnail, about 60 ms for the swirl).
- **Small changes to earlier pieces**: `MonitoringMap` no longer draws its own border and rounding (callers pass
  them; Landing does); `StatusRow` text is now `text-base`; `StageLayout`'s status column lost its vertical
  padding so a full stage fits a 760 px-high viewport without a scrollbar.
- Verified (headless Edge, real time): stage sequence and opacities sampled at ten moments; hand-off at 8.46 s;
  no console errors, also with map tiles blocked; no page scrollbar at any point; thumbnails and swirl checked in
  screenshots.


### Phase 4: Identify stage (done)

- `stages/Identify.tsx` replaces the placeholder. Title "IDENTIFYING CYCLONE"; sentence updated to "The AI looks
  inside the cloud mass to find the exact center of the storm." (`config/stages.ts`).
- **Main visual**, in order (default 7 s; beats are fractions in `IDENTIFY_BEATS`, `config/timings.ts`):
  the map (with the same swirl and marker as the end of Detect, so the hand-off is seamless) zooms into the storm
  (0.35 to 2.1 s) and cross-fades from 1.3 s into the fused satellite image; a scan line sweeps top to bottom
  (2.1 to 2.9 s); a faint 13x13 grid appears (2.4 s) and tightens toward the centre (2.8 to 3.85 s); a crosshair
  appears off-centre, searches and locks on `STORM_GEOMETRY.center` (2.9 to 4.05 s, with one ripple); a dashed
  uncertainty circle (radius = 0.55 x the inner ring radius) is drawn at 4.2 s.
- **Info panel** (each row its own panel, invisible until its beat): Center counts up and settles on 13.4 N, 86.9 E
  as the crosshair locks; Movement (arrow rotating counter-clockwise from north to north-west, "NW at 14 km/h" counting
  up); Confidence (ring filling counter-clockwise, 94%). Then the green tick line "Cyclone center identified"
  (5.7 s), and `onDone()` at 7 s (Classify visible at about 7.5 s).
- **How the zoom works**: a CSS scale + translate on a wrapper around `MonitoringMap` (so tiles, sweep, swirl and
  marker all move together), aimed at the storm's pixel position (`StormProbe` reads it from Leaflet). The scale is
  `max(panel w, h) / swirlPixels()`, so the on-map swirl grows exactly to the size of the satellite image that
  replaces it. `lib/swirlSize.ts` keeps the swirl's CSS size and the zoom maths in one place.
- **Image fills the visual** via `CoverSquare` (a centred square whose side is the panel's longer side, like
  `object-fit: cover`; the extra is cropped, mostly top and bottom). Children of `CoverSquare` use the storm's 0-1
  coordinates, so overlays line up with the image (checked: the locked crosshair is at (0.500, 0.500)). Phase 5
  should build its overlay inside a `CoverSquare` too, and remember that the top/bottom of the image are cropped.
- **Imagery now renders off the main thread**: `lib/satelliteWorker.ts` (Web Worker + OffscreenCanvas) and
  `lib/satelliteBitmap.ts` (`getSatelliteBitmap(channel, size)`, cached; `prewarmSatellite`). Two workers: one for
  images >= 512 px, one for small ones. `Landing` prewarms everything in `config/imagery.ts` (`PREWARM`: the four
  128 px thumbnails, the 192 px swirl, the 1024 px fused image) while the visitor reads the first screen.
  `SatelliteCanvas` now draws from that cache (its `delayMs` prop is gone; it no longer blocks the main thread), so
  the Phase 3 note about delayed canvas renders is obsolete. Sizes must match `config/imagery.ts` to share the
  cache. `renderSatellite` accepts any `DrawableCanvas` (HTMLCanvasElement or OffscreenCanvas). Falls back to the
  main thread if workers are unavailable.
- **New helpers**: `useBeats(seconds, beats)` (flips named beats true at fractions of the stage duration; use it
  for the choreography of Classify and Predict), `CountUp`, `CoverSquare`, `AnalysisOverlay` (`ScanLine`,
  `TighteningGrid`, `LockReticle`, `UncertaintyCircle`), `StormMapOverlays` (`StormSwirl`, `DetectionMarker`,
  moved out of `Detect.tsx`; `MonitoringMap` gained a `showLabel` prop).
- Verified (headless Edge, real time, dev server and production preview): zoom scale reaches 4.0 at 1600x900 (3.6 at
  1366x768); grid spacing goes 0.071 to 0.109 (edge) and 0.012 (centre); crosshair starts at (0.66, 0.34) and locks
  at (0.500, 0.500); circle centred (0.5, 0.5); values settle on 13.4 N 86.9 E / 14 km/h / 94%; Classify visible at
  7.47 s; no console errors (also with map tiles blocked, at 1920x1080); no page scrollbar at 1600x900, 1366x768,
  1920x1080; no long task (>50 ms) during Identify.

### Phase 5: Classify stage (done)

- `stages/Classify.tsx` replaces the placeholder. Title "CLASSIFYING STORM STRUCTURE"; sentence updated to "The AI
  reads the shape of the clouds, the same way forecasters do, using the Dvorak method." (`config/stages.ts`).
- **Main visual**: the fused storm image (from the shared cache, so it is there instantly) in a `CoverSquare`, with
  `components/StructureOverlay.tsx` on top, drawn from `STORM_GEOMETRY` in a 1000x1000 SVG (so strokes sit exactly on
  the features): the three curved-band arcs (amber) draw one after another, then the CDO outline (cyan, with a faint
  tint), then the centre marker (white cross with a dark halo, readable on the white cloud). Each feature gets a label
  with a leader line: "Curved Band" (right of the strongest arc, `bands[0][24]`), "CDO" (above the top of the outline,
  `cdo[24]`), "Cloud system center" (below the centre, inside the CDO). Label positions are in `LABELS` at the top of
  the file; they were chosen to clear the other features and to stay inside the visible (cropped) area.
- **Result panel** (status column): "Cloud pattern match" with five bars (CDO 71, Embedded Centre 14, Curved Band 9,
  Eye 4, Shear 2, straight from `dvorak.patterns`) that fill one by one with the numbers counting up; the CDO bar is
  highlighted. Then a "Top match" card: "Central Dense Overcast (CDO)", Confidence 71%, T-number 3.5 (counted up). Then
  one green box with two ticked lines: "Structure classified" and "Dvorak-aligned assessment available".
- **Timing**: `STAGE_SECONDS.classify` (7 s) and `CLASSIFY_BEATS` in `config/timings.ts` (fractions). Default:
  arcs 0.35 to 1.4 s, CDO 1.75 to 2.6 s, centre 2.8 s, results panel 3.3 s, bars at 3.4 / 3.8 / 4.1 / 4.5 / 4.8 s,
  top match 5.25 s, "Structure classified" 5.65 s, "Dvorak-aligned assessment available" 6.1 s, `onDone()` at 7 s
  (Predict visible at about 7.5 s).
- **Fixes found while testing** (they affect the whole app): (1) `text-base` is a colour here, not a size: every use was
  replaced with `text-[1rem]` (see Design system). (2) New `short:` variant for windows up to 700 px tall; `StageLayout`,
  `StoryScreen`, `Detect` and `Classify` use it. Detect had been overflowing by 28 px at 1366x768 (it was only tested at
  760 px high).
- Verified (headless Edge, real time): all beats sampled every 0.5 s; labels do not overlap and stay inside the panel;
  bars settle on 71/14/9/4/2; T-number 3.5; Predict visible at 7.50 s; no console errors; no long task (>50 ms)
  during Classify; page overflow is 0 px on every stage at 1600x900 and 1366x768; full-flow regression (Result waits for
  the click, then Explain) passes.

### Phase 6: Predict stage, the big reveal (done)

- `stages/Predict.tsx` replaces the placeholder. Title "PREDICTING RAPID INTENSIFICATION"; sentence updated to "Instead
  of guessing one number, the AI runs many possible futures and counts how many turn into rapid intensification."
  (`config/stages.ts`).
- **Image to thumbnail**: the fused storm image starts filling the visual (same crop as Classify), then shrinks (1 s) to an
  84 px thumbnail in the top-left corner while the chart frame fades in. It is one wrapper animated in pixels (from
  `useElementSize`) around a canvas with `object-cover`.
- **Chart** (`components/EnsembleChart.tsx`, custom SVG sized in real pixels, so text stays crisp; everything comes from
  `ensemble` and `riAssessment`): X = next 24 h (Now, 6h, 12h, 24h; 12h and 24h in bold cyan), Y = wind speed 40-120 kt.
  The 12-24h region is shaded, has dashed 12h/24h markers and the label "12-24h forecast window" (along its bottom edge:
  no path goes below 48 kt, so it is always clear). Reveal order: the 30 paths draw outward from "Now" one after another
  (smooth Catmull-Rom curves, thin, semi-transparent, cool blue), then the white median with dots at 12h and 24h, then the
  10-90% band fades in (behind the paths), then the dashed amber line at 85 kt (= 55 + 30) draws left to right with the
  label "+30 kt = Rapid Intensification"; then the 20 paths that reach it (counted from the data, `REACHES_RI`) turn amber
  in a quick stagger while the other 10 stay blue. Callouts: "Uncertainty band" (leader to the top edge of the band at
  15 h, where it is wide) and "Probability spread" (a bracket at 24 h from the lowest to the highest path, with the
  label above). Both sit in the empty strip above the highest path (113 kt height).
- **Results** (status column, next to the chart): "RI probability 24 h" 67% (counts up, amber, "20 of 30 paths"), "RI
  probability 12 h" 40% ("12 of 30 paths"), and a risk badge "ELEVATED" (`Badge size="lg"`; tones: Low green, Moderate
  cyan, Elevated amber, High red). Then one green box with four lines that tick one by one: "RI assessment generated",
  "12-24h forecast window", "Probability spread", "Uncertainty band".
- **Timing**: `STAGE_SECONDS.predict` (9 s) and `PREDICT_BEATS` in `config/timings.ts` (fractions). Default: shrink 0.2 s,
  frame 0.6 s, paths 1.1 to 3.2 s (about 0.9 s each, 0.04 s apart), median 3.2 s, band 4.0 s, RI line 4.7 s, warm colours
  5.4 s, results 5.6 s, callouts 6.1 / 6.3 s, badge 6.6 s, lines 6.8 / 7.3 / 7.7 / 8.2 s, `onDone()` at 9 s (Result visible
  at about 9.4 s). Path draw time, stagger and the other durations derive from the stage length.
- **New helpers**: `useElementSize(ref)` (measured width and height, updates on resize), `Badge` gained a `size` prop.
- Verified (headless Edge, real time; dev server, plus the production build at 1920x1080): draw progress sampled every
  0.5 s (paths start at about 1.2 s, all going by 2.5 s, complete by 3.7 s); 20 warm and 10 cool paths; numbers count to
  67 and 40; badge and lines in order; callouts do not overlap and stay inside the chart; Result visible at 9.4 s; no
  console errors; page overflow 0 px on every stage at 1600x900, 1366x768 and 1920x1080; no long task (>50 ms) during
  Predict.
- Not built, on purpose: a legend for the median line (the bold white line is the median by convention). Ask if wanted.

### Phase 7: Result stage (done)

- `stages/Result.tsx` replaces the placeholder. Title "CYCLONE ASSESSMENT COMPLETE"; the sentence is unchanged ("Here is
  everything CycloVision has concluded about the storm, in one place.").
- **Layout**: the summary card fills the big left panel (the `visual` slot of `StageLayout`); the right column has the
  title and sentence, then the fused storm image with the mini RI gauge, then the large button at the bottom.
- **Summary card**: header "Assessment summary" (green dot) with a "Cyclone Meghavi · BOB-01" chip, then five rows that
  slide in one after another (0.5 s apart), each with an icon tile that pops in and a small label. All rows are laid out
  from the start, just invisible, so nothing jumps. (1) Current state (`LocateFixed`): "Cyclone identified", 13.4° N,
  86.9° E, moving NW at 14 km/h. (2) Structure (`Layers`): "Dvorak-aligned classification", Central Dense Overcast (CDO)
  · T 3.5. (3) RI assessment (`Gauge`): the coloured badge ELEVATED (tone from the risk level: Low green, Moderate cyan,
  Elevated amber, High red) and "67% probability" counting up; the badge pops only after the count has finished.
  (4) Prediction window (`Clock`): "12-24 hours". (5) Evidence (`Satellite`): four green chips with ticks, IR, Water
  Vapor, Microwave, SST, ticking one by one. All values come from `data/storm.ts`.
- **Image and gauge**: the fused image (cached bitmap, `object-cover`, slow settle from 1.12x) with a "Fused satellite
  view" tag and `components/MiniGauge.tsx` in the corner: a ring split into the four risk zones (25% each) with a
  bright arc that fills COUNTER-CLOCKWISE from the top to 67% (so no clockwise gauge needle, per the rotation rule),
  the number counting up inside, and the level name beside it. It fills at the same moment the RI row lands.
- **Button**: `Explore AI Explanation` (large, `btn-glow`, full column width, arrow icon). It is invisible and disabled
  until 3.9 s, then it calls `onDone()`, which moves the story to `explain`. The stage never advances on its own.
- **Timing**: `RESULT_BEATS` in `config/timings.ts`. Unlike the other stages this one has no duration, so the values are
  plain SECONDS after the screen appears (read with `useBeats(1, RESULT_BEATS)`): card 0.15, image 0.4, rows 0.5 / 1.0 /
  1.5 / 2.0 / 2.5, badge 2.55, chips 2.85 / 3.05 / 3.25 / 3.45, button 3.9.
- Verified (headless Edge, real time; dev server, plus the production build at 1920x1080): row opacities, chips, gauge
  (arc and number reach 67) and button state sampled at ten moments; Result still showing 4 s later; clicking the button
  shows the Explain screen with all five tracker steps ticked; no console errors; page overflow 0 px on every stage at
  1600x900, 1366x768 and 1920x1080. Explain is still a placeholder.

### Phase 8: Explain stage (done)

- `stages/Explain.tsx` replaces the placeholder and is the last screen. It answers one question, used as the heading:
  "Why is the RI risk elevated?" (`STAGE_COPY.explain.title`). It is reached by the Result button; it never advances.
- **Left: image, switch, heatmap.** A channel switch above the image (Fused, IR, WV, MW, SST; a small plain-language note
  beside it says what the current channel shows). All five 1024 px images are stacked and the chosen one cross-fades on
  top of the always-present fused image, so switching changes the image underneath while the heatmap and labels stay
  exactly as they are (checked). The image fills the panel via `CoverSquare`. `components/AttentionHeatmap.tsx` draws the
  heatmap from `STORM_GEOMETRY`: a glowing ring on the eyewall ring (the strongest), soft blobs on the two hotspots and
  on the strongest curved band; it fades in (1.4 s) while a soft scrim dims the image by 40% so the heat reads on every
  channel (IR is orange too). Four labels in Dvorak-style words follow one by one (they reuse `FeatureLabel`, now exported
  from `StructureOverlay.tsx`): "Eyewall ring", "CDO cold tops", "Inner core convection", "Curved band". A small legend
  says "AI attention, low to high". The blur filter must cover the whole image (`filterUnits="userSpaceOnUse"`), or the
  ring glow is clipped into a visible square.
- **Right: the reasoning.** The heading and a summary sentence typed out by `TypeText`. The sentence is BUILT, not typed
  in: `lib/explanationSentence.ts` takes the top three drivers that push the risk up and joins their `phrase` fields
  ("sees" / "over" / "with", added to each driver in `data/storm.ts`). With the demo data it gives exactly: "The AI sees a
  ring forming in the microwave image that is not yet visible in infrared, over very warm water with low wind shear."
  Then a "What drives the risk" card with the six ranked drivers as bars (bar length is relative to the biggest, +22;
  amber for the five that raise the risk, blue for the dry-air one that lowers it; each with its plain-language
  description from the data) and the sum "9% typical + 58 points = 67%". Then "Contribution by data source", one
  stacked bar with MW 34% / IR 24% / SST 24% / WV 18%, and the "Back to result" button.
- **Back to result**: `useStory().back()` (new; the only backwards move, explain to result). The store also gained
  `resultSeen`; when the visitor returns, Result replays its reveal at 5x speed (about 0.8 s instead of 3.9 s) and the
  Explore button works again. `StageLayout` gained optional `sentence`, `columns` and `tight` props (Explain uses a wider
  right column and a typed sentence).
- **Timing**: `EXPLAIN_BEATS` in `config/timings.ts`, plain SECONDS after the screen appears: switch 0.1, sentence typing
  from 0.4 (1.6 s long), heatmap 0.6, drivers card 1.5, driver bars 1.8 to 3.05 (0.25 s apart), labels 1.7 / 2.0 / 2.3 / 2.6,
  data-source strip 3.4, button 3.8.
- **Prewarming**: `config/imagery.ts` `PREWARM` now also draws the IR, WV, MW and SST images at 1024 px in the
  background from the landing screen, so channel switching is instant by the time Explain opens.
- **Cleanup**: `stages/PlaceholderStage.tsx` was deleted (no stage uses it any more). `explain.sentence` in
  `config/stages.ts` is only a fallback; the screen passes the generated sentence.
- Verified (headless Edge, real time; dev server, and the production build at 1920x1080 and 1366x768): the generated
  sentence matches the example word for word; bars scale 100/68/55/36/32/27%; source strip 34/24/24/18; labels do not
  overlap and stay inside the image; all five channel switches change only the image (heatmap opacity stays 1); Back to
  result then Explore again works; no console errors; page overflow 0 px at 1600x900, 1366x768 (needed `short:` tweaks)
  and 1920x1080.
- The whole demo flow is now built: Landing, Detect, Identify, Classify, Predict, Result, Explain. Remaining before
  recording (from earlier phases): delete `src/dev/` and the two hash lines in `App.tsx`.

### Phase 9: Polish and final checks (done)

- **One transition for every screen change.** `STAGE_MOTION` in `config/timings.ts` (in from 12 px below, out 8 px up, fade,
  0.4 s, one easing) is used by the first stage appearing, every stage-to-stage swap (including Result to Explain and
  back) and the story leaving on Replay. The story root now only fades in (the stage adds the slide), so the first stage no
  longer takes 0.8 s while later ones take 0.4 s (`TRANSITION_SECONDS.storyEnter` was removed). Measured over two full runs,
  all 13 swaps took 0.68 to 0.78 s (0.4 out + 0.4 in) with the same slide range. The Landing to Detect zoom is the one
  deliberate exception (Phase 2's cinematic transition).
- **Replay.** `store.reset()` returns to `idle` and clears `resultSeen`. A small `Replay` button (counter-clockwise arrow icon)
  sits in the top bar beside the "Synthetic demo data" chip, only on Result and Explain; it fades in with the screen (it
  waits one fade, because the store moves to Result while Predict is still fading out) and out quickly. On click the story
  fades out with the same transition and the Landing plays its normal intro (about 0.45 s to reach it). `StoryScreen` keeps
  showing the last stage while it fades out. Checked from both screens, and a full second run gives identical numbers.
- **Dev page removed.** `src/dev/`, the `#dev-satellite` hash handling in `App.tsx`, and the two empty `.gitkeep` files are
  gone; nothing references them. `stages/PlaceholderStage.tsx` was already removed in Phase 8.
- **Layout.** Checked with an EXACT viewport (Chrome DevTools `Emulation.setDeviceMetricsOverride`), sampling the page's
  scroll size every animation frame through the whole story including transitions: 1920x1080, 1920x950, 1440x900, 1440x790,
  1366x768 and 1280x720 all need no scrolling (vertical and horizontal overflow 0 on every screen) and show no truncated
  text. Found and fixed: viewports between 700 and about 800 px tall (1366x768 or 1280x720 full screen, browser windows on
  1440x900 screens) overflowed by 9 to 12 px on Detect and Explain because `short:` stopped at 700 px; it now covers up to
  820 px. Earlier "1366x768" checks had used a headless window with only about 628 px of viewport, which hid this.
- **Console and numbers.** Zero console errors, warnings or browser-log entries on the dev server (React dev warnings
  included) and on the production build, across all runs. Numbers were extracted from every screen's text and checked against
  `data/storm.ts`: coordinates 13.4 N 86.9 E (Identify, Result), 14 km/h NW, confidence 94%, T 3.5 (Classify, Result), CDO 71%
  and the other Dvorak shares, RI 67% and 40% with 20/30 and 12/30 paths (Predict), 67% and ELEVATED (Predict, Result, Explain),
  9% + 58 points = 67%, sources 34/24/24/18: all match, and nothing is hard-coded outside the data file. The risk-level badge
  colours now come from one place, `config/risk.ts` (they had been written out separately in Predict and Result).
- **Production build.** `npm run build` is clean (no warnings; `chunkSizeWarningLimit` raised to 700 kB because Leaflet and
  framer-motion make the main bundle about 590 kB, which is fine for a local demo). `npm run preview` (port 4173) was run and
  the full audit passed against it. The build output `dist/` is not kept: run `npm run build` first.
- **Flow versus this file's Demo flow.** Everything in steps 1 to 5 is there, with the same on-screen wording. Differences, all
  intentional and agreed in the phase requests: (a) Identify shows the MAP zooming in and cross-fading into the satellite image,
  not the image alone zooming; (b) the Predict chart is 30 intensity paths plus band, median and +30 kt line, with the 12h and
  24h probabilities as callouts (the Phase 1 decision), and "RI assessment generated / 12-24h forecast window / Probability
  spread / Uncertainty band" are its four completion lines; (c) Explain (step 6 above), the Back to result button and the Replay
  button were added later; (d) Result also has a header chip with the storm name, the storm image with a mini gauge. This file's
  Demo flow section was updated to list Explain and Replay.
- **Known and accepted.** (1) The map tiles (Esri) need internet; without it the map still shows the grid, footprint and sweep
  (tested), and nothing else in the app needs the network. (2) One main-thread task of 70 to 110 ms occurs while Detect
  appears (creating the Leaflet map); it is hidden under the stage fade and not visible in use. (3) The storm coordinates
  (13.4 N 86.9 E) are a real open-sea point in the Bay of Bengal, as specified; the storm itself (Meghavi, BOB-01) is fictional.
- **To record**: `npm run build`, then `npm run preview`, open http://localhost:4173, use full screen, click Simulate Cyclone.
  Use Replay (top right, on the Result or Explain screen) for retakes; a reload also works.

### Phase 10: Manual "Continue" between stages, no auto-advance (done)

- **The story no longer auto-advances.** Detect, Identify, Classify and Predict each still play their own animation
  exactly as before (same visuals, same internal pacing), but the timer that used to call `onDone()` at the end of
  that animation is gone. Instead each now shows `components/ContinueButton.tsx` once its animation finishes, and
  the story only moves to the next stage when the visitor clicks it: "Continue to Identification" (Detect),
  "Continue to Classification" (Identify), "Continue to Prediction" (Classify), "Continue to Result" (Predict).
  `ContinueButton` matches the look of Result's `Explore AI Explanation` button (`btn-glow`, arrow icon) and fades
  in about 0.9 s after its animation's own last element appears, so it reads as a pause, not a jump cut. Result and
  Explain are unchanged: they already waited for a click (`Explore AI Explanation`, `Back to result`).
- **`config/timings.ts`**: `STAGE_SECONDS` and the four `*_BEATS` objects (`DETECT_BEATS`, `IDENTIFY_BEATS`,
  `CLASSIFY_BEATS`, `PREDICT_BEATS`) are unchanged except that the `end: 1` entry (and, in Detect, the hardcoded
  `at(1, ...)` timer) is gone from each — that fraction only ever scheduled the auto-advance, it drove no visual.
  Every fraction before it, and `STAGE_SECONDS` itself (the scale the fractions are multiplied against), still
  drives the stage's own animation exactly as before, so all internal timing is unchanged.
- **Cleanup**: `lib/useLatest.ts` was deleted — it existed only so a timer could call the latest `onDone` safely;
  with no more auto-advance timers nothing used it. The risk-level badge colours, which had been written out
  separately in `Predict.tsx` and `Result.tsx`, were pulled into one place, `config/risk.ts` (`RISK_TONE`), while
  touching those files for this change.
- **Progress tracker and every stage's visuals are untouched** — this phase only replaces the trigger for moving
  from one stage to the next; nothing about what each stage shows or how it animates changed.
- Verified (headless Edge, real time; dev server and the production build): every stage's Continue button stays
  disabled and invisible until its animation finishes, then becomes clickable; the story sat on each stage for
  30 s+ (well past its old auto-advance point) with no change, confirming nothing times out on its own; clicking
  each button in turn reached Result with all five tracker steps ticked, exactly as before; Result is unaffected
  (no Continue-labelled button appears there, only Explore AI Explanation). Page overflow is 0 px on every stage
  at 1920x1080, 1440x900, 1366x768 and 1280x720 (the extra button fits inside the existing `short:` spacing with
  no changes needed there). No console errors or warnings.

### Phase 11: Clickable progress tracker (done)

- **Detect, Identify, Classify and Predict RI's tracker items are now real `<button>`s.** Click an already-finished
  one and the story jumps back to it, showing its finished result immediately — the reveal is never replayed. Click
  one not reached yet and a small "Not processed yet" tooltip appears next to it for about 1.8 s; nothing navigates.
  Clicking the currently-viewed step is a no-op. Result stays exactly as it was: a plain, non-interactive marker,
  reachable only through Predict RI's Continue button — never a tracker target, per the brief.
- **Store** (`store/story.ts`): `doneStages` (`Partial<Record<Stage, true>>`) records which of the four auto-playing
  stages have finished their OWN animation at least once — set the moment the animation ends, not when Continue is
  clicked, so a stage that finished but hasn't been advanced past yet still counts as "done" if you navigate away and
  back to it. `markDone(stage)` sets it (idempotent); `view(stage)` is the tracker's jump: a no-op unless the target
  is done and isn't the stage already showing. `reset()` (Replay) clears `doneStages` too. `advance()` is unchanged —
  it just moves to the next stage in order regardless of doneStages, which is what lets Continue correctly walk
  forward through already-finished territory after a back-navigation.
- **Instant rendering, not a replay.** Each of the four stages reads its own `doneStages` flag (`useStory((s) =>
  s.doneStages.detect ?? false)`, and so on) as `instant`, captured once at mount (not reactive to later changes,
  since remounting is how a fresh visit always begins — `AnimatePresence key={shown}` in `StoryScreen` guarantees a
  full remount on every stage change, forward or back). `useBeats` gained an `instant` param: true starts every beat
  already true and schedules no timers at all, instead of counting through them. Detect's own hand-rolled
  useState/setTimeout logic got the equivalent treatment directly.
- **Finding and fixing every place that would still have replayed something** took real digging, since
  `initial={false}` (the pattern used everywhere in this app) is not sufficient on its own:
  - `CountUp` drove its count-up with an imperative `animate()` call in a `useEffect` keyed on `run` — with `run`
    already true at mount, it would count from 0 up to the final number all over again on every revisit. Fixed
    generically, with no call-site changes: it now captures whether `run` was already true AT MOUNT and, if so,
    starts (and stays) at the final value.
  - `initial={false}` does not stop an ARRAY-valued `animate` target (a keyframe sequence, as opposed to a single
    target value) from playing through in full on mount — found and fixed two of these by testing, not by
    inspection, since they're easy to miss: `LockReticle`'s crosshair search-and-lock wander (Identify) and
    `ScanLine`'s top-to-bottom sweep (Identify) each gained an `instant` prop that swaps the animated keyframe path
    for a single already-settled target. `Identify.tsx`'s own `ConfidenceRing` had an explicit `initial={{ pathLength:
    0 }}` (a single value, but still an explicit non-`false` initial) that would re-draw the ring from 0% on every
    mount; changed to `initial={false}`. Every other `animate` prop in the app (checked exhaustively, listed in this
    phase's own working notes) uses single target values with `initial={false}` already, which is safe as-is.
  - `StatusRow`'s tick/spinner icons needed no change: they are switched via `AnimatePresence initial={false}`,
    which already means whichever icon is present at first mount does not play an entrance animation.
- Verified (headless Edge, real time; dev server and the production build, 1920x1080/1366x768/1280x720): the exact
  scenario in the request — reach Predict RI, click back to Identify via the tracker, click Continue twice — lands
  back on Predict RI with byte-identical page text to the original (67%/40%/ELEVATED/all four ticks/chart fully
  drawn), not recomputed or recounted. Navigating to any of the four finished stages takes about 0.46 s (just the
  standard 0.4 s screen transition, confirming no multi-second replay). The tooltip appears only on an unreached
  step, blocks navigation, clears itself, and does not overlap or clip at 1366x768 or 1280x720. Clicking the current
  step and clicking Result (not a button) do nothing. No console errors or warnings on any run.

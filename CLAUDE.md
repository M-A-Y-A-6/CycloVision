# CycloVision

Front-end-only demo prototype for a YouTube pitch video for **Smart India Hackathon 2026** (Team Formula 1, Problem Statement **SIH26070**: an AI/ML system for identification, classification and prediction of tropical cyclone patterns using multi-source satellite data). All data and AI outputs are synthetic — each "Simulate Cyclone" click generates a brand new random storm from a fresh seed, deterministically (same seed, same storm) — there is no backend.

## Project brief

CycloVision is an **Explainable AI Early-Warning System**. Tagline: **"AI-powered tropical cyclone early-warning system"**. It fuses 4 data sources — INSAT-3D/3DR infrared (**IR**), water vapour (**WV**), passive microwave (**MW**), sea surface temperature (**SST**) — to **identify** a cyclone, **classify** its structure (IMD's Dvorak vocabulary: Curved Band, Shear, Eye, CDO, Embedded Centre), and **predict Rapid Intensification (RI**, a wind increase of 30+ knots within 24 hours) 12-24 hours ahead as a probability with an uncertainty band, plus an explainable result.

## Demo flow

**Dashboard** (`/`): logo, tagline, the monitoring-area visual, then a single always-available `[ Simulate Cyclone ]` button. There is nothing to pick — each click generates a brand new random storm (`beginSimulation()`, a fresh `Math.random()` seed) and navigates to `/analysis`. No real storm name is ever shown anywhere.

**Analysis** (`/analysis`) plays the 5-stage story. Nothing auto-advances: each stage plays its animation, then shows `[ Continue to <next> ]`. The progress tracker is clickable — a finished stage shows its result instantly (no replay); an unreached one shows a "Not processed yet" tooltip.

1. **Simulate Cyclone**: 5 source icons (INSAT, SAPHIR Microwave, Ocean, Atmospheric, NWP) light up, then collapse into a 4-step checklist (Data Cleaning, Geocoding & Reprojection, Storm-Centered Cropping, Normalization & Calibration). Ends "Preprocessing complete".
2. **Identify** (YOLO-NAS): a bounding box draws around the storm (`identification.boundingBox`), a "Cyclone Detected — {confidence}% — {lat}, {lon}" label, a crosshair locks on centre. Ends "Cyclone center identified".
3. **Classify** (ConvNeXt → Physics-Guided GAT): cropped image; a node-graph (Cloud pattern / Wind shear / SST / Moisture pulsing into a fused centre); "Basin Head Active: {basin}" badge; intensity category + confidence. Ends "Structure classified".
4. **Predict RI** (TCN + Attention → RI Head): the big-reveal ensemble chart — **30 intensity paths, 10-90% band, median path, dashed +30kt RI line**, 12h/24h probabilities as callouts counted from the paths (never a separate probability-by-hour series) — plus a trend sparkline, an RI gauge, "+{deltaIntensity} expected within 24h", "{probability24h}% ± {range}%, based on {ensemblePasses} ensemble passes", and a risk badge (Low <25 / Moderate 25-50 / Elevated 50-75 / High >75). Ends "RI assessment generated", "12-24h forecast window", "Uncertainty band".
5. **Explain Result** (internal id still `result`; Explainability & Uncertainty — ONE consolidated chip): Grad-CAM glow on the image; a compact panel with the top 2 `shapFeatures`, a bell-curve uncertainty sketch, and `plainLanguageExplanation` typed out. Ends "Explanation generated" and `[ View Full Results ]` — not a Continue button: it sets `resultsPanelReached` and navigates to `/results` (last story stage).

**Full Results** (`/results`, only via the button above): basin chip, `[ ← Back to Analysis ]` (plain route change) and `[ New Simulation ]` (reset, back to `/`). Five tabs: **Results** (default — category, RI gauge reused from Predict RI, a small SVG track-line preview); **Explain** (full-size Explain Result: Grad-CAM heatmap, all `shapFeatures` as full bars, an attention thumbnail + `attentionSummary`, bell-curve sketch, `plainLanguageExplanation` prominent — one consolidated panel); **Track** (Leaflet map, past + forecast track, a widening uncertainty-cone circle per forecast point sized by `uncertaintyRadiusKm`, `landfallEta`, labelled "Physics-Guided Track Head"); **Consensus** (IMD/ADT/SATCON/JTWC bars plus this assessment's own, framed as forecaster context not an override, plus `consensus.note`); **Alert** (`alertText` headline/body + severity badge, a phone-mockup "Preview — SACHET-style alert", `[ Send to SACHET ]` plays a local sending→sent animation, explicitly labelled simulated — nothing is ever really sent).

A small `Replay` button in the top bar (visible once `stage === 'result'`, so also on `/results`) resets everything and returns to `/`.

## Architecture pipeline

Every model label/chip must match this chain: **Data Ingestion & Preprocessing** (Data Cleaning → Geocoding & Reprojection → Storm-Centered Cropping → Normalization & Calibration) → **YOLO-NAS** (detection & centre localisation) → **ConvNeXt** (feature extraction) → **Physics-Guided GAT** (fuses visual + environmental variables) → **Basin-Adaptive Layer** (Arabian Sea or Bay of Bengal head, by the storm's randomly generated basin) → **Multi-Task Heads** (Classification Head; TCN+Attention → **RI Head**; Track Head) → **Explainability & Uncertainty** (Grad-CAM, SHAP, attention, MC Dropout, ensemble inference — ONE consolidated chip, never three separately labelled techniques).

`StageLayout`'s `pipelineLabels: string[]` prop renders one chip per model component (Classify shows two); `pipelineHint` adds a line under them (Predict RI only, its hint quoted in Demo flow above). Exact chip text is given per stage in Demo flow.

## Data

`src/data/cases.ts` exports `generateStormCase(seed)`: every "Simulate Cyclone" click (`beginSimulation()` in the store) draws a fresh numeric seed from `Math.random()` and generates one entirely fictional storm from it — same seed, same storm, but no two clicks share a seed. No real storm name or year is ever attached to a generated storm; only its basin (Bay of Bengal or Arabian Sea, picked at random, with a position close enough to India's coastline to plausibly affect it) is shown. `assertValidStormCase()` runs on every generation and throws if the storm's numbers stop adding up — the per-click equivalent of the old fixed-case self-check.

Each generated storm has `id` (the seed, stringified — keys the satellite-image cache), `basin`, `seed`, `center`, `movement`, `currentIntensity`, `geometry` (eyewall ring + hotspots — the same array feeds both the rendered satellite image and `explainability.gradCamHotspots`), `ensemble` (30-member wind-speed paths), and a `precomputed` object:

```
identification: { boundingBox, confidence, centerCoords }
classification: { category, confidence, basinHeadUsed }
riPrediction:    { probability24h, probability12h, uncertaintyRange, deltaIntensity, ensemblePasses, trend }
explainability:  { gradCamHotspots, shapFeatures, attentionSummary, uncertaintyBand, plainLanguageExplanation }
track:           { pastPositions, forecastPositions, landfallEta }
consensus:       { imd, adt, satcon, jtwc, note }
alertText:       { headline, body, severity }
```

## Rules

- **Do not add features not listed in Demo flow.** Ask instead of guessing if something seems missing.
- One plain-language sentence per stage.
- **Everything rotates counter-clockwise** (northern hemisphere): logo, storm imagery, markers, spinners. Negative angles / `animate-spin-ccw`, never Tailwind's `animate-spin`.
- **Never use `text-base`** — it's the page-background colour token, so this sets text invisible, not the font size. Use `text-[1rem]` for 16px.
- Story stages and Dashboard need **no page scrollbar** at 1920x1080 down to 1280x720 (use `short:`, active ≤820px height). `/results` and `/about` are document-style pages, read after or outside the animated story, and may scroll.
- All screen changes use the one shared transition, `STAGE_MOTION` in `config/timings.ts`.

## Tech stack

Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`, no config file; tokens in `src/index.css`), framer-motion, lucide-react, zustand, leaflet + react-leaflet, react-router-dom (`HashRouter` — no server rewrite needed). Fonts self-hosted via `@fontsource-variable` (Inter, JetBrains Mono). `tsconfig.app.json` sets `erasableSyntaxOnly`: no `enum`s or constructor parameter properties.

Commands: `npm run dev`, `npm run build` (typecheck + build), `npm run lint` (oxlint), `npm run preview`.

## Folder structure

```
src/
  components/  Panel, Badge, StatusRow, TopBar, CycloneIcon, MonitoringMap, MapAnchor, StormMapOverlays, SatelliteCanvas, CoverSquare, CountUp, AnalysisOverlay, StructureOverlay, EnsembleChart, MiniGauge, AttentionHeatmap, TrackMap, TypeText, ContinueButton, ProgressTracker, StageLayout, StoryScreen
  stages/      Detect, Identify, Classify, Predict, Result — one per story stage; read the storm via lib/useCase.ts
  pages/       Dashboard (/), Analysis (/analysis, redirects to / if no storm generated yet), ResultsPanel (/results, guarded by resultsPanelReached; tabs in pages/results/: ResultsTab, ExplainTab, TrackTab, ConsensusTab, AlertTab), AboutPage (/about, a Model Card), sharing DocumentHeader
  lib/         cn, spiral, random (mulberry32), noise, satellite (procedural generator, per-storm geometry), satelliteWorker + satelliteBitmap (off-thread imagery, cached by storm), swirlSize, useBeats, useElementSize, useCase
  data/        cases.ts — generateStormCase(seed) + assertValidStormCase (see Data)
  store/       story.ts — zustand: stage, currentCase, doneStages/markDone/view (tracker), resultsPanelReached/reachResultsPanel, beginSimulation/advance/reset
  config/      timings.ts, stages.ts (titles/sentences/tracker labels), map.ts, imagery.ts (prewarm list), risk.ts / basin.ts (badge colours)
  App.tsx      HashRouter + persistent TopBar + routed pages, cross-faded with AnimatePresence
  main.tsx     Entry point; index.css: Tailwind import, design tokens (@theme), glow styles
```

## Design system

Dark mission-control theme. Tokens (Tailwind classes `bg-*`/`text-*`/`border-*`) — `base` #0A101C (page bg), `panel` #111A2B (cards), `line` #1F2B42 (borders), `primary` #1E90FF (main button), `accent` #22D3EE (active states), `amber` #F59E0B (caution/chip), `red` #EF4444 (high risk), `green` #22C55E (success), `ink` #E6EDF7 (text), `muted` #8494B0 (secondary text).

Fonts: **Inter** (`font-sans`), **JetBrains Mono** for numbers (`font-mono` or `.num`). Components: `Panel` (titled container), `Badge` (tones neutral/blue/cyan/amber/red/green, sizes `sm`|`lg`), `StatusRow` (idle/active/done), `MiniGauge` (RI ring gauge, `size` prop, fills counter-clockwise), `TopBar` (logo, nav, Replay). Utilities in `index.css`: `btn-glow` (main-button glow, dimmed `:disabled` style), `animate-spin-ccw` (only allowed spinner), `animate-sweep-ccw` (radar sweep), `step-glow` (tracker's current step), `animate-pulse-ring` (calm expanding ring, never flashing). Logo spiral geometry lives in `src/lib/spiral.ts`, shared with `public/favicon.svg` — regenerate the favicon if it changes.

## History

Built in phases; see git log for history. A final regression pass verified all 4 cases end to end (Dashboard → pick → Simulate → all 5 stages with Continue/clickable-tracker/"Not processed yet" → View Full Results → all 5 Results Panel tabs → Back to Analysis / New Simulation), at 1920x1080 and 1440x900, against both the dev server and a production build/preview — zero console errors, zero layout overflow. Found and fixed one real bug: `Dashboard`'s Simulate button didn't reset the store first, so reaching Dashboard via the persistent nav link (not Replay/New Simulation) mid- or post-story, then picking a different case, could leave the previous case's `doneStages`/`stage` stale while only `currentCaseId` updated — Simulate now always resets before starting a run, regardless of how Dashboard was reached.

Replaced the 4 fixed historical cases with `generateStormCase(seed)`, a fully random-but-plausible storm generator (basin, position, intensity, RI outcome, classification, explainability, track, consensus, alert text all derived from one fresh seed per "Simulate Cyclone" click, no real storm name ever shown); removed the Dataset page/route/nav-link and the "Synthetic demo data" chip; removed the "illustrative simulation" disclaimer everywhere (no longer applicable with no real event referenced); verified with headless-browser runs across several random simulations, each end to end through all 5 stages and all 5 Results Panel tabs, with varying basins and zero console errors.

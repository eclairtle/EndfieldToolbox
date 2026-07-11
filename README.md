# Endfield Toolbox

Endfield Toolbox is a browser-based build planner and rotation sandbox for **Arknights: Endfield** theorycrafting. The app lets you assemble a 4-character party, configure weapons and gear, simulate combat timelines, inspect DPS and hit-by-hit output, and compare build variants against resource cost.

The project is currently in **alpha**. A lot of the simulation and data work is already substantial, but implementation depth still varies by character, weapon, enemy, and edge-case combat mechanic.

## What The App Does

- Create and manage multiple saved builds in the browser.
- Configure 4 party slots with character progression, talents, skills, weapons, and gear.
- Simulate combat rotations on a timeline with command placement and timing control.
- Configure enemy state, stagger behavior, SP flow, consumables, and contingency-contract style modifiers.
- Inspect total damage, DPS, event flow, hit details, buffs, debuffs, and combat state changes.
- Compare build variants and estimate progression/planner cost deltas.
- Use localized UI/content support for English and Simplified Chinese.

## Current Structure And Tech Stack

This app is a **frontend-heavy single-page application** with the combat engine and data modeling implemented client-side.

### Resume-Friendly Summary

- Built a **Vue 3 + TypeScript theorycrafting SPA** for Arknights: Endfield with a custom combat simulation engine.
- Implemented **stateful build-planning workflows** for party composition, equipment, progression, and saved build templates.
- Designed a **timeline-based rotation simulator** that models commands, hits, buffs, debuffs, stagger, SP/energy flow, enemy actions, and event logging.
- Organized the app into **UI, state, data, progression, localization, and combat-engine layers** to support ongoing expansion of characters and mechanics.
- Shipped as a **static Vite app** with browser persistence, route-based workspaces, and production chunk-splitting for large game-data modules.

### Architecture

- `src/App.vue`
  Owns the main app shell, workspace switching, build hydration, comparison mode, and summary orchestration.
- `src/router`
  Hash-based routes for the build list, builder workspace, and rotation workspace.
- `src/stores`
  Pinia stores for build state and persisted build library metadata.
- `src/components`
  UI for build management, builder cards/panels, and the rotation workspace.
- `src/lib/combat`
  Core simulation pipeline for build snapshots, timeline compilation, damage calculation, status processing, and runtime event flow.
- `src/lib/progression`
  Planner and build-cost utilities for progression/resource comparisons.
- `src/data`
  Curated game data, draft content, gear sets, weapons, enemies, and character definitions.
- `src/i18n`
  Locale bootstrap plus domain-specific translation helpers for names, skills, statuses, and labels.
- `public`
  Static assets such as avatars, weapons, gear, enemy icons, and game data payloads.

### Stack

- **Framework:** Vue 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Styling:** Tailwind CSS 4
- **Localization:** vue-i18n
- **Drag-and-drop:** `vuedraggable`
- **Persistence:** browser `localStorage`
- **Deployment model:** static frontend build

## Local Development

### Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm

### Clone And Run

```bash
git clone <your-repo-url>
cd EndfieldToolbox
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, typically `http://localhost:5173`.

### Helpful Scripts

```bash
npm run dev
npm run dev:lowmem
npm run type-check
npm run build
npm run preview
```

- `npm run dev`
  Starts the local development server.
- `npm run dev:lowmem`
  Starts Vite with lower memory usage and devtools disabled.
- `npm run type-check`
  Runs i18n coverage validation plus `vue-tsc`.
- `npm run build`
  Produces a production build.
- `npm run preview`
  Serves the production build locally.

## Data And Implementation Notes

- The project contains a larger raw/static dataset plus a curated app-facing data layer.
- Combat support is not uniformly complete across all operators and weapons.
- Some advanced mechanics are implemented deeply in the combat engine, while other content is still draft or partially modeled.
- The repo also includes helper scripts for character draft ingestion, audit checks, briefs generation, and localization maintenance.

## Relatively Complete Characters

These operators are currently among the more complete implementations in the repo, relative to the rest of the roster:

- Laevatain
- Ardelia
- Wulfgard
- Akekuri
- Rossi
- Perlica
- Gilberta
- Last Rite
- Yvonne

Implementation depth still varies, and behavior may change as more engine systems and data coverage are added.

## Verification

The current repo was checked with:

- `npm run type-check`
- `npm run build-only`

The production build succeeds. The build currently emits Vite chunk warnings about circular dependencies between the character/data chunks and combat core, which is useful to know but does not block the build.

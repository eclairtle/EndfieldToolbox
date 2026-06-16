# Rotation Engine Architecture

This note documents the current combat/rotation simulation architecture and proposes a staged refactor plan.

The goal is not to rewrite the engine immediately. The goal is to make future work safer by naming the main subsystems, clarifying data flow, and outlining an incremental plan to reduce risk in `simulateRotation.ts`.

## Current Architecture

The simulation pipeline currently has four main phases.

### 1. Build Snapshot Phase

Primary file:
- `src/lib/combat/buildSnapshots.ts`

Responsibilities:
- Read build-store state for a slot.
- Resolve character, weapon, and gear data.
- Compute final stats and static modifiers.
- Resolve character commands and execute hits at skill level.
- Apply command-level modifier rewrites such as ultimate cost reduction.
- Append generic commands and generic execute hits.

Output:
- `CharacterCombatSnapshot`

This snapshot is the main pre-battle runtime input for a character.

### 2. Command Resolution Phase

Primary file:
- `src/lib/commands.ts`

Responsibilities:
- Define the command schema.
- Resolve scaling tables into level-specific values.
- Resolve hit effects into concrete values.
- Apply build-condition filtering.
- Apply runtime transforms such as enhanced commands and finisher transforms.

Key concepts:
- `CommandDefinition`
- `ResolvedCommandAtLevel`
- `resolveCommandsAtLevel(...)`
- `resolveExecuteHitsAtLevel(...)`
- `resolveCommandTransform(...)`

This layer is effectively the declarative combat DSL for characters.

### 3. Rotation Compilation Phase

Primary file:
- `src/lib/combat/compileRotationTimeline.ts`

Responsibilities:
- Turn user-authored rotation steps into executable actions.
- Compute time-freeze extensions.
- Resolve real time vs game time offsets.
- Apply interruption/cancel rules between actions.
- Produce a compiled action list with start/end times.

Output:
- `CompiledRotationAction[]`
- `RotationTimeExtension[]`
- `RotationTimeContext`

This layer is the scheduler for player intent before combat effects are applied.

### 4. Simulation Phase

Primary file:
- `src/lib/combat/simulateRotation.ts`

Responsibilities:
- Initialize mutable runtime state.
- Expand compiled actions into occurrences:
  - action start
  - hits
  - action end
- Process occurrences in chronological order.
- Apply status, buff, reaction, damage, healing, stagger, SP, and energy logic.
- Queue delayed execute hits and arts bursts.
- Emit combat events.
- Dispatch event listeners for:
  - character hooks
  - gear sets
  - weapons
- Record outputs for the UI and debug tooling.

Outputs:
- damage timeline
- actor snapshots
- enemy snapshots
- combo windows
- event stream
- warnings
- debug traces

This file is currently the runtime engine, event bus, status manager, effect processor, and recorder all in one.

## Current Runtime State Model

The runtime state is split across several representations.

### Snapshot-Like Inputs

- `CharacterCombatSnapshot`
- `EnemyResolvedStats`
- compiled rotation actions

These are mostly immutable inputs.

### Mutable Runtime State in `simulateRotation.ts`

- actor buff arrays
- enemy debuff arrays
- unified statuses
- dedicated enemy infliction state
- pending execute-hit queues
- combo cooldown maps
- combo trigger windows
- listener cooldown/counter maps
- build variant tracking
- HP and stagger state

### Output State

- `DamageTimelineEntry[]`
- `ActorCombatStateSnapshot[]`
- `EnemyCombatStateSnapshot[]`
- `RotationCombatEvent[]`

This split works, but it means the simulator owns both the canonical runtime state and all derived recording logic.

## What Is Working Well

- The command/effect system is flexible enough to implement many characters without engine rewrites.
- Hooks plus event listeners give characters, gear, and weapons a common extension surface.
- The split between build snapshot, command resolution, timeline compilation, and simulation is conceptually sound.
- The engine already supports advanced timing features:
  - real time vs game time
  - time freeze
  - delayed hits
  - transformed commands
  - combo trigger windows

## Main Structural Risks

### 1. Simulator Scope Creep

`simulateRotation.ts` is the main architectural pressure point.

It currently owns:
- state storage
- state cleanup
- event emission
- listener dispatch
- hit execution
- status application
- snapshot recording
- combo runtime
- enemy action window handling
- debug capture

This is the biggest maintenance risk in the engine.

### 2. Split Runtime State

The engine has a `UnifiedCombatStatus` model, but not all temporary combat state lives there.

Examples of state that still lives outside the unified model:
- actor buffs
- enemy debuffs
- arts infliction
- physical infliction
- combo cooldown maps
- pending execute queues

This makes it harder to reason about invariants and harder to build generic tooling on top of the runtime.

### 3. Repeated Array Scanning in Hot Paths

Many runtime queries filter full arrays repeatedly:
- actor buffs by slot
- enemy statuses by id
- status stack counts
- snapshot recording
- effective modifier assembly

This is acceptable for current scale, but the cost and complexity will both grow as more passive systems are added.

### 4. Hook Context Duplication

The hook state facades for:
- `onResolvedHit`
- `onEvent`
- `onActionStart`

are manually assembled in multiple places inside the simulator.

That makes new hook helpers easy to forget in one context.

### 5. Hard-Coded Scheduling Rules

Action cancellation and overlap rules are readable today, but they are encoded as engine logic rather than data or a more explicit policy layer.

That is fine for now, but it will become more brittle as more special action types are introduced.

## Refactor Goals

The refactor should preserve behavior while improving these qualities:

- local reasoning
- testability
- runtime query consistency
- lower regression risk for new characters
- smaller surface area per file

The refactor should be incremental. Large rewrites are likely to destabilize combat behavior.

## Target Architecture

The engine should gradually move toward five explicit layers.

### 1. Definitions Layer

Files:
- `commands.ts`
- character command data
- weapon/gear effect definitions

Responsibilities:
- declarative skill/effect definitions
- no mutable runtime state

### 2. Snapshot Builder Layer

Files:
- `buildSnapshots.ts`

Responsibilities:
- produce immutable battle-ready actor snapshots

### 3. Timeline Compiler Layer

Files:
- `compileRotationTimeline.ts`

Responsibilities:
- convert user steps into executable scheduled actions

### 4. Runtime Engine Layer

Suggested future modules:
- `runtimeState.ts`
- `effectProcessor.ts`
- `eventBus.ts`
- `occurrenceRunner.ts`
- `snapshotRecorder.ts`

Responsibilities:
- own mutable state
- advance time
- execute occurrences
- dispatch events
- record outputs

### 5. Extension Layer

Files:
- character combat hooks
- `gearSetEffects.ts`
- `weaponEffects.ts`

Responsibilities:
- react to engine events through stable hook APIs
- avoid direct engine-state mutation patterns beyond exposed helpers

## Staged Refactor Plan

This plan is ordered from lowest-risk extraction to highest-value restructuring.

### Phase 1. Document and Stabilize Interfaces

Goal:
- reduce accidental coupling before moving code

Tasks:
- document runtime concepts and invariants
- define the intended meaning of:
  - real time
  - game time
  - action occurrence
  - resolved hit
  - unified status
  - actor buff
  - combo trigger window
- centralize shared helper types for hook contexts and runtime queries

Expected benefit:
- easier future extractions without semantic drift

### Phase 2. Extract Hook Context Builders

Goal:
- remove duplicated hook-state facades

Tasks:
- move `onResolvedHit`, `onEvent`, and `onActionStart` context assembly into dedicated helpers
- define a shared runtime query surface used by all hook types

Expected benefit:
- adding a new helper method becomes one change instead of several

### Phase 3. Extract Event Bus and Listener Dispatch

Goal:
- separate state mutation from listener orchestration

Tasks:
- move event emission and passive-listener dispatch into a dedicated runtime event bus module
- keep listener debug recording there as well

Expected benefit:
- clearer distinction between:
  - what happened
  - who reacts to it

### Phase 4. Extract Status/Buff Store

Goal:
- make runtime state more queryable and less ad hoc

Tasks:
- wrap actor buffs, enemy debuffs, unified statuses, and infliction state behind a single runtime state store API
- preserve existing behavior, but stop letting most simulator logic touch raw arrays directly
- add indexed access helpers by:
  - slot
  - scope
  - status id
  - buff id

Expected benefit:
- fewer repeated scans
- easier invariants
- easier future UI/debug introspection

### Phase 5. Extract Effect Processing

Goal:
- reduce the giant branching logic inside hit-effect application

Tasks:
- move `APPLY_*`, `REMOVE_*`, `EXECUTE_HIT`, reaction, and status effect handling into a dedicated effect processor
- consider a handler registry keyed by effect type

Expected benefit:
- each effect family becomes easier to test and extend in isolation

### Phase 6. Extract Occurrence Runner

Goal:
- isolate chronological execution from effect semantics

Tasks:
- separate occurrence queue building from occurrence execution
- separate:
  - action-start handling
  - hit handling
  - action-end handling
  - delayed execute-hit processing

Expected benefit:
- clearer simulation control flow
- easier debugging of timing bugs

### Phase 7. Normalize Runtime Snapshots

Goal:
- make recording a consumer of runtime state rather than partially re-deriving it

Tasks:
- move actor/enemy snapshot recording into a recorder module
- record from runtime-store queries instead of direct array access

Expected benefit:
- less duplicated state interpretation

## Suggested First Refactor Slice

If only one small refactor is done soon, it should be:

1. Extract hook context builders.
2. Extract passive listener dispatch.
3. Extract a `RuntimeStatusStore` facade without changing behavior yet.

This gives the best reduction in simulator complexity without forcing a risky rewrite of damage or timing logic.

## Testing Strategy for Refactors

Refactors should be gated by behavior-focused tests rather than line-by-line rewrites.

Recommended coverage:
- command transform behavior
- combo trigger/cooldown behavior
- delayed execute-hit timing
- time-freeze interaction with action timing
- status expiration and periodic effects
- representative character regression tests for complex kits:
  - Zhuang Fangyi
  - Tangtang
  - Arclight
  - Laevatain

If possible, add snapshot-style tests for:
- event streams
- combo windows
- damage timelines

These are likely to catch regressions earlier than raw damage-only assertions.

## Non-Goals

The following should not be attempted in the first refactor pass:

- rewriting all character hooks
- replacing the command schema
- changing combat math formulas
- redesigning rotation UI state
- fully unifying every runtime concept into one object immediately

The initial refactor should focus on structure, not behavior changes.

## Summary

The engine already has a good conceptual split between:
- snapshot building
- command resolution
- rotation compilation
- runtime simulation

The main issue is that the runtime simulation layer has become too centralized.

The safest long-term path is to keep the existing combat model, but progressively extract:
- hook context builders
- event dispatch
- runtime state storage
- effect processing
- occurrence execution

That should make future character and system work faster, safer, and easier to review.

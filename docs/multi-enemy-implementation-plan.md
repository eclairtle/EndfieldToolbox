# Multi-Enemy Implementation Plan

This note records the agreed plan for adding multiple enemies to the rotation simulator.

The goal is to support up to 10 enemy slots in rotation, preserve current single-enemy behavior as a compatibility case, and avoid overloading old legacy fields such as command `mode`.

## Core Goals

- The rotation UI supports up to 10 enemy slots.
- There is always one `targeted enemy`.
- `targeted enemy` defaults to the first enemy slot.
- Commands and hits target all enemies by default.
- Commands and hits may explicitly target only the targeted enemy.
- Damage and enemy-facing effects resolve per enemy slot, not globally.
- Event emission remains per occurrence, not per affected enemy.

## UI Model

- The rotation timeline includes an enemy row.
- Enemy row is a flex row with enemy cards/avatars and a trailing `+` button.
- Clicking `+` appends a new enemy slot until the cap of 10 is reached.
- One enemy slot is marked as the targeted enemy.
- Target selection is part of rotation state, not UI-only state.
- Enemy action configuration becomes per enemy slot, not per enemy base id.

## Enemy Runtime Model

Enemies should follow a slot-based runtime model structurally similar to characters, but they should remain a separate domain type.

Recommended shape:

- `enemySlots[]`
  - `slotId`
  - `enemyId`
  - `level`
  - action placements
  - current combat state
- `targetedEnemySlotId`

Reasons:

- Reduces architectural mismatch with character slots.
- Allows multiple copies of the same enemy base id.
- Makes phase transitions, summons, and target selection slot-local.

## Command / Hit Targeting Model

Do not reuse the removed legacy `mode` field.

Add a new targeting field with inheritance similar to `attackType` and `damageType`.

Recommended shape:

- command-level: `targets?: "all_enemies" | "targeted_enemy"`
- hit-level: `targets?: "all_enemies" | "targeted_enemy"`

Rules:

- command default is `"all_enemies"`
- hit default is command `targets`
- current command data does not need to be edited
- future single-target commands can opt in
- future mixed-target commands can override per hit

## Resolution Rules

### Damage / Effect Resolution

One hit occurrence may resolve against one or many enemy slots.

Rules:

- damage is resolved individually per enemy slot
- enemy-targeted effects are resolved individually per enemy slot
- status application / consumption / reactions are per enemy slot
- enemy HP, stagger, invulnerability, and transformations are per enemy slot

### Event Emission

Events should represent occurrences, not targets.

Rules:

- one hit occurrence emits at most one hit event
- hit event only fires if at least one enemy was successfully affected
- one enemy-facing status application effect emits at most one application event
- one consumption effect emits at most one consumption event

### Aggregate Event Data

Even though only one event is emitted per occurrence, the event should expose multi-enemy resolution details.

Recommended event payload fields:

- `affectedEnemySlotIds: string[]`
- aggregate totals where relevant, for example:
  - `totalStacksConsumed`
  - `totalApplicationsSucceeded`

This supports mechanics like:

- Laevatain consuming 1 Heat Infliction from each of 4 enemies and gaining 4 total Molten Flame stacks
- Ardelia triggering from a Final Strike that hit multiple enemies if any one of them satisfies the condition

## Enemy-State Conditions

Enemy-state-dependent conditions must resolve against an explicit enemy slot context.

Rules:

- if a condition is evaluated during per-enemy damage/effect resolution, it uses that enemy slot
- if a condition is evaluated at a global stage such as command cast, it defaults to the targeted enemy

Recommended implementation rule:

- helper APIs accept optional `enemySlotId`
- if omitted, they default to `targetedEnemySlotId`

## Event State Access

Do not proliferate special derived event flags such as:

- `hadVulnerabilityBefore`
- `hadArtsInflictionBefore`
- `hpRatioBefore`

Instead, events should expose:

- `affectedEnemySlotIds`
- event-time enemy-state access helpers or equivalent bound context

Listeners can then query enemy state at the event moment for a specific enemy slot.

This keeps the event payload compact and future-proof.

## Enemy Actions

Enemy actions must become slot-local.

Current issue:

- enemy actions are keyed by enemy base id
- this does not support duplicate enemy instances

Target model:

- enemy actions are keyed by enemy slot id
- transformations mutate only that enemy slot
- default actions are seeded per slot based on its enemy base id

## Timeline / Result Model

The result model must become enemy-slot-aware.

Required additions:

- damage timeline entries identify which enemy slot they hit
- enemy state timeline entries identify which enemy slot they belong to
- enemy action windows identify which enemy slot they belong to

Recommended approach:

- add `targetEnemySlotId?: string` to damage timeline entries
- add `enemySlotId: string` to enemy state snapshots
- add `enemySlotId: string` to enemy action windows

## Compatibility / Migration Strategy

Implement in stages.

### Stage 1: Data Model Foundations

- remove legacy command `mode`
- add command/hit targeting fields with defaults
- add enemy slot state types
- add targeted enemy slot id
- keep compatibility fallbacks for old single-enemy saved state

### Stage 2: Rotation State

- replace singleton enemy selection with `enemySlots[]`
- migrate persisted rotation schemes
- keep legacy `selectedEnemyId` / `enemyLevel` loading support

### Stage 3: UI

- add enemy row with `+`
- add targeted enemy selection
- move enemy action editing to per-slot state

### Stage 4: Simulator

- convert singleton enemy state to per-slot state
- resolve hit targeting through command/hit targeting fields
- emit one event per occurrence with multi-enemy aggregate data

### Stage 5: Listener / Condition APIs

- add enemy-slot-aware helper APIs
- default global queries to targeted enemy
- allow listeners to inspect each affected enemy slot

### Stage 6: Content Pass

- annotate commands/hits that should be targeted-only
- verify mechanics like Laevatain and Ardelia

## Important Non-Goals For Early Stages

- Do not fully rewrite the simulator in one pass.
- Do not force enemies and characters into one literal shared type.
- Do not add many bespoke event booleans when enemy-slot state queries can answer the same question.

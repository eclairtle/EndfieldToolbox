## Multi-Rotation Relay Plan

This note records the agreed plan for making long simulations more rigid by splitting a build into up to four ordered rotations, with each later rotation able to either start independently or relay from the previous rotation's exported runtime state.

## Goals

- Increase per-build rotation capacity from 2 to 4.
- Reduce the maximum steps in each rotation from 256 to 128.
- Let each rotation after Rotation 1 choose between:
  - `independent`
  - `relay_from_previous`
- Preserve a rotation's independent-only setup even when that rotation is switched into relay mode.
- Make relay boundaries explicit so invalidation is predictable:
  - editing Rotation 1 recomputes 1 -> 4
  - editing Rotation 2 recomputes 2 -> 4
  - editing Rotation 3 recomputes 3 -> 4
  - editing Rotation 4 recomputes 4 only
- Allow a rotation to export an earlier handoff point through a trigger action instead of always handing off at its end.

## Core Model

Each rotation scheme remains a persisted object in `RotationSchemesState.schemes`, but gains relay metadata:

- `simulationMode: "independent" | "relay_from_previous"`

Notes:

- Rotation 1 always behaves as independent, even if a bad persisted value says otherwise.
- Rotations 2-4 may choose either mode.
- Relay mode never deletes independent settings. It only makes the simulator ignore them and the UI grey them out.

## Independent Settings That Must Be Preserved

These settings continue to live on every rotation scheme even when the scheme is currently relayed:

- active contingency contracts
- custom triggers
- custom trigger variables
- battle-start SP / team SP config
- per-slot starting energy
- battle-start consumables
- any future independent-only pre-battle setup

When a scheme is relayed:

- these settings stay persisted
- these settings stay editable only after switching back to independent
- the simulator does not read them for that scheme while relay mode is active

## Relay Inheritance

When Rotation N is in `relay_from_previous` mode, it inherits from Rotation N-1:

- current real time and game time
- actor HP / statuses / buffs / active build variants
- enemy runtime state
- targeted enemy
- controlled operator
- contract runtime consequences that already exist in state
- custom/internal trigger runtime enabled state
- trigger variables
- pending trigger resumes
- pending execute hits
- pending Arts bursts
- countdown timeline state still relevant after handoff
- any other queued runtime work stored in the simulation checkpoint

Relay mode does not inherit:

- the previous rotation's authored steps
- the previous rotation's authored enemy command placements as editable data

## Relay Export Point

By default, a rotation exports its final simulation checkpoint.

We also introduce a trigger action:

- `RELAY_ROTATION`

Behavior:

- It marks the current runtime point as a candidate handoff checkpoint.
- The next rotation uses the earliest such export point.
- If no export point exists, the next rotation uses the final checkpoint.

Why earliest:

- It gives authors a deterministic "handoff now" tool.
- It avoids ambiguity when multiple relay markers are created.

## UI Rules

### Rotation Count

- Maximum rotations per build becomes 4.
- Maximum steps per rotation becomes 128.

### Mode Switching

- Rotations 2-4 show a mode toggle:
  - `Independent`
  - `Relay`
- Rotation 1 does not offer relay mode.

### Greyed-Out Sections In Relay Mode

When a rotation is relayed, the following sections stay visible but are disabled:

- contracts
- trigger editor
- team SP / battle-start setup
- any other independent-only initialization controls

The purpose is to preserve user-authored settings so switching back to independent mode restores them instantly.

### Relay Explanation

Relay mode should have a compact description near the toggle:

- This rotation inherits state from the previous rotation's relay point.
- Independent setup is preserved but currently ignored.

## Simulation Strategy

The simulator should move toward explicit per-rotation chaining rather than one giant monolithic cache.

High-level flow:

1. Simulate Rotation 1 independently.
2. Export a relay checkpoint from Rotation 1.
3. If Rotation 2 is relayed, simulate Rotation 2 from that checkpoint.
4. Repeat for Rotations 3 and 4.

If a rotation is independent:

- it starts from normal build state
- it ignores the previous rotation's exported checkpoint
- later relayed rotations chain from that independent rotation instead

## Invalidation Rules

The chain should invalidate from the earliest changed rotation onward.

Examples:

- Edit Rotation 1:
  - recompute Rotation 1, then 2/3/4 if they depend on it
- Edit Rotation 2:
  - keep Rotation 1
  - recompute Rotation 2, then 3/4 if they depend on it
- Toggle Rotation 3 from independent to relay:
  - keep Rotations 1 and 2
  - recompute Rotation 3 and 4

Changing relay mode is therefore a structural invalidation from that rotation onward.

## Persistence / Migration

Persisted schemes should migrate safely:

- old schemes become `simulationMode: "independent"`
- `relayExportMode` defaults to `rotation_end`
- no existing trigger/contract/team-SP data is removed

## First Implementation Pass

The first pass should focus on structure:

1. Extend `RotationScheme` with relay metadata.
2. Migrate persisted state.
3. Raise rotation cap to 4.
4. Lower step cap to 128.
5. Add UI mode controls and greying behavior.
6. Add a placeholder `RELAY_ROTATION` trigger action to the trigger schema/UI.

The second pass should wire chained simulation:

1. export/import relay checkpoints between adjacent rotations
2. bypass independent-only initialization for relayed rotations
3. add rotation-level invalidation / caching

## Open Notes

- Relay mode should remain strictly adjacent: Rotation 3 may only relay from Rotation 2.
- The exported relay checkpoint should include pending trigger actions and queued delayed effects.
- The long-term goal is to make cross-rotation relay the primary optimization path, with intra-rotation checkpoints becoming a secondary acceleration layer rather than the only strategy.

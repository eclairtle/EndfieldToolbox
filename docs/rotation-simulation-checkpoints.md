# Rotation Simulation Checkpoints

This note documents the checkpoint/invalidation foundation for long-rotation simulation.

## Current state

The simulator still executes as a full deterministic replay through `simulateRotation()`.
We now have a shared cache wrapper in `src/lib/combat/simulationCache.ts` that adds:

- Exact-input cache reuse
- Explicit invalidation classification
- 15s checkpoint summaries over the result timeline

This is the safe first pass before true partial replay.

## Invalidation rules

`timeline_local`

- Rotation steps/groups changed
- Enemy action windows changed

For these changes we compute an `earliestTime` and map it to a 15s chunk index.
This is the basis for future replay from the latest checkpoint before that time.

`full`

- Party changed
- Party variant snapshots changed
- Enemy slots changed
- Targeted enemy changed
- Enemy base stats/modifiers changed
- Battle-start consumables changed
- Contracts changed
- Custom triggers changed
- Trigger variables changed

These edits can affect the whole simulation state, so they currently require a full replay.

`exact`

- Inputs are identical, so the prior result can be reused directly.

## Why replay checkpoints are not fully wired yet

True resume-from-checkpoint replay needs more than HP/buffs snapshots. The simulator has
stateful delayed work that must also be restored, including:

- Pending execute hits
- Pending arts bursts
- Pending trigger resumes / waits / countdowns
- Trigger enabled/runtime state
- Trigger variables
- Enemy spawn/death/replace state
- HP clamp history windows
- Combo windows and cooldown bookkeeping
- Control / targeted-enemy runtime state

Because of this, the current pass stores checkpoint summaries and invalidation metadata first,
without changing combat semantics.

## Next implementation step

Add a serializable `SimulationCheckpoint` that captures full runtime state at a chunk boundary,
then extend `simulateRotation()` with:

- `resumeFromCheckpoint`
- `resumeOccurrenceIndex`

At that point, `timeline_local` invalidations can replay only from the latest valid checkpoint
before `earliestTime`.

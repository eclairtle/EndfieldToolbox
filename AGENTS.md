# Agent guidance

## Simulation performance

- Preserve incremental checkpoint recomputation. A change after a checkpoint must not require reconstructing or rescanning the whole rotation or its preceding relay chain unless the changed input genuinely invalidates that earlier state.
- Apply this rule to UI-derived state as well as the combat engine. Timeline validation, cursor state, resource displays, warnings, and debug views should start from the nearest valid checkpoint or use precompiled/indexed simulation output; do not repeatedly scan complete inherited histories for each command or event.
- Avoid algorithms shaped like `suffix events × full rotation history`. Keep histories time-indexed and inspect only the latest state at or before an interval plus changes inside that interval.
- When changing simulation or timeline reconstruction, benchmark both a cold run and a late-step edit in a long relayed template such as Contingency Contracts. Check elapsed time in addition to the reported number of recalculated checkpoint regions, because expensive work outside the region counter can otherwise be hidden.
- A mandatory full reconstruction is acceptable only for global input changes that make every checkpoint invalid. Document any new full-invalidation case and why a checkpoint cannot safely carry the required state.

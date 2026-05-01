# Combat Status Schema (Single Source of Truth)

This document defines the only supported runtime status schema for combat simulation.

If a new mechanic needs state over time, model it as a runtime status instance using the schema below.
Do not add parallel ad-hoc containers (for example, new `timedXxx` arrays).

## Canonical types

Code ownership:
- `src/lib/combat/statusModel.ts`
- `src/lib/combat/simulateRotation.ts`

Core status instance shape (`RuntimeStatusInstance`):
- `id: string`
- `label: string`
- `kind: string`
- `scope: "actor" | "enemy" | "team" | "global"`
- `ownerSlot?: number`
- `targetSlot?: number`
- `stackCount?: number`
- `expiresAt?: number`
- `timeScale?: "real" | "game"`
- `metadata?: Record<string, unknown>`
- `hidden?: boolean`

## Kinds currently in use

- `reaction_status`
  - Enemy reaction-like states (for example: `combustion`, `corrosion`, `solidification`, `vulnerability`, `breach`).
- `effect_status`
  - APPLY_STATUS runtime entries (initial + periodic + expire effect execution).
- `actor_buff`
  - Character-local buff entries that contribute to resolved actor modifiers.
- `team_status`
  - Team-wide statuses (for example: stacks shared by team logic).
- `link_status`
  - Link stacks represented as runtime statuses.

## Access pattern

Always use typed encode/decode + accessors in `simulateRotation.ts`:
- `getEnemyStatuses()` / `setEnemyStatuses()`
- `getEffectStatuses()` / `setEffectStatuses()`
- `getActorBuffs()` / `setActorBuffs()`

Never read/write `runtimeStatuses` directly from unrelated helper code when a typed accessor exists.

## Time model

- `expiresAt` is interpreted with `timeScale`.
- `timeScale: "game"` means game timeline seconds.
- `timeScale: "real"` means real timeline seconds.
- Convert with existing helpers when crossing timelines.

## Extension rules

When implementing a new status mechanic:
1. Add/extend a typed metadata interface in `statusModel.ts`.
2. Add decode/encode handling in the relevant accessor path.
3. Reuse existing status `kind` when semantically aligned; add a new kind only when behavior/model is truly distinct.
4. Ensure visibility behavior is explicit (`hidden` when needed).
5. Add i18n/display label handling through existing status rendering pipeline.

## Guardrails

- Do not introduce new legacy containers such as `timedEnemyStatuses`, `timedEffectStatuses`, or `timedActorBuffs`.
- Do not duplicate the same status concept in two different stores.
- Prefer status `metadata` over one-off top-level fields.

## Quick checklist for PRs

- [ ] New timed mechanic uses `RuntimeStatusInstance`.
- [ ] No new ad-hoc status arrays/maps were introduced.
- [ ] Access goes through typed getters/setters.
- [ ] Expiration and timeline conversion are correct.
- [ ] Status is visible/hidden intentionally.
- [ ] `npm run type-check` passes.

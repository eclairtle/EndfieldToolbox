# Thread Handoff - 2026-07-12

This note summarizes the main progress, design decisions, and unresolved areas from the long implementation thread so a new conversation can resume without rediscovering the same context.

## High-Level Progress

- Added and iterated on several operator implementations, especially Zhuang Fangyi, Alesh, Mifu, Camille, Estella, Antal, Rossi fixes, and related command/talent mechanics.
- Expanded combat engine support for multi-enemy simulation, enemy lifecycle, enemy transformation/replacement, death/spawn state, and target enemy handling.
- Added a custom trigger system with editor UI, variables, conditions, actions, script editing, internal triggers, trigger import/export, wait/countdown/relay actions, and runtime execution.
- Added contingency contract UI and many contract data/effect improvements, including icon grid layout, grouping/aliases, Chinese/English sourced text, internal trigger-backed contracts, and contract-specific damage modifier handling.
- Added multi-rotation relay support with relay points, relayed initial state, cumulative display time, pending trigger/action carryover work, and relay timeline markers.
- Did broad localization work for statuses, weapons, gearsets, commands, hit names, modifier labels, consumables, contract labels, and assorted UI gaps.
- Added or updated template builds multiple times, including Zhuang/Rhodagn, Zhuang/Nefarith, Last Rite/Rhodagn, Estella contingency contract, and multi-round contingency templates.

## Recent Switch/Controlled Operator Investigation

The most recent bug concerned switch actions before cumulative `t = 0`.

Important finding:
- Pre-battle switch actions existed in the rotation data and could be displayed after removing a UI filter, but they were warning as `switchOnCooldown`.
- The actual cooldown bug was a hidden `t = 0` assumption: missing switch cooldown entries defaulted to `0`.
- For a switch at negative time, `switchBackLockedUntilBySlot.get(slot) ?? 0` treated "no cooldown" as "locked until battle start."

Fix applied:
- Added `NO_SWITCH_LOCK_UNTIL = Number.NEGATIVE_INFINITY`.
- Replaced switch cooldown default lookups in `RotationWorkspace.vue` and `simulateRotation.ts`.
- Removed UI `Math.max(0, cursorTime)` from switch cooldown comparison so negative cumulative time is respected.

Related changes from earlier passes:
- Switch actions are no longer filtered out of `laneActions()`, so they can display like other commands.
- Basic attack insertion from detailed command list now redirects to the canonical controlled slot because many basic sequence parent commands are not marked `requiresControlledOperator`.
- Detailed switch insertion routes through `executeSwitchToSlot(...)` instead of raw generic insertion.
- `controlledOperatorSlot` was added to rotation setup state and simulation args/results, but pre-battle switching should still place a real switch action. Do not convert negative-time switch into initial-state mutation.

Model intent clarified by user:
- Battle initial time for independent rotations is the beginning of the first action or cumulative `t = 0`, whichever is earlier.
- Pre-battle means cumulative `t < 0`.
- Controlled operator should be initialized at simulation start time, which can be negative, and switch actions should freely modify it before cumulative `t = 0`.
- Relayed rotations cannot have local actions before local `t = 0`, but a relay may happen while cumulative time is still negative.

## Controlled Operator Design Notes

Current implementation is still split:
- `teamSpConfig.controlledOperatorSlot` stores initial control.
- `simulateRotation.ts` has runtime `controlledOperatorSlot`.
- UI reconstructs control state in `RotationWorkspace.vue`.
- Validation replays switch state separately.
- Some command insertion paths still need careful review when adding new UI controls.

The user's preferred conceptual model:
- Treat controlled operator like a singleton operator status.
- Simulation start applies controlled status to one operator.
- Switch action applies controlled status to its operator.
- Applying controlled status removes it from all other operators.
- All queries check the same status/state source.

We have not fully rewritten to that model. The recent fixes only reduce the drift.

## Trigger System State

Implemented:
- Trigger popup split into its own component.
- Custom variables with types and initial values.
- Trigger conditions with comparator and logic groups.
- Nested actions, `IF_THEN_ELSE`, `FIRE_TRIGGER`, `STOP_TRIGGER`, `BREAK`, `WAIT`, `COUNTDOWN`, `RELAY_ROTATION`, `REPLACE_ENEMY`, `EXECUTE_HIT`, status apply/remove, HP modification, variable modification, enable/disable trigger.
- Script tab supports raw JSON editing.
- Internal trigger foundation exists; internal triggers do not occupy the 32 custom trigger limit.
- `Export All Triggers` copies custom variables and custom triggers.
- `Import Triggers` accepts a single trigger script or a bulk `{ variables, triggers }` script.
- Bulk import now merges by id instead of replacing.

Recent trigger import/export behavior:
- Single trigger import adds or updates by trigger id.
- Bulk import merges variables and triggers by id, appending until max limits.
- Export/copy status labels were added.

Watch-outs:
- Trigger action/condition schemas are growing quickly. Invalid references should be ignored rather than crashing.
- Trigger runtime and UI schemas should stay aligned; several past bugs came from editor fields not exposing expression types already supported in JSON.

## Multi-Enemy State

Implemented or partly implemented:
- Multiple enemy slots up to 10.
- Target enemy slot separate from selected enemy editor slot.
- Enemy slot lifecycle: not spawned, active, dead.
- Spawn time option.
- No Death option.
- Enemy death event.
- Enemy replacement/transformation via trigger action and built-in enemy behavior.
- Enemy lifecycle markers in timeline for spawned/defeated/replaced/transformed.
- Finisher targeting rule chooses first enemy with finisher-available status and consumes it on that enemy.
- Contract enemy HP and modifiers should apply per enemy, including spawned enemies.

Design intent:
- Hits default to all enemies unless explicitly single/finisher targeted.
- Hit events should fire once per hit even if multiple enemies are affected.
- Status application events should fire once per effect, with affected enemy group exposed.
- Conditions resolved in per-enemy damage/effect context should check that enemy; global/cast contexts default to targeted enemy.

Watch-outs:
- Status and reaction application must use the shared status pipeline so contracts such as Encasement see the events.
- Periodic damage/status ticks must extend simulation/tally end time.
- Enemy UI state must update on periodic/status damage, not only command hits.

## Relay Rotations

Implemented or partly implemented:
- Builds support up to 4 rotations.
- Rotations 2-4 can be independent or relay-from-previous.
- Relayed rotations inherit state from a previous relay point.
- Cumulative display time is shown in UI while local simulation can run from local `t = 0`.
- `RELAY_ROTATION` trigger action adds relay marker.
- `ROTATION_RELAYED` trigger event fires at relayed rotation start.
- Relay marker shown on timeline as a vertical strip with localized label.

Design notes:
- Relayed rotation should construct its initial state from previous rotation relay point.
- Relay start point and relay markers are different concepts.
- Relay state must include resources, combo cooldowns, statuses, enemy runtime state, variables, pending trigger actions, pending execute hits, etc.
- Relayed rotations should grey/disable independent setup UI, but not delete its stored setup.

Watch-outs:
- Several bugs appeared from confusing relay marker exported by a rotation with the starting point of the next relayed rotation.
- There were issues with SP/energy relay that moved toward checkpoint-native resource state.
- Relayed rotations may start while cumulative display time is negative, even though local time is zero.

## Contingency Contracts

Implemented or partly implemented:
- Contract data updated from Warfarin wiki API for EN/CN names/descriptions.
- Contract popup displays icon grid with grouped families and group aliases.
- Some hidden/WIP handling changed over time; WIP label was removed once internal trigger-backed work began.
- Contract damage modifier now has its own multiplier region separate from normal modifier stats.
- Contract flat modifiers added for damage clamping.
- Contract token statuses added for visibility even when effects are not ordinary modifier stats.

Important behavior:
- Contract damage modifiers stack multiplicatively and are not clamped to a minimum.
- Team: Bent Edges / bladebreaking-style contract damage can reduce damage to zero.
- Team: Encumbered uses global status to disable natural SP recovery and suppression triggered by final strike/finisher hits.
- Edit: Encasement tracks arts infliction/vulnerability stacks on enemies and applies residual removal delay.
- Edit: Rush clamps damage based on max HP and HP change within 0.1s.
- Edit: Regeneration is trigger-backed, applying regeneration status for the event crowd-control duration.

Watch-outs:
- Some contracts are implemented as internal triggers and should expose statuses/expressions needed by the trigger editor.
- Status update events should observe status lifecycle without changing lifecycle behavior.

## Status System Notes

Significant work was done toward a unified status model:
- Status change log added.
- Status update/end events added.
- Field status changed toward a flag rather than a category.
- Sunderblade modeled as a self status with field-effect flag.
- Infinite duration statuses should display without fake large durations.
- Player-side arts inflictions and reactions began implementation.

Player-side reaction behavior:
- Player-side reactions occur when one element reaches 4 stacks, not by mixing elements.
- Player-side solidification immobilizes/nullifies commands and prevents cast events/sp consumption.
- Player-side combustion deals immediate and periodic enemy-to-operator damage.

Watch-outs:
- Operator-side infliction stack display had a UI issue even when solidification correctly triggered.
- Apply Status trigger action should use the same status pipeline as command/effect application.

## Character/Weapon/Gear Highlights

Zhuang Fangyi:
- Implemented combo, battle skill, ultimate, Sunderblades, Force of Nature, potentials, enhanced battle skill behavior, Lone Barge interactions, resistance ignore, crit rigging for executed thunder strikes.
- Battle skill consumes all enemy electrification.
- Ultimate enhanced battle skill can create extra Sunderblades and avoid SP cost through status behavior.
- P5 resistance ignore is 15, not 20.
- Force of Nature eventually moved to simpler main/addition stack scheme.
- Sunderblade display had duplicate-stack investigations; hidden counter/status names may still need attention if it resurfaces.

Mifu:
- Implemented skill commands from Endaxis data and wiki.
- Battle skill variants use Trail and Mangle / World Splitter statuses.
- World Splitter should deal crush reaction damage through reaction pipeline.

Camille:
- Implemented skill commands and Firefang Vesperwings status logic.
- Battle skill dummy applies Firefang to main target before all-enemy heat hit.
- Firefang should transfer to next available enemy when its host dies.
- Enhanced Hunter Pursuit after ultimate is combo-skill type/damage.

Rossi:
- Skill names/localization fixed from wiki.
- Combo segment multipliers adjusted.
- Lift application should still happen even if vulnerability barrier blocks vulnerability.
- Seething Blood executed hits against Razor Clawmark enemies needed checking.
- Razor Clawmark persistence after enemy death/replacement was investigated.

Antal:
- Implemented focus model concept: Focus status removes focus from other enemies; reapply to same enemy refreshes; periodic enhancer stack; combo marker records reaction/infliction to replay.

Gear/Weapons:
- Added and moved several weapons from generated/drafts into proper category files.
- Added Xiranflow, Grizzled Edge, Qingbo, and newer gears from API.
- Fixed asset handling so new gear/weapon icons are local, not loaded live from wiki.
- HP percent gear modifiers needed correction.
- Chimeric Justice and Rational Farewell were promoted/implemented, with rank-appropriate generic boosts.
- Lone Barge's Battle Skill Electric DMG% required combined attack-type+element modifier handling.

## Localization Notes

Large amount of CN localization added:
- Gearset names/descriptions/statuses sourced from Warfarin CN pages/API.
- Weapon-derived statuses.
- Consumables from CN items API.
- Character commands/talents/statuses for many operators.
- Hit names for named skill/talent/reaction hits.
- Modifier stat labels.
- Contract names/descriptions/statuses.
- UI labels such as trigger editor, relay labels, damage breakdown, build list, summary fields.

Important wording:
- Ultimate = `终结技`.
- Final Strike = `重击`.
- Main/secondary attributes = `主能力` / `副能力`.
- Infliction labels should be `寒冷/灼热/电磁/自然附着`, not `Cryo/Heat/Electric/Nature法术附着`.
- Relay label in Chinese should be `前往{Chinese name of next rotation}`.

## Templates / Build List

Implemented:
- Build list supports localized names/descriptions.
- Template builds moved to dedicated templates section and no longer occupy user slots.
- Template edit/discard flow exists, but bugs were found where discard could preserve changes in memory.
- Build copying was fixed to preserve rotation state, triggers, contracts, rotations, enemy actions.
- Reset user data should restore template builds.

Watch-outs:
- Several old templates lacked consumables or had old Rhodagn opening actions.
- Ensure template replacement uses full build payload including `rotationState`.
- Copy/discard paths are high risk because past bugs lost non-template rotation data.

## Recent Files Touched Heavily

- `src/components/workspaces/RotationWorkspace.vue`
- `src/components/workspaces/rotation/RotationTriggersPopup.vue`
- `src/lib/combat/simulateRotation.ts`
- `src/lib/combat/rotation.ts`
- `src/lib/combat/rotationSchemes.ts`
- `src/lib/combat/simulationCache.ts`
- `src/lib/combat/triggers.ts`
- `src/lib/combat/contracts.ts`
- `src/lib/combat/combatDamage.ts`
- `src/data/defaultTemplateBuilds.json`
- `src/i18n/locales/en.ts`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/domain/*`

## Verification Habit

For code changes in this thread, the standard verification was:

```bash
npm run type-check
```

This runs the i18n coverage check and `vue-tsc --build`.


# Trigger System Plan

## Goals

The trigger system is a user-authored combat listener layer stored inside rotation builds.
Each trigger listens to a combat event, optionally checks one or more conditions, and then runs one or more actions.

This system should be powerful enough to express:

- existing contingency-contract listeners
- future preset triggers shipped by the project
- user-authored custom listeners that reference event participants dynamically

## Design Principles

### 1. Event fields should not be consumed directly

Trigger conditions and actions should never read ad hoc event fields like `slot`, `enemySlotId`, or `affectedEnemySlotIds` directly.
Instead, every event should expose a normalized alias surface.

Core aliases:

- `event_operator`
- `event_operator_group`
- `event_enemy_target`
- `event_enemy_group`
- `event_source_command`
- `event_source_hit`
- `event_time`
- `event_game_time`

Each event type declares which aliases are available.

### 2. Conditions and actions should both use nested expressions

Rather than hardcoding separate condition types like `enemy_identity` or `hp_ratio_compare`, the canonical model should use expression trees.

Conditions should be:

- `left`
- `comparator`
- `right`

where both `left` and `right` are typed expressions with nested arguments.

Actions should also use nested arguments, so things like `apply_status`, `remove_status`, and `modify_hp` can resolve dynamic targets and values through the same system.

### 3. Editor availability should follow event capabilities

When an event does not expose a given alias, trigger UI should hide or disable any condition/action arguments that depend on it.

Examples:

- `ULTIMATE_CAST` should expose `event_operator`, but not `event_enemy_group`
- `BATTLE_SKILL_HIT` should expose `event_operator`, `event_enemy_target`, and `event_enemy_group`
- `ENEMY_DEFEATED` should expose `event_enemy_target`, and may expose `event_operator` if defeat had an operator source

## Canonical Runtime Pieces

### Trigger event definition

Every trigger event type needs metadata:

- display label / description
- available aliases
- compatible condition subjects
- compatible action target references

### Trigger context

At runtime, a combat event should be converted into a trigger context that resolves aliases into concrete references.

The trigger context should expose:

- operator refs
- enemy refs
- source command / hit refs
- scalar values like time

### Expression AST

The expression model should separate:

- references
- derived values
- literals

Examples:

- reference: `event_enemy_target`
- reference: `enemy_in_slot(1)`
- derived value: `enemy_identity(event_enemy_target)`
- derived value: `hp_ratio(event_operator)`
- literal: `enemy_id_literal("rhodagn")`
- literal: `number_literal(0.25)`

### Conditions

Canonical condition format:

- `left expression`
- `comparator`
- `right expression`

Examples:

- `enemy_identity(event_enemy_target) equals enemy_id_literal("rhodagn")`
- `hp_ratio(event_operator) lte number_literal(0.25)`

### Actions

Actions should be effect-like nodes with expression arguments.

Initial planned actions:

- `apply_status`
- `remove_status`
- `modify_hp`
- `execute_hit`

Initial action arguments:

- target reference expression
- status id expression
- duration expression
- stacks expression

## Suggested Type Families

### Reference expressions

- operator reference expressions
- enemy reference expressions
- command reference expressions
- hit reference expressions

### Value expressions

- `enemy_identity(enemyRef)`
- `hp_ratio(unitRef)`
- `status_stack_count(unitRef, statusId)`
- literals for number / boolean / enemy id / status id

### Comparators

- `equals`
- `not_equals`
- `gt`
- `gte`
- `lt`
- `lte`

Each expression family should declare its output kind so the editor and validator can reject invalid comparisons.

## Initial Implementation Scope

### Phase 1

- Replace the temporary flat trigger schema with an AST-based schema
- Store triggers inside rotation schemes
- Add event capability metadata
- Keep current trigger popup working with a simplified editor that writes the new schema

### Phase 2

- Add full condition builder UI
- Add alias-aware target/value builders
- Add runtime trigger-context builder

### Phase 3

- Execute trigger actions in simulation
- Migrate suitable contingency contracts into prewritten triggers

## Compatibility Notes

- Existing saved trigger data from the temporary schema should be normalized into the new format where possible
- The current popup can remain a guided editor and does not need to expose arbitrary recursion yet
- The internal AST should still be canonical from this point onward

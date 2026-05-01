# Character Implementation Pipeline

This is the required implementation pipeline for adding or updating a character in `src/data/chars`.

## 1) Collect source data

- Wiki API source of truth (values/descriptions):
  - Primary endpoint: `https://api.warfarin.wiki/v1/en/operators/<slug>`
  - If live endpoint schema drifts or omits combat fields, use the repo's API-derived draft payload:
    - `src/data/chars/drafts/raw/<slug>.json`
    - or its parsed brief in `src/data/chars/drafts/briefs/<slug>.md`
- If API-derived sources still lack required combat data, use the public operator page as the next fallback:
  - `https://warfarin.wiki/en/operators/<slug>`
  - Extract skill/talent/potential text and map to explicit engine fields.
- `public/gamedata.json` is secondary and should be used primarily for:
  - timing
  - hit offsets/segment ordering
  - sequencing details not present in wiki data

Resource/effect values (cost, gain, cooldown, reaction/status duration, stack counts) must come from wiki API-derived data unless unavailable there.

## 2) Command/hit construction requirements

- Build command shells first (`basic`, `battleSkill`, `comboSkill`, `ultimate`) with IDs and attack types.
- Add sequence variants (`final_strike`, `dive_attack`, hidden enhanced variants) where applicable.
- Use `gamedata.json` to derive:
  - command duration
  - per-hit offsets
  - segment ordering

## 3) Mandatory hit-count parity check

For every command/segment:

- Count hit segments in `gamedata.json` and match them in `src` command hits.
- If source has multi-hit segments, explicitly decide:
  - `times + repeatIntervalFrames`, or
  - expanded explicit hits.
- Verify split behavior:
  - only use split-multiplier when intended by source semantics.

This is a hard gate: do not finalize character implementation until source-vs-src hit counts are reconciled.

## 3.5) Mandatory resource-and-duration sanity check

Before finalizing, explicitly verify that these values are sourced from wiki API-derived data, not blindly from `gamedata.json`:

- `spCost`
- `energyCost`
- `energyGain` / `energyReturn`
- `comboCooldownSeconds`
- status/reaction duration (`durationSeconds`)

If `gamedata.json` and wiki differ, prefer wiki and add an implementation note documenting the divergence.

## 4) Mandatory effect-to-hit mapping check

From API descriptions and skill blackboard keys:

- Identify which exact hit applies each of:
  - status
  - reaction
  - infliction
  - execute-hit followup
  - SP/energy return
- Map effects to the exact hit in `effects` or `postEffects`.
- If an effect is command-start behavior, use command `initialEffects`.
- If a trigger is event-driven (crit threshold, stagger node reached, etc.), implement via combat hooks/event listeners.

This is a hard gate: all described status/reaction applications must be attached to explicit hit or explicit event trigger.

## 5) Talent and potential tiering

- Implement unique talents as explicit tier keys (`..._1`, `..._2`, etc.) with unlock conditions.
- Avoid hardcoding only max-tier values.
- Ensure UI visibility and toggles are available for implemented tiers.
- If a tier changes hit multipliers/debuff values, encode tier-specific values in:
  - command mutation, and/or
  - conditional effect branches.

## 6) Combo and trigger mechanics

When applicable:

- Use combo window/cooldown owner semantics for multi-segment combos.
- Ensure trigger source event is explicit and deterministic.
- For detached followup hits, use execute-hit definitions with standalone command identity.

## 7) Validation gates (required)

- `npm run type-check`
- Manual spot-check in Rotation UI:
  - command labels and variants
  - hit timeline count/order
  - expected status/reaction on expected hit
  - combo trigger/cooldown behavior

## 8) Suggested implementation notes in PR

- API slug used.
- Whether live API or draft raw payload was used, and why.
- Any intentional divergences from source and why.
- Unimplemented mechanics (if any), with exact scope.

## Terminology guardrail

- `Final Strike` and `Finisher` are not interchangeable:
  - `Final Strike`: the last hit/segment of a normal Basic Attack Sequence.
  - `Finisher`: the transformed Basic Attack command available when enemy `finisher available` status is active.
- In UI/labels and timeline entries, these two terms must remain textually distinct.

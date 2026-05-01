# Character draft stubs

These draft files are generated from `public/gamedata.json` for operators not yet implemented in `src/data/chars`.

Each file includes:
- `gamedataId`
- CN name
- rarity / element / weapon
- target Warfarin Wiki URL

Remaining work per draft:
- full base stat tables (Lv1-Lv90)
- command multipliers per skill level
- finalized command timing alignment with gamedata offsets/durations

## Animation frame data source

For character implementation tasks, treat `public/gamedata.json` as the source of truth
for animation/command timing data (durations, offsets, sequence timing).

Recommended workflow:
- Pull multipliers and patch-level balance values from Warfarin API.
- Pull frame/timing values from `public/gamedata.json` to avoid hand-estimating durations.

Now that `jq` is available in the environment, use it to inspect timing blocks quickly.

## Fast Pipeline

Use the standardized pipeline commands from repo root:

1. `npm run chars:fetch-drafts-api`
2. `npm run chars:briefs`
3. `npm run chars:audit`

Or run all at once:

- `npm run chars:pipeline`

What each step does:

- `chars:fetch-drafts-api` downloads missing draft raw API payloads into `src/data/chars/drafts/raw`.
- `chars:briefs` builds per-operator implementation briefs in `src/data/chars/drafts/briefs`.
- `chars:audit` checks implementation consistency (registry sync + basic finisher/dive variant conventions).

## Required Implementation Checklist

In addition to the fast commands above, follow the required checklist in:

- `docs/character-implementation-pipeline.md`

Critical non-optional items include:

- hit-count parity against `public/gamedata.json` per command/segment
- mapping API-described status/reaction/infliction effects to exact hit or explicit event trigger
- tiered unique talent/potential value handling (not only max-tier hardcoded values)

# PostgreSQL build persistence

`schema.sql` defines the intended PostgreSQL tables. The application seed in
`src/data/postgresqlTemplateBuildPreviews.json` is the eagerly loaded list
projection. `src/data/postgresqlTemplateBuildDetails.json` contains the lazy
revision and rotation rows. Both are camelCase transport snapshots interpreted by
`src/lib/persistence/postgresqlBuildSchema.ts`.

## Canonical versus editor data

Both `current_party` and `planned_party` are canonical build data and are kept
on every immutable build revision. Each contains exactly four slots and four
reachable variants per slot. A duplicate variant is encoded with
`sameAsVariantIndex` and
resolves to an earlier variant in the same slot.

The canonical party deliberately excludes `characterBuilds` entries for
unselected characters and the `weaponBuilds` editor cache. The interpreter
recreates only the selected character's four variant snapshots required by the
current editor and simulator.

Rotation steps are stored independently from rotations. Database rotation IDs
are revision-scoped because copied builds can retain the same application
scheme ID. `rotations.scheme_id` preserves the ID used by the editor.

Simulation summaries are derived rows. They are retained for template list
display but are not part of the authoritative simulation input.

`build_previews` is the root projection required by the build list. Its four
slot entries contain only operator, weapon, and gear IDs, plus the effective
stage of the final rotation chain and its client-reported summary. Searchable
locale text and concrete current-party memberships are projected into
`build_preview_localizations`, `build_preview_operators`,
`build_preview_weapons`, and `build_preview_gear_sets`. This supports combining
locale-aware name/description search with operator, weapon, gear-set, stage,
damage, and DPS filters without loading canonical party or rotation JSONB.

The submission transaction should validate and resolve the active current-party
variant, populate all preview rows, and then publish the revision. The gear-set
rows are derived from equipped gear IDs through the server's versioned gear
catalog. Opening a build loads its current revision and dependent rotation rows.
Updating a published revision should refresh all preview projection rows in the
same transaction.

## Regenerating and auditing the seed

The original editor-format templates are preserved verbatim under
`database/backups/templates/`.

Run:

```sh
node scripts/templates/convert-legacy-templates-to-postgresql.mjs
npx tsx --tsconfig tsconfig.app.json scripts/templates/audit-postgresql-template-roundtrip.ts
```

The audit compares every reconstructed current/planned variant and all
simulation-relevant rotation collections against the backups.

## SQL import mapping

The checked-in seed uses application-style camelCase names. An API/importer
should map them to the snake_case SQL columns and place step-specific optional
fields in `payload`. Inserts are ordered as follows because builds and current
revisions reference one another:

1. Insert `builds` with `current_revision_id = NULL`.
2. Insert `build_revisions`.
3. Update `builds.current_revision_id`.
4. Insert rotations and their dependent rows.
5. Insert derived simulation summaries.

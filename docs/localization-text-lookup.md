# Localization Text Lookup

This note standardizes where UI text should be looked up and where the source-of-truth files live.

Date: 2026-06-11

## Scope

The app is authored in English first, but it also ships `zh-CN` UI text. We should keep lookup rules simple:

1. Names/descriptions coming from Warfarin item/operator data should be sourced from Warfarin CN data.
2. Combat-facing buff/status labels should be localized in one shared map.
3. Existing project terminology wins over ad-hoc phrasing.
   Example: `Ultimate` should be translated as `终结技`.

## Lookup Locations

### Gear names and set descriptions

- File: [src/i18n/domain/gearApiTexts.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/gearApiTexts.ts)
- Purpose:
  - CN gear set names
  - CN gear set descriptions
  - gearId -> suitId normalization for API-backed text lookup

### Final gear display lookup

- File: [src/i18n/domain/displayNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/displayNames.ts)
- Purpose:
  - Resolves the localized display name/description used by the UI
  - Pulls CN gear text from `gearApiTexts.ts`

### Weapon names

- File: [src/i18n/domain/weaponNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/weaponNames.ts)
- Purpose:
  - Localized weapon display names

### Character names

- File: [src/i18n/domain/characterNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/characterNames.ts)
- Purpose:
  - Localized operator names

### Skill names

- File: [src/i18n/domain/skillNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/skillNames.ts)
- Purpose:
  - Localized command/skill display names

### Combat buff and status labels

- File: [src/i18n/domain/statusBuffLabels.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/statusBuffLabels.ts)
- Purpose:
  - Shared localization map for buff/status labels shown during simulation
  - Used by rotation UI via `getLocalizedStatusBuffLabel(...)`
  - Best place for weapon-unique-skill-derived status names
  - Also contains fallback term replacement for generic status phrases

### Combat hit labels

- File: [src/i18n/domain/hitNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/hitNames.ts)
- Purpose:
  - Shared localization map and pattern handling for hit names shown in the rotation damage timeline
  - Handles three cases:
    - generic numbered hits such as `Hit 1` -> `HIT 1`
    - reaction/status-derived labels such as `Crush Trigger`
    - bespoke per-character sub-hit labels such as Zhuang Fangyi's thunderstrike flow

## Source Rules

### Gear-set text

Use Warfarin CN gear pages or CN gear API data for:

- suit names
- suit descriptions
- gear piece naming

These should be recorded in `gearApiTexts.ts`.

### Weapon-derived status names

When a status label is derived from a weapon unique skill name, use the weapon's CN text from Warfarin instead of inventing a translation.

Preferred source order:

1. Warfarin CN weapon API (`https://api.warfarin.wiki/v1/cn/weapons/{slug}`)
2. Warfarin CN weapon page (`https://warfarin.wiki/cn/weapons/{slug}`)

Record the resulting combat label in `statusBuffLabels.ts`.

Examples already following this rule:

- `Streaming Blitz` -> `压制·流霆`
- `Delivery Guaranteed` -> `追袭·不辱使命`
- `Eminent Repute` -> `残暴·规行矩止`

### Generic combat terms

If a label is a composed phrase rather than a named title, reuse project-standard terms from `statusBuffLabels.ts`.

Examples:

- `Ultimate` -> `终结技`
- `Electrification` -> `导电`
- `Combustion` -> `燃烧`
- `Vulnerability` -> `破防`

### Combat hit names

If a hit name is not just `Hit X`, localize it through `hitNames.ts`.

Preferred source order:

1. Warfarin CN operator text for skill/talent/potential-derived phrasing
2. Existing project combat terminology from `statusBuffLabels.ts`

Rules:

- Generic numbered hits stay in English as uppercase `HIT X`.
- Reaction or status-derived labels should reuse project-standard CN terms.
  Examples:
  - `Crush Trigger` -> `猛击触发`
  - `Arts Burst` -> `法术爆发`
- Bespoke sub-hit labels should be recorded in the per-character map in `hitNames.ts`.
  Example:
  - Zhuang Fangyi `Invoke Thunder Strikes` -> derived from the CN battle skill text describing `引导附近的青霆剑依次雷击目标`

## Practical Workflow

When adding new localized text:

1. Determine whether it is a proper name or a generic combat phrase.
2. If it comes from Warfarin item/operator/weapon content, fetch the CN source text first.
3. Store gear API-derived text in `gearApiTexts.ts`.
4. Store combat buff/status labels in `statusBuffLabels.ts`.
5. Store combat hit labels in `hitNames.ts`.
6. Only use fallback term replacement for generic phrases, not named titles.

## Rotation UI Consumer

The rotation workspace displays status labels through the shared combat-status lookup:

- UI: [src/components/workspaces/RotationWorkspace.vue](/home/eclair/projects/EndfieldToolbox/src/components/workspaces/RotationWorkspace.vue)
- Helper: [src/i18n/domain/statusBuffLabels.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/statusBuffLabels.ts)

If a combat label is wrong in the simulator UI, `statusBuffLabels.ts` should be checked first.

The same workspace also displays hit labels through the shared hit-name lookup:

- UI: [src/components/workspaces/RotationWorkspace.vue](/home/eclair/projects/EndfieldToolbox/src/components/workspaces/RotationWorkspace.vue)
- Helper: [src/i18n/domain/hitNames.ts](/home/eclair/projects/EndfieldToolbox/src/i18n/domain/hitNames.ts)

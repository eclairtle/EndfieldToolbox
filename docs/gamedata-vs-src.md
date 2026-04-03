# gamedata.json vs src/data comparison

## Snapshot (2026-04-03)

### Dataset sizes
- `public/gamedata.json`
  - `characterRoster`: 25 entries
  - `weaponDatabase`: 66 entries
  - `enemyDatabase`: 58 entries
  - `equipmentDatabase`: 170 entries
- `src/data`
  - Characters in `CHARACTERS`: 7 (`GILBERTA`, `LAEVATAIN`, `YVONNE`, `AKEKURI`, `ANTAL`, `ARDELIA`, `WULFGARD`)
  - Weapons in `WEAPONS`: 8
  - Enemies in `ENEMIES`: 1 (`RHODAGN`)
  - Gears in `GEARS`: 13

### Identifier overlap
- Characters: all 7 `src` characters exist in `gamedata.json` when normalized to uppercase IDs.
  - Matching IDs: `AKEKURI`, `ANTAL`, `ARDELIA`, `GILBERTA`, `LAEVATAIN`, `WULFGARD`, `YVONNE`
- Weapons: no direct ID overlap (`src` uses readable IDs like `forgeborn_scathe`; gamedata uses IDs like `wpn_sword_0021`).
- Enemies: no direct ID overlap (`src` uses `rhodagn`; gamedata uses IDs like `eny_0051_rodin`).
- Gears: no direct ID overlap (`src` uses readable IDs like `tide_fall_light_armor`; gamedata uses `item_equip_...` IDs).

### Conclusion
`src/data` currently appears to be a curated subset (and custom schema) of the larger `public/gamedata.json` dataset. Character identity is alignable by name/ID normalization, while weapons/enemies/gears use different ID namespaces and require explicit mapping logic if you want one-to-one syncing.

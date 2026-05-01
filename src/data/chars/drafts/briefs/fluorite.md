# Fluorite

- Slug: `fluorite`
- Gamedata ID: `FLUORITE`
- CN Name: 萤石
- Source JSON: `src/data/chars/drafts/raw/fluorite.json`
- Wiki: https://warfarin.wiki/en/operators/fluorite

## Talents

- `chr_0022_bounda_talent_1_1`: Fluorite gains DMG Dealt +{dmg_up:0%} against Slowed targets.
- `chr_0022_bounda_talent_1_2`: Fluorite gains DMG Dealt +{dmg_up:0%} against Slowed targets.
- `chr_0022_bounda_talent_2_1`: Grants {probability:0%} chance of Arts DMG immunity and grants Fluorite ATK +{atk_up:0%} for {duration:0}s. This effect cannot stack.
- `chr_0022_bounda_talent_2_2`: Grants {probability:0%} chance of Arts DMG immunity and grants Fluorite ATK +{atk_up:0%} for {duration:0}s. This effect cannot stack.

## Potentials

- `chr_0022_bounda_potential_1`: Agility +{Agi:0}, Intellect +{Wisd:0}.
- `chr_0022_bounda_potential_2`: Talent Unpredictable improved: Chance to ignore Arts DMG +{probability:0%}.
- `chr_0022_bounda_potential_3`: Battle skill Tiny Surprise improved: After Improvised Explosive explodes, the slow effect is applied to all enemies hit and lasts {duration_potential:0}s.
- `chr_0022_bounda_potential_4`: Ultimate Apex Prankster improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0022_bounda_potential_5`: Combo skill Free Giveaway improved: Whenever Cryo Infliction or Nature Infliction is applied to the enemy, cooldown is shortened by {reduce:0}s. Effect can only trigger once every 1s.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

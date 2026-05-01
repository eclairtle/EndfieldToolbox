# Estella

- Slug: `estella`
- Gamedata ID: `ESTELLA`
- CN Name: 埃特拉
- Source JSON: `src/data/chars/drafts/raw/estella.json`
- Wiki: https://warfarin.wiki/en/operators/estella

## Talents

- `chr_0021_whiten_talent_1_1`: When triggering Shatter, the next battle skill Onomatopoeia cast returns {atb:0.0} SP. This effect cannot stack.
- `chr_0021_whiten_talent_1_2`: When triggering Shatter, the next battle skill Onomatopoeia cast returns {atb:0} SP. This effect cannot stack.
- `chr_0021_whiten_talent_2_1`: Ignores Cryo Infliction and takes {dmg_down:0%} Cryo DMG.
- `chr_0021_whiten_talent_2_2`: Ignores Cryo Infliction and takes {dmg_down:0%} Cryo DMG.

## Potentials

- `chr_0021_whiten_potential_1`: Combo skill Distortion improved: Physical Susceptibility duration +{rate_plus:0}s.
- `chr_0021_whiten_potential_2`: Ultimate Tremolo improved: Ultimate Energy cost -{1-costValue:0%}.
- `chr_0021_whiten_potential_3`: Battle skill Onomatopoeia improved: Freezing sound wave range +50% and DMG Dealt +{dmg_up:0%} to the first enemy hit.
- `chr_0021_whiten_potential_4`: Will +{Will:0}, Strength +{Str:0}.
- `chr_0021_whiten_potential_5`: After applying Solidification to an enemy, Estella gains {usp:0} Ultimate Energy. Effect can only trigger once every 1s.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

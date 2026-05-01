# Last Rite

- Slug: `last-rite`
- Gamedata ID: `LASTRITE`
- CN Name: 别礼
- Source JSON: `src/data/chars/drafts/raw/last-rite.json`
- Wiki: https://warfarin.wiki/en/operators/last-rite

## Talents

- `chr_0026_lastrite_talent_1_1`: After Last Rite consumes any Arts Infliction, she applies Cryo Susceptibility to the target with the effect of [Number of Arts Infliction stacks consumed × {crystal_up:0%}] for {duration:0}s. This effect cannot stack.
- `chr_0026_lastrite_talent_1_2`: After Last Rite consumes any Arts Infliction, she applies Cryo Susceptibility to the target with the effect of [Number of Arts Infliction stacks consumed × {crystal_up:0%}] for {duration:0}s. This effect cannot stack.
- `chr_0026_lastrite_talent_2_1`: Ultimate Vigil Services improved: When the ultimate deals DMG to an enemy with Cryo Susceptibility, the effect of that Cryo Susceptibility is {rate:0.0} times the original.
- `chr_0026_lastrite_talent_2_2`: Ultimate Vigil Services improved: When the ultimate deals DMG to an enemy with Cryo Susceptibility, the effect of that Cryo Susceptibility is {rate:0.0} times the original.

## Potentials

- `chr_0026_lastrite_potential_1`: When the controlled operator with Hypothermic Perfusion performs a Final Strike that hits the enemy, it deals another {atk_up:0%} DMG and {poise:0} Stagger.
- `chr_0026_lastrite_potential_2`: Strength +{Str:0}, Cryo DMG Dealt +{CrystDamageIncrease:0%}.
- `chr_0026_lastrite_potential_3`: Combo skill Winter's Devourer and ultimate Vigil Services improved: DMG multiplier increased to {atk_scale2:0.00} times the original.
- `chr_0026_lastrite_potential_4`: Ultimate Vigil Services improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0026_lastrite_potential_5`: Battle skill Esoteric Legacy of Seš'qa improved: Amount of SP returned is increased by another {atb:0}; Mirage Additional ATK Multiplier is increased to {atk_scale:0.0} times the original.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

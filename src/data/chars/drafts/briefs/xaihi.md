# Xaihi

- Slug: `xaihi`
- Gamedata ID: `XAIHI`
- CN Name: 赛希
- Source JSON: `src/data/chars/drafts/raw/xaihi.json`
- Wiki: https://warfarin.wiki/en/operators/xaihi

## Talents

- `chr_0011_seraph_talent_1_1`: Combo skill Stress Testing improved: Hitting an enemy with Cryo Infliction or Solidification also causes the enemy to suffer Cryo DMG Taken +{cryst_up:0%} for {duration:0}s. This effect cannot stack.
- `chr_0011_seraph_talent_1_2`: Combo skill Stress Testing improved: Hitting an enemy with Cryo Infliction or Solidification also causes the enemy to suffer Cryo DMG Taken +{cryst_up:0%} for {duration:0}s. This effect cannot stack.
- `chr_0011_seraph_talent_2_1`: Ultimate Stack Overflow improved: The ultimate also dispels Cryo Infliction and Solidification from the entire team.
- `chr_0011_seraph_talent_2_2`: Ultimate Stack Overflow improved: The ultimate also dispels Cryo Infliction and Solidification from the entire team.

## Potentials

- `chr_0011_seraph_potential_1`: Arts Amp granted by the Auxiliary Crystal is increased by another {atk_up:0%}.
- `chr_0011_seraph_potential_2`: Ultimate Stack Overflow improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0011_seraph_potential_3`: Combo skill Stress Testing improved: When hitting the target, the hit chains 1 time to 1 additional target nearby.
- `chr_0011_seraph_potential_4`: Intellect +{Wisd:0}, Treatment Efficiency +{HealOutputIncrease:0%}.
- `chr_0011_seraph_potential_5`: Ultimate Stack Overflow improved: Amp effect is increased to {atk_up:0.0} times the original.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

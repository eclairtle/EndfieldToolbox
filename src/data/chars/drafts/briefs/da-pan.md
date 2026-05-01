# Da Pan

- Slug: `da-pan`
- Gamedata ID: `DAPAN`
- CN Name: 大潘
- Source JSON: `src/data/chars/drafts/raw/da-pan.json`
- Wiki: https://warfarin.wiki/en/operators/da-pan

## Talents

- `chr_0018_dapan_talent_1_1`: After consuming 1 Vulnerability stack, Da Pan gains Physical DMG Dealt +{dmg_up:0%} for {duration:0}s. This effect can reach {stack:0} stacks.
- `chr_0018_dapan_talent_1_2`: After consuming 1 Vulnerability stack, Da Pan gains Physical DMG Dealt +{dmg_up:0%} for {duration:0}s. This effect can reach {stack:0} stacks.
- `chr_0018_dapan_talent_2_1`: Ultimate CHOP 'N DUNK! improved: For every enemy hit by the final sequence of the ultimate, gains 1 stack of Prep Ingredients for {talent_1_duration:0}s (max stacks: {talent_1_stack:0}). When Prep Ingredients is active, hitting an enemy with combo skills immediately shortens cooldown by {talent_1_cd_reduce:0%} and consumes 1 stack of Prep Ingredients.
- `chr_0018_dapan_talent_2_2`: Ultimate CHOP 'N DUNK! improved: For every enemy hit by the final sequence of the ultimate, gains 1 stack of Prep Ingredients for {talent_1_duration:0}s (max stacks: {talent_1_stack:0}). When Prep Ingredients is active, hitting an enemy with combo skills immediately shortens cooldown by {talent_1_cd_reduce:0%} and consumes 1 stack of Prep Ingredients.

## Potentials

- `chr_0018_dapan_potential_1`: Ultimate CHOP 'N DUNK! improved: If the ultimate defeats at least one enemy, Da Pan deals +{potential_1_dmg_up:0%} Physical DMG for {potential_1_duration:0}s. This effect cannot stack.
- `chr_0018_dapan_potential_2`: Talent Salty or Mild improved: Prep Ingredients buff duration +{talent_1_duration:0}s, max stacks +{talent_1_stack:0}.
- `chr_0018_dapan_potential_3`: Strength +{Str:0}, Physical DMG Dealt +{PhysicalDamageIncrease:0%}.
- `chr_0018_dapan_potential_4`: Ultimate CHOP 'N DUNK! improved: Ultimate Energy cost -{1-costValue:0%}.
- `chr_0018_dapan_potential_5`: Battle skill FLIP DA WOK! improved: If the skill hits only one enemy, apply 1 more stack of Vulnerability on the target. Effect only triggers once every {potential_5_interval:0}s.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

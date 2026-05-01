# Perlica

- Slug: `perlica`
- Gamedata ID: `PERLICA`
- CN Name: 佩丽卡
- Source JSON: `src/data/chars/drafts/raw/perlica.json`
- Wiki: https://warfarin.wiki/en/operators/perlica

## Talents

- `chr_0004_pelica_talent_1_1`: DMG Dealt +{dmg:0%} to Staggered enemies.
- `chr_0004_pelica_talent_1_2`: DMG Dealt +{dmg:0%} to Staggered enemies.
- `chr_0004_pelica_talent_2_1`: Combo skill Instant Protocol: Chain improved: When hitting a Vulnerable enemy, the hit chains 1 more time.
- `chr_0004_pelica_talent_2_2`: Combo skill Instant Protocol: Chain improved: When hitting a Vulnerable enemy, the hit chains 1 more time.

## Potentials

- `chr_0004_pelica_potential_1`: Combo skill Instant Protocol: Chain improved: Electrification duration +{duration-1:0%}.
- `chr_0004_pelica_potential_2`: Ultimate Protocol ε: 70.41K improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0004_pelica_potential_3`: After Perlica applies Electrification to the enemy, she gains ATK +{atk_up:0%} for {atk_duration:0}s. This effect can reach {max_stack:0} stacks.
- `chr_0004_pelica_potential_4`: Combo skill Instant Protocol: Chain improved: The Arts DMG Taken debuff effects on the enemy applied by the skill's Electrification are increased to {extra_scaling} times the original.
- `chr_0004_pelica_potential_5`: Ultimate Protocol ε: 70.41K improved: Critical Rate +{crit:0%}.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

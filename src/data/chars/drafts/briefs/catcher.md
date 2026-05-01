# Catcher

- Slug: `catcher`
- Gamedata ID: `CATCHER`
- CN Name: 卡契尔
- Source JSON: `src/data/chars/drafts/raw/catcher.json`
- Wiki: https://warfarin.wiki/en/operators/catcher

## Talents

- `chr_0020_meurs_talent_1_1`: For every 10 Will, DEF +{rate:0.0}.
- `chr_0020_meurs_talent_1_2`: For every 10 Will, DEF +{rate:0.0}.
- `chr_0020_meurs_talent_2_1`: Ultimate Textbook Assault improved: Final hit creates {talent_1+1:0} shockwave(s), each dealing {atk_scale_shockwave:0%} ATK of Physical DMG.
- `chr_0020_meurs_talent_2_2`: Ultimate Textbook Assault improved: Final hit creates {talent_1+1:0} shockwave(s), each dealing {atk_scale_shockwave:0%} ATK of Physical DMG.

## Potentials

- `chr_0020_meurs_potential_1`: Battle skill Rigid Interdiction and ultimate Textbook Assault improved: After hitting the enemy, deals another strike that deals [{dmg_base:0} + DEF×{def_scale:0.0}] of Physical DMG.
- `chr_0020_meurs_potential_2`: DEF +{Def:0}, Will +{Will:0}.
- `chr_0020_meurs_potential_3`: Combo skill Timely Suppression improved: Shield duration +{potential3_duration:0}s.
- `chr_0020_meurs_potential_4`: Ultimate Textbook Assault improved: Ultimate Energy cost -{1-costValue:0%}.
- `chr_0020_meurs_potential_5`: Battle skill Rigid Interdiction improved: Hitting an enemy while the shield is active returns {potential5_atb:0} SP.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

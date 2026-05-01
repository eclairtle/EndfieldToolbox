# Tangtang

- Slug: `tangtang`
- Gamedata ID: `TANGTANG`
- CN Name: 汤汤
- Source JSON: `src/data/chars/drafts/raw/tangtang.json`
- Wiki: https://warfarin.wiki/en/operators/tangtang

## Talents

- `chr_0027_tangtang_talent_1_1`: When within a {range_talent1buff:0}-meter radius of a Whirlpool, allied operators gain {ratio_speed:0%} Haste while enemies suffer {1-ratio_speedreduction:0%} Slow. These effects persist for {duration_talent1buff:0}s after leaving the area of effect.
- `chr_0027_tangtang_talent_1_2`: When within a {range_talent1buff:0}-meter radius of a Whirlpool, allied operators gain {ratio_speed:0%} Haste while enemies suffer {1-ratio_speedreduction:0%} Slow. These effects persist for {duration_talent1buff:0}s after leaving the area of effect.
- `chr_0027_tangtang_talent_2_1`: During OLDEN STARE, performing a dive attack with the controlled operator ends its evolution early and creates a Waterspout. All nearby Whirlpools are also consumed and converted into additional Waterspouts. Waterspouts created this way have the same effects as those created by the battle skill IMA WAVERIDAAH! and gain DMG Dealt +{dmg_up_water_ult:0%}.
- `chr_0027_tangtang_talent_2_2`: During OLDEN STARE, performing a dive attack with the controlled operator ends its evolution early and creates a Waterspout. All nearby Whirlpools are also consumed and converted into additional Waterspouts. Waterspouts created this way have the same effects as those created by the battle skill IMA WAVERIDAAH! and gain DMG Dealt +{dmg_up_water_ult:0%}.

## Potentials

- `chr_0027_tangtang_potential_1`: Combo skill RIVER, TO ME! improved: DMG Multiplier is increased to {atk_scale:0.0} times of the original, and cooldown is now {coolDown:0}s. Battle skill IMA WAVERIDAAH! improved: For every Whirlpool consumed and converted into a Waterspout, return {atb_return:0} additional SP.
- `chr_0027_tangtang_potential_2`: Agility +{Agi:0}, Cryo DMG Dealt +{CrystDamageIncrease:0%}
- `chr_0027_tangtang_potential_3`: Battle skill IMA WAVERIDAAH! improved: DMG Multiplier is increased to {atk_scale_1:0.0} times the original. When forming multiple Waterspouts, the resulting Arts Susceptibility effect is increased by +{rate_spellvulnerable_02:0%}.
- `chr_0027_tangtang_potential_4`: Ultimate DA CHIEF SEES YOU! improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0027_tangtang_potential_5`: Ultimate DA CHIEF SEES YOU! improved: DMG Multiplier is increased to {atk_scale_1:0.00} times the original. Talent Riot Bringer improved: DMG effects of any Waterspout created by the ultimate DA CHIEF SEES YOU! are increased by +{dmg_up_water_ult:0%}.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

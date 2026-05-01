# Alesh

- Slug: `alesh`
- Gamedata ID: `ALESH`
- CN Name: 阿列什
- Source JSON: `src/data/chars/drafts/raw/alesh.json`
- Wiki: https://warfarin.wiki/en/operators/alesh

## Talents

- `chr_0024_deepfin_talent_1_1`: After Solidification or Originium Crystals are applied to a nearby enemy, Alesh gains {usp:0} Ultimate Energy. If the said Solidification is applied by Alesh, he gains an additional {usp_self:0} Ultimate Energy. This effect can only trigger once every 3s.
- `chr_0024_deepfin_talent_1_2`: After Solidification or Originium Crystals are applied to a nearby enemy, Alesh gains {usp:0} Ultimate Energy. If the said Solidification is applied by Alesh, he gains an additional {usp_self:0} Ultimate Energy. This effect can only trigger once every 3s.
- `chr_0024_deepfin_talent_2_1`: Combo skill Auger Angling improved: Every {rate:0} Intellect grants Rare Fin catching chance +{prob_add:0.0%} (max: +{prob_max:0%}).
- `chr_0024_deepfin_talent_2_2`: Combo skill Auger Angling improved: Every {rate:0} Intellect grants Rare Fin catching chance +{prob_add:0.0%} (max: +{prob_max:0%}).

## Potentials

- `chr_0024_deepfin_potential_1`: Battle skill Unconventional Lure improved: SP Recovery grants an additional {potential_1_atb:0} SP.
- `chr_0024_deepfin_potential_2`: Strength +{Str:0}, Intellect +{Wisd:0}.
- `chr_0024_deepfin_potential_3`: Combo skill Auger Angling improved: After catching a Rare Fin, the entire team gains ATK +{atk_up:0%} for {Duration:0}s. This effect cannot stack.
- `chr_0024_deepfin_potential_4`: Ultimate One Monster Catch! improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0024_deepfin_potential_5`: Ultimate One Monster Catch! improved: Hitting a target below {hp_tar:0%} HP increases the DMG Multiplier to {atk_up:0.0} times the original.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

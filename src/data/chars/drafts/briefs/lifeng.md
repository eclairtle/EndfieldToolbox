# Lifeng

- Slug: `lifeng`
- Gamedata ID: `LIFENG`
- CN Name: 黎风
- Source JSON: `src/data/chars/drafts/raw/lifeng.json`
- Wiki: https://warfarin.wiki/en/operators/lifeng

## Talents

- `chr_0015_lifeng_talent_1_1`: Every point of Intellect and Will further grants ATK +{atk_up:0.00%}.
- `chr_0015_lifeng_talent_1_2`: Every point of Intellect and Will further grants ATK +{atk_up:0.00%}.
- `chr_0015_lifeng_talent_2_1`: Applying Knock Down also deals {atk_scale_talent2:0%} ATK of Physical DMG.
- `chr_0015_lifeng_talent_2_2`: Applying Knock Down also deals {atk_scale_talent2:0%} ATK of Physical DMG.

## Potentials

- `chr_0015_lifeng_potential_1`: Battle skill Turbid Avatar improved: Physical Susceptibility +{phy_resist_down:0%}; also triggers this additional effect to enemies with no more than {num:0} Vulnerability stacks.
- `chr_0015_lifeng_potential_2`: All attributes +{Str:0}.
- `chr_0015_lifeng_potential_3`: Talent Illumination improved: Every point in the attributes of Intellect and Will grants Lifeng an additional ATK +{atk_up:0.00%}.
- `chr_0015_lifeng_potential_4`: Ultimate Heart of the Unmoving improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0015_lifeng_potential_5`: Talent Subduer of Evil improved: Every {interval:0}s, the next effect triggered deals another {atk_scale_potential5:0%} ATK of Physical DMG and {poise_potential5:0} Stagger.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

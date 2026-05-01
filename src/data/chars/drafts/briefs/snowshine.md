# Snowshine

- Slug: `snowshine`
- Gamedata ID: `SNOWSHINE`
- CN Name: 昼雪
- Source JSON: `src/data/chars/drafts/raw/snowshine.json`
- Wiki: https://warfarin.wiki/en/operators/snowshine

## Talents

- `chr_0014_aurora_talent_1_1`: Treatment Effect +{heal_up:0%} for targets of {rate:0%} HP or below.
- `chr_0014_aurora_talent_1_2`: Treatment Effect +{heal_up:0%} for targets of {rate:0%} HP or below.
- `chr_0014_aurora_talent_2_1`: Battle skill Saturated Defense improved: After successfully retaliating an enemy attack, Snowshine gains another {talent_2_sup:0} Ultimate Energy.
- `chr_0014_aurora_talent_2_2`: Battle skill Saturated Defense improved: After successfully retaliating an enemy attack, Snowshine gains another {talent_2_sup:0} Ultimate Energy.

## Potentials

- `chr_0014_aurora_potential_1`: Battle skill Saturated Defense improved: During the blocking effect, Arts Inflictions cannot be applied to allied operators with Protection.
- `chr_0014_aurora_potential_2`: Ultimate Frigid Snowfield improved: Effect radius +{potential_2_range:0%}.
- `chr_0014_aurora_potential_3`: Ultimate Frigid Snowfield improved: Duration of the Solidification applied by the skill is increased by {extra_duration:0}s.
- `chr_0014_aurora_potential_4`: DEF +{Def:0}, Will +{Will:0}.
- `chr_0014_aurora_potential_5`: Battle skill Saturated Defense improved: Successfully retaliating an enemy attack returns {potential_5_atb:0} SP.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

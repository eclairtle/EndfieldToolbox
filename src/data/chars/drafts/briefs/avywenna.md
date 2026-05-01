# Avywenna

- Slug: `avywenna`
- Gamedata ID: `AVYWENNA`
- CN Name: 艾维文娜
- Source JSON: `src/data/chars/drafts/raw/avywenna.json`
- Wiki: https://warfarin.wiki/en/operators/avywenna

## Talents

- `chr_0012_avywen_talent_1_1`: After a thrown or returning Thunderlance or Thunderlance EX hits the enemy, Avywenna gains {talent0_usp:0} Ultimate Energy.
- `chr_0012_avywen_talent_1_2`: After a thrown or returning Thunderlance or Thunderlance EX hits the enemy, Avywenna gains {talent0_usp:0} Ultimate Energy.
- `chr_0012_avywen_talent_2_1`: Ultimate Thunderlance: Final Shock improved: Also applies {pulse_vul_rate:0%} Electric Susceptibility for {pulse_vul_duration:0}s to enemies it hits.
- `chr_0012_avywen_talent_2_2`: Ultimate Thunderlance: Final Shock improved: Also applies {pulse_vul_rate:0%} Electric Susceptibility for {pulse_vul_duration:0}s to enemies it hits.

## Potentials

- `chr_0012_avywen_potential_1`: Talent Expedited Delivery improved: Ultimate Energy gain +{talent0_usp:0}.
- `chr_0012_avywen_potential_2`: Thunderlance and Thunderlance EX duration +{potential_2:0}s.
- `chr_0012_avywen_potential_3`: Will +{Will:0}, Electric DMG Dealt +{PulseDamageIncrease:0%}.
- `chr_0012_avywen_potential_4`: Ultimate Thunderlance: Final Shock improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0012_avywen_potential_5`: When returning Thunderlances or Thunderlances EX hit an Electric Susceptible enemy, the DMG multipliers are increased to {potential_5_rate:0.00} times the original.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

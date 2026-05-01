# Ember

- Slug: `ember`
- Gamedata ID: `EMBER`
- CN Name: 余烬
- Source JSON: `src/data/chars/drafts/raw/ember.json`
- Wiki: https://warfarin.wiki/en/operators/ember

## Talents

- `chr_0009_azrila_talent_1_1`: When casting the battle skill Forward March and the combo skill Frontline Support, Ember gains {1-shelterrate:0%} Protection and is less likely to be interrupted.
- `chr_0009_azrila_talent_1_2`: When casting the battle skill Forward March and the combo skill Frontline Support, Ember gains {1-shelterrate:0%} Protection and is less likely to be interrupted.
- `chr_0009_azrila_talent_2_1`: When Ember receives DMG from the enemy, she gains ATK +{attack:0%} for {duration:0}s. This effect can reach 3 stacks.
- `chr_0009_azrila_talent_2_2`: When Ember receives DMG from the enemy, she gains ATK +{attack:0%} for {duration:0}s. This effect can reach 3 stacks.

## Potentials

- `chr_0009_azrila_potential_1`: Talent Inflamed for the Assault improved: Protection effect +{extrashelter:0%}; hitting an enemy extends the duration by {extratime:0.0}s.
- `chr_0009_azrila_potential_2`: Strength +{Str:0}, Will +{Will:0}.
- `chr_0009_azrila_potential_3`: Combo skill Frontline Support improved: Restores the HP of another teammate with the lowest percentage HP at {extracure:0%} of the base effect.
- `chr_0009_azrila_potential_4`: Ultimate Re-Ignited Oath improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0009_azrila_potential_5`: Ultimate Re-Ignited Oath improved: Shield effect is multiplied by {extrashield:0.0}; while this shield is active, the wielder gains ATK +{extraattack:0%}.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

# Rossi

- Slug: `rossi`
- Gamedata ID: `ROSSI`
- CN Name: 洛茜
- Source JSON: `src/data/chars/drafts/raw/rossi.json`
- Wiki: https://warfarin.wiki/en/operators/rossi

## Talents

- `chr_0028_wulfa_talent_1_1`: Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for {duration_bleed:0}s. This effect cannot stack. For the duration of Razor Clawmark, the target takes {atk_scale_bleed:0%} ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +{damage_up:0%}.
- `chr_0028_wulfa_talent_1_2`: Battle skill improved: After Wolven Ambrage deals DMG, Rossi applies Razor Clawmark to the target for {duration_bleed:0}s. This effect cannot stack. For the duration of Razor Clawmark, the target takes {atk_scale_bleed:0%} ATK (Rossi's) of Physical DMG per second and suffers Physical DMG Taken and Heat DMG Taken +{damage_up:0%}.
- `chr_0028_wulfa_talent_2_1`: When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals {bleed_critical_damage_scale:0%} ATK (Rossi's) of Heat DMG and restores [Intellect × {heal_scale:0.00}] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to {talent2_burning_damage_scale:0.0} times.
- `chr_0028_wulfa_talent_2_2`: When Rossi's skill deals Critical DMG to a Razor Clawmarked enemy, trigger another hit that deals {bleed_critical_damage_scale:0%} ATK (Rossi's) of Heat DMG and restores [Intellect × {heal_scale:0.00}] HP to Rossi. If the target is also Combusted, then the aforementioned DMG and HP Restoration effects are increased to {talent2_burning_damage_scale:0.0} times.

## Potentials

- `chr_0028_wulfa_potential_1`: Battle skill Crimson Shadow and combo skill Moment of Blazing Shadow improved: The DMG Multipliers of these skills are increased to {atk_scale_3:0.00} times of the original. Wolven Ambrage of the battle skill also returns {atb_return:0} SP after hitting the enemy.
- `chr_0028_wulfa_potential_2`: Agility +{Agi:0}, Critical Rate +{CriticalRate:0%}.
- `chr_0028_wulfa_potential_3`: Talent Seething Blood improved: When triggered, it grants Base DMG Multiplier +{bleed_critical_damage_scale:0%} and restores HP +[Intellect × {heal_scale:0.00}].
- `chr_0028_wulfa_potential_4`: Ultimate "Razorclaw" Ambuscade improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0028_wulfa_potential_5`: Ultimate "Razorclaw" Ambuscade improved: DMG Multiplier is increased to {potential_5_damage_scale:0.0} times of the original; Critical DMG Dealt is increased by +{potential_5_critical_damage:0%}.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

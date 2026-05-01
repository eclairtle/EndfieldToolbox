# Pogranichnik

- Slug: `pogranichnik`
- Gamedata ID: `POGRANICHNK`
- CN Name: 骏卫
- Source JSON: `src/data/chars/drafts/raw/pogranichnik.json`
- Wiki: https://warfarin.wiki/en/operators/pogranichnik

## Talents

- `chr_0029_pograni_talent_1_1`: During battle, recovering {atb_gain:0} SP with his own skills grants Fervent Morale for {duration:0}s. Fervent Morale effects: ATK +{atk_up:0%} and Arts Intensity +{physpell_up:0}. This effect can reach 3 stacks. Duration of each stack is counted separately.
- `chr_0029_pograni_talent_1_2`: During battle, recovering {atb_gain:0} SP with his own skills grants Fervent Morale for {duration:0}s. Fervent Morale effects: ATK +{atk_up:0%} and Arts Intensity +{physpell_up:0}. This effect can reach 3 stacks. Duration of each stack is counted separately.
- `chr_0029_pograni_talent_2_1`: Ultimate Shieldguard Banner, Forward improved: Any operator triggering the ultimate's subsequent effects also gains Fervent Morale for {duration:0}s. Requires activation of talent: The Living Banner.
- `chr_0029_pograni_talent_2_2`: Ultimate Shieldguard Banner, Forward improved: Any operator triggering the ultimate's subsequent effects also gains Fervent Morale for {duration:0}s. Requires activation of talent: The Living Banner.

## Potentials

- `chr_0029_pograni_potential_1`: Battle skill The Pulverizing Front improved: When hitting at least 2 enemies, {atb_return:0} SP is returned.
- `chr_0029_pograni_potential_2`: Will +{Will:0}, Physical DMG Dealt +{PhysicalDamageIncrease:0%}.
- `chr_0029_pograni_potential_3`: Talent The Living Banner improved: Amount of SP recovery needed to gain Fervent Morale is reduced to {atb_gain:0}. Max Fervent Morale stacks on self +{max_stack_owner-3}.
- `chr_0029_pograni_potential_4`: Ultimate Shieldguard Banner, Forward improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0029_pograni_potential_5`: Combo skill Full Moon Slash improved: Length of cooldown {coolDown:0}s; SP recovery is increased to {atb_ratio:0.0} times the original.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

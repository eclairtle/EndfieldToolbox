# Zhuang Fangyi

- Slug: `zhuang-fangyi`
- Source JSON: `src/data/chars/drafts/raw/zhuang-fangyi.json`
- Wiki: https://warfarin.wiki/en/operators/zhuang-fangyi

## Talents

- `chr_0030_zhuangfy_talent_1_1`: Battle skill Mantra of Sundering improved: Casting the battle skill grants Zhuang Fangyi {base_rate:0%} Electric Amp for {duration:0}s. Scoring hits with the battle skill's Thunder Strike increases this effect by +{enhance_rate:0%}. Every casting of the battle skill Mantra of Sundering again resets this Electric Amp effect.
- `chr_0030_zhuangfy_talent_1_2`: Battle skill Mantra of Sundering improved: Casting the battle skill grants Zhuang Fangyi {base_rate:0%} Electric Amp for {duration:0}s. Scoring hits with the battle skill's Thunder Strike increases this effect by +{enhance_rate:0%}. Every casting of the battle skill Mantra of Sundering again resets this Electric Amp effect.
- `chr_0030_zhuangfy_talent_2_1`: Gains a {base_rate:0%} chance of immunity against DMG taken, with each Sunderblade nearby increasing this chance by +{sword_rate:0%}. After DMG Immunity is triggered, Zhuang Fangyi is also restored for {heal:0%} Max HP. The HP restoration effect only triggers once every {duration:0}s.
- `chr_0030_zhuangfy_talent_2_2`: Gains a {base_rate:0%} chance of immunity against DMG taken, with each Sunderblade nearby increasing this chance by +{sword_rate:0%}. After DMG Immunity is triggered, Zhuang Fangyi is also restored for {heal:0%} Max HP. The HP restoration effect only triggers once every {duration:0}s.

## Potentials

- `chr_0030_zhuangfy_potential_1`: Battle skill Mantra of Sundering improved: DMG multiplier is increased to {atk_scale:0.00} times the original. After entering battle, Zhuang Fangyi's first battle skill casting also creates 1 more Sunderblade. The additional Sunderblade created by this skill can exceed the Sunderblade creation limit from a single casting of the battle skill.
- `chr_0030_zhuangfy_potential_2`: Will +{Will:0}, Battle Skill DMG Dealt +{NormalSkillDamageIncrease:0%}.
- `chr_0030_zhuangfy_potential_3`: Battle skill Mantra of Sundering improved: After consuming Electrification, the battle skill returns {atb_return:0} SP. Sunderblade duration +{sword_duration:0}s.
- `chr_0030_zhuangfy_potential_4`: Ultimate Smiting Tempest improved: Ultimate Energy cost -{1-costvalue:0%}.
- `chr_0030_zhuangfy_potential_5`: During the Empyrean of Truth transformation, DMG Dealt by Zhuang Fangyi ignores {100*ignore_pulse_resist:0} of the enemy's Electric Resistance.

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

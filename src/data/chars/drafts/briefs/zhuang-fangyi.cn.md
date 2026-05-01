# 庄方宜

- Slug: `zhuang-fangyi.cn`
- Source JSON: `src/data/chars/drafts/raw/zhuang-fangyi.cn.json`
- Wiki: https://warfarin.wiki/en/operators/zhuang-fangyi.cn

## Talents

- `chr_0030_zhuangfy_talent_1_1`: 施放战技惊霆诀时对自身施加{base_rate:0%}电磁增幅，持续{duration:0}秒。 战技的雷击命中时使该效果+{enhance_rate:0%}。 每次施放战技惊霆诀时，该电磁增幅效果重置。
- `chr_0030_zhuangfy_talent_1_2`: 施放战技惊霆诀时对自身施加{base_rate:0%}电磁增幅，持续{duration:0}秒。 战技的雷击命中时使该效果+{enhance_rate:0%}。 每次施放战技惊霆诀时，该电磁增幅效果重置。
- `chr_0030_zhuangfy_talent_2_1`: 有{base_rate:0%}的概率免疫受到的伤害，附近每存在1柄青霆剑，此概率+{sword_rate:0%}。 触发伤害免疫效果后，回复自身{heal:0%}最大生命值，每{duration:0}秒最多回复1次生命值。
- `chr_0030_zhuangfy_talent_2_2`: 有{base_rate:0%}的概率免疫受到的伤害，附近每存在1柄青霆剑，此概率+{sword_rate:0%}。 触发伤害免疫效果后，回复自身{heal:0%}最大生命值，每{duration:0}秒最多回复1次生命值。

## Potentials

- `chr_0030_zhuangfy_potential_1`: 战技惊霆诀的伤害倍率提升至原本的{atk_scale:0.00}倍。且进入战斗后首次施放战技额外生成1柄青霆剑。 额外生成的青霆剑无视单次战技的青霆剑生成数量限制。
- `chr_0030_zhuangfy_potential_2`: 意志+{Will:0}，战技伤害+{NormalSkillDamageIncrease:0%}。
- `chr_0030_zhuangfy_potential_3`: 战技惊霆诀消耗导电后返还{atb_return:0}点技力。青霆剑的存在时间+{sword_duration:0}秒。
- `chr_0030_zhuangfy_potential_4`: 终结技万钧风雷所需的终结技能量-{1-costvalue:0%}。
- `chr_0030_zhuangfy_potential_5`: 天理合真状态下，自身造成的伤害无视敌人{100*ignore_pulse_resist:0}点电磁抗性。

## Notes

- Use this brief with `public/gamedata.json` for frame timing and command offsets.
- Validate implementations with `npm run chars:audit` and `npm run type-check`.

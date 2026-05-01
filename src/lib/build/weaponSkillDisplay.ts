import type { CharacterBase } from "@/data/characters";
import type { WeaponBase, WeaponSkillDef } from "@/data/weapons";
import { getWeaponUniqueSkillDescription } from "@/lib/combat/weaponEffects";
import { skillX, skillY } from "@/lib/build/weaponSkills";
import { i18n, type SupportedLocale } from "@/i18n";

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

function localizedUniqueSkillDescriptionZhCN(weaponId: string, level: number): string | null {
  const y = skillY(level);
  switch (weaponId) {
    case "forgeborn_scathe":
      return [
        `灼热伤害+${percent(12.8 + 3.2 * y)}。`,
        `装备者施放终结技时，获得普通攻击伤害+${percent(60 + 15 * y)}，持续20秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "thermite_cutter":
      return [
        `攻击力+${percent(8 + 2 * y)}。`,
        `装备者通过自身技能恢复技力或获得连击状态后，全队攻击力+${percent(4 + y)}，持续20秒。`,
        "同名效果最多叠加2层，每层单独计算持续时间。",
      ].join("\n");
    case "khravengger":
      return [
        `所有技能伤害+${percent(16 + 4 * y)}。`,
        `装备者通过战技施加寒冷附着时，获得寒冷伤害+${percent(8 + 2 * y)}，持续15秒。`,
        `装备者对寒冷附着的敌人造成连携技伤害时，获得寒冷伤害+${percent(16 + 4 * y)}，持续15秒。`,
        "两种效果独立生效，且均无法叠加。",
      ].join("\n");
    case "artsy_tyrannical":
      return [
        `寒冷伤害+${percent(12.8 + 3.2 * y)}。`,
        `装备者的战技或连携技造成暴击伤害后，寒冷伤害+${percent(11.2 + 2.8 * y)}，持续30秒。`,
        "同名效果最多叠加3层，每层单独计算持续时间，每0.1秒最多触发一次。",
      ].join("\n");
    case "clannibal":
      return [
        `法术伤害+${percent(9.6 + 2.4 * y)}。`,
        `装备者消耗法术异常后，使目标敌人受到对应属性的法术伤害+${percent(8 + 2 * y)}，持续15秒。`,
        "每种效果独立生效，且均无法叠加，每25秒最多触发一次。",
      ].join("\n");
    case "brigands_calling":
      return [
        `寒冷伤害+${percent(12.8 + 3.2 * y)}。`,
        `装备者施放战技或终结技时，获得寒冷伤害+${percent(16 + 4 * y)}，持续20秒。`,
        `装备者施加法术脆弱时，使目标敌人受到的法术伤害+${percent(4.8 + 1.2 * y)}，持续20秒。`,
        "两种效果独立生效，且均无法叠加。",
      ].join("\n");
    case "jet":
      return [
        `法术伤害+${percent(9.6 + 2.4 * y)}。`,
        `装备者施放战技时，获得法术伤害+${percent(9.6 + 2.4 * y)}，持续15秒。`,
        `装备者施放连携技时，获得法术伤害+${percent(9.6 + 2.4 * y)}，持续15秒。`,
        "两种效果独立生效，且均无法叠加。",
      ].join("\n");
    case "delivery_guaranteed":
      return [
        `自然伤害+${percent(scaledPercentFromRank1(16, y))}。`,
        `装备者通过自身连携技造成击飞后，全队造成的法术伤害+${percent(scaledPercentFromRank1(12, y))}，持续15秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "stanza_of_memorials":
      return `装备者通过自身技能恢复技力后，攻击力+${percent(scaledPercentFromRank1(10, y))}，持续15秒。同名效果无法叠加。`;
    case "detonation_unit":
      return [
        `副能力+${percent(scaledPercentFromRank1(10, y))}。`,
        `装备者造成法术异常时，使目标敌人受到的法术伤害+${percent(scaledPercentFromRank1(9, y))}，持续15秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "dreams_of_the_starry_beach":
      return [
        `副能力+${percent(scaledPercentFromRank1(16, y))}。`,
        `装备者消耗腐蚀后，使目标敌人受到的法术伤害+${percent(scaledPercentFromRank1(10, y))}，持续25秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "chivalric_virtues":
      return [
        `治疗效率+${percent(scaledPercentFromRank1(10, y))}。`,
        `装备者通过自身技能治疗后，全队攻击力+${percent(scaledPercentFromRank1(9, y))}，持续15秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "eminent_repute":
      return [
        `物理伤害+${percent(scaledPercentFromRank1(5.6, y))}。`,
        `攻击力+${percent(scaledPercentFromRank1(10, y))}。`,
        "装备者消耗脆弱层数后，自身获得攻击力提升，并使队伍中其他干员获得该增益效果一半数值的提升，持续20秒。",
        "同名效果无法叠加。",
      ].join("\n");
    case "white_night_nova":
      return [
        `法术伤害+${percent(scaledPercentFromRank1(12, y))}。`,
        `装备者施加燃烧或导电后，获得法术伤害+${percent(scaledPercentFromRank1(12, y))}、源石技艺强度+${(25 * (0.8 + 0.2 * y)).toFixed(1)}，持续15秒。`,
        "同名效果无法叠加。",
      ].join("\n");
    case "former_finery":
      return [
        `最大生命值+${percent(scaledPercentFromRank1(10, y))}。`,
        `治疗效率+${percent(scaledPercentFromRank1(10, y))}。`,
        `受到庇护的队友受到伤害后，装备者恢复生命值[${(84 * (0.8 + 0.2 * y)).toFixed(0)}+意志×${(0.8 + 0.2 * y).toFixed(1)}]。`,
        "每15秒最多触发一次。",
      ].join("\n");
    default:
      return null;
  }
}

function getLabels(locale: SupportedLocale) {
  if (locale === "zh-CN") {
    return {
      inactive: "未生效",
      notAppliedYet: "暂未实装",
      notApplied: "未实装",
      uniqueFallback: (level: number) => `Lv ${level} 效果预览暂不可用`,
      STR: "力量",
      AGI: "敏捷",
      INT: "智识",
      WIL: "意志",
      ATK: "攻击力",
      critRate: "暴击率",
      artsDmg: "法术伤害",
      artsIntensity: "源石技艺强度",
      healing: "治疗效率",
      ultGain: "终结技充能效率",
      maxHp: "最大生命值",
    };
  }

  return {
    inactive: "Inactive",
    notAppliedYet: "Not applied yet",
    notApplied: "Not applied",
    uniqueFallback: (level: number) => `Lv ${level} effect preview is not available yet.`,
    STR: "STR",
    AGI: "AGI",
    INT: "INT",
    WIL: "WIL",
    ATK: "ATK",
    critRate: "Crit Rate",
    artsDmg: "Arts DMG",
    artsIntensity: "Arts Intensity",
    healing: "Treatment Efficiency",
    ultGain: "Ultimate Gain Efficiency",
    maxHp: "Max HP",
  };
}

function localizeAttr(attr: CharacterBase["mainAttr"], labels: ReturnType<typeof getLabels>) {
  switch (attr) {
    case "STR":
      return labels.STR;
    case "AGI":
      return labels.AGI;
    case "INT":
      return labels.INT;
    case "WIL":
      return labels.WIL;
    default:
      return attr;
  }
}

export function getWeaponSkillLiveBonus(
  weapon: WeaponBase,
  skill: WeaponSkillDef,
  level: number,
  char: CharacterBase,
): string {
  const locale = currentLocale();
  const labels = getLabels(locale);

  if (skill.id === "UNIQUE") {
    if (locale === "zh-CN") {
      const zhDescription = localizedUniqueSkillDescriptionZhCN(weapon.id, level);
      if (zhDescription) {
        return zhDescription;
      }
    }

    const description = getWeaponUniqueSkillDescription(weapon.id, level);
    if (!description) {
      return labels.uniqueFallback(level);
    }
    return description;
  }

  const x = skillX(level);
  if (x <= 0) return labels.inactive;
  const rankMultiplier = 1 - 0.2 * (3 - skill.rank);

  switch (skill.id) {
    case "STR_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} ${labels.STR}`;
    case "AGI_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} ${labels.AGI}`;
    case "INT_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} ${labels.INT}`;
    case "WIL_UP":
      return `+${Math.floor((4 + 16 * x) * rankMultiplier)} ${labels.WIL}`;
    case "MAIN_ATTR_UP":
      return `+${Math.floor((4 + 13.5 * x) * rankMultiplier)} ${localizeAttr(char.mainAttr, labels)}`;
    case "ATK_UP":
      return `+${(Math.floor((10 + 40 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.ATK}`;
    case "CRIT_UP":
      return `+${(Math.floor((5 + 20 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.critRate}`;
    case "ARTS_DMG_UP":
      return `+${(Math.floor((11.6 + 44.4 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.artsDmg}`;
    case "ARTS_INTENSITY_UP":
      return `+${Math.floor((2 + 8 * x) * rankMultiplier)} ${labels.artsIntensity}`;
    case "HEALING_UP":
      return `+${(Math.floor((12.5 + 47.6 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.healing}`;
    case "ULT_GAIN_UP":
      return `+${(Math.floor((12.5 + 47.6 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.ultGain}`;
    case "HP_UP":
      return `+${(Math.floor((20 + 80 * x) * rankMultiplier) / 10).toFixed(1)}% ${labels.maxHp}`;
    case "CRYO_DMG_UP":
      return labels.notAppliedYet;
    default:
      return labels.notApplied;
  }
}

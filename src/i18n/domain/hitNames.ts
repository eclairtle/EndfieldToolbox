import { i18n, type SupportedLocale } from "@/i18n";
import { getLocalizedStatusBuffLabel } from "@/i18n/domain/statusBuffLabels";

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

const GENERIC_HIT_REGEX = /^Hit\s+(\d+)$/i;
const NUMERIC_SUFFIX_REGEX = /^(.*?)(\s+\d+)$/;
const REPEAT_SUFFIX_REGEX = /^(.*?)(\s+#\d+)$/;
const SEQ_HIT_REGEX = /^Seq\s+(\d+)$/i;

const GLOBAL_HIT_LABELS_ZH: Record<string, string> = {
  "Arts Burst": "法术爆发",
  "Heat Burst": "灼热爆发",
  "Cryo Burst": "寒冷爆发",
  "Electric Burst": "电磁爆发",
  "Nature Burst": "自然爆发",
  "Combustion Tick": "燃烧",
  "Combustion Trigger": "燃烧触发",
  "Electrification Trigger": "导电触发",
  "Corrosion Trigger": "腐蚀触发",
  "Freeze Trigger": "冻结触发",
  "Solidification Trigger": "冻结触发",
  "Shatter Trigger": "碎冰触发",
  "Knockdown Trigger": "倒地触发",
  "Lift Trigger": "击飞触发",
  "Crush Trigger": "猛击触发",
  "Breach Trigger": "碎甲触发",
};

const CHARACTER_HIT_LABELS_ZH: Record<string, Record<string, string>> = {
  zhuangfangyi: {
    "Create Sunderblades": "生成青霆剑",
    "Invoke Thunder Strikes": "引导青霆剑雷击",
    "Thunder Strike": "雷击",
    "Final Thunder Strike": "最终雷击",
  },
  tangtang: {
    "Shot x5": "射击 x5",
    "Create Waterspout": "生成水龙卷",
    "Additional Waterspout x2": "额外生成水龙卷 x2",
    "Apply OLDEN STARE": "施加古老图形",
    "OLDEN STARE Tick": "古老图形",
    "Rogue Wave (Delayed)": "巨浪（延迟）",
    "Rogue Wave (Early)": "巨浪（提前）",
    Waterspout: "水龙卷",
    "Waterspout (Riot Bringer)": "水龙卷（呼风唤浪）",
    "Additional Waterspout (Riot Bringer)": "额外水龙卷（呼风唤浪）",
  },
  lastrite: {
    "Ice Shard": "冰刺",
    Slash: "斩击",
    "Seq 1": "第一段",
    "Seq 2": "第二段",
    "Seq 3": "第三段",
    "Esoteric Legacy Trigger Hit": "幻影追击",
  },
  pogranichnik: {
    "Slash I": "斩击 I",
    "Slash II": "斩击 II",
    "Slash III": "斩击 III",
    "Slash III Enhanced": "强化斩击 III",
    Advance: "推进",
    "Shieldguard Harass": "盾卫袭扰",
    "Decisive Assault": "决胜突击",
  },
  arclight: {
    Additional: "追加攻击",
    "Seq 1": "第一段",
    "Seq 2": "第二段",
  },
  laevatain: {
    "UBS Hit 1": "终结技强化攻击 1",
    "UBS Hit 2": "终结技强化攻击 2",
    "Initial Explosion": "初始爆炸",
    "Continuous Hit ×10": "持续伤害 ×10",
    "Additional Hit": "追加攻击",
    "Enhanced Hit 1": "强化攻击 1",
    "Enhanced Hit 2": "强化攻击 2",
    "Enhanced Hit 3": "强化攻击 3",
    "Enhanced Hit 4": "强化攻击 4",
  },
  ardelia: {
    "Volcanic Cloud": "火山云",
    Explosion: "爆炸",
  },
  avywenna: {
    Strike: "攻击",
    "Thunderlance Recall": "雷枪回收",
    "Thunderlance EX Recall": "雷枪EX回收",
  },
  dapan: {
    "Aerial Flurry": "空中连斩",
    "Final Slam": "终结重击",
  },
  wulfgard: {
    "Rapid Barrage x5": "连射 x5",
  },
  chenqianyu: {
    "Slash x6": "斩击 x6",
    "Final Slash": "终结斩击",
  },
  lifeng: {
    "Seq 1": "第一段",
    "Seq 2": "第二段",
    Additional: "追加攻击",
    "Subduer of Evil I": "伏魔 I",
    "Subduer of Evil II": "伏魔 II",
    Unremitting: "不懈",
  },
  snowshine: {
    Explosion: "爆炸",
    "DoT x10": "持续伤害 x10",
  },
  estella: {
    "vs Non-Solidified": "对非冻结敌人",
    "vs Solidified": "对冻结敌人",
  },
  fluorite: {
    "Seq 1": "第一段",
    "Seq 2": "第二段",
    "Seq 3": "第三段",
    "Seq 4": "第四段",
  },
  endministrator: {
    "Crystal Shattering": "源石结晶碎裂",
  },
  gilberta: {
    "Gravity Pull": "重力牵引",
    "Explosion": "爆炸",
    "Gravity Field End": "重力场结束",
  },
  akekuri: {
    "Dash Sequence x2": "冲刺连击 x2",
  },
  xaihi: {
    "Auxiliary Crystal Treatment": "支援晶体治疗",
    "Auxiliary Crystal Deploy": "支援晶体部署",
    Amp: "增幅",
    Healing: "治疗",
  },
  rossi: {
    "Seq 1 Hit 1": "第一段第1击",
    "Seq 1 Hit 2": "第一段第2击",
    "Seq 1 Hit 3": "第一段第3击",
    "Combo 1": "连携一击",
    "Combo 2": "连携二击",
    "Combo 3 Hit 1": "连携三连击 1",
    "Combo 3 Hit 2": "连携三连击 2",
    "Combo 3 Hit 3": "连携三连击 3",
    "Seething Blood I": "沸腾狼血 I",
    "Seething Blood I (Potential 3)": "沸腾狼血 I（潜能3）",
    "Seething Blood I (Combustion)": "沸腾狼血 I（燃烧）",
    "Seething Blood I (Combustion, Potential 3)": "沸腾狼血 I（燃烧，潜能3）",
    "Seething Blood II": "沸腾狼血 II",
    "Seething Blood II (Potential 3)": "沸腾狼血 II（潜能3）",
    "Seething Blood II (Combustion)": "沸腾狼血 II（燃烧）",
    "Seething Blood II (Combustion, Potential 3)": "沸腾狼血 II（燃烧，潜能3）",
    "Razor Clawmark DoT I": "利爪之痕持续伤害 I",
    "Razor Clawmark DoT II": "利爪之痕持续伤害 II",
    "Battle Skill Seq 2 Hit 1": "战技第二段第1击",
    "Battle Skill Seq 2 Hit 2": "战技第二段第2击",
    "Battle Skill Seq 2 Hit 3": "战技第二段第3击",
    "Battle Skill Seq 2 Hit 4": "战技第二段第4击",
    "Multi Hit x25": "25连击",
  },
  arcane: {
    Imprisonment: "囹圄",
    "Imprisonment Detonation": "囹圄爆炸",
    Clusterstrike: "集束打击",
    "Tactical Double": "战术分身",
  },
};

function localizeZhHitName(baseLabel: string, characterId?: string) {
  const characterSpecific = characterId
    ? CHARACTER_HIT_LABELS_ZH[characterId.toLowerCase()]?.[baseLabel]
    : undefined;
  if (characterSpecific) {
    return characterSpecific;
  }

  const globalSpecific = GLOBAL_HIT_LABELS_ZH[baseLabel];
  if (globalSpecific) {
    return globalSpecific;
  }

  const triggerMatch = baseLabel.match(/^(.*)\s+Trigger$/);
  if (triggerMatch) {
    const localizedBase = getLocalizedStatusBuffLabel(triggerMatch[1], "zh-CN");
    return `${localizedBase}触发`;
  }

  const localizedStatusLabel = getLocalizedStatusBuffLabel(baseLabel, "zh-CN");
  return localizedStatusLabel || baseLabel;
}

export function getLocalizedHitName(args: {
  hitName?: string | null;
  hitIndex?: number | null;
  damageType?: string | null;
  characterId?: string;
}) {
  const locale = currentLocale();
  const rawLabel = args.hitName?.trim();

  if (!rawLabel) {
    if (args.damageType === "Healing" && typeof args.hitIndex === "number") {
      return `Healing ${args.hitIndex + 1}`;
    }
    if (typeof args.hitIndex === "number") {
      return `HIT ${args.hitIndex + 1}`;
    }
    return "";
  }

  const genericHitMatch = rawLabel.match(GENERIC_HIT_REGEX);
  if (genericHitMatch) {
    return `HIT ${genericHitMatch[1]}`;
  }

  const seqMatch = rawLabel.match(SEQ_HIT_REGEX);
  if (seqMatch) {
    return locale === "zh-CN" ? `第${seqMatch[1]}段` : rawLabel;
  }

  if (locale === "zh-CN") {
    const exactLocalized = localizeZhHitName(rawLabel, args.characterId);
    if (exactLocalized !== rawLabel) {
      return exactLocalized;
    }
  }

  const numericSuffixMatch = rawLabel.match(NUMERIC_SUFFIX_REGEX);
  if (numericSuffixMatch) {
    const [, baseLabel, numericSuffix] = numericSuffixMatch;
    const localizedBase = locale === "zh-CN"
      ? localizeZhHitName(baseLabel ?? "", args.characterId)
      : (baseLabel ?? "");
    return `${localizedBase}${numericSuffix ?? ""}`;
  }

  const repeatMatch = rawLabel.match(REPEAT_SUFFIX_REGEX);
  const baseLabel = repeatMatch?.[1] ?? rawLabel;
  const repeatSuffix = repeatMatch?.[2] ?? "";

  if (locale !== "zh-CN") {
    return `${baseLabel}${repeatSuffix}`;
  }

  return `${localizeZhHitName(baseLabel, args.characterId)}${repeatSuffix}`;
}

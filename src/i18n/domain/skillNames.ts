import { i18n, type SupportedLocale } from "@/i18n";
import { CHARACTERS, type CharacterBase } from "@/data/characters";
import { type WeaponBase } from "@/data/weapons";
import type { CharacterSkillKey } from "@/lib/build/characterSkills";
import { apiSkillTextByLocale } from "@/i18n/domain/apiSkillTexts";

const GENERIC_EN_CHARACTER_SKILL_NAMES: Record<CharacterSkillKey, string> = {
  basic: "Basic Attack",
  battleSkill: "Battle Skill",
  comboSkill: "Combo Skill",
  ultimate: "Ultimate",
};

const characterSkillNamesByLocale = apiSkillTextByLocale.characterSkills as Record<
  SupportedLocale,
  Record<string, Partial<Record<CharacterSkillKey, string>>>
>;

const characterSkillDescriptionsByLocale = apiSkillTextByLocale.characterSkillDescriptions as Record<
  SupportedLocale,
  Record<string, Partial<Record<CharacterSkillKey, string>>>
>;

const weaponSkillNamesByLocale = apiSkillTextByLocale.weaponSkills as Record<
  SupportedLocale,
  Record<string, readonly string[]>
>;

const weaponSkillDescriptionsByLocale = apiSkillTextByLocale.weaponSkillDescriptions as Record<
  SupportedLocale,
  Record<string, readonly string[]>
>;

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

function cleanApiText(text: string | null | undefined) {
  return String(text ?? "")
    .replace(/<@[^>]+>/g, "")
    .replace(/<\/>/g, "")
    .replace(/>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const zhCNCharacterUniqueTalentListOverrides: Record<string, string[]> = {
  gilberta: ["信使的歌声", "迟来的回信"],
  laevatain: ["灼心", "复燃"],
  yvonne: ["科技连击", "冰点"],
  akekuri: ["胜利喝彩", "心流时间"],
  antal: ["即兴发挥", "下意识"],
  ardelia: ["朋友的身影", "山顶冲浪"],
  wulfgard: ["灼热獠牙", "节制准则"],
  arclight: ["荒野游人", "众生智慧"],
  ember: ["陷阵之志", "以铁还铁"],
  lifeng: ["顿悟", "伏魔"],
  snowshine: ["极地生存", "救援专家"],
  endministrator: ["本质瓦解", "现实静滞"],
  dapan: ["勾芡", "尝尝咸淡"],
  perlica: ["歼灭协议", "循环协议"],
  estella: ["同病相怜", "惰性使然"],
  fluorite: ["落井下石爱好者", "捉摸不定"],
  catcher: ["坚韧防线", "全局思维"],
  alesh: ["闪冻锁鲜", "钓鳞老手"],
  lastrite: ["低温症", "低温脆性"],
  chenqianyu: ["斩锋", "破势"],
  xaihi: ["启动进程", "协议冻结"],
  tangtang: ["肝胆相照", "呼风唤浪"],
};

function normalizeTalentBaseName(name: string) {
  return name.replace(/\s+[IVX]+$/u, "").trim();
}

function extractRomanSuffix(name: string): string | null {
  const match = name.match(/\s+([IVX]+)$/u);
  return match?.[1] ?? null;
}

const enCharacterUniqueTalentNamesByCharId = Object.fromEntries(
  CHARACTERS.map((character) => [
    character.id,
    Object.fromEntries(Object.entries(character.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.name])),
  ]),
) as Record<string, Record<string, string>>;

const enCharacterUniqueTalentBaseNamesByCharId = Object.fromEntries(
  Object.entries(enCharacterUniqueTalentNamesByCharId).map(([characterId, keyToName]) => {
    const uniqueBaseNames = [...new Set(Object.values(keyToName).map(normalizeTalentBaseName))];
    return [characterId, uniqueBaseNames];
  }),
) as Record<string, string[]>;

const zhCNCharacterUniqueTalentBaseNameOverrides = Object.fromEntries(
  Object.entries(zhCNCharacterUniqueTalentListOverrides).map(([characterId, talentNames]) => {
    const baseNames = enCharacterUniqueTalentBaseNamesByCharId[characterId] ?? [];
    const mapped = Object.fromEntries(baseNames.map((baseName, index) => [baseName, talentNames[index] ?? baseName]));
    return [characterId, mapped];
  }),
) as Record<string, Record<string, string>>;

export function getCharacterSkillDisplayName(args: {
  character: CharacterBase | null | undefined;
  skillKey: CharacterSkillKey;
  fallbackName?: string;
}) {
  const locale = currentLocale();
  const characterId = args.character?.id;
  if (characterId) {
    const localized = characterSkillNamesByLocale[locale]?.[characterId]?.[args.skillKey];
    if (localized) {
      return cleanApiText(localized);
    }
    const fallbackEn = characterSkillNamesByLocale.en?.[characterId]?.[args.skillKey];
    if (fallbackEn) {
      return cleanApiText(fallbackEn);
    }
  }
  return args.fallbackName ?? GENERIC_EN_CHARACTER_SKILL_NAMES[args.skillKey];
}

export function getCharacterSkillDescription(args: {
  character: CharacterBase | null | undefined;
  skillKey: CharacterSkillKey;
  fallbackName?: string;
}) {
  const characterId = args.character?.id;
  if (!characterId) {
    return "";
  }

  const locale = currentLocale();
  const localized = characterSkillDescriptionsByLocale[locale]?.[characterId]?.[args.skillKey];
  if (localized) {
    return cleanApiText(localized);
  }

  const fallbackEn = characterSkillDescriptionsByLocale.en?.[characterId]?.[args.skillKey];
  if (fallbackEn) {
    return cleanApiText(fallbackEn);
  }

  return args.fallbackName ?? "";
}

export function getCharacterUniqueTalentDisplayName(args: {
  character: CharacterBase | null | undefined;
  talentKey: string;
  fallbackName?: string;
}) {
  const characterId = args.character?.id;
  if (!characterId) {
    return args.fallbackName ?? "";
  }

  const locale = currentLocale();
  const fallbackEn = enCharacterUniqueTalentNamesByCharId[characterId]?.[args.talentKey];
  if (locale === "zh-CN" && fallbackEn) {
    const baseName = normalizeTalentBaseName(fallbackEn);
    const localized = zhCNCharacterUniqueTalentBaseNameOverrides[characterId]?.[baseName];
    if (localized) {
      const romanSuffix = extractRomanSuffix(fallbackEn);
      return romanSuffix ? `${localized} ${romanSuffix}` : localized;
    }
  }

  return fallbackEn ?? args.fallbackName ?? args.talentKey;
}

export function getWeaponSkillDisplayName(args: {
  weapon: WeaponBase | null | undefined;
  skillIndex: number;
  skillId?: string;
  fallbackName?: string;
}) {
  const weaponId = args.weapon?.id;
  if (!weaponId) {
    return args.fallbackName ?? "";
  }

  const locale = currentLocale();
  const apiIndex = resolveWeaponSkillApiIndex(args.skillId, args.skillIndex);
  const localized = weaponSkillNamesByLocale[locale]?.[weaponId]?.[apiIndex];
  if (localized) {
    return cleanApiText(localized);
  }

  const fallbackEn = weaponSkillNamesByLocale.en?.[weaponId]?.[apiIndex];
  if (fallbackEn) {
    return cleanApiText(fallbackEn);
  }

  return args.fallbackName ?? `Skill ${args.skillIndex + 1}`;
}

export function getWeaponSkillDescription(args: {
  weapon: WeaponBase | null | undefined;
  skillIndex: number;
  skillId?: string;
  fallbackText?: string;
}) {
  const weaponId = args.weapon?.id;
  if (!weaponId) {
    return args.fallbackText ?? "";
  }

  const locale = currentLocale();
  const apiIndex = resolveWeaponSkillApiIndex(args.skillId, args.skillIndex);
  const localized = weaponSkillDescriptionsByLocale[locale]?.[weaponId]?.[apiIndex];
  if (localized) {
    return cleanApiText(localized);
  }

  const fallbackEn = weaponSkillDescriptionsByLocale.en?.[weaponId]?.[apiIndex];
  if (fallbackEn) {
    return cleanApiText(fallbackEn);
  }

  return args.fallbackText ?? "";
}

const WEAPON_PRIMARY_STAT_SKILL_IDS = new Set([
  "STR_UP",
  "AGI_UP",
  "INT_UP",
  "WIL_UP",
  "MAIN_ATTR_UP",
]);

const WEAPON_SECONDARY_STAT_SKILL_IDS = new Set([
  "ATK_UP",
  "CRIT_UP",
  "ARTS_DMG_UP",
  "ARTS_INTENSITY_UP",
  "HEALING_UP",
  "ULT_GAIN_UP",
  "HP_UP",
  "CRYO_DMG_UP",
]);

function resolveWeaponSkillApiIndex(skillId: string | undefined, fallbackIndex: number) {
  if (skillId === "UNIQUE") {
    return 0;
  }
  if (skillId && WEAPON_PRIMARY_STAT_SKILL_IDS.has(skillId)) {
    return 1;
  }
  if (skillId && WEAPON_SECONDARY_STAT_SKILL_IDS.has(skillId)) {
    return 2;
  }
  return fallbackIndex;
}

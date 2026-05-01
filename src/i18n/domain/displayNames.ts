import { i18n, type SupportedLocale } from "@/i18n";
import { CHARACTERS, type CharacterBase } from "@/data/characters";
import { WEAPONS, type WeaponBase } from "@/data/weapons";
import { GEARS, type GearBase } from "@/data/gears";
import { characterNamesByLocale } from "@/i18n/domain/characterNames";
import { weaponNamesByLocale } from "@/i18n/domain/weaponNames";
import { gearNamesByLocale } from "@/i18n/domain/gearNames";
import { cnGearApiText } from "@/i18n/domain/gearApiTexts";

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

export function getCharacterDisplayName(args: { id?: string | null; fallbackName?: string | null }) {
  if (!args.id) {
    return args.fallbackName ?? "";
  }
  const locale = currentLocale();
  const localized = characterNamesByLocale[locale][args.id as keyof typeof characterNamesByLocale["en"]];
  if (localized) {
    return localized;
  }
  const fallbackEn = characterNamesByLocale.en[args.id as keyof typeof characterNamesByLocale["en"]];
  if (fallbackEn) {
    return fallbackEn;
  }
  const match = CHARACTERS.find((character) => character.id === args.id);
  return match?.name ?? args.fallbackName ?? args.id;
}

export function getWeaponDisplayName(args: { id?: string | null; fallbackName?: string | null }) {
  if (!args.id) {
    return args.fallbackName ?? "";
  }
  const locale = currentLocale();
  const localized = weaponNamesByLocale[locale][args.id as keyof typeof weaponNamesByLocale["en"]];
  if (localized) {
    return localized;
  }
  const fallbackEn = weaponNamesByLocale.en[args.id as keyof typeof weaponNamesByLocale["en"]];
  if (fallbackEn) {
    return fallbackEn;
  }
  const match = WEAPONS.find((weapon) => weapon.id === args.id);
  return match?.name ?? args.fallbackName ?? args.id;
}

export function getGearDisplayName(args: { id?: string | null; fallbackName?: string | null }) {
  if (!args.id) {
    return args.fallbackName ?? "";
  }
  const locale = currentLocale();
  const localized = gearNamesByLocale[locale][args.id as keyof typeof gearNamesByLocale["en"]];
  if (localized) {
    return localized;
  }
  const fallbackEn = gearNamesByLocale.en[args.id as keyof typeof gearNamesByLocale["en"]];
  if (fallbackEn) {
    return fallbackEn;
  }
  const match = GEARS.find((gear) => gear.id === args.id);
  return match?.name ?? args.fallbackName ?? args.id;
}

export function getCharacterDisplayNameByCharacter(character: CharacterBase | null | undefined) {
  return getCharacterDisplayName({ id: character?.id, fallbackName: character?.name ?? "" });
}

export function getWeaponDisplayNameByWeapon(weapon: WeaponBase | null | undefined) {
  return getWeaponDisplayName({ id: weapon?.id, fallbackName: weapon?.name ?? "" });
}

export function getGearDisplayNameByGear(gear: GearBase | null | undefined) {
  return getGearDisplayName({ id: gear?.id, fallbackName: gear?.name ?? "" });
}

const cnGearSuitNameBySuitId = cnGearApiText.gearSuitNameBySuitId as Record<string, string>;
const cnGearSetDescriptionBySuitId = cnGearApiText.gearSetDescriptionBySuitId as Record<string, string>;
const cnGearSuitIdByGearId = cnGearApiText.gearSuitIdByGearId as Record<string, string>;

const gearSetNameToSuitId = Object.fromEntries(
  GEARS
    .filter((gear) => Boolean(gear.set))
    .map((gear) => [gear.set as string, cnGearSuitIdByGearId[gear.id] ?? ""])
    .filter(([, suitId]) => Boolean(suitId)),
) as Record<string, string>;

export function getGearSetDisplayName(args: { setName?: string | null; fallbackName?: string | null }) {
  const setName = args.setName ?? args.fallbackName ?? "";
  if (!setName) {
    return "";
  }

  const locale = currentLocale();
  if (locale === "zh-CN") {
    const suitId = gearSetNameToSuitId[setName];
    const localized = suitId ? cnGearSuitNameBySuitId[suitId] : "";
    if (localized) {
      return localized;
    }
  }

  return setName;
}

export function getGearSetDescription(args: { setName?: string | null; fallbackDescription?: string | null }) {
  const setName = args.setName ?? "";
  const fallback = args.fallbackDescription ?? "";
  if (!setName) {
    return fallback;
  }

  const locale = currentLocale();
  if (locale === "zh-CN") {
    const suitId = gearSetNameToSuitId[setName];
    const localized = suitId ? cnGearSetDescriptionBySuitId[suitId] : "";
    if (localized) {
      return localized;
    }
  }

  return fallback;
}

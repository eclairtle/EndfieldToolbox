import type { Attrs } from "@/lib/build/stats";
import type { CharacterBase } from "@/data/characters";
import type { AscensionStage } from "@/lib/build/progression";
import {
  getCharacterTalentBonus,
  isCharacterTalentUnlocked,
} from "@/lib/build/progression";

export const CHARACTER_TALENT_KEYS = [
  "TALENT_1",
  "TALENT_2",
  "TALENT_3",
  "TALENT_4",
] as const;

export type CharacterTalentKey = typeof CHARACTER_TALENT_KEYS[number];

export type CharacterTalentToggles = Record<CharacterTalentKey, boolean>;

export function getCharacterTalentBonuses(
  char: CharacterBase,
  index: number,
): Partial<Record<keyof Attrs, number>> {
  return char.genericTalentBonuses?.[index] ?? {
    [char.mainAttr]: getCharacterTalentBonus(index),
  };
}

export function applyGenericCharacterTalents(args: {
  char: CharacterBase;
  attrs: Attrs;
  ascensionStage: AscensionStage;
  toggles: CharacterTalentToggles;
}): Attrs {

  let attrs = { ...args.attrs };

  const talentKeys: CharacterTalentKey[] = [
    "TALENT_1",
    "TALENT_2",
    "TALENT_3",
    "TALENT_4",
  ];

  for (let i = 0; i < talentKeys.length; i++) {

    const key = talentKeys[i];

    const unlocked = isCharacterTalentUnlocked(i, args.ascensionStage);
    const enabled = key && args.toggles[key] === true;

    if (!unlocked || !enabled) continue;

    const bonuses = getCharacterTalentBonuses(args.char, i);
    for (const [attribute, bonus] of Object.entries(bonuses)) {
      const key = attribute as keyof Attrs;
      attrs[key] += bonus ?? 0;
    }
  }

  return attrs;
}

export type AscensionStage = 0 | 1 | 2 | 3 | 4;
export type PotentialLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const ASCENSION_LEVEL_CAPS: Record<AscensionStage, number> = {
  0: 20,
  1: 40,
  2: 60,
  3: 80,
  4: 90,
};

export const ASCENSION_LEVEL_MINS: Record<AscensionStage, number> = {
  0: 1,
  1: 20,
  2: 40,
  3: 60,
  4: 80,
};

export function clampCharacterLevelToAscension(
  level: number,
  stage: AscensionStage,
): number {
  const min = ASCENSION_LEVEL_MINS[stage];
  const max = ASCENSION_LEVEL_CAPS[stage];
  return Math.max(min, Math.min(max, level));
}

export function getCharacterTalentUnlockStage(index: number): AscensionStage {
  // Talent 1~4 unlock at ascension 1~4
  return (index + 1) as AscensionStage;
}

export function getCharacterTalentBonus(index: number): number {
  // +10 | +15 | +15 | +20
  const values = [10, 15, 15, 20] as const;
  return values[index] ?? 0;
}

export function isCharacterTalentUnlocked(
  talentIndex: number,
  stage: AscensionStage,
): boolean {
  return stage >= getCharacterTalentUnlockStage(talentIndex);
}

// Weapon skill level rules
export function getWeaponSkill1Range(stage: AscensionStage): { min: number; max: number } {
  switch (stage) {
    case 0: return { min: 1, max: 3 };
    case 1: return { min: 2, max: 5 };
    case 2: return { min: 2, max: 6 };
    case 3: return { min: 3, max: 8 };
    case 4: return { min: 3, max: 9 };
    default: return { min: 1, max: 3 };
  }
}

export function getWeaponSkill2Range(stage: AscensionStage): { min: number; max: number } {
  switch (stage) {
    case 0: return { min: 1, max: 3 };
    case 1: return { min: 1, max: 4 };
    case 2: return { min: 2, max: 6 };
    case 3: return { min: 2, max: 7 };
    case 4: return { min: 3, max: 9 };
    default: return { min: 1, max: 3 };
  }
}

export function getWeaponSkill3Range(potential: PotentialLevel): { min: number; max: number } {
  return {
    min: 1 + potential,
    max: 4 + potential,
  };
}

export function clampWeaponSkillLevel(
  level: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, level));
}

export function clampPotential(value: number): PotentialLevel {
  return Math.max(0, Math.min(5, value)) as PotentialLevel;
}

export function clampAscensionStage(value: number): AscensionStage {
  return Math.max(0, Math.min(4, value)) as AscensionStage;
}
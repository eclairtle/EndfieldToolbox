export type CharacterSkillKey = "basic" | "battleSkill" | "comboSkill" | "ultimate";

export type CharacterSkillLevels = {
  basic: number;       // 1..12
  battleSkill: number; // 1..12
  comboSkill: number;  // 1..12
  ultimate: number;    // 1..12
};

export function makeDefaultCharacterSkillLevels(): CharacterSkillLevels {
  return {
    basic: 1,
    battleSkill: 1,
    comboSkill: 1,
    ultimate: 1,
  };
}

export function clampCharacterSkillLevel(level: number): number {
  return Math.max(1, Math.min(12, level));
}
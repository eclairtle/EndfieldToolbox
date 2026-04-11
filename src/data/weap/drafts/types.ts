import type { WeaponSkillId, WeaponType } from "@/data/weapons";

export type WeaponDraftSkill = {
  id: WeaponSkillId | "UNIQUE";
  name: string;
  rank: number;
  implemented: boolean;
  rank1Description: string;
};

export type WeaponDraft = {
  id: string;
  name: string;
  weaponType: WeaponType;
  rarity: number;
  wikiUrl: string;
  baseAtkTable: string;
  tuningMaterials?: [string, string];
  finalStageTuningMaterial?: string;
  finalStageMaterials?: string[];
  skills: [WeaponDraftSkill, WeaponDraftSkill, WeaponDraftSkill];
  notes: string;
};

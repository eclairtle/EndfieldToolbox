import type { WeaponDraft } from "./types";

export const DETONATION_UNIT_DRAFT: WeaponDraft = {
  id: "detonation_unit",
  name: "Detonation Unit",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/detonation-unit",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Triphasic Nanoflake ×16",
    "Wulingstone ×8",
  ],
  skills: [
    {
      id: "MAIN_ATTR_UP",
      name: "Main Attribute Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Main attribute +17",
    },
    {
      id: "ARTS_INTENSITY_UP",
      name: "Arts Intensity Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Arts Intensity +10",
    },
    {
      id: "UNIQUE",
      name: "Detonate: Imposing Champion",
      rank: 1,
      implemented: false,
      rank1Description: "Secondary Attribute +10.0%.\nWhen the wielder applies an Arts Burst, target enemy suffers Arts DMG Taken +9.0% for 15s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

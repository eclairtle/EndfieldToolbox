import type { WeaponDraft } from "./types";

export const EMINENT_REPUTE_DRAFT: WeaponDraft = {
  id: "eminent_repute",
  name: "Eminent Repute",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/eminent-repute",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Tachyon Screening Lattice ×16",
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
      id: "UNIQUE",
      name: "Physical DMG Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Physical DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Brutality: Disciplinarian",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +10.0%.\nAfter the wielder consumes Vulnerability stack(s), the wielder gains ATK +[5.0% + 2.5%×Stacks Consumed] while other operators in the team gain half of this buff for 20s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

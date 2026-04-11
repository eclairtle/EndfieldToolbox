import type { WeaponDraft } from "./types";

export const CHIVALRIC_VIRTUES_DRAFT: WeaponDraft = {
  id: "chivalric_virtues",
  name: "Chivalric Virtues",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/chivalric-virtues",
  baseAtkTable: "ATK_TABLE_49_485",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "D96 Steel Sample 4 ×16",
    "Wulingstone ×8",
  ],
  skills: [
    {
      id: "WIL_UP",
      name: "Will Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Will +20",
    },
    {
      id: "UNIQUE",
      name: "HP Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Max HP +10.0%",
    },
    {
      id: "UNIQUE",
      name: "Medicant: Blight Fervor",
      rank: 1,
      implemented: false,
      rank1Description: "Treatment Efficiency +10.0%.\nAfter the wielder's skill provides HP treatment, the entire team gains ATK +9.0% for 15s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

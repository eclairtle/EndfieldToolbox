import type { WeaponDraft } from "./types";

export const ARTZY_TYRANNICAL_DRAFT: WeaponDraft = {
  id: "artzy_tyrannical",
  name: "Artzy Tyrannical",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/artzy-tyrannical",
  baseAtkTable: "ATK_TABLE_51_505",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Tachyon Screening Lattice ×16",
    "Wulingstone ×8",
  ],
  skills: [
    {
      id: "INT_UP",
      name: "Intellect Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Intellect +20",
    },
    {
      id: "CRIT_UP",
      name: "Critical Rate Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Critical Rate +2.5%",
    },
    {
      id: "UNIQUE",
      name: "Fracture: Artzy Exaggeration",
      rank: 1,
      implemented: false,
      rank1Description: "Cryo DMG Dealt +16.0%.\nAfter the wielder scores a critical hit with a battle skill or combo skill, the wielder gains Cryo DMG Dealt +14.0% for 30s.\nMax stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

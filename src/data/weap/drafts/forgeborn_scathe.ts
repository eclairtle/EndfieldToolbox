import type { WeaponDraft } from "./types";

export const FORGEBORN_SCATHE_DRAFT: WeaponDraft = {
  id: "forgeborn_scathe",
  name: "Forgeborn Scathe",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/forgeborn-scathe",
  baseAtkTable: "ATK_TABLE_52_510",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "D96 Steel Sample 4 ×16",
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
      id: "ATK_UP",
      name: "Attack Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Attack +5.0%",
    },
    {
      id: "UNIQUE",
      name: "Twilight: Blazing Wail",
      rank: 1,
      implemented: false,
      rank1Description: "Heat DMG Dealt +16.0%.\nWhen the wielder casts an ultimate, the wielder gains Basic Attack DMG Dealt +75.0% for 20s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

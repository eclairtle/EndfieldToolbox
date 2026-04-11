import type { WeaponDraft } from "./types";

export const THERMITE_CUTTER_DRAFT: WeaponDraft = {
  id: "thermite_cutter",
  name: "Thermite Cutter",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/thermite-cutter",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "D96 Steel Sample 4 ×16",
    "Igneosite ×8",
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
      id: "ATK_UP",
      name: "Attack Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Attack +5.0%",
    },
    {
      id: "UNIQUE",
      name: "Flow: Thermal Release",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +10.0%.\nAfter the wielder's skill recovers SP or grants a Link state, the entire team gains ATK +5.0% for 20s.\nMax stacks for effects of the same name: 2. Duration of each stack is counted separately.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

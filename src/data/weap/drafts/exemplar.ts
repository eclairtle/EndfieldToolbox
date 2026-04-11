import type { WeaponDraft } from "./types";

export const EXEMPLAR_DRAFT: WeaponDraft = {
  id: "exemplar",
  name: "Exemplar",
  weaponType: "GREATSWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/exemplar",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Triphasic Nanoflake ×16",
    "Igneosite ×8",
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
      id: "ATK_UP",
      name: "Attack Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Attack +5.0%",
    },
    {
      id: "UNIQUE",
      name: "Suppression: Stacked Hew",
      rank: 1,
      implemented: false,
      rank1Description: "Physical DMG Dealt +10.0%.\nWhen the wielder's battle skill or ultimate hits the enemy, the wielder gains Physical DMG Dealt +10.0% for 30s.\nMax stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

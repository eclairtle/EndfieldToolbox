import type { WeaponDraft } from "./types";

export const UMBRAL_TORCH_DRAFT: WeaponDraft = {
  id: "umbral_torch",
  name: "Umbral Torch",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/umbral-torch",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
    "Igneosite ×8",
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
      id: "UNIQUE",
      name: "Heat DMG Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Heat DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Infliction: Covetous Buildup",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +7.0%.\nWhenever Combustion or Corrosion is applied to an enemy, the wielder gains Heat and Nature DMG Dealt +8.0% for 20s.\nMax stacks for effects of the same name: 2. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

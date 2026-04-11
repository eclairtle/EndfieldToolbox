import type { WeaponDraft } from "./types";

export const NAVIGATOR_DRAFT: WeaponDraft = {
  id: "navigator",
  name: "Navigator",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/navigator",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
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
      id: "CRYO_DMG_UP",
      name: "Cryo DMG Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Cryo DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Infliction: Lone and Distant Sail",
      rank: 1,
      implemented: false,
      rank1Description: "Critical Rate +3.5%.\nWhen Solidification or Corrosion is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt +3.5%, and Critical Rate +2.0% for 15s. If this effect is triggered by the wielder, double the increase gained.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

import type { WeaponDraft } from "./types";

export const RAPID_ASCENT_DRAFT: WeaponDraft = {
  id: "rapid_ascent",
  name: "Rapid Ascent",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/rapid-ascent",
  baseAtkTable: "ATK_TABLE_50_495",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
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
      id: "CRIT_UP",
      name: "Critical Rate Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Critical Rate +2.5%",
    },
    {
      id: "UNIQUE",
      name: "Twilight: Azure Clouds",
      rank: 1,
      implemented: false,
      rank1Description: "Battle skills and ultimates gain Physical DMG Dealt +15.0%.\nAgainst Staggered enemies, battle skills and ultimates also gain DMG Dealt +35.0%.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

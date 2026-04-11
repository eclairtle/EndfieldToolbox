import type { WeaponDraft } from "./types";

export const GRAND_VISION_DRAFT: WeaponDraft = {
  id: "grand_vision",
  name: "Grand Vision",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/grand-vision",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
    "Wulingstone ×8",
  ],
  skills: [
    {
      id: "AGI_UP",
      name: "Agility Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Agility +20",
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
      name: "Infliction: Long Time Wish",
      rank: 1,
      implemented: false,
      rank1Description: "Arts Intensity +30.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +36.0%.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

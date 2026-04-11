import type { WeaponDraft } from "./types";

export const KHRAVENGGER_DRAFT: WeaponDraft = {
  id: "khravengger",
  name: "Khravengger",
  weaponType: "GREATSWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/khravengger",
  baseAtkTable: "ATK_TABLE_51_505",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Triphasic Nanoflake ×16",
    "Wulingstone ×8",
  ],
  skills: [
    {
      id: "STR_UP",
      name: "Strength Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Strength +20",
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
      name: "Detonate: Bonechilling",
      rank: 1,
      implemented: false,
      rank1Description: "Skill DMG Dealt +20.0% (for every skill).\nWhen the wielder's battle skill applies Cryo Infliction, the wielder gains Cryo DMG Dealt +10.0% for 15s. When the wielder deals combo skill DMG to an enemy with Cryo Infliction, the wielder gains Cryo DMG Dealt +20.0% for 15s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

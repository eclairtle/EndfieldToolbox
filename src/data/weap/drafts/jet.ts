import type { WeaponDraft } from "./types";

export const JET_DRAFT: WeaponDraft = {
  id: "jet",
  name: "JET",
  weaponType: "POLEARM",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/jet",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Quadrant Fitting Fluid ×16",
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
      id: "ATK_UP",
      name: "Attack Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Attack +5.0%",
    },
    {
      id: "UNIQUE",
      name: "Suppression: Astrophysics",
      rank: 1,
      implemented: false,
      rank1Description: "Arts DMG Dealt +12.0%.\nWhen the wielder casts a battle skill, the wielder gains Arts DMG Dealt +12.0% for 15s. When the wielder casts a combo skill, Arts DMG Dealt +12.0% for 15s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

import type { WeaponDraft } from "./types";

export const WHITE_NIGHT_NOVA_DRAFT: WeaponDraft = {
  id: "white_night_nova",
  name: "White Night Nova",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/white-night-nova",
  baseAtkTable: "ATK_TABLE_51_505",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Quadrant Fitting Fluid ×16",
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
      id: "ARTS_INTENSITY_UP",
      name: "Arts Intensity Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Arts Intensity +10",
    },
    {
      id: "UNIQUE",
      name: "Infliction: White Night Nova",
      rank: 1,
      implemented: false,
      rank1Description: "Arts DMG Dealt +12.0%.\nAfter the wielder applies Combustion or Electrification, the wielder gains Arts DMG Dealt +12.0% and Arts Intensity +25 for 15s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

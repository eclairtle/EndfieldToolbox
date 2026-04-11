import type { WeaponDraft } from "./types";

export const CLANNIBAL_DRAFT: WeaponDraft = {
  id: "clannibal",
  name: "Clannibal",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/clannibal",
  baseAtkTable: "ATK_TABLE_50_490",
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
      id: "ARTS_DMG_UP",
      name: "Arts Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Arts DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Infliction: Vicious Purge",
      rank: 1,
      implemented: false,
      rank1Description: "Arts DMG +12.0%.\nAfter the wielder consumes an Arts Reaction, target enemy suffers Arts DMG Taken +10.0% (for the specified element) for 15s.\nEach effect applies separately and does not stack with itself. Effect only triggers once every 25s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

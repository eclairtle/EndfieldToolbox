import type { WeaponDraft } from "./types";

export const WEDGE_DRAFT: WeaponDraft = {
  id: "wedge",
  name: "Wedge",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/wedge",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Tachyon Screening Lattice ×16",
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
      id: "CRIT_UP",
      name: "Critical Rate Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Critical Rate +2.5%",
    },
    {
      id: "UNIQUE",
      name: "Infliction: Wedge of Civilization",
      rank: 1,
      implemented: false,
      rank1Description: "Arts DMG Dealt +12.0%.\nWhen the wielder casts a battle skill, the wielder gains Arts DMG Dealt +8.0% for 15s. When the wielder's battle skill applies an Arts Reaction, the wielder gains Arts DMG Dealt +16.0% for 15s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

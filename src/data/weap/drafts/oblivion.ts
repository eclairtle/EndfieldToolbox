import type { WeaponDraft } from "./types";

export const OBLIVION_DRAFT: WeaponDraft = {
  id: "oblivion",
  name: "Oblivion",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/oblivion",
  baseAtkTable: "ATK_TABLE_50_495",
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
      id: "ARTS_DMG_UP",
      name: "Arts Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Arts DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Twilight: Humiliation",
      rank: 1,
      implemented: false,
      rank1Description: "Critical Rate +5.0%.\nWhen the wielder casts an ultimate, the wielder gains Arts DMG Dealt +24.0% for 15s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt +12.0% for 15s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

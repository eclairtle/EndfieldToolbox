import type { WeaponDraft } from "./types";

export const THUNDERBERGE_DRAFT: WeaponDraft = {
  id: "thunderberge",
  name: "Thunderberge",
  weaponType: "GREATSWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/thunderberge",
  baseAtkTable: "ATK_TABLE_50_495",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "D96 Steel Sample 4 ×16",
    "Igneosite ×8",
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
      id: "UNIQUE",
      name: "HP Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Max HP +10.0%",
    },
    {
      id: "UNIQUE",
      name: "Medicant: Eye of Talos",
      rank: 1,
      implemented: false,
      rank1Description: "Shield applied +24.0%.\nAfter the wielder's combo skill provides HP treatment, the controlled operator gains an additional [7.0%×Wielder's Max HP] Shield for 15s.\nEffect only triggers once every 15s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

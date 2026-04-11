import type { WeaponDraft } from "./types";

export const NEVER_REST_DRAFT: WeaponDraft = {
  id: "never_rest",
  name: "Never Rest",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/never-rest",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
    "Igneosite ×8",
  ],
  skills: [
    {
      id: "WIL_UP",
      name: "Will Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Will +20",
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
      name: "Flow: Reincarnation",
      rank: 1,
      implemented: false,
      rank1Description: "Physical DMG Dealt +16.0%.\nAfter the wielder's skill recovers SP, the wielder gains Physical DMG Dealt +5.0% while other operators in the team gain Physical DMG Dealt +2.5% for 30s.\nMax stacks for effects of the same name: 5. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

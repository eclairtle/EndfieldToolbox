import type { WeaponDraft } from "./types";

export const SUNDERED_PRINCE_DRAFT: WeaponDraft = {
  id: "sundered_prince",
  name: "Sundered Prince",
  weaponType: "GREATSWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/sundered-prince",
  baseAtkTable: "ATK_TABLE_50_490",
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
      id: "CRIT_UP",
      name: "Critical Rate Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Critical Rate +2.5%",
    },
    {
      id: "UNIQUE",
      name: "Crusher: Princely Deterrence",
      rank: 1,
      implemented: false,
      rank1Description: "When the wielder performs a Final Strike on the enemy, the wielder gains ATK +10.0% for 8s.\nIf the wielder is also the controlled operator, double the ATK increase gained and buff the Final Strike so that it deals Stagger +12.0% to the enemy.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

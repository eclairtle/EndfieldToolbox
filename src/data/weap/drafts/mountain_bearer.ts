import type { WeaponDraft } from "./types";

export const MOUNTAIN_BEARER_DRAFT: WeaponDraft = {
  id: "mountain_bearer",
  name: "Mountain Bearer",
  weaponType: "POLEARM",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/mountain-bearer",
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
      id: "AGI_UP",
      name: "Agility Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Agility +20",
    },
    {
      id: "UNIQUE",
      name: "Physical DMG Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Physical DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Efficacy: Weight of Mountain",
      rank: 1,
      implemented: false,
      rank1Description: "Against Vulnerable enemies, the wielder gains DMG Dealt +20.0%.\nWhen the wielder's battle skill applies Vulnerability, the wielder gains All Attributes +8.0% for 15s. When the wielder's battle skill applies Physical Susceptibility, the wielder gains All Attributes +8.0% for 15s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

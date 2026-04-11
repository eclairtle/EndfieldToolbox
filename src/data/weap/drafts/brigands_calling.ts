import type { WeaponDraft } from "./types";

export const BRIGANDS_CALLING_DRAFT: WeaponDraft = {
  id: "brigands_calling",
  name: "Brigand's Calling",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/brigands-calling",
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
      id: "AGI_UP",
      name: "Agility Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Agility +20",
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
      name: "Detonate: Brigand's Bane",
      rank: 1,
      implemented: false,
      rank1Description: "Cryo DMG Dealt +16.0%.\nWhen the wielder applies Cryo Infliction via battle skills or ultimates, the wielder gains Cryo DMG Dealt +20.0% for 20s. When the wielder's battle skill or ultimate applies Arts Susceptibility, the target enemy suffers Arts DMG Taken +6.0% for 20s.\nThe two effects apply separately and do not stack with themselves.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

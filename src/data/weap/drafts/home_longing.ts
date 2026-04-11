import type { WeaponDraft } from "./types";

export const HOME_LONGING_DRAFT: WeaponDraft = {
  id: "home_longing",
  name: "Home Longing",
  weaponType: "HANDCANNON",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/home-longing",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Tachyon Screening Lattice ×16",
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
      id: "CRYO_DMG_UP",
      name: "Cryo DMG Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Cryo DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Suppression: Olden Moon",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +7.0%.\nFor 20s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt +8.0%.\nMax stacks for effects of the same name: 2. Duration of each stack is counted separately.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

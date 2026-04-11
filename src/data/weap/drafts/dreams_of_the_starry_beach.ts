import type { WeaponDraft } from "./types";

export const DREAMS_OF_THE_STARRY_BEACH_DRAFT: WeaponDraft = {
  id: "dreams_of_the_starry_beach",
  name: "Dreams of the Starry Beach",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/dreams-of-the-starry-beach",
  baseAtkTable: "ATK_TABLE_50_495",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Quadrant Fitting Fluid ×16",
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
      id: "HEALING_UP",
      name: "Treatment Efficiency Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Treatment Efficiency +6.0%.",
    },
    {
      id: "UNIQUE",
      name: "Infliction: Tidal Murmurs",
      rank: 1,
      implemented: false,
      rank1Description: "Secondary attribute +16.0%.\nAfter the wielder consumes Corrosion, target enemy suffers Arts DMG Taken +10.0% for 25s.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

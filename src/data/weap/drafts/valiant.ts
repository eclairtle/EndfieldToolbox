import type { WeaponDraft } from "./types";

export const VALIANT_DRAFT: WeaponDraft = {
  id: "valiant",
  name: "Valiant",
  weaponType: "POLEARM",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/valiant",
  baseAtkTable: "ATK_TABLE_50_495",
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
      id: "UNIQUE",
      name: "Physical DMG Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Physical DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Combative: Virtuous Gain",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +10.0%.\nAfter the wielder applies Physical Statuses, the wielder also deals another hit of Physical DMG equal to 120.0% of the wielder's ATK.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

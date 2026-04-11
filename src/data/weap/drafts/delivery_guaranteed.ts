import type { WeaponDraft } from "./types";

export const DELIVERY_GUARANTEED_DRAFT: WeaponDraft = {
  id: "delivery_guaranteed",
  name: "Delivery Guaranteed",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/delivery-guaranteed",
  baseAtkTable: "ATK_TABLE_51_500",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Tachyon Screening Lattice ×16",
    "Wulingstone ×8",
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
      id: "ULT_GAIN_UP",
      name: "Ultimate Gain Efficiency Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Ultimate Gain Efficiency +6.0%",
    },
    {
      id: "UNIQUE",
      name: "Pursuit: Duty Fulfilled",
      rank: 1,
      implemented: false,
      rank1Description: "Nature DMG Dealt +16.0%.\nAfter the wielder's combo skill applies Lifted, the team gains Arts DMG Dealt +12.0% for 15s. For every enemy Lifted, the team gains bonus Arts DMG Dealt +3.5%, up to a max of +10.5%.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

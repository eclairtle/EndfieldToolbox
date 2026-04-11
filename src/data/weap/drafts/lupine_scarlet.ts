import type { WeaponDraft } from "./types";

export const LUPINE_SCARLET_DRAFT: WeaponDraft = {
  id: "lupine_scarlet",
  name: "Lupine Scarlet",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/lupine-scarlet",
  baseAtkTable: "ATK_TABLE_51_505",
  finalStageTuningMaterial: "Igneosite",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Triphasic Nanoflake ×16",
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
      id: "CRIT_UP",
      name: "Critical Rate Boost [L]",
      rank: 3,
      implemented: true,
      rank1Description: "Critical Rate +2.5%",
    },
    {
      id: "UNIQUE",
      name: "Fracture: Gnashing Wolves",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +16.0%.\nAfter the wielder's skill deals Critical DMG, the wielder gains 1 stack of Wolven Blood that grants Physical and Heat DMG Dealt +1.0%. Wolven Blood can reach 16 stacks. After reaching 16 stacks, the wielder gains another Physical and Heat DMG Dealt +24.0% for 20s. After the duration ends, all Wolven Blood stacks are removed.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

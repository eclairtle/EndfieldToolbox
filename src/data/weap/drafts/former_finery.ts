import type { WeaponDraft } from "./types";

export const FORMER_FINERY_DRAFT: WeaponDraft = {
  id: "former_finery",
  name: "Former Finery",
  weaponType: "GREATSWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/former-finery",
  baseAtkTable: "ATK_TABLE_50_495",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Metadiastima Photoemission Tube ×16",
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
      id: "UNIQUE",
      name: "HP Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Max HP +10.0%",
    },
    {
      id: "UNIQUE",
      name: "Efficacy: Mincing Therapy",
      rank: 1,
      implemented: false,
      rank1Description: "Treatment Efficiency +10.0%.\nAfter a Protected operator takes DMG, the wielder restores the said operator's HP by [84 + Will×1].\nEffect only triggers once every 15s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

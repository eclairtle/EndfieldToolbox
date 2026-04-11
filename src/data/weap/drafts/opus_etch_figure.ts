import type { WeaponDraft } from "./types";

export const OPUS_ETCH_FIGURE_DRAFT: WeaponDraft = {
  id: "opus_etch_figure",
  name: "Opus: Etch Figure",
  weaponType: "ARTS_UNIT",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/opus-etch-figure",
  baseAtkTable: "ATK_TABLE_49_485",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "Quadrant Fitting Fluid ×16",
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
      name: "Nature DMG Boost [L]",
      rank: 1,
      implemented: false,
      rank1Description: "Nature DMG Dealt +5.6%",
    },
    {
      id: "UNIQUE",
      name: "Suppression: Tillite Etchings",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +7.0%.\nWhen the wielder's battle skill applies Nature Infliction, other operators in the team gain Arts DMG Dealt +5.0% for 15s. For every enemy suffering from Nature Infliction applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt +2.0%, up to a max of +6.0%.\nEffects of the same name cannot stack.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

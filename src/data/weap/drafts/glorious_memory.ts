import type { WeaponDraft } from "./types";

export const GLORIOUS_MEMORY_DRAFT: WeaponDraft = {
  id: "glorious_memory",
  name: "Glorious Memory",
  weaponType: "SWORD",
  rarity: 6,
  wikiUrl: "https://warfarin.wiki/en/weapons/glorious-memory",
  baseAtkTable: "ATK_TABLE_50_490",
  finalStageTuningMaterial: "Wulingstone",
  finalStageMaterials: [
    "T-Creds ×90,000",
    "Heavy Cast Die ×30",
    "D96 Steel Sample 4 ×16",
    "Wulingstone ×8",
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
      name: "Twilight: Lingering Glow",
      rank: 1,
      implemented: false,
      rank1Description: "ATK +7.0%.\nWhen the wielder's skill applies Vulnerability, during the next ultimate cast within 30s, the wielder gains DMG Dealt +12.0%.\nMax stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.",
    },
  ],
  notes: "Populate implementation later for unique skills and integrate exact ATK table into live weapon data as needed.",
};

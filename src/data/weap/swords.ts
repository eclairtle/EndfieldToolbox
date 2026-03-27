import type { WeaponBase, WeaponPassiveDef } from "@/data/weapons";
import { skillY } from "@/lib/build/weaponSkills";

export const forgebornScathePassive: WeaponPassiveDef = {
  alwaysOn: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return {
      HEAT_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },

  buffs: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return [
      {
        id: "forgeborn_scathe_twilight_blazing_wail",
        name: "Twilight: Blazing Wail",
        trigger: "ON_ULTIMATE_USED",
        durationSeconds: 20,
        effects: [
          {
            stat: "BASIC_ATK_DMG_PCT",
            value: (60 + 15 * y) / 100,
          },
        ],
      },
    ];
  },
};

export const FORGEBORN_SCATHE: WeaponBase = {
  id: "forgeborn_scathe",
  name: "Forgeborn Scathe",
  weaponType: "SWORD",
  baseAtkLv1: 52,
  baseAtkLv90: 510,
  skills: [
    { id: "INT_UP", name: "INT UP",  rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK% UP",  rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Blazing Wail",  rank: 3, implemented: true },
  ],
  passive: forgebornScathePassive,
};

export const THERMITE_CUTTER: WeaponBase = {
  id: "thermite_cutter",
  name: "Thermite Cutter",
  weaponType: "SWORD",
  baseAtkLv1: 50,
  baseAtkLv90: 490,
  skills: [
    { id: "WIL_UP", name: "WIL UP",  rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK% UP",  rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Thermal Release",  rank: 3, implemented: true },
  ],
}


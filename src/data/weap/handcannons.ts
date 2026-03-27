import type { WeaponBase, WeaponPassiveDef } from "@/data/weapons";
import { skillY } from "@/lib/build/weaponSkills";

export const artsyTyrannicalPassive: WeaponPassiveDef = {
  alwaysOn: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return {
      CRYO_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },

  buffs: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return [
      {
        id: "artsy_tyrannical_fracture_artsy_exaggeration",
        name: "Fracture: Artsy Exaggeration",
        trigger: "ON_CRIT_WITH_BATTLE_OR_COMBO",
        durationSeconds: 30,
        effects: [
          {
            stat: "CRYO_DMG_PCT",
            value: (11.8 + 2.8 * y) / 100,
          },
        ],
      },
    ];
  },
};

export const ARTSY_TYRANNICAL: WeaponBase = {
  id: "artsy_tyrannical",
  name: "Artsy Tyrannical",
  weaponType: "HANDCANNON",
  baseAtkLv1: 51,
  baseAtkLv90: 505,
  skills: [
    { id: "INT_UP", name: "INT UP",  rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Crit UP",  rank: 3, implemented: true },
    { id: "UNIQUE", name: "Fracture: Artsy Exaggeration",  rank: 3, implemented: true },
  ],
  passive: artsyTyrannicalPassive,
};

export const ClannibalPassive: WeaponPassiveDef = {
  alwaysOn: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return {
      ARTS_DMG_PCT: (9.6 + 2.4 * y) / 100,
    };
  },

  buffs: ({ skillLevels }) => {
    const y = skillY(skillLevels[2] ?? 1);

    return [
      {
        id: "clannibal_infliction_vicious_purge",
        name: "Infliction: Vicious Purge",
        trigger: "ON_ARTS_REACTION_CONSUMPTION",
        durationSeconds: 30,
        effects: [
          {
            stat: "CRYO_DMG_PCT",
            value: (11.8 + 2.8 * y) / 100,
          },
        ],
      },
    ];
  },
};

export const CLANNIBAL: WeaponBase = {
  id: "clannibal",
  name: "Clannibal",
  weaponType: "HANDCANNON",
  baseAtkLv1: 50,
  baseAtkLv90: 490,
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute UP",  rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "ARTS DMG UP",  rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Vicious Purge",  rank: 3, implemented: true },
  ],
};
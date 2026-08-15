import type { GearBase, GearSetBonus } from "@/data/gears";

export const QINGBO_SET_BONUS: GearSetBonus = {
  "name": "Qingbo",
  "description": "3-piece set effect: Wearer's Combo Skill Cooldown Reduction +15%.\nWhen the wearer casts a combo skill, the wearer gains Skill DMG Dealt +20% for 15s. This effect can reach 2 stacks. Duration of each stack is counted separately."
};

export const QINGBO: GearBase[] = [
  {
    "id": "item_equip_t4_suit_combo_cd01_body_01",
    "name": "Qingbo Heavy Armor",
    "slot": "ARMOR",
    "set": "Qingbo",
    "defFlat": 56,
    "subs": [
      {
        "stat": "AGI",
        "value": 87
      },
      {
        "stat": "STR",
        "value": 58
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.1232142857142857
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_body_02",
    "name": "Qingbo Light Armor",
    "slot": "ARMOR",
    "set": "Qingbo",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
        "value": 87
      },
      {
        "stat": "WIL",
        "value": 58
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 20.7
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_edc_01",
    "name": "Qingbo Positioning Kit",
    "slot": "KIT",
    "set": "Qingbo",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 32
      },
      {
        "stat": "STR",
        "value": 21
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_edc_02",
    "name": "Qingbo Bamboo Cutter",
    "slot": "KIT",
    "set": "Qingbo",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 32
      },
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "HEAT_NATURE_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_edc_03",
    "name": "Qingbo Cask",
    "slot": "KIT",
    "set": "Qingbo",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 32
      },
      {
        "stat": "WIL",
        "value": 21
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 41.4
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_edc_04",
    "name": "Qingbo Positioning Kit T1",
    "slot": "KIT",
    "set": "Qingbo",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 32
      },
      {
        "stat": "STR",
        "value": 21
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_hand_01",
    "name": "Qingbo Gauntlets",
    "slot": "GLOVES",
    "set": "Qingbo",
    "defFlat": 42,
    "subs": [
      {
        "stat": "AGI",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      },
      {
        "stat": "SKILL_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_combo_cd01_hand_02",
    "name": "Qingbo Gloves",
    "slot": "GLOVES",
    "set": "Qingbo",
    "defFlat": 42,
    "subs": [
      {
        "stat": "INT",
        "value": 65
      },
      {
        "stat": "WIL",
        "value": 43
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.20535714285714285
      }
    ],
  }
];

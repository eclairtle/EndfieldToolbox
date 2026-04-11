import type { GearBase, GearSetBonus } from "@/data/gears";

export const FRONTIERS_SET_BONUS: GearSetBonus = {
  "name": "Frontiers",
  "description": "3-piece set effect: Wearer's Combo Skill Cooldown Reduction +15%.\nAfter the wearer's skill recovers SP, the team gains DMG +16% for 15s. This effect cannot stack."
};

export const FRONTIERS: GearBase[] = [
  {
    "id": "item_equip_t4_suit_atb01_body_01",
    "name": "Frontiers Armor",
    "slot": "ARMOR",
    "set": "Frontiers",
    "defFlat": 56,
    "subs": [
      {
        "stat": "STR",
        "value": 87
      },
      {
        "stat": "INT",
        "value": 58
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.259
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_body_02",
    "name": "Frontiers Armor T1",
    "slot": "ARMOR",
    "set": "Frontiers",
    "defFlat": 56,
    "subs": [
      {
        "stat": "STR",
        "value": 87
      },
      {
        "stat": "AGI",
        "value": 58
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_body_03",
    "name": "Frontiers Armor T2",
    "slot": "ARMOR",
    "set": "Frontiers",
    "defFlat": 56,
    "subs": [
      {
        "stat": "AGI",
        "value": 87
      },
      {
        "stat": "INT",
        "value": 58
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_body_04",
    "name": "Frontiers Armor T3",
    "slot": "ARMOR",
    "set": "Frontiers",
    "defFlat": 56,
    "subs": [
      {
        "stat": "AGI",
        "value": 87
      },
      {
        "stat": "INT",
        "value": 58
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_body_05",
    "name": "Frontiers Protection Suit",
    "slot": "ARMOR",
    "set": "Frontiers",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
        "value": 87
      },
      {
        "stat": "AGI",
        "value": 58
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_edc_01",
    "name": "Frontiers Comm",
    "slot": "KIT",
    "set": "Frontiers",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_edc_02",
    "name": "Frontiers Comm T1",
    "slot": "KIT",
    "set": "Frontiers",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 32
      },
      {
        "stat": "INT",
        "value": 21
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_edc_03",
    "name": "Frontiers Analyzer",
    "slot": "KIT",
    "set": "Frontiers",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 41
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.517
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_edc_04",
    "name": "Frontiers Extra O2 Tube",
    "slot": "KIT",
    "set": "Frontiers",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 32
      },
      {
        "stat": "INT",
        "value": 21
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_edc_05",
    "name": "Frontiers O2 Tube",
    "slot": "KIT",
    "set": "Frontiers",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 41
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_hand_01",
    "name": "Frontiers Blight RES Gloves",
    "slot": "GLOVES",
    "set": "Frontiers",
    "defFlat": 42,
    "subs": [
      {
        "stat": "AGI",
        "value": 65
      },
      {
        "stat": "INT",
        "value": 43
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.345
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atb01_hand_02",
    "name": "Frontiers Fiber Gloves",
    "slot": "GLOVES",
    "set": "Frontiers",
    "defFlat": 42,
    "subs": [
      {
        "stat": "WIL",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      }
    ],
  }
];


import type { GearBase, GearSetBonus } from "@/data/gears";

export const MI_SECURITY_SET_BONUS: GearSetBonus = {
  "name": "MI Security",
  "description": "3-piece set effect: Wearer's Critical Rate +5%. \nAfter the wearer scores a critical hit, the wearer gains ATK +5% for 5s. This effect can reach 5 stacks. At max stacks, grant an additional Critical Rate +5%. This effect cannot stack."
};

export const MI_SECURITY: GearBase[] = [
  {
    "id": "item_equip_t4_suit_criti01_body_01",
    "name": "MI Security Armor",
    "slot": "ARMOR",
    "set": "MI Security",
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
        "stat": "ARTS_INTENSITY",
        "value": 20
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_body_02",
    "name": "MI Security Overalls",
    "slot": "ARMOR",
    "set": "MI Security",
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
        "stat": "BASIC_ATK_DMG_PCT",
        "value": 0.138
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_body_03",
    "name": "MI Security Overalls T1",
    "slot": "ARMOR",
    "set": "MI Security",
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
        "stat": "CRIT_RATE_PCT",
        "value": 0.052
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_body_04",
    "name": "MI Security Overalls T2",
    "slot": "ARMOR",
    "set": "MI Security",
    "defFlat": 56,
    "subs": [
      {
        "stat": "WIL",
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
    "id": "item_equip_t4_suit_criti01_body_06",
    "name": "MI Security Armor T1",
    "slot": "ARMOR",
    "set": "MI Security",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_edc_01",
    "name": "MI Security Armband",
    "slot": "KIT",
    "set": "MI Security",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 32
      },
      {
        "stat": "WIL",
        "value": 21
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_edc_02",
    "name": "MI Security Scope",
    "slot": "KIT",
    "set": "MI Security",
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
    "id": "item_equip_t4_suit_criti01_edc_03",
    "name": "MI Security Toolkit",
    "slot": "KIT",
    "set": "MI Security",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 32
      },
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "CRIT_RATE_PCT",
        "value": 0.103
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_edc_04",
    "name": "MI Security Push Knife",
    "slot": "KIT",
    "set": "MI Security",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 32
      },
      {
        "stat": "INT",
        "value": 21
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_edc_05",
    "name": "MI Security Push Knife T1",
    "slot": "KIT",
    "set": "MI Security",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 32
      },
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_edc_06",
    "name": "MI Security Scope T1",
    "slot": "KIT",
    "set": "MI Security",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 32
      },
      {
        "stat": "INT",
        "value": 21
      },
      {
        "stat": "CRIT_RATE_PCT",
        "value": 0.103
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_hand_01",
    "name": "MI Security Gloves",
    "slot": "GLOVES",
    "set": "MI Security",
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
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.345
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_hand_02",
    "name": "MI Security Hands PPE",
    "slot": "GLOVES",
    "set": "MI Security",
    "defFlat": 42,
    "subs": [
      {
        "stat": "INT",
        "value": 65
      },
      {
        "stat": "AGI",
        "value": 43
      },
      {
        "stat": "BASIC_ATK_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_hand_03",
    "name": "MI Security Hands PPE T1",
    "slot": "GLOVES",
    "set": "MI Security",
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
        "stat": "CRIT_RATE_PCT",
        "value": 0.086
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_criti01_hand_04",
    "name": "MI Security Gloves T1",
    "slot": "GLOVES",
    "set": "MI Security",
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
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.431
      }
    ],
  }
];


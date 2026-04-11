import type { GearBase, GearSetBonus } from "@/data/gears";

export const BONEKRUSHA_SET_BONUS: GearSetBonus = {
  "name": "Bonekrusha",
  "description": "3-piece set effect: Wearer's ATK +15%. \nWhen the wearer casts a combo skill, the wearer gains 1 stack of Bonekrushing Smash that grants the wearer's next battle skill DMG Dealt +30%. Bonekrushing Smash can stack 2 time(s)."
};

export const BONEKRUSHA: GearBase[] = [
  {
    "id": "item_equip_t4_suit_attri01_body_01",
    "name": "Bonekrusha Heavy Armor",
    "slot": "ARMOR",
    "set": "Bonekrusha",
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
    "id": "item_equip_t4_suit_attri01_body_02",
    "name": "Bonekrusha Heavy Armor T1",
    "slot": "ARMOR",
    "set": "Bonekrusha",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_body_03",
    "name": "Bonekrusha Poncho",
    "slot": "ARMOR",
    "set": "Bonekrusha",
    "defFlat": 56,
    "subs": [
      {
        "stat": "WIL",
        "value": 87
      },
      {
        "stat": "STR",
        "value": 58
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_body_04",
    "name": "Bonekrusha Poncho T1",
    "slot": "ARMOR",
    "set": "Bonekrusha",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_body_05",
    "name": "Bonekrusha Heavy Armor T2",
    "slot": "ARMOR",
    "set": "Bonekrusha",
    "defFlat": 56,
    "subs": [
      {
        "stat": "AGI",
        "value": 87
      },
      {
        "stat": "STR",
        "value": 58
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_edc_03",
    "name": "Bonekrusha Figurine",
    "slot": "KIT",
    "set": "Bonekrusha",
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
    "id": "item_equip_t4_suit_attri01_edc_04",
    "name": "Bonekrusha Mask",
    "slot": "KIT",
    "set": "Bonekrusha",
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
        "stat": "DMG_VS_STAGGERED_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_edc_05",
    "name": "Bonekrusha Mask T1",
    "slot": "KIT",
    "set": "Bonekrusha",
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
        "stat": "CRIT_RATE_PCT",
        "value": 0.103
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_edc_06",
    "name": "Bonekrusha Figurine T1",
    "slot": "KIT",
    "set": "Bonekrusha",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 32
      },
      {
        "stat": "INT",
        "value": 21
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_edc_07",
    "name": "Bonekrusha Mask T2",
    "slot": "KIT",
    "set": "Bonekrusha",
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
    "id": "item_equip_t4_suit_attri01_hand_01",
    "name": "Bonekrusha Wristband",
    "slot": "GLOVES",
    "set": "Bonekrusha",
    "defFlat": 42,
    "subs": [
      {
        "stat": "STR",
        "value": 65
      },
      {
        "stat": "AGI",
        "value": 43
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_attri01_hand_02",
    "name": "Bonekrusha Wristband T1",
    "slot": "GLOVES",
    "set": "Bonekrusha",
    "defFlat": 42,
    "subs": [
      {
        "stat": "AGI",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      }
    ],
  }
];


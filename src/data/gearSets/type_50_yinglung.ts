import type { GearBase, GearSetBonus } from "@/data/gears";

export const TYPE_50_YINGLUNG_SET_BONUS: GearSetBonus = {
  "name": "Type 50 Yinglung",
  "description": "3-piece set effect: Wearer's ATK +15%. \nWhen any operator in the team casts a battle skill, the wearer gains 1 stack of Yinglung's Edge that gives DMG +20% to the wearer's next combo skill. Yinglung's Edge can stack 3 time(s)."
};

export const TYPE_50_YINGLUNG: GearBase[] = [
  {
    "id": "item_equip_t4_suit_atk02_body_01",
    "name": "Type 50 Yinglung Heavy Armor",
    "slot": "ARMOR",
    "set": "Type 50 Yinglung",
    "defFlat": 56,
    "subs": [
      {
        "stat": "STR",
        "value": 87
      },
      {
        "stat": "WIL",
        "value": 58
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.115
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_body_02",
    "name": "Type 50 Yinglung Heavy Armor T1",
    "slot": "ARMOR",
    "set": "Type 50 Yinglung",
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
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_body_03",
    "name": "Type 50 Yinglung Heavy Armor T2",
    "slot": "ARMOR",
    "set": "Type 50 Yinglung",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_body_04",
    "name": "Type 50 Yinglung Light Armor",
    "slot": "ARMOR",
    "set": "Type 50 Yinglung",
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
        "stat": "SKILL_DMG_PCT",
        "value": 0.138
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_edc_01",
    "name": "Type 50 Yinglung Radar",
    "slot": "KIT",
    "set": "Type 50 Yinglung",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 32
      },
      {
        "stat": "WIL",
        "value": 21
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_edc_02",
    "name": "Type 50 Yinglung Radar T1",
    "slot": "KIT",
    "set": "Type 50 Yinglung",
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
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.517
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_edc_03",
    "name": "Type 50 Yinglung Radar T2",
    "slot": "KIT",
    "set": "Type 50 Yinglung",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_edc_04",
    "name": "Type 50 Yinglung Knife",
    "slot": "KIT",
    "set": "Type 50 Yinglung",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_edc_05",
    "name": "Type 50 Yinglung Knife T1",
    "slot": "KIT",
    "set": "Type 50 Yinglung",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 32
      },
      {
        "stat": "STR",
        "value": 21
      },
      {
        "stat": "SKILL_DMG_PCT",
        "value": 0.276
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_atk02_hand_01",
    "name": "Type 50 Yinglung Gloves",
    "slot": "GLOVES",
    "set": "Type 50 Yinglung",
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
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.345
      }
    ],
  }
];


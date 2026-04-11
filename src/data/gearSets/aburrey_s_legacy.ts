import type { GearBase, GearSetBonus } from "@/data/gears";

export const ABURREY_S_LEGACY_SET_BONUS: GearSetBonus = {
  "name": "Aburrey's Legacy",
  "description": "3-piece set effect: Wearer's Skill DMG +24%. \nWhen the wearer casts a battle skill, combo skill, or ultimate, the wearer gains ATK +5% for 15s. The buff from each of the three skill types is unique and does not stack with itself."
};

export const ABURREY_S_LEGACY: GearBase[] = [
  {
    "id": "item_equip_t3_suit_atk01_body_01",
    "name": "Aburrey Heavy Armor",
    "slot": "ARMOR",
    "set": "Aburrey's Legacy",
    "defFlat": 40,
    "subs": [
      {
        "stat": "STR",
        "value": 61
      },
      {
        "stat": "AGI",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_body_02",
    "name": "Aburrey Heavy Armor T1",
    "slot": "ARMOR",
    "set": "Aburrey's Legacy",
    "defFlat": 40,
    "subs": [
      {
        "stat": "AGI",
        "value": 61
      },
      {
        "stat": "STR",
        "value": 41
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_body_03",
    "name": "Aburrey Light Armor",
    "slot": "ARMOR",
    "set": "Aburrey's Legacy",
    "defFlat": 40,
    "subs": [
      {
        "stat": "INT",
        "value": 61
      },
      {
        "stat": "STR",
        "value": 41
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.088
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_body_04",
    "name": "Aburrey Light Armor T1",
    "slot": "ARMOR",
    "set": "Aburrey's Legacy",
    "defFlat": 40,
    "subs": [
      {
        "stat": "WIL",
        "value": 61
      },
      {
        "stat": "AGI",
        "value": 41
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_01",
    "name": "Aburrey UV Lamp",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "STR",
        "value": 23
      },
      {
        "stat": "AGI",
        "value": 15
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_02",
    "name": "Aburrey Auditory Chip",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "STR",
        "value": 23
      },
      {
        "stat": "WIL",
        "value": 15
      },
      {
        "stat": "DMG_VS_STAGGERED_PCT",
        "value": 0.294
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_03",
    "name": "Aburrey Auditory Chip T1",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "AGI",
        "value": 23
      },
      {
        "stat": "STR",
        "value": 15
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.294
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_04",
    "name": "Aburrey Flashlight",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "INT",
        "value": 23
      },
      {
        "stat": "STR",
        "value": 15
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.175
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_05",
    "name": "Aburrey Sensor Chip",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "WIL",
        "value": 23
      },
      {
        "stat": "AGI",
        "value": 15
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.294
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_edc_06",
    "name": "Aburrey Sensor Chip T1",
    "slot": "KIT",
    "set": "Aburrey's Legacy",
    "defFlat": 15,
    "subs": [
      {
        "stat": "WIL",
        "value": 23
      },
      {
        "stat": "INT",
        "value": 15
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.294
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_atk01_hand_01",
    "name": "Aburrey Gauntlets",
    "slot": "GLOVES",
    "set": "Aburrey's Legacy",
    "defFlat": 30,
    "subs": [
      {
        "stat": "STR",
        "value": 46
      },
      {
        "stat": "WIL",
        "value": 30
      },
      {
        "stat": "DMG_VS_STAGGERED_PCT",
        "value": 0.245
      }
    ],
  }
];


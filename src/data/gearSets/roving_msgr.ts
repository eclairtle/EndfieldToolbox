import type { GearBase, GearSetBonus } from "@/data/gears";

export const ROVING_MSGR_SET_BONUS: GearSetBonus = {
  "name": "Roving MSGR",
  "description": "3-piece set effect: Wearer's Agility +50. \nWhen the wearer's HP is above 80%, Physical DMG +20%."
};

export const ROVING_MSGR: GearBase[] = [
  {
    "id": "item_equip_t2_suit_agi01_body_01",
    "name": "Roving MSGR Jacket",
    "slot": "ARMOR",
    "set": "Roving MSGR",
    "defFlat": 28,
    "subs": [
      {
        "stat": "AGI",
        "value": 44
      },
      {
        "stat": "INT",
        "value": 29
      },
      {
        "stat": "FLAT_ATK",
        "value": 16
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_agi01_edc_01",
    "name": "Roving MSGR Gyro",
    "slot": "KIT",
    "set": "Roving MSGR",
    "defFlat": 10,
    "subs": [
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_agi01_edc_02",
    "name": "Roving MSGR Flashlight",
    "slot": "KIT",
    "set": "Roving MSGR",
    "defFlat": 10,
    "subs": [
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.21
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_agi01_hand_01",
    "name": "Roving MSGR Fists",
    "slot": "GLOVES",
    "set": "Roving MSGR",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 33
      },
      {
        "stat": "STR",
        "value": 22
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.097
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_agi01_body_01",
    "name": "Roving MSGR Jacket T1",
    "slot": "ARMOR",
    "set": "Roving MSGR",
    "defFlat": 40,
    "subs": [
      {
        "stat": "AGI",
        "value": 61
      },
      {
        "stat": "INT",
        "value": 41
      },
      {
        "stat": "HP",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_agi01_edc_01",
    "name": "Roving MSGR Flashlight T1",
    "slot": "KIT",
    "set": "Roving MSGR",
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
    "id": "item_equip_t3_suit_agi01_edc_02",
    "name": "Roving MSGR Flashlight T2",
    "slot": "KIT",
    "set": "Roving MSGR",
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
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.368
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_agi01_edc_03",
    "name": "Roving MSGR Gyro T1",
    "slot": "KIT",
    "set": "Roving MSGR",
    "defFlat": 15,
    "subs": [
      {
        "stat": "AGI",
        "value": 23
      },
      {
        "stat": "INT",
        "value": 15
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_agi01_hand_01",
    "name": "Roving MSGR Fists T1",
    "slot": "GLOVES",
    "set": "Roving MSGR",
    "defFlat": 30,
    "subs": [
      {
        "stat": "AGI",
        "value": 46
      },
      {
        "stat": "STR",
        "value": 30
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.123
      }
    ],
  }
];


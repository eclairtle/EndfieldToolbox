import type { GearBase, GearSetBonus } from "@/data/gears";

export const ARMORED_MSGR_SET_BONUS: GearSetBonus = {
  "name": "Armored MSGR",
  "description": "3-piece set effect: Wearer's Strength +50. \nWhen the wearer's HP is below 50%, the wearer gains 30% DMG Reduction against all types of DMG."
};

export const ARMORED_MSGR: GearBase[] = [
  {
    "id": "item_equip_t2_suit_str01_body_01",
    "name": "Armored MSGR Jacket",
    "slot": "ARMOR",
    "set": "Armored MSGR",
    "defFlat": 28,
    "subs": [
      {
        "stat": "STR",
        "value": 44
      },
      {
        "stat": "AGI",
        "value": 29
      },
      {
        "stat": "HP",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_str01_edc_01",
    "name": "Armored MSGR Gyro",
    "slot": "KIT",
    "set": "Armored MSGR",
    "defFlat": 10,
    "subs": [
      {
        "stat": "STR",
        "value": 21
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_str01_edc_02",
    "name": "Armored MSGR Flashlight",
    "slot": "KIT",
    "set": "Armored MSGR",
    "defFlat": 10,
    "subs": [
      {
        "stat": "STR",
        "value": 21
      },
      {
        "stat": "HP",
        "value": 0.21
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_str01_hand_01",
    "name": "Armored MSGR Gloves",
    "slot": "GLOVES",
    "set": "Armored MSGR",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 33
      },
      {
        "stat": "WIL",
        "value": 22
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_str01_body_01",
    "name": "Armored MSGR Jacket T1",
    "slot": "ARMOR",
    "set": "Armored MSGR",
    "defFlat": 40,
    "subs": [
      {
        "stat": "STR",
        "value": 61
      },
      {
        "stat": "WIL",
        "value": 41
      },
      {
        "stat": "HP",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_str01_edc_01",
    "name": "Armored MSGR Gyro T1",
    "slot": "KIT",
    "set": "Armored MSGR",
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
        "stat": "FLAT_ATK",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_str01_edc_02",
    "name": "Armored MSGR Flashlight T1",
    "slot": "KIT",
    "set": "Armored MSGR",
    "defFlat": 15,
    "subs": [
      {
        "stat": "STR",
        "value": 23
      },
      {
        "stat": "AGI",
        "value": 15
      },
      {
        "stat": "CRIT_RATE_PCT",
        "value": 0.073
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_str01_hand_01",
    "name": "Armored MSGR Gloves T1",
    "slot": "GLOVES",
    "set": "Armored MSGR",
    "defFlat": 30,
    "subs": [
      {
        "stat": "STR",
        "value": 46
      },
      {
        "stat": "AGI",
        "value": 30
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_str01_hand_02",
    "name": "Armored MSGR Gloves T2",
    "slot": "GLOVES",
    "set": "Armored MSGR",
    "defFlat": 30,
    "subs": [
      {
        "stat": "STR",
        "value": 46
      },
      {
        "stat": "AGI",
        "value": 30
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.245
      }
    ],
  }
];


import type { GearBase, GearSetBonus } from "@/data/gears";

export const MORDVOLT_INSULATION_SET_BONUS: GearSetBonus = {
  "name": "Mordvolt Insulation",
  "description": "3-piece set effect: Wearer's Intellect +50. \nWhen the wearer's HP is above 80%, Arts DMG +20%."
};

export const MORDVOLT_INSULATION: GearBase[] = [
  {
    "id": "item_equip_t2_suit_wisd01_body_01",
    "name": "Mordvolt Insulation Vest",
    "slot": "ARMOR",
    "set": "Mordvolt Insulation",
    "defFlat": 28,
    "subs": [
      {
        "stat": "INT",
        "value": 44
      },
      {
        "stat": "STR",
        "value": 29
      },
      {
        "stat": "FLAT_ATK",
        "value": 16
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_wisd01_edc_01",
    "name": "Mordvolt Insulation Wrench",
    "slot": "KIT",
    "set": "Mordvolt Insulation",
    "defFlat": 10,
    "subs": [
      {
        "stat": "INT",
        "value": 21
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_wisd01_edc_02",
    "name": "Mordvolt Insulation Wrench T1",
    "slot": "KIT",
    "set": "Mordvolt Insulation",
    "defFlat": 10,
    "subs": [
      {
        "stat": "INT",
        "value": 21
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_wisd01_edc_03",
    "name": "Mordvolt Insulation Battery",
    "slot": "KIT",
    "set": "Mordvolt Insulation",
    "defFlat": 10,
    "subs": [
      {
        "stat": "INT",
        "value": 21
      },
      {
        "stat": "CRIT_RATE_PCT",
        "value": 0.053
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_wisd01_hand_01",
    "name": "Mordvolt Insulation Gloves",
    "slot": "GLOVES",
    "set": "Mordvolt Insulation",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 33
      },
      {
        "stat": "WIL",
        "value": 22
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_wisd01_body_01",
    "name": "Mordvolt Insulation Vest T1",
    "slot": "ARMOR",
    "set": "Mordvolt Insulation",
    "defFlat": 40,
    "subs": [
      {
        "stat": "INT",
        "value": 61
      },
      {
        "stat": "AGI",
        "value": 41
      },
      {
        "stat": "BASIC_ATK_DMG_PCT",
        "value": 0.098
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_wisd01_body_02",
    "name": "Mordvolt Insulation Vest T2",
    "slot": "ARMOR",
    "set": "Mordvolt Insulation",
    "defFlat": 40,
    "subs": [
      {
        "stat": "INT",
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
    "id": "item_equip_t3_suit_wisd01_edc_01",
    "name": "Mordvolt Insulation Wrench T2",
    "slot": "KIT",
    "set": "Mordvolt Insulation",
    "defFlat": 15,
    "subs": [
      {
        "stat": "INT",
        "value": 23
      },
      {
        "stat": "AGI",
        "value": 15
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_wisd01_edc_02",
    "name": "Mordvolt Insulation Battery T1",
    "slot": "KIT",
    "set": "Mordvolt Insulation",
    "defFlat": 15,
    "subs": [
      {
        "stat": "INT",
        "value": 29
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.175
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_wisd01_hand_01",
    "name": "Mordvolt Insulation Gloves T1",
    "slot": "GLOVES",
    "set": "Mordvolt Insulation",
    "defFlat": 30,
    "subs": [
      {
        "stat": "INT",
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


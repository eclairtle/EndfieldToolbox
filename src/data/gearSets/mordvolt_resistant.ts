import type { GearBase, GearSetBonus } from "@/data/gears";

export const MORDVOLT_RESISTANT_SET_BONUS: GearSetBonus = {
  "name": "Mordvolt Resistant",
  "description": "3-piece set effect: Wearer's Will +50. \nWhen the wearer's HP is below 50%, Treatment Effect +30%."
};

export const MORDVOLT_RESISTANT: GearBase[] = [
  {
    "id": "item_equip_t2_suit_will01_body_01",
    "name": "Mordvolt Resistant Vest",
    "slot": "ARMOR",
    "set": "Mordvolt Resistant",
    "defFlat": 28,
    "subs": [
      {
        "stat": "WIL",
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
    "id": "item_equip_t2_suit_will01_edc_01",
    "name": "Mordvolt Resistant Wrench",
    "slot": "KIT",
    "set": "Mordvolt Resistant",
    "defFlat": 10,
    "subs": [
      {
        "stat": "WIL",
        "value": 21
      },
      {
        "stat": "FLAT_ATK",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_will01_edc_02",
    "name": "Mordvolt Resistant Battery",
    "slot": "KIT",
    "set": "Mordvolt Resistant",
    "defFlat": 10,
    "subs": [
      {
        "stat": "WIL",
        "value": 21
      },
      {
        "stat": "HEALING_PCT",
        "value": 0.105
      }
    ],
  },
  {
    "id": "item_equip_t2_suit_will01_hand_01",
    "name": "Mordvolt Resistant Gloves",
    "slot": "GLOVES",
    "set": "Mordvolt Resistant",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 33
      },
      {
        "stat": "INT",
        "value": 22
      },
      {
        "stat": "HEALING_PCT",
        "value": 0.088
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_will01_body_01",
    "name": "Mordvolt Resistant Vest T1",
    "slot": "ARMOR",
    "set": "Mordvolt Resistant",
    "defFlat": 40,
    "subs": [
      {
        "stat": "WIL",
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
    "id": "item_equip_t3_suit_will01_edc_01",
    "name": "Mordvolt Resistant Battery T1",
    "slot": "KIT",
    "set": "Mordvolt Resistant",
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
        "stat": "HEALING_PCT",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_will01_edc_02",
    "name": "Mordvolt Resistant Wrench T1",
    "slot": "KIT",
    "set": "Mordvolt Resistant",
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
        "stat": "FLAT_ATK",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_will01_hand_01",
    "name": "Mordvolt Resistant Gloves T1",
    "slot": "GLOVES",
    "set": "Mordvolt Resistant",
    "defFlat": 30,
    "subs": [
      {
        "stat": "WIL",
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
  }
];


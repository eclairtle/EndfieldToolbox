import type { GearBase, GearSetBonus } from "@/data/gears";

export const ETERNAL_XIRANITE_SET_BONUS: GearSetBonus = {
  "name": "Eternal Xiranite",
  "description": "3-piece set effect: Wearer's HP +1000.\nAfter the wearer applies Amp, Protected, Susceptibility, or Weakened, other teammates gain DMG Dealt +16% for 15s. This effect cannot stack."
};

export const ETERNAL_XIRANITE: GearBase[] = [
  {
    "id": "item_equip_t4_suit_usp02_body_01",
    "name": "Eternal Xiranite Armor",
    "slot": "ARMOR",
    "set": "Eternal Xiranite",
    "defFlat": 56,
    "subs": [
      {
        "stat": "WIL",
        "value": 87
      },
      {
        "stat": "INT",
        "value": 58
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 20
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_usp02_edc_01",
    "name": "Eternal Xiranite Power Core",
    "slot": "KIT",
    "set": "Eternal Xiranite",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.246
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_usp02_edc_02",
    "name": "Eternal Xiranite Power Core T1",
    "slot": "KIT",
    "set": "Eternal Xiranite",
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
        "stat": "HEALING_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_usp02_edc_03",
    "name": "Eternal Xiranite Auxiliary Arm",
    "slot": "KIT",
    "set": "Eternal Xiranite",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.246
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_usp02_hand_01",
    "name": "Eternal Xiranite Gloves",
    "slot": "GLOVES",
    "set": "Eternal Xiranite",
    "defFlat": 42,
    "subs": [
      {
        "stat": "INT",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.205
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_usp02_hand_02",
    "name": "Eternal Xiranite Gloves T1",
    "slot": "GLOVES",
    "set": "Eternal Xiranite",
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
        "value": 0.205
      }
    ],
  }
];


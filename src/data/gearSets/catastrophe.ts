import type { GearBase, GearSetBonus } from "@/data/gears";

export const CATASTROPHE_SET_BONUS: GearSetBonus = {
  "name": "Catastrophe",
  "description": "3-piece set effect: Wearer's Ultimate Gain Efficiency +20%.\nThe wearer casts a battle skill, the action returns 50 SP. This effect only triggers 1 time per battle."
};

export const CATASTROPHE: GearBase[] = [
  {
    "id": "item_equip_t3_suit_usp01_body_01",
    "name": "Catastrophe Heavy Armor",
    "slot": "ARMOR",
    "set": "Catastrophe",
    "defFlat": 40,
    "subs": [
      {
        "stat": "STR",
        "value": 61
      },
      {
        "stat": "INT",
        "value": 41
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.184
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_usp01_body_02",
    "name": "Catastrophe Heavy Armor T1",
    "slot": "ARMOR",
    "set": "Catastrophe",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.088
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_usp01_edc_01",
    "name": "Catastrophe Gauze Cartridge",
    "slot": "KIT",
    "set": "Catastrophe",
    "defFlat": 15,
    "subs": [
      {
        "stat": "STR",
        "value": 23
      },
      {
        "stat": "INT",
        "value": 15
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.368
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_usp01_edc_02",
    "name": "Catastrophe Gauze Cartridge T1",
    "slot": "KIT",
    "set": "Catastrophe",
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
        "stat": "SECONDARY_ATTR_PCT",
        "value": 0.147
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_usp01_edc_03",
    "name": "Catastrophe Filter",
    "slot": "KIT",
    "set": "Catastrophe",
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
        "stat": "ARTS_INTENSITY",
        "value": 29
      }
    ],
  },
  {
    "id": "item_equip_t3_suit_usp01_hand_01",
    "name": "Catastrophe Gloves",
    "slot": "GLOVES",
    "set": "Catastrophe",
    "defFlat": 30,
    "subs": [
      {
        "stat": "WIL",
        "value": 46
      },
      {
        "stat": "INT",
        "value": 30
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 24
      }
    ],
  }
];


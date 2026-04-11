import type { GearBase, GearSetBonus } from "@/data/gears";

export const TIDE_SURGE_SET_BONUS: GearSetBonus = {
  "name": "Tide Surge",
  "description": "3-piece set effect: Wearer's Skill DMG Dealt +20%.\nAfter the wearer applies 2 or more stacks of Arts Infliction on the enemy, the wearer gains Arts DMG Dealt +35% for 15s. This effect cannot stack."
};

export const TIDE_SURGE: GearBase[] = [
  {
    "id": "item_equip_t4_suit_burst01_body_01",
    "name": "Tide Fall Light Armor",
    "slot": "ARMOR",
    "set": "Tide Surge",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
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
    "id": "item_equip_t4_suit_burst01_edc_01",
    "name": "Hanging River O2 Tube",
    "slot": "KIT",
    "set": "Tide Surge",
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
    "id": "item_equip_t4_suit_burst01_edc_02",
    "name": "Turbid Cutting Torch",
    "slot": "KIT",
    "set": "Tide Surge",
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
        "stat": "BASIC_ATK_DMG_PCT",
        "value": 0.276
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_burst01_hand_01",
    "name": "Tide Surge Gauntlets",
    "slot": "GLOVES",
    "set": "Tide Surge",
    "defFlat": 42,
    "subs": [
      {
        "stat": "STR",
        "value": 65
      },
      {
        "stat": "WIL",
        "value": 43
      }
    ],
  }
];


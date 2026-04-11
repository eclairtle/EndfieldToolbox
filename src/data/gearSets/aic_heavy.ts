import type { GearBase, GearSetBonus } from "@/data/gears";

export const AIC_HEAVY_SET_BONUS: GearSetBonus = {
  "name": "AIC Heavy",
  "description": "3-piece set effect: Wearer's HP +500. \nAfter the wearer defeats an enemy, the wearer restores 100 HP. Effect trigger cooldown: 5s."
};

export const AIC_HEAVY: GearBase[] = [
  {
    "id": "item_equip_t1_suit_stragi01_body_01",
    "name": "AIC Heavy Armor",
    "slot": "ARMOR",
    "set": "AIC Heavy",
    "defFlat": 22,
    "subs": [
      {
        "stat": "STR",
        "value": 30
      },
      {
        "stat": "AGI",
        "value": 30
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_stragi01_edc_01",
    "name": "AIC Heavy Plate",
    "slot": "KIT",
    "set": "AIC Heavy",
    "defFlat": 8,
    "subs": [
      {
        "stat": "STR",
        "value": 16
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_stragi01_edc_02",
    "name": "AIC Alloy Plate",
    "slot": "KIT",
    "set": "AIC Heavy",
    "defFlat": 8,
    "subs": [
      {
        "stat": "AGI",
        "value": 16
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_stragi01_hand_01",
    "name": "AIC Gauntlets",
    "slot": "GLOVES",
    "set": "AIC Heavy",
    "defFlat": 16,
    "subs": [
      {
        "stat": "STR",
        "value": 23
      },
      {
        "stat": "WIL",
        "value": 23
      }
    ],
  }
];


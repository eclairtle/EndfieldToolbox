import type { GearBase, GearSetBonus } from "@/data/gears";

export const SWORDMANCER_SET_BONUS: GearSetBonus = {
  "name": "Swordmancer",
  "description": "3-piece set effect: Wearer's Stagger Efficiency Bonus +20%.\nAfter the wearer applies a Physical Status, the wearer also performs 1 hit that deals 250% ATK of Physical DMG and [10 Stagger]. Effect trigger cooldown: 15s."
};

export const SWORDMANCER: GearBase[] = [
  {
    "id": "item_equip_t4_suit_phy01_body_01",
    "name": "Swordmancer Light Armor",
    "slot": "ARMOR",
    "set": "Swordmancer",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.123
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_phy01_body_02",
    "name": "Swordmancer Heavy Armor",
    "slot": "ARMOR",
    "set": "Swordmancer",
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
        "stat": "ARTS_INTENSITY",
        "value": 20
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_phy01_edc_01",
    "name": "Swordmancer NAV Beacon",
    "slot": "KIT",
    "set": "Swordmancer",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 41
      },
      {
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_phy01_edc_02",
    "name": "Swordmancer Micro Filter",
    "slot": "KIT",
    "set": "Swordmancer",
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
    "id": "item_equip_t4_suit_phy01_edc_03",
    "name": "Swordmancer Flint",
    "slot": "KIT",
    "set": "Swordmancer",
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
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.23
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_phy01_hand_01",
    "name": "Swordmancer TAC Gloves",
    "slot": "GLOVES",
    "set": "Swordmancer",
    "defFlat": 42,
    "subs": [
      {
        "stat": "STR",
        "value": 65
      },
      {
        "stat": "WIL",
        "value": 43
      },
      {
        "stat": "PHYSICAL_DMG_PCT",
        "value": 0.192
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_phy01_hand_02",
    "name": "Swordmancer TAC Gauntlets",
    "slot": "GLOVES",
    "set": "Swordmancer",
    "defFlat": 42,
    "subs": [
      {
        "stat": "AGI",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.431
      }
    ],
  }
];


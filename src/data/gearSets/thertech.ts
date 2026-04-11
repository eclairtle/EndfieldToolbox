import type { GearBase, GearSetBonus } from "@/data/gears";

export const THERTECH_SET_BONUS: GearSetBonus = {
  "name": "Æthertech",
  "description": "3-piece set effect: Wearer's ATK +8%. \nAfter the wearer applies Vulnerability, the wearer gains Physical DMG +8% for 15s. This effect can reach 4 stacks. If the target already has 4 stack(s) of Vulnerability, the wearer gains an additional Physical DMG +16% for 10s. This effect cannot stack."
};

export const THERTECH: GearBase[] = [
  {
    "id": "item_equip_t4_suit_poise01_body_01",
    "name": "Æthertech Plating",
    "slot": "ARMOR",
    "set": "Æthertech",
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
        "stat": "DMG_VS_STAGGERED_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_poise01_edc_01",
    "name": "Æthertech Analysis Band",
    "slot": "KIT",
    "set": "Æthertech",
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
    "id": "item_equip_t4_suit_poise01_edc_02",
    "name": "Æthertech Stabilizer",
    "slot": "KIT",
    "set": "Æthertech",
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
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_poise01_edc_03",
    "name": "Æthertech Stabilizer T1",
    "slot": "KIT",
    "set": "Æthertech",
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
    "id": "item_equip_t4_suit_poise01_edc_04",
    "name": "Æthertech Watch",
    "slot": "KIT",
    "set": "Æthertech",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 32
      },
      {
        "stat": "AGI",
        "value": 21
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_poise01_hand_01",
    "name": "Æthertech Gloves",
    "slot": "GLOVES",
    "set": "Æthertech",
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
        "stat": "ARTS_INTENSITY",
        "value": 34
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_poise01_hand_02",
    "name": "Æthertech Light Gloves",
    "slot": "GLOVES",
    "set": "Æthertech",
    "defFlat": 42,
    "subs": [
      {
        "stat": "WIL",
        "value": 65
      },
      {
        "stat": "AGI",
        "value": 43
      }
    ],
  }
];


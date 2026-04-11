import type { GearBase, GearSetBonus } from "@/data/gears";

export const AIC_LIGHT_SET_BONUS: GearSetBonus = {
  "name": "AIC Light",
  "description": "3-piece set effect: Wearer's HP +500. \nAfter the wearer defeats an enemy, the wearer gains ATK +20 for 5s."
};

export const AIC_LIGHT: GearBase[] = [
  {
    "id": "item_equip_t1_suit_wisdwill01_body_01",
    "name": "AIC Light Armor",
    "slot": "ARMOR",
    "set": "AIC Light",
    "defFlat": 22,
    "subs": [
      {
        "stat": "INT",
        "value": 30
      },
      {
        "stat": "WIL",
        "value": 30
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.081
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_wisdwill01_edc_01",
    "name": "AIC Light Plate",
    "slot": "KIT",
    "set": "AIC Light",
    "defFlat": 8,
    "subs": [
      {
        "stat": "INT",
        "value": 16
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.162
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_wisdwill01_edc_02",
    "name": "AIC Ceramic Plate",
    "slot": "KIT",
    "set": "AIC Light",
    "defFlat": 8,
    "subs": [
      {
        "stat": "WIL",
        "value": 16
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.162
      }
    ],
  },
  {
    "id": "item_equip_t1_suit_wisdwill01_hand_01",
    "name": "AIC Tactical Gloves",
    "slot": "GLOVES",
    "set": "AIC Light",
    "defFlat": 16,
    "subs": [
      {
        "stat": "INT",
        "value": 23
      },
      {
        "stat": "AGI",
        "value": 23
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.135
      }
    ],
  }
];


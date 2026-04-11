import type { GearBase, GearSetBonus } from "@/data/gears";

export const HOT_WORK_SET_BONUS: GearSetBonus = {
  "name": "Hot Work",
  "description": "3-piece set effect: Wearer's Arts Intensity +30. \nAfter the wearer applies Combustion, the wearer gains Heat DMG +50% for 10s. After the wearer applies Corrosion, the wearer gains Nature DMG +50% for 10s. The aforementioned effects cannot stack."
};

export const HOT_WORK: GearBase[] = [
  {
    "id": "item_equip_t4_suit_fire_natr01_body_01",
    "name": "Hot Work Exoskeleton",
    "slot": "ARMOR",
    "set": "Hot Work",
    "defFlat": 56,
    "subs": [
      {
        "stat": "STR",
        "value": 87
      },
      {
        "stat": "AGI",
        "value": 58
      },
      {
        "stat": "HEAT_NATURE_DMG_PCT",
        "value": 0.115
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_body_02",
    "name": "Hot Work Exo-Rig",
    "slot": "ARMOR",
    "set": "Hot Work",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
        "value": 87
      },
      {
        "stat": "WIL",
        "value": 58
      },
      {
        "stat": "HEAT_NATURE_DMG_PCT",
        "value": 0.115
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_edc_01",
    "name": "Hot Work Power Bank",
    "slot": "KIT",
    "set": "Hot Work",
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
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_edc_02",
    "name": "Hot Work Pyrometer",
    "slot": "KIT",
    "set": "Hot Work",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 41
      },
      {
        "stat": "BATTLE_SKILL_DMG_PCT",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_edc_03",
    "name": "Hot Work Power Cartridge",
    "slot": "KIT",
    "set": "Hot Work",
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
        "stat": "ARTS_INTENSITY",
        "value": 41
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_hand_01",
    "name": "Hot Work Gloves",
    "slot": "GLOVES",
    "set": "Hot Work",
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
        "stat": "ARTS_INTENSITY",
        "value": 34
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_hand_02",
    "name": "Hot Work Gauntlets",
    "slot": "GLOVES",
    "set": "Hot Work",
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
        "stat": "HEAT_NATURE_DMG_PCT",
        "value": 0.192
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_fire_natr01_hand_03",
    "name": "Hot Work Gauntlets T1",
    "slot": "GLOVES",
    "set": "Hot Work",
    "defFlat": 42,
    "subs": [
      {
        "stat": "WIL",
        "value": 65
      },
      {
        "stat": "INT",
        "value": 43
      },
      {
        "stat": "HEAT_NATURE_DMG_PCT",
        "value": 0.192
      }
    ],
  }
];

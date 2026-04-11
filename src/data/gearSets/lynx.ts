import type { GearBase, GearSetBonus } from "@/data/gears";

export const LYNX_SET_BONUS: GearSetBonus = {
  "name": "LYNX",
  "description": "3-piece set effect: Wearer's HP Treatment Efficiency +20%. \nAfter the wearer gives HP treatment to an allied target, that target also gains 15% DMG Reduction against all types of DMG for 10s. If the said treatment exceeds the target's Max HP, the target gains 30% DMG Reduction against all types of DMG. The aforementioned effects cannot stack."
};

export const LYNX: GearBase[] = [
  {
    "id": "item_equip_t4_suit_heal01_body_01",
    "name": "LYNX Heavy Armor",
    "slot": "ARMOR",
    "set": "LYNX",
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
        "stat": "HEALING_PCT",
        "value": 0.103
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_body_02",
    "name": "LYNX Cuirass",
    "slot": "ARMOR",
    "set": "LYNX",
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
        "stat": "HEALING_PCT",
        "value": 0.103
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_edc_01",
    "name": "LYNX Connector",
    "slot": "KIT",
    "set": "LYNX",
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
        "stat": "FINAL_DMG_REDUCTION_PCT",
        "value": 0.171
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_edc_02",
    "name": "LYNX Connector T2",
    "slot": "KIT",
    "set": "LYNX",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 41
      },
      {
        "stat": "HP",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_edc_03",
    "name": "LYNX Slab",
    "slot": "KIT",
    "set": "LYNX",
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
        "stat": "MAIN_ATTR_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_edc_04",
    "name": "LYNX Aegis Injector",
    "slot": "KIT",
    "set": "LYNX",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 41
      },
      {
        "stat": "HEALING_PCT",
        "value": 0.207
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_edc_05",
    "name": "LYNX Connector T1",
    "slot": "KIT",
    "set": "LYNX",
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
        "stat": "HP",
        "value": 0.414
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_hand_01",
    "name": "LYNX Gloves",
    "slot": "GLOVES",
    "set": "LYNX",
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
        "stat": "ULT_GAIN_PCT",
        "value": 0.205
      }
    ],
  },
  {
    "id": "item_equip_t4_suit_heal01_hand_02",
    "name": "LYNX Gauntlets",
    "slot": "GLOVES",
    "set": "LYNX",
    "defFlat": 42,
    "subs": [
      {
        "stat": "WIL",
        "value": 65
      },
      {
        "stat": "STR",
        "value": 43
      },
      {
        "stat": "HEALING_PCT",
        "value": 0.173
      }
    ],
  }
];

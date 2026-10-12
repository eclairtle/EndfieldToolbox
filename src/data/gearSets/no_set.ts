import type { GearBase, GearSetBonus, GearSubstatBase } from "@/data/gears";

const make = (id: string, name: string, slot: GearBase["slot"], defFlat: number, subs: GearSubstatBase[]): GearBase => ({
  id, name, slot, defFlat, subs,
});

export const NO_SET: GearBase[] = [
  {
    "id": "item_equip_t0_parts_tundra01_body_01",
    "name": "Basic Armor",
    "slot": "ARMOR",
    "defFlat": 8,
    "subs": [
      {
        "stat": "STR",
        "value": 15
      },
      {
        "stat": "AGI",
        "value": 10
      },
      {
        "stat": "HP",
        "value": 46
      }
    ],
  },
  {
    "id": "item_equip_t0_parts_tundra01_body_02",
    "name": "Basic PPE",
    "slot": "ARMOR",
    "defFlat": 8,
    "subs": [
      {
        "stat": "INT",
        "value": 15
      },
      {
        "stat": "WIL",
        "value": 10
      },
      {
        "stat": "HP",
        "value": 46
      }
    ],
  },
  {
    "id": "item_equip_t0_parts_tundra01_hand_01",
    "name": "Basic Gauntlets",
    "slot": "GLOVES",
    "defFlat": 6,
    "subs": [
      {
        "stat": "STR",
        "value": 11
      },
      {
        "stat": "AGI",
        "value": 7
      },
      {
        "stat": "HP",
        "value": 77
      }
    ],
  },
  {
    "id": "item_equip_t0_parts_tundra01_hand_02",
    "name": "Basic Gloves",
    "slot": "GLOVES",
    "defFlat": 6,
    "subs": [
      {
        "stat": "INT",
        "value": 11
      },
      {
        "stat": "WIL",
        "value": 7
      },
      {
        "stat": "HP",
        "value": 77
      }
    ],
  },
  {
    "id": "item_equip_t2_parts_tundra01_edc_04",
    "name": "Miner Comm",
    "slot": "KIT",
    "defFlat": 10,
    "subs": [
      {
        "stat": "WIL",
        "value": 22
      },
      {
        "stat": "HP_PCT",
        "value": 0.228
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_body_01",
    "name": "Redeemer Plates",
    "slot": "ARMOR",
    "defFlat": 56,
    "subs": [
      {
        "stat": "AGI",
        "value": 115
      },
      {
        "stat": "BASIC_ATK_DMG_PCT",
        "value": 0.144
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_body_02",
    "name": "Redeemer Armor",
    "slot": "ARMOR",
    "defFlat": 56,
    "subs": [
      {
        "stat": "INT",
        "value": 115
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.129
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_edc_01",
    "name": "Redeemer Tag",
    "slot": "KIT",
    "defFlat": 21,
    "subs": [
      {
        "stat": "STR",
        "value": 43
      },
      {
        "stat": "FINAL_DMG_REDUCTION_PCT",
        "value": 0.178
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_edc_02",
    "name": "Redeemer Tag T1",
    "slot": "KIT",
    "defFlat": 21,
    "subs": [
      {
        "stat": "AGI",
        "value": 43
      },
      {
        "stat": "COMBO_SKILL_DMG_PCT",
        "value": 0.432
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_edc_03",
    "name": "Redeemer Seal",
    "slot": "KIT",
    "defFlat": 21,
    "subs": [
      {
        "stat": "INT",
        "value": 43
      },
      {
        "stat": "ULT_GAIN_PCT",
        "value": 0.257
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_edc_04",
    "name": "Redeemer Seal T1",
    "slot": "KIT",
    "defFlat": 21,
    "subs": [
      {
        "stat": "WIL",
        "value": 43
      },
      {
        "stat": "CRIT_RATE_PCT",
        "value": 0.108
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_hand_01",
    "name": "Redeemer Gloves",
    "slot": "GLOVES",
    "defFlat": 42,
    "subs": [
      {
        "stat": "AGI",
        "value": 86
      },
      {
        "stat": "ULTIMATE_DMG_PCT",
        "value": 0.45
      }
    ],
  },
  {
    "id": "item_equip_t4_parts_wuling01_hand_02",
    "name": "Redeemer Hands",
    "slot": "GLOVES",
    "defFlat": 42,
    "subs": [
      {
        "stat": "STR",
        "value": 86
      },
      {
        "stat": "SKILL_DMG_PCT",
        "value": 0.24
      }
    ],
  },
  {
    id: "item_equip_t4_parts_wuling02_body_01",
    name: "Rift Trekker Heavy Armor",
    slot: "ARMOR",
    defFlat: 56,
    subs: [{ stat: "STR", value: 115 }, { stat: "ARTS_INTENSITY", value: 21.6 }],
  },
  {
    id: "item_equip_t4_parts_wuling02_body_02",
    name: "Rift Trekker Light Armor",
    slot: "ARMOR",
    defFlat: 56,
    subs: [{ stat: "WIL", value: 115 }, { stat: "HEALING_PCT", value: 0.108 }],
  },
  {
    id: "item_equip_t4_parts_wuling02_hand_01",
    name: "Rift Trekker Gloves",
    slot: "GLOVES",
    defFlat: 42,
    subs: [{ stat: "INT", value: 86 }, { stat: "ULT_GAIN_PCT", value: 0.21428571428571427 }],
  },
  {
    id: "item_equip_t4_parts_wuling02_hand_02",
    name: "Rift Trekker Hands",
    slot: "GLOVES",
    defFlat: 42,
    subs: [{ stat: "WIL", value: 86 }, { stat: "BATTLE_SKILL_DMG_PCT", value: 0.36 }],
  },
  {
    id: "item_equip_t4_parts_wuling02_edc_01",
    name: "Rift Trekker Armor Slab",
    slot: "KIT",
    defFlat: 21,
    subs: [{ stat: "AGI", value: 43 }, { stat: "SECONDARY_ATTR_PCT", value: 0.21601861044623727 }],
  },
  make("item_equip_t1_parts_tundra01_body_01", "Miner Armor", "ARMOR", 16, [
    { stat: "STR", value: 27 }, { stat: "AGI", value: 18 }, { stat: "HP", value: 125 },
  ]),
  make("item_equip_t1_parts_tundra01_body_02", "Miner Overalls", "ARMOR", 16, [
    { stat: "INT", value: 27 }, { stat: "WIL", value: 18 }, { stat: "HP", value: 125 },
  ]),
  make("item_equip_t1_parts_tundra01_body_03", "Prototype Heavy Armor", "ARMOR", 22, [
    { stat: "STR", value: 37 }, { stat: "INT", value: 25 }, { stat: "FLAT_ATK", value: 11 },
  ]),
  make("item_equip_t1_parts_tundra01_body_04", "Prototype Heavy Armor T1", "ARMOR", 22, [
    { stat: "AGI", value: 37 }, { stat: "WIL", value: 25 }, { stat: "FLAT_ATK", value: 11 },
  ]),
  make("item_equip_t1_parts_tundra01_body_05", "Miner Vest", "ARMOR", 22, [
    { stat: "AGI", value: 37 }, { stat: "INT", value: 25 }, { stat: "HP_PCT", value: 0.09 },
  ]),
  make("item_equip_t1_parts_tundra01_body_06", "Miner Cleansuit", "ARMOR", 22, [
    { stat: "WIL", value: 37 }, { stat: "AGI", value: 25 }, { stat: "HP_PCT", value: 0.09 },
  ]),
  make("item_equip_t1_parts_tundra01_hand_01", "Miner Gauntlets", "GLOVES", 12, [
    { stat: "STR", value: 20 }, { stat: "AGI", value: 13 }, { stat: "HP_PCT", value: 0.11 },
  ]),
  make("item_equip_t1_parts_tundra01_hand_02", "Miner Wrists", "GLOVES", 16, [
    { stat: "AGI", value: 28 }, { stat: "STR", value: 18 }, { stat: "HP_PCT", value: 0.15 },
  ]),
  make("item_equip_t1_parts_tundra01_hand_03", "Miner Gloves", "GLOVES", 12, [
    { stat: "INT", value: 20 }, { stat: "WIL", value: 13 }, { stat: "HP_PCT", value: 0.11 },
  ]),
  make("item_equip_t1_parts_tundra01_hand_04", "Miner Fists", "GLOVES", 16, [
    { stat: "WIL", value: 28 }, { stat: "INT", value: 18 }, { stat: "HP_PCT", value: 0.15 },
  ]),
  make("item_equip_t1_parts_tundra01_edc_01", "Emergency Comm", "KIT", 6, [
    { stat: "CRIT_RATE_PCT", value: 0.066 },
  ]),
  make("item_equip_t1_parts_tundra01_edc_02", "Emergency Compression Core", "KIT", 6, [
    { stat: "ATK_PCT", value: 0.132 },
  ]),
  make("item_equip_t2_parts_tundra01_hand_01", "Miner Gauntlets T1", "GLOVES", 21, [
    { stat: "STR", value: 36 }, { stat: "INT", value: 24 }, { stat: "ATK_PCT", value: 0.095 },
  ]),
  make("item_equip_t2_parts_tundra01_hand_02", "Miner Gloves T1", "GLOVES", 21, [
    { stat: "INT", value: 36 }, { stat: "AGI", value: 24 }, { stat: "HP_PCT", value: 0.19 },
  ]),
  make("item_equip_t2_parts_tundra01_edc_01", "Miner Turbine", "KIT", 10, [
    { stat: "STR", value: 22 }, { stat: "COMBO_SKILL_DMG_PCT", value: 0.228 },
  ]),
  make("item_equip_t2_parts_tundra01_edc_02", "Miner Drive Wheel", "KIT", 10, [
    { stat: "AGI", value: 22 }, { stat: "CRIT_RATE_PCT", value: 0.057 },
  ]),
  make("item_equip_t2_parts_tundra01_edc_03", "Miner Compression Core", "KIT", 10, [
    { stat: "INT", value: 22 }, { stat: "CRIT_RATE_PCT", value: 0.057 },
  ]),
  make("item_equip_t3_parts_tundra01_body_01", "Miner Armor T1", "ARMOR", 40, [
    { stat: "STR", value: 65 }, { stat: "WIL", value: 43 }, { stat: "CRIT_RATE_PCT", value: 0.039 },
  ]),
  make("item_equip_t3_parts_tundra01_body_02", "Miner Overalls T1", "ARMOR", 40, [
    { stat: "INT", value: 65 }, { stat: "AGI", value: 43 }, { stat: "ATK_PCT", value: 0.078 },
  ]),
  make("item_equip_t3_parts_tundra01_hand_01", "Miner Gloves T2", "GLOVES", 30, [
    { stat: "INT", value: 49 }, { stat: "AGI", value: 32 }, { stat: "ATK_PCT", value: 0.13 },
  ]),
  make("item_equip_t3_parts_tundra01_hand_02", "Miner Fists T1", "GLOVES", 30, [
    { stat: "WIL", value: 49 }, { stat: "INT", value: 32 }, { stat: "ULT_GAIN_PCT", value: 0.15476190476190477 },
  ]),
  make("item_equip_t3_parts_tundra01_edc_01", "Miner Turbine T1", "KIT", 15, [
    { stat: "STR", value: 31 }, { stat: "FINAL_DMG_REDUCTION_PCT", value: 0.1349480968858131 },
  ]),
  make("item_equip_t3_parts_tundra01_edc_02", "Miner Drive Wheel T1", "KIT", 15, [
    { stat: "AGI", value: 31 }, { stat: "COMBO_SKILL_DMG_PCT", value: 0.312 },
  ]),
  make("item_equip_t3_parts_tundra01_edc_03", "Miner Compression Core T1", "KIT", 15, [
    { stat: "INT", value: 31 }, { stat: "ULT_GAIN_PCT", value: 0.18571428571428572 },
  ]),
  make("item_equip_t3_parts_tundra01_edc_04", "Miner Comm T1", "KIT", 15, [
    { stat: "WIL", value: 31 }, { stat: "HEALING_PCT", value: 0.156 },
  ]),
];

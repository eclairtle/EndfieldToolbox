// src/data/gears.ts
import type { AttrKey, ModifierStatKey } from "@/lib/build/stats";

export type GearSlot = "ARMOR" | "GLOVES" | "KIT";

export type GearSubstatBase = {
  stat: AttrKey | ModifierStatKey
  value: number; // base lv0 value
};

export type GearBase = {
  id: string;
  name: string;
  slot: GearSlot;
  set?: string;
  defFlat: number;
  subs: GearSubstatBase[];
};

export const GEARS: GearBase[] = [
  {
    id: "tide_fall_light_armor",
    name: "Tide Fall Light Armor",
    slot: "ARMOR",
    set: "Tide Surge",
    defFlat: 56,
    subs: [
      { stat: "INT", value: 87 },
      { stat: "STR", value: 58 },
      { stat: "ULT_GAIN_PCT", value: 0.123 },
    ],
  },
  {
    id: "mi_security_overalls",
    name: "MI Security Overalls",
    slot: "ARMOR",
    set: "MI Security",
    defFlat: 56,
    subs: [
      { stat: "INT", value: 87 },
      { stat: "AGI", value: 58 },
      { stat: "BASIC_ATK_DMG_PCT", value: 0.138 },
    ],
  },
  {
    id: "hot_work_gauntlets",
    name: "Hot Work Gauntlets",
    slot: "GLOVES",
    set: "Hot Work",
    defFlat: 42,
    subs: [
      { stat: "INT", value: 65 },
      { stat: "STR", value: 43 },
      { stat: "HEAT_DMG_PCT", value: 0.192 },
    ],
  },
  {
    id: "mi_security_hands_ppe",
    name: "MI Security Hands PPE",
    slot: "GLOVES",
    set: "MI Security",
    defFlat: 42,
    subs: [
      { stat: "INT", value: 65 },
      { stat: "AGI", value: 43 },
      { stat: "BASIC_ATK_DMG_PCT", value: 0.23 },
    ],
  },
  {
    id: "hot_work_pyrometer",
    name: "Hot Work Pyrometer",
    slot: "KIT",
    set: "Hot Work",
    defFlat: 21,
    subs: [
      { stat: "INT", value: 41 },
      { stat: "BATTLE_SKILL_DMG_PCT", value: 0.414 },
    ],
  },
  {
    id: "mi_security_toolkit",
    name: "MI Security Toolkit",
    slot: "KIT",
    set: "MI Security",
    defFlat: 21,
    subs: [
      { stat: "INT", value: 32 },
      { stat: "AGI", value: 21 },
      { stat: "CRIT_RATE_PCT", value: 0.104 },
    ],
  },
  {
    id: "lynx_slab",
    name: "LYNX Slab",
    slot: "KIT",
    set: "LYNX",
    defFlat: 21,
    subs: [
      { stat: "WIL", value: 32 },
      { stat: "INT", value: 21 },
      { stat: "MAIN_ATTR_PCT", value: 0.207 },
    ],
  },
  {
    id: "external_xiranite_auxiliary_arm",
    name: "External Xiranite Auxiliary Arm",
    slot: "KIT",
    set: "External Xiranite",
    defFlat: 21,
    subs: [
      { stat: "WIL", value: 32 },
      { stat: "INT", value: 21 },
      { stat: "ULT_GAIN_PCT", value: 0.246 },
    ],
  },
  {
    id: "external_xiranite_power_core_t1",
    name: "External Xiranite Power Core T1",
    slot: "KIT",
    set: "External Xiranite",
    defFlat: 21,
    subs: [
      { stat: "INT", value: 32 },
      { stat: "WIL", value: 21 },
      { stat: "HEALING_PCT", value: 0.246 },
    ],
  },
  {
    id: "external_xiranite_power_core",
    name: "External Xiranite Power Core",
    slot: "KIT",
    set: "External Xiranite",
    defFlat: 21,
    subs: [
      { stat: "INT", value: 32 },
      { stat: "STR", value: 21 },
      { stat: "ULT_GAIN_PCT", value: 0.246 },
    ],
  },
  {
    id: "external_xiranite_gloves_t1",
    name: "External Xiranite Gloves T1",
    slot: "GLOVES",
    set: "External Xiranite",
    defFlat: 42,
    subs: [
      { stat: "INT", value: 65 },
      { stat: "WIL", value: 43 },
      { stat: "ULT_GAIN_PCT", value: 0.205 },
    ],
  },
  {
    id: "external_xiranite_gloves",
    name: "External Xiranite Gloves",
    slot: "GLOVES",
    set: "External Xiranite",
    defFlat: 42,
    subs: [
      { stat: "INT", value: 65 },
      { stat: "STR", value: 43 },
      { stat: "ULT_GAIN_PCT", value: 0.205 },
    ],
  },
  {
    id: "external_xiranite_armor",
    name: "External Xiranite Armor",
    slot: "ARMOR",
    set: "External Xiranite",
    defFlat: 56,
    subs: [
      { stat: "WIL", value: 87 },
      { stat: "INT", value: 58 },
      { stat: "ARTS_INTENSITY", value: 20 },
    ],
  },
];
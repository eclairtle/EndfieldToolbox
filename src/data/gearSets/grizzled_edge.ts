import type { GearBase, GearSetBonus } from "@/data/gears";

export const GRIZZLED_EDGE_SET_BONUS: GearSetBonus = {
  name: "Grizzled Edge",
  description: "3-piece set effect: Wearer's ATK +8%.\nWhen the wearer applies Crush or Breach, the wearer gains Physical DMG Dealt +[6% x max Vulnerability stacks consumed from one enemy] for 20s. If the target already has Physical Susceptibility, is Staggered, or has attached Originium Crystals, increase the aforementioned buff to 1.5x. This buff cannot stack.",
};

export const GRIZZLED_EDGE: GearBase[] = [
  {
    id: "item_equip_t4_suit_crush_fracture_body_01",
    name: "Grizzled Edge Armor",
    slot: "ARMOR",
    set: "Grizzled Edge",
    defFlat: 56,
    subs: [
      { stat: "STR", value: 87 },
      { stat: "WIL", value: 58 },
      { stat: "PHYSICAL_DMG_PCT", value: 0.115 },
    ],
  },
  {
    id: "item_equip_t4_suit_crush_fracture_body_02",
    name: "Grizzled Edge Armor T1",
    slot: "ARMOR",
    set: "Grizzled Edge",
    defFlat: 56,
    subs: [
      { stat: "AGI", value: 87 },
      { stat: "STR", value: 58 },
      { stat: "ARTS_INTENSITY", value: 20.7 },
    ],
  },
  {
    id: "item_equip_t4_suit_crush_fracture_hand_01",
    name: "Grizzled Edge Gauntlets",
    slot: "GLOVES",
    set: "Grizzled Edge",
    defFlat: 42,
    subs: [
      { stat: "AGI", value: 65 },
      { stat: "WIL", value: 43 },
      { stat: "ARTS_INTENSITY", value: 34.5 },
    ],
  },
  {
    id: "item_equip_t4_suit_crush_fracture_hand_02",
    name: "Grizzled Edge Gauntlets T1",
    slot: "GLOVES",
    set: "Grizzled Edge",
    defFlat: 42,
    subs: [
      { stat: "AGI", value: 65 },
      { stat: "STR", value: 43 },
      { stat: "ARTS_INTENSITY", value: 34.5 },
    ],
  },
  {
    id: "item_equip_t4_suit_crush_fracture_edc_01",
    name: "Grizzled Edge Push Knife",
    slot: "KIT",
    set: "Grizzled Edge",
    defFlat: 21,
    subs: [
      { stat: "STR", value: 32 },
      { stat: "WIL", value: 21 },
      { stat: "PHYSICAL_DMG_PCT", value: 0.23 },
    ],
  },
  {
    id: "item_equip_t4_suit_crush_fracture_edc_02",
    name: "Grizzled Edge Push Knife T1",
    slot: "KIT",
    set: "Grizzled Edge",
    defFlat: 21,
    subs: [
      { stat: "AGI", value: 32 },
      { stat: "STR", value: 21 },
      { stat: "PHYSICAL_DMG_PCT", value: 0.23 },
    ],
  },
];

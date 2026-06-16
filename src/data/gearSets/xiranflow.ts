import type { GearBase, GearSetBonus } from "@/data/gears";

export const XIRANFLOW_SET_BONUS: GearSetBonus = {
  name: "Xiranflow",
  description: "3-piece set effect: Wearer's ATK +10%.\nWhenever the wearer consumes Electrification or Corrosion, the wearer gains a number of buff stacks equal to the Status Level of the Arts Reaction consumed, with each buff stack giving Electric DMG Dealt and Nature DMG Dealt +15% for 25s. Max number of buff stacks: 3. Duration of each stack is counted separately.",
};

export const XIRANFLOW: GearBase[] = [
  {
    id: "item_equip_t4_suit_expend_spell01_body_02",
    name: "Xiranflow Light Armor",
    slot: "ARMOR",
    set: "Xiranflow",
    defFlat: 56,
    subs: [
      { stat: "WIL", value: 87 },
      { stat: "INT", value: 58 },
      { stat: "CRYO_ELECTRIC_DMG_PCT", value: 0.115 },
    ],
  },
  {
    id: "item_equip_t4_suit_expend_spell01_edc_02",
    name: "Xiranflow Baton",
    slot: "KIT",
    set: "Xiranflow",
    defFlat: 21,
    subs: [
      { stat: "WIL", value: 32 },
      { stat: "INT", value: 21 },
      { stat: "BATTLE_SKILL_DMG_PCT", value: 0.414 },
    ],
  },
  {
    id: "item_equip_t4_suit_expend_spell01_hand_02",
    name: "Xiranflow Gloves",
    slot: "GLOVES",
    set: "Xiranflow",
    defFlat: 42,
    subs: [
      { stat: "WIL", value: 65 },
      { stat: "INT", value: 43 },
      { stat: "CRYO_ELECTRIC_DMG_PCT", value: 0.19166666666666668 },
    ],
  },
];

import type { GearBase, GearSetBonus } from "@/data/gears";

export const DEEP_RAMPART_SET_BONUS: GearSetBonus = {
  name: "Deep Rampart",
  description: "3-piece set effect: Wearer's Arts DMG Dealt +16%.\nWhen the wearer applies Nature Burst or Cryo Burst, the wearer gains Arts Intensity +16 for 20s. Max stacks for this effect: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
};

export const DEEP_RAMPART: GearBase[] = [
  {
    id: "item_equip_t4_suit_spellburst_body_01",
    name: "Deep Rampart Armor",
    slot: "ARMOR",
    set: "Deep Rampart",
    defFlat: 56,
    subs: [{ stat: "AGI", value: 87 }, { stat: "WIL", value: 58 }, { stat: "ARTS_INTENSITY", value: 20 }],
  },
  {
    id: "item_equip_t4_suit_spellburst_hand_01",
    name: "Deep Rampart Gauntlets",
    slot: "GLOVES",
    set: "Deep Rampart",
    defFlat: 42,
    subs: [{ stat: "AGI", value: 65 }, { stat: "WIL", value: 43 }, { stat: "ARTS_INTENSITY", value: 34 }],
  },
  {
    id: "item_equip_t4_suit_spellburst_edc_01",
    name: "Deep Rampart Comms",
    slot: "KIT",
    set: "Deep Rampart",
    defFlat: 21,
    subs: [{ stat: "AGI", value: 32 }, { stat: "WIL", value: 21 }, { stat: "ARTS_INTENSITY", value: 41 }],
  },
];

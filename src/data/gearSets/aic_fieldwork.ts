import type { GearBase, GearSetBonus, GearSubstatBase } from "@/data/gears";

export const AIC_FIELDWORK_SET_BONUS: GearSetBonus = {
  name: "AIC Fieldwork",
  description: "3-piece set effect: Wearer gains DMG Dealt +20%, 10% DMG Reduction, and Ultimate Gain Efficiency +10%.",
};

const make = (id: string, name: string, slot: GearBase["slot"], defFlat: number, subs: GearSubstatBase[]): GearBase => ({
  id, name, slot, set: "AIC Fieldwork", defFlat, subs,
});

export const AIC_FIELDWORK: GearBase[] = [
  make("item_equip_t4_parts_wuling00_body_01", "AIC Fieldwork Armor", "ARMOR", 48, [
    { stat: "MAIN_ATTR_FLAT", value: 74 }, { stat: "SECONDARY_ATTR_FLAT", value: 49 }, { stat: "ARTS_DMG_PCT", value: 0.0931578947368421 },
  ]),
  make("item_equip_t4_parts_wuling00_body_02", "AIC Fieldwork Plate", "ARMOR", 48, [
    { stat: "MAIN_ATTR_FLAT", value: 74 }, { stat: "SECONDARY_ATTR_FLAT", value: 49 }, { stat: "ULT_GAIN_PCT", value: 0.10535714285714286 },
  ]),
  make("item_equip_t4_parts_wuling00_body_03", "AIC Fieldwork Vest", "ARMOR", 48, [
    { stat: "SECONDARY_ATTR_FLAT", value: 74 }, { stat: "MAIN_ATTR_FLAT", value: 49 }, { stat: "SECONDARY_ATTR_PCT", value: 0.08850762511338889 },
  ]),
  make("item_equip_t4_parts_wuling00_hand_01", "AIC Fieldwork Gloves", "GLOVES", 36, [
    { stat: "MAIN_ATTR_FLAT", value: 55 }, { stat: "SECONDARY_ATTR_FLAT", value: 37 }, { stat: "ARTS_DMG_PCT", value: 0.15526315789473685 },
  ]),
  make("item_equip_t4_parts_wuling00_hand_02", "AIC Fieldwork Hands", "GLOVES", 36, [
    { stat: "MAIN_ATTR_FLAT", value: 55 }, { stat: "SECONDARY_ATTR_FLAT", value: 37 }, { stat: "ULT_GAIN_PCT", value: 0.17559523809523808 },
  ]),
  make("item_equip_t4_parts_wuling00_hand_03", "AIC Fieldwork Wraps", "GLOVES", 36, [
    { stat: "SECONDARY_ATTR_FLAT", value: 55 }, { stat: "MAIN_ATTR_FLAT", value: 37 }, { stat: "SECONDARY_ATTR_PCT", value: 0.14751270852231482 },
  ]),
  make("item_equip_t4_parts_wuling00_edc_01", "AIC Fieldwork Machete", "KIT", 18, [
    { stat: "MAIN_ATTR_FLAT", value: 27 }, { stat: "SECONDARY_ATTR_FLAT", value: 18 }, { stat: "ARTS_DMG_PCT", value: 0.1863157894736842 },
  ]),
  make("item_equip_t4_parts_wuling00_edc_02", "AIC Fieldwork Ember", "KIT", 18, [
    { stat: "MAIN_ATTR_FLAT", value: 27 }, { stat: "SECONDARY_ATTR_FLAT", value: 18 }, { stat: "ULT_GAIN_PCT", value: 0.21071428571428572 },
  ]),
  make("item_equip_t4_parts_wuling00_edc_03", "AIC Fieldwork Flashlight", "KIT", 18, [
    { stat: "SECONDARY_ATTR_FLAT", value: 27 }, { stat: "MAIN_ATTR_FLAT", value: 18 }, { stat: "SECONDARY_ATTR_PCT", value: 0.17701525022677778 },
  ]),
];

import type { ModifierStats } from "@/lib/build/stats";

export type ConsumableDefinition = {
  id: string;
  name: string;
  nameZh: string;
  durationSeconds: number;
  effects: Partial<ModifierStats>;
};

export const CONSUMABLES: ConsumableDefinition[] = [
  {
    id: "item_corp3_animal_1",
    name: "Ginseng Meat Stew",
    nameZh: "人参肉汤",
    durationSeconds: 300,
    effects: {
      FLAT_ATK: 180,
      CRIT_RATE_PCT: 0.11,
    },
  },
  {
    id: "item_agrange_1_erhound_1_sp_1_1",
    name: "Jakub's Legacy",
    nameZh: "雅各布之遗",
    durationSeconds: 300,
    effects: {
      ATK_PCT: 0.27,
    },
  },
  {
    id: "item_bottled_insec2_2",
    name: "Kunst Tube",
    nameZh: "库恩试管",
    durationSeconds: 300,
    effects: {
      DMG_AMP_PCT: 0.2465306,
    },
  },
  {
    id: "item_bottled_insec2_1",
    name: "Kunst Vial",
    nameZh: "库恩小瓶",
    durationSeconds: 300,
    effects: {
      DMG_AMP_PCT: 0.18081632,
    },
  },
  {
    id: "item_bottled_moss_1_2_1",
    name: "Perplexing Medication",
    nameZh: "迷离药剂",
    durationSeconds: 300,
    effects: {
      ULT_GAIN_PCT: 0.23760933,
    },
  },
  {
    id: "item_corp3_grass1_1",
    name: "Fortifying Infusion",
    nameZh: "固元饮",
    durationSeconds: 300,
    effects: {
      CRIT_RATE_PCT: 0.09096939,
      DMG_AMP_PCT: 0.18193878,
    },
  },
  {
    id: "item_hsmob_1_dog_1_1",
    name: "Bamboo Sprouts and Meat",
    nameZh: "笋肉煲",
    durationSeconds: 300,
    effects: {
      ULT_GAIN_PCT: 0.21100584,
      HEALING_RECEIVED_PCT: 0.3544898,
    },
  },
  {
    id: "item_lbshield_1_slimeml_1_dog_1_1",
    name: "Old Man John's Burger",
    nameZh: "老约翰汉堡",
    durationSeconds: 300,
    effects: {
      PHYSICAL_DMG_PCT: 0.20612244,
    },
  },
  {
    id: "item_firebat_1_agrange_1_1",
    name: "Edible Denstack",
    nameZh: "可食岩栈",
    durationSeconds: 300,
    effects: {
      ATK_PCT: 0.066530615,
      CRIT_RATE_PCT: 0.033265308,
      DMG_AMP_PCT: 0.066530615,
    },
  },
  {
    id: "item_hsfly_1_slimeml_1_hsmob_1_1",
    name: "Simmered Xiranite Ball",
    nameZh: "炖西拉石球",
    durationSeconds: 300,
    effects: {
      CRIT_RATE_PCT: 0.20540816,
    },
  },
  {
    id: "item_mimicw_1_moss_1_moss_2_1",
    name: "Sod-Turning Meat Soup",
    nameZh: "翻土肉汤",
    durationSeconds: 300,
    effects: {
      ATK_PCT: 0.11979592,
    },
  },
  {
    id: "item_wgshoal_1_grass_1_grass_2_1",
    name: "Mini Sugar Painting",
    nameZh: "迷你糖画",
    durationSeconds: 300,
    effects: {
      ATK_PCT: 0.18193878,
      CRIT_RATE_PCT: 0.09096939,
    },
  },
  {
    id: "item_agrange_1_lbshamman_bottled_1",
    name: "Simple Pain Relief Salve",
    nameZh: "简易止痛膏",
    durationSeconds: 300,
    effects: {
      FINAL_DMG_REDUCTION_PCT: 1 - 0.8782936,
    },
  },
  {
    id: "item_erhound_1_agmelee_1_moss_1_1",
    name: "Hazefyre Blossom",
    nameZh: "雾火花",
    durationSeconds: 300,
    effects: {
      FINAL_DMG_REDUCTION_PCT: 1 - 0.83361685,
    },
  },
  {
    id: "item_wgthorns_1_hshog_1_hsmob_1_1",
    name: "Pan-Fried Double Crisp",
    nameZh: "双脆煎",
    durationSeconds: 300,
    effects: {
      FINAL_DMG_REDUCTION_PCT: 1 - 0.7088095,
    },
  },
];

export const CONSUMABLE_BY_ID: Record<string, ConsumableDefinition> = Object.fromEntries(
  CONSUMABLES.map((item) => [item.id, item]),
);

export function getConsumableDisplayName(
  consumable: ConsumableDefinition | null | undefined,
  locale: "en" | "zh-CN",
): string {
  if (!consumable) {
    return "";
  }
  return locale === "zh-CN" ? consumable.nameZh : consumable.name;
}

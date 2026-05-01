import type { ModifierStats } from "@/lib/build/stats";

export type ConsumableDefinition = {
  id: string;
  name: string;
  durationSeconds: number;
  effects: Partial<ModifierStats>;
};

export const CONSUMABLES: ConsumableDefinition[] = [
  {
    id: "item_corp3_animal_1",
    name: "Ginseng Meat Stew",
    durationSeconds: 300,
    effects: {
      FLAT_ATK: 180,
      CRIT_RATE_PCT: 0.11,
    },
  },
  {
    id: "item_agrange_1_erhound_1_sp_1_1",
    name: "Jakub's Legacy",
    durationSeconds: 300,
    effects: {
      ATK_PCT: 0.27,
    },
  },
];

export const CONSUMABLE_BY_ID: Record<string, ConsumableDefinition> = Object.fromEntries(
  CONSUMABLES.map((item) => [item.id, item]),
);

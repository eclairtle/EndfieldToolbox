export type EnemyRank = "common" | "advanced" | "elite" | "alpha" | "boss";

const COMMON_ENEMY_IDS = [
  "acid_originium_slug",
  "acid_originium_slug_alpha",
  "aethillu",
  "aggeloi_ram",
  "aggeloi_ram_alpha",
  "aggeloi_sting",
  "aggeloi_sting_alpha",
  "blazemist_originium_slug",
  "bonekrusher_ambusher",
  "bonekrusher_infiltrator",
  "bonekrusher_raider",
  "bonekrusher_ripptusk",
  "bonekrusher_vanguard",
  "brutal_pincerbeast",
  "elite_ambusher",
  "elite_raider",
  "elite_ripptusk",
  "falsewings",
  "falsewings_alpha",
  "firemist_originium_slug",
  "grove_archer",
  "hazefyre_claw",
  "hazefyre_tuskbeast",
  "hedron",
  "hedron_delta",
  "highway_reaver",
  "indigenous_pincerbeast",
  "mudflow",
  "mudflow_delta",
  "prism",
  "road_plunderer",
  "rockhowler",
  "sweeping_wind",
  "tidewalker",
  "tidewalker_delta",
  "waterlamp",
  "wild_tuskbeast",
] as const;

const ADVANCED_ENEMY_IDS = [
  "aggeloi_effigy",
  "aggeloi_sentinel",
  "armored_manglerbeast",
  "axe_armorbeast",
  "bonekrusher_ballista",
  "bonekrusher_executioner",
  "bonekrusher_siegeknuckles",
  "breaking_gust",
  "cloud_obliterator",
  "elite_executioner",
  "glaring_rakerbeast",
  "hazefyre_axe_armorbeast",
  "hill_smasher",
  "spotted_rakerbeast",
] as const;

const ELITE_ENEMY_IDS = [
  "ereignis",
  "marble_aggelomoirai",
  "marble_aggelomoirai_core",
  "marble_appendage",
  "nefarith_bonekrusher",
  "nefarith_conqueror",
  "rhodagn",
  "ruan_yi",
  "triaggelos",
] as const;

const ALPHA_ENEMY_IDS = [
  "aggeloi_heavy_ram",
  "aggeloi_heavy_ram_alpha",
  "aggeloi_heavy_sting",
  "aggeloi_heavy_sting_alpha",
  "bonekrusher_arsonist",
  "bonekrusher_pyromancer",
  "cloud_stalker",
  "imbued_quillbeast",
  "nimbus_razor",
  "quillbeast",
  "tunneling_nidwyrm",
] as const;

const BOSS_ENEMY_IDS = [
  "craghowler",
  "skydrummer",
  "tidalklast",
  "walking_chrysopolis",
] as const;

const ENEMY_RANK_BY_ID = new Map<string, EnemyRank>([
  ...COMMON_ENEMY_IDS.map((id) => [id, "common"] as const),
  ...ADVANCED_ENEMY_IDS.map((id) => [id, "advanced"] as const),
  ...ELITE_ENEMY_IDS.map((id) => [id, "elite"] as const),
  ...ALPHA_ENEMY_IDS.map((id) => [id, "alpha"] as const),
  ...BOSS_ENEMY_IDS.map((id) => [id, "boss"] as const),
]);

export function inferEnemyRank(enemyId: string): EnemyRank {
  return ENEMY_RANK_BY_ID.get(enemyId) ?? "common";
}

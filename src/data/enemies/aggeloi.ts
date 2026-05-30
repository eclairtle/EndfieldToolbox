import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

type AggeloiEnemyInput = {
  id: string;
  name: string;
  baseHpLv1: number;
  baseAtkLv1: number;
  def: number;
  weight: number;
  staggerGauge: number;
  staggerNodes?: number[];
  staggerRecoverySeconds: number;
  finisherMultiplier: number;
  finisherSpGain: number;
  resistances?: Partial<EnemyBase["resistances"]>;
};

function makeAggeloiEnemy(input: AggeloiEnemyInput): EnemyBase {
  return {
    id: input.id,
    name: input.name,
    baseHpLv1: input.baseHpLv1,
    baseAtkLv1: input.baseAtkLv1,
    hpScalingModel: DEFAULT_ENEMY_HP_SCALING,
    atkScalingModel: DEFAULT_ENEMY_ATK_SCALING,
    def: input.def,
    resistances: {
      Physical: 0,
      Heat: 0,
      Cryo: 0,
      Nature: 0,
      Electric: 0,
      Aether: 0,
      ...input.resistances,
    },
    weight: input.weight,
    staggerGauge: input.staggerGauge,
    staggerNodes: input.staggerNodes,
    staggerRecoverySeconds: input.staggerRecoverySeconds,
    finisherMultiplier: input.finisherMultiplier,
    finisherSpGain: input.finisherSpGain,
  };
}

export const AGGELOI_RAM = makeAggeloiEnemy({
  id: "aggeloi_ram",
  name: "Ram",
  baseHpLv1: 138,
  baseAtkLv1: 33,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const AGGELOI_SENTINEL = makeAggeloiEnemy({
  id: "aggeloi_sentinel",
  name: "Sentinel",
  baseHpLv1: 415,
  baseAtkLv1: 49,
  def: 100,
  weight: 2,
  staggerGauge: 200,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const AGGELOI_HEAVY_RAM = makeAggeloiEnemy({
  id: "aggeloi_heavy_ram",
  name: "Heavy Ram",
  baseHpLv1: 831,
  baseAtkLv1: 66,
  def: 100,
  weight: 1.5,
  staggerGauge: 160,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const AGGELOI_STING = makeAggeloiEnemy({
  id: "aggeloi_sting",
  name: "Sting",
  baseHpLv1: 138,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const AGGELOI_HEAVY_STING = makeAggeloiEnemy({
  id: "aggeloi_heavy_sting",
  name: "Heavy Sting",
  baseHpLv1: 734,
  baseAtkLv1: 49,
  def: 100,
  weight: 1.5,
  staggerGauge: 140,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const TRIAGGELOS = makeAggeloiEnemy({
  id: "triaggelos",
  name: "Triaggelos",
  baseHpLv1: 1385,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 280,
  staggerRecoverySeconds: 11,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const AGGELOI_RAM_ALPHA = makeAggeloiEnemy({
  id: "aggeloi_ram_alpha",
  name: "Ram α",
  baseHpLv1: 208,
  baseAtkLv1: 46,
  def: 100,
  weight: 1,
  staggerGauge: 90,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const MARBLE_AGGELOMOIRAI = makeAggeloiEnemy({
  id: "marble_aggelomoirai",
  name: "Marble Aggelomoirai",
  baseHpLv1: 4430,
  baseAtkLv1: 78,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 11,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
});

export const FALSEWINGS = makeAggeloiEnemy({
  id: "falsewings",
  name: "Falsewings",
  baseHpLv1: 111,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const NEFARITH_BONEKRUSHER = makeAggeloiEnemy({
  id: "nefarith_bonekrusher",
  name: 'Nefarith, "Bonekrusher"',
  baseHpLv1: 2354,
  baseAtkLv1: 46,
  def: 100,
  weight: 2,
  staggerGauge: 480,
  staggerRecoverySeconds: 11,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
});

export const NEFARITH_CONQUEROR = makeAggeloiEnemy({
  id: "nefarith_conqueror",
  name: 'Nefarith, "Conqueror"',
  baseHpLv1: 2631,
  baseAtkLv1: 39,
  def: 100,
  weight: 2,
  staggerGauge: 480,
  staggerRecoverySeconds: 16,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
});

export const AGGELOI_EFFIGY = makeAggeloiEnemy({
  id: "aggeloi_effigy",
  name: "Effigy",
  baseHpLv1: 1246,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 340,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const MARBLE_AGGELOMOIRAI_CORE = makeAggeloiEnemy({
  id: "marble_aggelomoirai_core",
  name: "Marble Aggelomoirai",
  baseHpLv1: 2077,
  baseAtkLv1: 33,
  def: 100,
  weight: 2,
  staggerGauge: 200,
  staggerRecoverySeconds: 24,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
});

export const AGGELOI_STING_ALPHA = makeAggeloiEnemy({
  id: "aggeloi_sting_alpha",
  name: "Sting α",
  baseHpLv1: 208,
  baseAtkLv1: 36,
  def: 100,
  weight: 1,
  staggerGauge: 90,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const WALKING_CHRYSOPOLIS = makeAggeloiEnemy({
  id: "walking_chrysopolis",
  name: "Walking Chrysopolis",
  baseHpLv1: 1385,
  baseAtkLv1: 59,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Cryo: 0.2,
    Electric: 0.2,
  },
});

export const AGGELOI_HEAVY_RAM_ALPHA = makeAggeloiEnemy({
  id: "aggeloi_heavy_ram_alpha",
  name: "Heavy Ram α",
  baseHpLv1: 1246,
  baseAtkLv1: 72,
  def: 100,
  weight: 1.5,
  staggerGauge: 200,
  staggerRecoverySeconds: 7.5,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const AGGELOI_HEAVY_STING_ALPHA = makeAggeloiEnemy({
  id: "aggeloi_heavy_sting_alpha",
  name: "Heavy Sting α",
  baseHpLv1: 1094,
  baseAtkLv1: 59,
  def: 100,
  weight: 1.5,
  staggerGauge: 180,
  staggerRecoverySeconds: 7.5,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const FALSEWINGS_ALPHA = makeAggeloiEnemy({
  id: "falsewings_alpha",
  name: "Falsewings α",
  baseHpLv1: 166,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const AGGELOI: EnemyBase[] = [
  AGGELOI_RAM,
  AGGELOI_SENTINEL,
  AGGELOI_HEAVY_RAM,
  AGGELOI_STING,
  AGGELOI_HEAVY_STING,
  TRIAGGELOS,
  AGGELOI_RAM_ALPHA,
  MARBLE_AGGELOMOIRAI,
  FALSEWINGS,
  NEFARITH_BONEKRUSHER,
  NEFARITH_CONQUEROR,
  AGGELOI_EFFIGY,
  MARBLE_AGGELOMOIRAI_CORE,
  AGGELOI_STING_ALPHA,
  WALKING_CHRYSOPOLIS,
  AGGELOI_HEAVY_RAM_ALPHA,
  AGGELOI_HEAVY_STING_ALPHA,
  FALSEWINGS_ALPHA,
];

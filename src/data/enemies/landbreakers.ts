import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

type LandbreakerEnemyInput = {
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

function makeLandbreakerEnemy(input: LandbreakerEnemyInput): EnemyBase {
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

export const RHODAGN = makeLandbreakerEnemy({
  id: "rhodagn",
  name: "Rhodagn the Bonekrushing Fist",
  baseHpLv1: 3461,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 280,
  staggerNodes: [0.5],
  staggerRecoverySeconds: 10,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
});

export const BONEKRUSHER_EXECUTIONER = makeLandbreakerEnemy({
  id: "bonekrusher_executioner",
  name: "Bonekrusher Executioner",
  baseHpLv1: 1108,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const BONEKRUSHER_RAIDER = makeLandbreakerEnemy({
  id: "bonekrusher_raider",
  name: "Bonekrusher Raider",
  baseHpLv1: 194,
  baseAtkLv1: 36,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const BONEKRUSHER_AMBUSHER = makeLandbreakerEnemy({
  id: "bonekrusher_ambusher",
  name: "Bonekrusher Ambusher",
  baseHpLv1: 180,
  baseAtkLv1: 28,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const BONEKRUSHER_PYROMANCER = makeLandbreakerEnemy({
  id: "bonekrusher_pyromancer",
  name: "Bonekrusher Pyromancer",
  baseHpLv1: 761,
  baseAtkLv1: 49,
  def: 100,
  weight: 1.5,
  staggerGauge: 160,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Electric: 0.5,
  },
});

export const BONEKRUSHER_ARSONIST = makeLandbreakerEnemy({
  id: "bonekrusher_arsonist",
  name: "Bonekrusher Arsonist",
  baseHpLv1: 831,
  baseAtkLv1: 49,
  def: 100,
  weight: 1.5,
  staggerGauge: 170,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Electric: 0.5,
  },
});

export const BONEKRUSHER_BALLISTA = makeLandbreakerEnemy({
  id: "bonekrusher_ballista",
  name: "Bonekrusher Ballista",
  baseHpLv1: 1246,
  baseAtkLv1: 72,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const BONEKRUSHER_INFILTRATOR = makeLandbreakerEnemy({
  id: "bonekrusher_infiltrator",
  name: "Bonekrusher Infiltrator",
  baseHpLv1: 166,
  baseAtkLv1: 33,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const HAZEFYRE_CLAW = makeLandbreakerEnemy({
  id: "hazefyre_claw",
  name: "Hazefyre Claw",
  baseHpLv1: 249,
  baseAtkLv1: 36,
  def: 100,
  weight: 1,
  staggerGauge: 100,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const BONEKRUSHER_RIPPTUSK = makeLandbreakerEnemy({
  id: "bonekrusher_ripptusk",
  name: "Bonekrusher Ripptusk",
  baseHpLv1: 152,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const HAZEFYRE_TUSKBEAST = makeLandbreakerEnemy({
  id: "hazefyre_tuskbeast",
  name: "Hazefyre Tuskbeast",
  baseHpLv1: 194,
  baseAtkLv1: 33,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const ELITE_RAIDER = makeLandbreakerEnemy({
  id: "elite_raider",
  name: "Elite Raider",
  baseHpLv1: 291,
  baseAtkLv1: 49,
  def: 100,
  weight: 1,
  staggerGauge: 110,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const ELITE_AMBUSHER = makeLandbreakerEnemy({
  id: "elite_ambusher",
  name: "Elite Ambusher",
  baseHpLv1: 263,
  baseAtkLv1: 38,
  def: 100,
  weight: 1,
  staggerGauge: 110,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const ELITE_RIPPTUSK = makeLandbreakerEnemy({
  id: "elite_ripptusk",
  name: "Elite Ripptusk",
  baseHpLv1: 228,
  baseAtkLv1: 39,
  def: 100,
  weight: 1,
  staggerGauge: 90,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const ELITE_EXECUTIONER = makeLandbreakerEnemy({
  id: "elite_executioner",
  name: "Elite Executioner",
  baseHpLv1: 1661,
  baseAtkLv1: 105,
  def: 100,
  weight: 2,
  staggerGauge: 340,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const BONEKRUSHER_VANGUARD = makeLandbreakerEnemy({
  id: "bonekrusher_vanguard",
  name: "Bonekrusher Vanguard",
  baseHpLv1: 166,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
  },
});

export const BONEKRUSHER_SIEGEKNUCKLES = makeLandbreakerEnemy({
  id: "bonekrusher_siegeknuckles",
  name: "Bonekrusher Siegeknuckles",
  baseHpLv1: 1246,
  baseAtkLv1: 26,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 50,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Cryo: 0.2,
    Nature: 0.2,
  },
});

export const LANDBREAKERS: EnemyBase[] = [
  RHODAGN,
  BONEKRUSHER_EXECUTIONER,
  BONEKRUSHER_RAIDER,
  BONEKRUSHER_AMBUSHER,
  BONEKRUSHER_PYROMANCER,
  BONEKRUSHER_ARSONIST,
  BONEKRUSHER_BALLISTA,
  BONEKRUSHER_INFILTRATOR,
  HAZEFYRE_CLAW,
  BONEKRUSHER_RIPPTUSK,
  HAZEFYRE_TUSKBEAST,
  ELITE_RAIDER,
  ELITE_AMBUSHER,
  ELITE_RIPPTUSK,
  ELITE_EXECUTIONER,
  BONEKRUSHER_VANGUARD,
  BONEKRUSHER_SIEGEKNUCKLES,
];

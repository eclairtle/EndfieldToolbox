import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

function makeEnemy(input: {
  id: string;
  name: string;
  baseHpLv1: number;
  baseAtkLv1: number;
  def: number;
  weight: number;
  staggerGauge: number;
  staggerRecoverySeconds: number;
  finisherMultiplier: number;
  finisherSpGain: number;
  resistances?: Partial<EnemyBase["resistances"]>;
}): EnemyBase {
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
    staggerRecoverySeconds: input.staggerRecoverySeconds,
    finisherMultiplier: input.finisherMultiplier,
    finisherSpGain: input.finisherSpGain,
  };
}

export const RUAN_YI = makeEnemy({
  id: "ruan_yi",
  name: "Ruan Yi",
  baseHpLv1: 3323,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 300,
  staggerRecoverySeconds: 15,
  finisherMultiplier: 1.75,
  finisherSpGain: 100,
  resistances: {
    Heat: 0.2,
    Nature: 0.2,
  },
});

export const RUAN_YI_ENEMIES: EnemyBase[] = [RUAN_YI];

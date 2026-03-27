
import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

export const RHODAGN: EnemyBase = {
  id: "rhodagn",
  name: "Rhodagn",

  baseHpLv1: 3461,
  baseAtkLv1: 66,
  hpScalingModel: DEFAULT_ENEMY_HP_SCALING,
  atkScalingModel: DEFAULT_ENEMY_ATK_SCALING,
  def: 100,

  resistances: {
    Physical: 0,
    Heat: 0,
    Cryo: 0,
    Nature: 0,
    Electric: 0,
    Aether: 0,
  },

  weight: 2,
  staggerGauge: 280,
  staggerRecoverySeconds: 10,

  finisherMultiplier: 1.75,
  finisherSpGain: 100,
};
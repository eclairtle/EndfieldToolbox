import { type EnemyBase } from "@/data/enemies";
import { DEFAULT_ENEMY_ATK_SCALING, DEFAULT_ENEMY_HP_SCALING } from "@/lib/enemy/enemyScaling";

type WildlifeEnemyInput = {
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

function makeWildlifeEnemy(input: WildlifeEnemyInput): EnemyBase {
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

export const TUNNELING_NIDWYRM = makeWildlifeEnemy({
  id: "tunneling_nidwyrm",
  name: "Tunneling Nidwyrm",
  baseHpLv1: 692,
  baseAtkLv1: 56,
  def: 100,
  weight: 1.5,
  staggerGauge: 160,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Heat: 0.3,
  },
});

export const WILD_TUSKBEAST = makeWildlifeEnemy({
  id: "wild_tuskbeast",
  name: "Wild Tuskbeast",
  baseHpLv1: 1,
  baseAtkLv1: 16,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const AXE_ARMORBEAST = makeWildlifeEnemy({
  id: "axe_armorbeast",
  name: "Axe Armorbeast",
  baseHpLv1: 1385,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 280,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const HAZEFYRE_AXE_ARMORBEAST = makeWildlifeEnemy({
  id: "hazefyre_axe_armorbeast",
  name: "Hazefyre Axe Armorbeast",
  baseHpLv1: 1800,
  baseAtkLv1: 72,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const INDIGENOUS_PINCERBEAST = makeWildlifeEnemy({
  id: "indigenous_pincerbeast",
  name: "Indigenous Pincerbeast",
  baseHpLv1: 166,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const BRUTAL_PINCERBEAST = makeWildlifeEnemy({
  id: "brutal_pincerbeast",
  name: "Brutal Pincerbeast",
  baseHpLv1: 277,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const ACID_ORIGINIUM_SLUG = makeWildlifeEnemy({
  id: "acid_originium_slug",
  name: "Acid Originium Slug",
  baseHpLv1: 152,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const ACID_ORIGINIUM_SLUG_ALPHA = makeWildlifeEnemy({
  id: "acid_originium_slug_alpha",
  name: "Acid Originium Slug α",
  baseHpLv1: 249,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
});

export const FIREMIST_ORIGINIUM_SLUG = makeWildlifeEnemy({
  id: "firemist_originium_slug",
  name: "Firemist Originium Slug",
  baseHpLv1: 180,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const BLAZEMIST_ORIGINIUM_SLUG = makeWildlifeEnemy({
  id: "blazemist_originium_slug",
  name: "Blazemist Originium Slug",
  baseHpLv1: 270,
  baseAtkLv1: 30,
  def: 100,
  weight: 1,
  staggerGauge: 60,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Physical: 0.2,
    Heat: 0.2,
    Electric: 0.2,
  },
});

export const WATERLAMP = makeWildlifeEnemy({
  id: "waterlamp",
  name: "Waterlamp",
  baseHpLv1: 111,
  baseAtkLv1: 26,
  def: 100,
  weight: 1,
  staggerGauge: 80,
  staggerRecoverySeconds: 6,
  finisherMultiplier: 1,
  finisherSpGain: 25,
  resistances: {
    Heat: 0.2,
    Nature: 0.2,
  },
});

export const SKYDRUMMER = makeWildlifeEnemy({
  id: "skydrummer",
  name: "Skydrummer",
  baseHpLv1: 1661,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
});

export const SPOTTED_RAKERBEAST = makeWildlifeEnemy({
  id: "spotted_rakerbeast",
  name: "Spotted Rakerbeast",
  baseHpLv1: 1108,
  baseAtkLv1: 66,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Heat: 0.2,
    Cryo: 0.2,
  },
});

export const GLARING_RAKERBEAST = makeWildlifeEnemy({
  id: "glaring_rakerbeast",
  name: "Glaring Rakerbeast",
  baseHpLv1: 1869,
  baseAtkLv1: 72,
  def: 100,
  weight: 2,
  staggerGauge: 320,
  staggerRecoverySeconds: 9,
  finisherMultiplier: 1.5,
  finisherSpGain: 50,
  resistances: {
    Heat: 0.2,
    Cryo: 0.2,
  },
});

export const QUILLBEAST = makeWildlifeEnemy({
  id: "quillbeast",
  name: "Quillbeast",
  baseHpLv1: 831,
  baseAtkLv1: 39,
  def: 100,
  weight: 1.5,
  staggerGauge: 200,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const IMBUED_QUILLBEAST = makeWildlifeEnemy({
  id: "imbued_quillbeast",
  name: "Imbued Quillbeast",
  baseHpLv1: 1246,
  baseAtkLv1: 44,
  def: 100,
  weight: 1.5,
  staggerGauge: 200,
  staggerRecoverySeconds: 7,
  finisherMultiplier: 1.25,
  finisherSpGain: 35,
  resistances: {
    Nature: 0.2,
    Electric: 0.2,
  },
});

export const WILDLIFE: EnemyBase[] = [
  TUNNELING_NIDWYRM,
  WILD_TUSKBEAST,
  AXE_ARMORBEAST,
  HAZEFYRE_AXE_ARMORBEAST,
  INDIGENOUS_PINCERBEAST,
  BRUTAL_PINCERBEAST,
  ACID_ORIGINIUM_SLUG,
  ACID_ORIGINIUM_SLUG_ALPHA,
  FIREMIST_ORIGINIUM_SLUG,
  BLAZEMIST_ORIGINIUM_SLUG,
  WATERLAMP,
  SKYDRUMMER,
  SPOTTED_RAKERBEAST,
  GLARING_RAKERBEAST,
  QUILLBEAST,
  IMBUED_QUILLBEAST,
];

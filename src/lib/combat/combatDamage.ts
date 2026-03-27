import type { ModifierStats } from "@/lib/build/stats";
import type {
  AttackType,
  ResolvedCommandAtLevel,
  ResolvedCommandHitAtLevel,
} from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { EnemyResolvedStats } from "../enemy/enemyScaling";

function getAttackTypeBonus(attackType: AttackType, mods: ModifierStats): number {
  switch (attackType) {
    case "BASIC_ATTACK":
      return mods.BASIC_ATK_DMG_PCT;
    case "BATTLE_SKILL":
      return mods.SKILL_DMG_PCT + mods.BATTLE_SKILL_DMG_PCT;
    case "COMBO_SKILL":
      return mods.SKILL_DMG_PCT + mods.COMBO_SKILL_DMG_PCT;
    case "ULTIMATE":
      return mods.SKILL_DMG_PCT + mods.ULTIMATE_DMG_PCT;
    default:
      return 0;
  }
}

function getDamageTypeBonus(damageType: ElementType, mods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return mods.PHYSICAL_DMG_PCT;

    case "Heat":
      return mods.ARTS_DMG_PCT + mods.HEAT_DMG_PCT;

    case "Cryo":
      return mods.ARTS_DMG_PCT + mods.CRYO_DMG_PCT;

    case "Electric":
      return mods.ARTS_DMG_PCT + mods.ELECTRIC_DMG_PCT;

    case "Nature":
      return mods.ARTS_DMG_PCT + mods.NATURE_DMG_PCT;

    default:
      return 0;
  }
}

export function getTotalDamageBonus(
  attackType: AttackType,
  damageType: ElementType,
  mods: ModifierStats,
): number {
  return getAttackTypeBonus(attackType, mods) + getDamageTypeBonus(damageType, mods);
}

export function getAverageCritMultiplier(mods: ModifierStats): number {
  return 1 + mods.CRIT_RATE_PCT * mods.CRIT_DMG_PCT;
}

function getEnemyResistance(damageType: ElementType, enemyMods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return enemyMods.PHYSICAL_RESIST_PCT;
    case "Heat":
      return enemyMods.HEAT_RESIST_PCT;
    case "Cryo":
      return enemyMods.CRYO_RESIST_PCT;
    case "Electric":
      return enemyMods.ELECTRIC_RESIST_PCT;
    case "Nature":
      return enemyMods.NATURE_RESIST_PCT;
    case "Aether":
      return enemyMods.AETHER_RESIST_PCT;
    default:
      return 0;
  }
}

export function calculateResolvedHitDamage(args: {
  finalAtk: number;
  attackType: AttackType;
  damageType: ElementType;
  hit: ResolvedCommandHitAtLevel;
  attackerMods: ModifierStats;
  enemyMods: ModifierStats;
  enemyStats: EnemyResolvedStats;
}): number {
  const {
    finalAtk,
    attackType,
    damageType,
    hit,
    attackerMods,
    enemyMods,
  } = args;

  const dmgBonus =
    getAttackTypeBonus(attackType, attackerMods) +
    getDamageTypeBonus(damageType, attackerMods);

  const critMultiplier = getAverageCritMultiplier(attackerMods);

  const damageTakenMultiplier = 1 + enemyMods.DMG_TAKEN_PCT;
  const resistMultiplier = 1 - getEnemyResistance(damageType, enemyMods);

  // simple first-pass formula: ignore DEF for now
  const base =
    finalAtk *
    hit.multiplier *
    (1 + dmgBonus) *
    critMultiplier *
    damageTakenMultiplier *
    resistMultiplier;

  return Math.max(0, base * hit.times);
}

export function calculateCommandDamage(args: {
  finalAtk: number;
  command: ResolvedCommandAtLevel;
  mods: ModifierStats;
}): number {
  const { finalAtk, command, mods } = args;

  const dmgBonus = getTotalDamageBonus(command.attackType, command.damageType, mods);
  const critMultiplier = getAverageCritMultiplier(mods);

  let total = 0;

  for (const hit of command.hits) {
    const hitDamage =
      finalAtk *
      hit.multiplier *
      (1 + dmgBonus) *
      critMultiplier *
      hit.times;

    total += hitDamage;
  }

  return total;
}

export function calculateBenchmarkMap(args: {
  finalAtk: number;
  commands: ResolvedCommandAtLevel[];
  mods: ModifierStats;
}): Record<string, number> {
  const out: Record<string, number> = {};

  for (const command of args.commands) {
    out[command.id] = calculateCommandDamage({
      finalAtk: args.finalAtk,
      command,
      mods: args.mods,
    });
  }

  return out;
}
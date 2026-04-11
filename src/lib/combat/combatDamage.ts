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
    case "Healing":
      return mods.HEALING_PCT;

    default:
      return 0;
  }
}

export function getTotalDamageBonus(
  attackType: AttackType,
  damageType: ElementType,
  mods: ModifierStats,
): number {
  return mods.ALL_DMG_PCT + getAttackTypeBonus(attackType, mods) + getDamageTypeBonus(damageType, mods);
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
    case "Healing":
      return 0;
    default:
      return 0;
  }
}

function getResistanceIgnore(damageType: ElementType, attackerMods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return attackerMods.PHYSICAL_RESIST_IGNORE_PCT;
    case "Heat":
      return attackerMods.HEAT_RESIST_IGNORE_PCT;
    case "Cryo":
      return attackerMods.CRYO_RESIST_IGNORE_PCT;
    case "Electric":
      return attackerMods.ELECTRIC_RESIST_IGNORE_PCT;
    case "Nature":
      return attackerMods.NATURE_RESIST_IGNORE_PCT;
    case "Aether":
      return attackerMods.AETHER_RESIST_IGNORE_PCT;
    default:
      return 0;
  }
}

function getEnemySusceptibility(damageType: ElementType, enemyMods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return enemyMods.PHYSICAL_SUS_PCT;
    case "Aether":
      return enemyMods.ARTS_SUS_PCT + enemyMods.AETHER_SUS_PCT;
    case "Heat":
      return enemyMods.ARTS_SUS_PCT + enemyMods.HEAT_SUS_PCT;
    case "Cryo":
      return enemyMods.ARTS_SUS_PCT + enemyMods.CRYO_SUS_PCT;
    case "Electric":
      return enemyMods.ARTS_SUS_PCT + enemyMods.ELECTRIC_SUS_PCT;
    case "Nature":
      return enemyMods.ARTS_SUS_PCT + enemyMods.NATURE_SUS_PCT;
    default:
      return 0;
  }
}

function getEnemyDamageTakenBonus(damageType: ElementType, enemyMods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.PHYSICAL_DMG_TAKEN_PCT;
    case "Aether":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.ARTS_DMG_TAKEN_PCT + enemyMods.AETHER_DMG_TAKEN_PCT;
    case "Heat":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.ARTS_DMG_TAKEN_PCT + enemyMods.HEAT_DMG_TAKEN_PCT;
    case "Cryo":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.ARTS_DMG_TAKEN_PCT + enemyMods.CRYO_DMG_TAKEN_PCT;
    case "Electric":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.ARTS_DMG_TAKEN_PCT + enemyMods.ELECTRIC_DMG_TAKEN_PCT;
    case "Nature":
      return enemyMods.DMG_TAKEN_PCT + enemyMods.ARTS_DMG_TAKEN_PCT + enemyMods.NATURE_DMG_TAKEN_PCT;
    default:
      return enemyMods.DMG_TAKEN_PCT;
  }
}

export function calculateHealingAmount(args: {
  baseAmount: number;
  healerMods: ModifierStats;
  targetHealingReceivedBonus: number;
}): number {
  return (
    args.baseAmount *
    (1 + args.healerMods.HEALING_PCT) *
    (1 + args.targetHealingReceivedBonus)
  );
}

export function calculateResolvedHitDamage(args: {
  finalAtk: number;
  attackType: AttackType;
  damageType: ElementType;
  hit: ResolvedCommandHitAtLevel;
  attackerMods: ModifierStats;
  enemyMods: ModifierStats;
  enemyStats: EnemyResolvedStats;
}): { noCritDamage: number; critDamage: number; averageDamage: number } {
  const {
    finalAtk,
    attackType,
    damageType,
    hit,
    attackerMods,
    enemyMods,
  } = args;

  const dmgBonus =
    attackerMods.ALL_DMG_PCT +
    getAttackTypeBonus(attackType, attackerMods) +
    getDamageTypeBonus(damageType, attackerMods);

  const critRate = attackerMods.CRIT_RATE_PCT;
  const critDamageBonus = attackerMods.CRIT_DMG_PCT;

  const damageTakenMultiplier = 1 + getEnemyDamageTakenBonus(damageType, enemyMods);
  const effectiveResistance = getEnemyResistance(damageType, enemyMods) - getResistanceIgnore(damageType, attackerMods);
  const resistMultiplier = 1 - effectiveResistance;
  const susceptibilityMultiplier = 1 + getEnemySusceptibility(damageType, enemyMods);
  const defenseMultiplier = (() => {
    if (damageType === "Healing") {
      return 1;
    }

    const defense = args.enemyStats.def;
    if (defense > 0) {
      return 1 - defense / (defense + 100);
    }
    if (defense < 0) {
      return 1 + (1 - Math.pow(0.99, -defense));
    }
    return 1;
  })();

  const preCritBase =
    finalAtk *
    hit.multiplier *
    (1 + dmgBonus) *
    damageTakenMultiplier *
    resistMultiplier *
    susceptibilityMultiplier *
    defenseMultiplier;

  const noCritDamage = Math.max(0, preCritBase * hit.times);
  const critDamage = Math.max(0, preCritBase * (1 + critDamageBonus) * hit.times);
  const averageDamage = Math.max(0, noCritDamage * (1 - critRate) + critDamage * critRate);

  return {
    noCritDamage,
    critDamage,
    averageDamage,
  };
}

export function calculateReactionDamage(args: {
  finalAtk: number;
  damageType: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  baseMultiplier: number;
  attackerMods: ModifierStats;
  enemyMods: ModifierStats;
  enemyStats: EnemyResolvedStats;
  applierLevel: number;
  isPhysicalReaction?: boolean;
}): { noCritDamage: number; critDamage: number; averageDamage: number } {
  const critRate = args.attackerMods.CRIT_RATE_PCT;
  const critDamageBonus = args.attackerMods.CRIT_DMG_PCT;
  const artsIntensity = Math.max(0, args.attackerMods.ARTS_INTENSITY);

  const damageTakenMultiplier = 1 + getEnemyDamageTakenBonus(args.damageType, args.enemyMods);
  const effectiveResistance = getEnemyResistance(args.damageType, args.enemyMods) - getResistanceIgnore(args.damageType, args.attackerMods);
  const resistMultiplier = 1 - effectiveResistance;
  const susceptibilityMultiplier = 1 + getEnemySusceptibility(args.damageType, args.enemyMods);
  const defenseMultiplier = (() => {
    const defense = args.enemyStats.def;
    if (defense > 0) {
      return 1 - defense / (defense + 100);
    }
    if (defense < 0) {
      return 1 + (1 - Math.pow(0.99, -defense));
    }
    return 1;
  })();
  const levelMultiplier = args.isPhysicalReaction
    ? 1 + (Math.max(1, args.applierLevel) - 1) / 196
    : 1 + (Math.max(1, args.applierLevel) - 1) / 392;
  const artsIntensityMultiplier = 1 + (2 * artsIntensity) / (artsIntensity + 300);

  const preCritBase =
    args.finalAtk *
    args.baseMultiplier *
    damageTakenMultiplier *
    resistMultiplier *
    susceptibilityMultiplier *
    defenseMultiplier *
    levelMultiplier *
    artsIntensityMultiplier;

  const noCritDamage = Math.max(0, preCritBase);
  const critDamage = Math.max(0, preCritBase * (1 + critDamageBonus));
  const averageDamage = Math.max(0, noCritDamage * (1 - critRate) + critDamage * critRate);

  return {
    noCritDamage,
    critDamage,
    averageDamage,
  };
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

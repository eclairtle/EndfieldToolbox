import type { ModifierStats } from "@/lib/build/stats";
import type {
  AttackType,
  ResolvedCommandAtLevel,
  ResolvedCommandHitAtLevel,
} from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { EnemyResolvedStats } from "../enemy/enemyScaling";

const MIN_DAMAGE_MULTIPLIER = 0.05;
function floorDamageMultiplier(value: number): number {
  return Math.max(MIN_DAMAGE_MULTIPLIER, value);
}

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

function getFinalStrikeBonus(
  attackType: AttackType,
  basicAttackVariant: ResolvedCommandAtLevel["basicAttackVariant"] | undefined,
  mods: ModifierStats,
): number {
  if (attackType !== "BASIC_ATTACK") {
    return 0;
  }
  if (basicAttackVariant !== "final_strike") {
    return 0;
  }
  return mods.FINAL_STRIKE_DMG_PCT;
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

function getDamageAmpBonus(damageType: ElementType, mods: ModifierStats): number {
  switch (damageType) {
    case "Physical":
      return mods.DMG_AMP_PCT + mods.PHYSICAL_DMG_AMP_PCT;
    case "Heat":
      return mods.DMG_AMP_PCT + mods.HEAT_DMG_AMP_PCT;
    case "Cryo":
      return mods.DMG_AMP_PCT + mods.CRYO_DMG_AMP_PCT;
    case "Electric":
      return mods.DMG_AMP_PCT + mods.ELECTRIC_DMG_AMP_PCT;
    case "Nature":
      return mods.DMG_AMP_PCT + mods.NATURE_DMG_AMP_PCT;
    case "Aether":
      return mods.DMG_AMP_PCT + mods.AETHER_DMG_AMP_PCT;
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

function getEnemySusceptibility(damageType: ElementType, enemyMods: ModifierStats, attackerMods: ModifierStats): number {
  const genericSus = enemyMods.SUS_PCT * (1+attackerMods.SUS_ENHANCE_PCT);
  switch (damageType) {
    case "Physical":
      return genericSus + enemyMods.PHYSICAL_SUS_PCT * (1 + attackerMods.PHYSICAL_SUS_ENHANCE_PCT);
    case "Aether":
      return genericSus + (
        enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
        + enemyMods.AETHER_SUS_PCT * (1 + attackerMods.AETHER_SUS_ENHANCE_PCT)
      );
    case "Heat":
      return genericSus + (
        enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
        + enemyMods.HEAT_SUS_PCT * (1 + attackerMods.HEAT_SUS_ENHANCE_PCT)
      );
    case "Cryo":
      return genericSus + (
        enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
        + enemyMods.CRYO_SUS_PCT * (1 + attackerMods.CRYO_SUS_ENHANCE_PCT)
      );
    case "Electric":
      return genericSus + (
        enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
        + enemyMods.ELECTRIC_SUS_PCT * (1 + attackerMods.ELECTRIC_SUS_ENHANCE_PCT)
      );
    case "Nature":
      return genericSus + (
        enemyMods.ARTS_SUS_PCT * (1 + attackerMods.ARTS_SUS_ENHANCE_PCT)
        + enemyMods.NATURE_SUS_PCT * (1 + attackerMods.NATURE_SUS_ENHANCE_PCT)
      );
    default:
      return genericSus;
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
  basicAttackVariant?: ResolvedCommandAtLevel["basicAttackVariant"];
  damageType: ElementType;
  hit: ResolvedCommandHitAtLevel;
  attackerMods: ModifierStats;
  enemyMods: ModifierStats;
  enemyStats: EnemyResolvedStats;
  noCrit?: boolean;
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
    getFinalStrikeBonus(attackType, args.basicAttackVariant, attackerMods) +
    getDamageTypeBonus(damageType, attackerMods);
  const dmgBonusMultiplier = floorDamageMultiplier(1 + dmgBonus);
  const dmgAmpMultiplier = floorDamageMultiplier(1 + getDamageAmpBonus(damageType, attackerMods));

  const critRate = args.noCrit ? 0 : attackerMods.CRIT_RATE_PCT;
  const critDamageBonus = attackerMods.CRIT_DMG_PCT;

  const damageTakenMultiplier = floorDamageMultiplier(1 + getEnemyDamageTakenBonus(damageType, enemyMods));
  const effectiveResistance = getEnemyResistance(damageType, enemyMods) - getResistanceIgnore(damageType, attackerMods);
  const resistMultiplier = floorDamageMultiplier(1 - effectiveResistance);
  const susceptibilityMultiplier = floorDamageMultiplier(1 + getEnemySusceptibility(damageType, enemyMods, attackerMods));
  const defenseMultiplier = floorDamageMultiplier((() => {
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
  })());

  const preCritBase =
    finalAtk *
    hit.multiplier *
    dmgBonusMultiplier *
    dmgAmpMultiplier *
    damageTakenMultiplier *
    resistMultiplier *
    susceptibilityMultiplier *
    defenseMultiplier;

  // Timeline resolves repeated hits as separate occurrences, so each occurrence
  // should be a single execution rather than multiplied by hit.times again.
  const noCritDamage = Math.max(0, preCritBase);
  const critDamage = Math.max(0, preCritBase * (1 + critDamageBonus));
  const averageDamage = Math.max(0, noCritDamage * (1 - critRate) + critDamage * critRate);

  return {
    noCritDamage,
    critDamage,
    averageDamage,
  };
}

export function calculateReactionDamage(args: {
  finalAtk: number;
  damageType: Extract<ElementType, "Physical" | "Heat" | "Cryo" | "Electric" | "Nature">;
  baseMultiplier: number;
  attackerMods: ModifierStats;
  enemyMods: ModifierStats;
  enemyStats: EnemyResolvedStats;
  applierLevel: number;
  reactionCategory?: "arts" | "physical";
  noCrit?: boolean;
}): { noCritDamage: number; critDamage: number; averageDamage: number } {
  const critRate = args.noCrit ? 0 : args.attackerMods.CRIT_RATE_PCT;
  const critDamageBonus = args.attackerMods.CRIT_DMG_PCT;
  const artsIntensity = Math.max(0, args.attackerMods.ARTS_INTENSITY);
  const dmgBonus = args.attackerMods.ALL_DMG_PCT + getDamageTypeBonus(args.damageType, args.attackerMods);
  const dmgBonusMultiplier = floorDamageMultiplier(1 + dmgBonus);
  const dmgAmpMultiplier = floorDamageMultiplier(1 + getDamageAmpBonus(args.damageType, args.attackerMods));

  const damageTakenMultiplier = floorDamageMultiplier(1 + getEnemyDamageTakenBonus(args.damageType, args.enemyMods));
  const effectiveResistance = getEnemyResistance(args.damageType, args.enemyMods) - getResistanceIgnore(args.damageType, args.attackerMods);
  const resistMultiplier = floorDamageMultiplier(1 - effectiveResistance);
  const susceptibilityMultiplier = floorDamageMultiplier(1 + getEnemySusceptibility(args.damageType, args.enemyMods, args.attackerMods));
  const defenseMultiplier = floorDamageMultiplier((() => {
    const defense = args.enemyStats.def;
    if (defense > 0) {
      return 1 - defense / (defense + 100);
    }
    if (defense < 0) {
      return 1 + (1 - Math.pow(0.99, -defense));
    }
    return 1;
  })());
  const levelMultiplier = (args.reactionCategory ?? "arts") === "physical"
    ? 1 + (Math.max(1, args.applierLevel) - 1) / 392
    : 1 + (Math.max(1, args.applierLevel) - 1) / 196;
  const artsIntensityMultiplier = 1 + artsIntensity / 100;

  const preCritBase =
    args.finalAtk *
    args.baseMultiplier *
    dmgBonusMultiplier *
    dmgAmpMultiplier *
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

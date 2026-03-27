import { makeBaseModifierStats, type ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { Rotation, CharacterCombatSnapshot, RotationSimulationResult } from "@/lib/combat/rotation";
import { calculateResolvedHitDamage } from "@/lib/combat/combatDamage";

export function makeEnemyModifierSnapshot(input: {
  resistances: {
    PHYSICAL_RESIST_PCT: number;
    HEAT_RESIST_PCT: number;
    CRYO_RESIST_PCT: number;
    ELECTRIC_RESIST_PCT: number;
    NATURE_RESIST_PCT: number;
    AETHER_RESIST_PCT: number;
  };
  dmgTakenPct?: number;
}): ModifierStats {
  const base = makeBaseModifierStats();
  return {
    ...base,
    DMG_TAKEN_PCT: input.dmgTakenPct ?? 0,
    PHYSICAL_RESIST_PCT: input.resistances.PHYSICAL_RESIST_PCT,
    HEAT_RESIST_PCT: input.resistances.HEAT_RESIST_PCT,
    CRYO_RESIST_PCT: input.resistances.CRYO_RESIST_PCT,
    ELECTRIC_RESIST_PCT: input.resistances.ELECTRIC_RESIST_PCT,
    NATURE_RESIST_PCT: input.resistances.NATURE_RESIST_PCT,
    AETHER_RESIST_PCT: input.resistances.AETHER_RESIST_PCT,
  };
}

export function simulateRotation(args: {
  rotation: Rotation;
  party: CharacterCombatSnapshot[];
  enemyStats: EnemyResolvedStats;
  enemyMods: ModifierStats;
}): RotationSimulationResult {
  const { rotation, party, enemyStats, enemyMods } = args;

  const partyBySlot = new Map(party.map((p) => [p.slot, p]));

  let currentTime = 0;
  let totalDamage = 0;

  const timeline: RotationSimulationResult["timeline"] = [];

  for (const step of rotation.steps) {
    const actor = partyBySlot.get(step.slot);
    if (!actor) continue;

    const command = actor.commands.find((c) => c.id === step.commandId);
    if (!command) continue;

    for (let i = 0; i < command.hits.length; i++) {
      const hit = command.hits[i];

      if (!hit) continue;

      currentTime += hit.frameData / 30; // treating 30 frames = 1 second

      const damage = calculateResolvedHitDamage({
        finalAtk: actor.finalAtk,
        attackType: command.attackType,
        damageType: hit.damageType,
        hit,
        attackerMods: actor.mods,
        enemyMods,
        enemyStats,
      });

      totalDamage += damage;

      timeline.push({
        time: currentTime,
        stepId: step.id,
        slot: step.slot,
        characterName: actor.characterName,
        commandId: command.id,
        commandName: command.name,
        hitIndex: i,
        hitName: hit.name,
        damageType: hit.damageType,
        multiplier: hit.multiplier,
        damage,
      });
    }
  }

  return {
    totalDamage,
    totalTime: currentTime,
    timeline,
  };
}
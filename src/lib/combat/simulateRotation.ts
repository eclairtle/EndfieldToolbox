import { makeBaseModifierStats, type ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { Rotation, CharacterCombatSnapshot, RotationSimulationResult } from "@/lib/combat/rotation";
import { calculateResolvedHitDamage } from "@/lib/combat/combatDamage";
import type { ModifierStatKey } from "@/lib/build/stats";

type TimedEnemyDebuff = {
  stat: ModifierStatKey;
  value: number;
  expiresAt: number;
};

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
  let timedEnemyDebuffs: TimedEnemyDebuff[] = [];

  const timeline: RotationSimulationResult["timeline"] = [];

  for (const step of rotation.steps) {
    const actor = partyBySlot.get(step.slot);
    if (!actor) continue;

    const command = actor.commands.find((c) => c.id === step.commandId);
    if (!command) continue;

    const commandStartTime = currentTime;

    for (let i = 0; i < command.hits.length; i++) {
      const hit = command.hits[i];

      if (!hit) continue;

      for (let repeatIndex = 0; repeatIndex < hit.times; repeatIndex++) {
        const hitTime =
          commandStartTime +
          hit.offsetFrames / 60 +
          (repeatIndex * hit.repeatIntervalFrames) / 60;

        timedEnemyDebuffs = timedEnemyDebuffs.filter((debuff) => debuff.expiresAt > hitTime);
        const effectiveEnemyMods: ModifierStats = { ...enemyMods };
        for (const debuff of timedEnemyDebuffs) {
          effectiveEnemyMods[debuff.stat] += debuff.value;
        }

        const damage = calculateResolvedHitDamage({
          finalAtk: actor.finalAtk,
          attackType: command.attackType,
          damageType: hit.damageType,
          hit,
          attackerMods: actor.mods,
          enemyMods: effectiveEnemyMods,
          enemyStats,
        });

        totalDamage += damage;

        timeline.push({
          time: hitTime,
          stepId: step.id,
          slot: step.slot,
          characterName: actor.characterName,
          commandId: command.id,
          commandName: command.name,
          hitIndex: i,
          hitName: hit.times > 1 ? `${hit.name ?? `Hit ${i + 1}`} #${repeatIndex + 1}` : hit.name,
          damageType: hit.damageType,
          multiplier: hit.multiplier,
          damage,
        });

        for (const debuff of hit.targetDebuffs) {
          timedEnemyDebuffs.push({
            stat: debuff.stat,
            value: debuff.value,
            expiresAt: hitTime + debuff.durationSeconds,
          });
        }
      }
    }

    currentTime = commandStartTime + command.durationFrames / 60;
  }

  return {
    totalDamage,
    totalTime: currentTime,
    timeline,
  };
}

import fs from "fs";
import { buildPartySnapshots, buildPartySnapshotsByVariant } from "/home/eclair/projects/EndfieldToolbox/src/lib/combat/buildSnapshots";
import { simulateRotation, makeEnemyModifierSnapshot } from "/home/eclair/projects/EndfieldToolbox/src/lib/combat/simulateRotation";
import { ENEMIES } from "/home/eclair/projects/EndfieldToolbox/src/data/enemies";
import { calculateEnemyStats } from "/home/eclair/projects/EndfieldToolbox/src/lib/enemy/enemyScaling";
import type { BuildStoreStateSnapshot } from "/home/eclair/projects/EndfieldToolbox/src/stores/buildStore";
import type { RotationSchemesState } from "/home/eclair/projects/EndfieldToolbox/src/lib/combat/rotationSchemes";
import type { CharacterCombatSnapshot } from "/home/eclair/projects/EndfieldToolbox/src/lib/combat/rotation";

const raw = JSON.parse(
  fs.readFileSync(
    "/home/eclair/.codex/attachments/7b1dfffe-9726-4af2-beba-c23ad4f759b0/pasted-text.txt",
    "utf8",
  ),
);
const build = raw["combat-simulator-build-list-v1"].builds.find((entry: any) => entry.id === "build_rs8ospee");
if (!build) throw new Error("build_rs8ospee not found");

const currentBuildState = build.currentBuildState as BuildStoreStateSnapshot;
const rotationState = build.rotationState as RotationSchemesState;
const scheme = rotationState.schemes.find((entry) => entry.id === rotationState.activeSchemeId) ?? rotationState.schemes[0];
if (!scheme) throw new Error("active scheme not found");

const party = buildPartySnapshots(currentBuildState.slots);
const partyVariantsBySlot: Partial<Record<0 | 1 | 2 | 3, CharacterCombatSnapshot[]>> = {};
for (const variantIndex of [0, 1, 2, 3] as const) {
  const snapshots = buildPartySnapshotsByVariant(
    currentBuildState.slots,
    variantIndex,
    currentBuildState.activeVariantIndex,
  );
  for (const snapshot of snapshots) {
    if (!partyVariantsBySlot[snapshot.slot]) {
      partyVariantsBySlot[snapshot.slot] = [null, null, null, null] as unknown as CharacterCombatSnapshot[];
    }
    partyVariantsBySlot[snapshot.slot]![variantIndex] = snapshot;
  }
}

const enemy = ENEMIES.find((entry) => entry.id === "rhodagn") ?? ENEMIES[0];
if (!enemy) throw new Error("enemy not found");
const enemyStats = { level: 90, ...calculateEnemyStats(enemy, 90), resistances: enemy.resistances };

const result = simulateRotation({
  rotation: scheme.rotation,
  party,
  partyVariantsBySlot,
  initialVariantIndex: currentBuildState.activeVariantIndex,
  enemyStats,
  enemyMods: makeEnemyModifierSnapshot({
    resistances: {
      PHYSICAL_RESIST_PCT: enemy.resistances.Physical,
      HEAT_RESIST_PCT: enemy.resistances.Heat,
      CRYO_RESIST_PCT: enemy.resistances.Cryo,
      ELECTRIC_RESIST_PCT: enemy.resistances.Electric,
      NATURE_RESIST_PCT: enemy.resistances.Nature,
      AETHER_RESIST_PCT: enemy.resistances.Aether,
    },
  }),
  enemyStaggerGauge: enemy.staggerGauge,
  enemyStaggerNodes: enemy.staggerNodes,
  enemyStaggerRecoverySeconds: enemy.staggerRecoverySeconds,
  enemyFinisherMultiplier: enemy.finisherMultiplier,
  enemyFinisherSpGain: enemy.finisherSpGain,
  battleStartConsumableIdsBySlot: ["item_corp3_animal_1", null, null, null],
  enemyActionWindows: [],
  debug: {
    onResolvedHit: ({ time, gameTime, occurrence, actorBuffs }) => {
      if (
        occurrence.actor.slot !== 0
        || time < 9
        || time > 12.2
      ) {
        return;
      }

      const forceBuffs = actorBuffs
        .filter((buff) => buff.id.startsWith("zhuangfangyi_force_of_nature"))
        .map((buff) => ({
          id: buff.id,
          appliedAt: Number(buff.appliedAt.toFixed(3)),
          appliedAtGameTime: Number(buff.appliedAtGameTime.toFixed(3)),
          expiresAt: Number(buff.expiresAt.toFixed(3)),
          timeScale: buff.timeScale,
        }));

      if (
        occurrence.command.id === "zhuangfangyi_ultimate_battle_skill"
        || /Thunder Strike/.test(occurrence.hit.name ?? "")
      ) {
        console.log("[debug onResolvedHit]", {
          time: Number(time.toFixed(3)),
          gameTime: Number(gameTime.toFixed(3)),
          commandId: occurrence.command.id,
          hitName: occurrence.hit.name,
          forceBuffs,
        });
      }
    },
  },
});

console.log("\n=== Timeline focus ===");
for (const entry of result.timeline) {
  if (entry.slot !== 0 || entry.time < 9 || entry.time > 12.2) {
    continue;
  }
  if (
    entry.commandId === "zhuangfangyi_ultimate_battle_skill"
    || /Thunder Strike/.test(entry.hitName)
  ) {
    console.log(JSON.stringify({
      time: Number(entry.time.toFixed(3)),
      gameTime: Number(entry.gameTime.toFixed(3)),
      commandId: entry.commandId,
      hitName: entry.hitName,
      damage: Math.round(entry.damage),
      buffs: entry.calculationContext.attackerMods.ELECTRIC_DMG_AMP_PCT,
    }));
  }
}

console.log("\n=== Passive listener focus ===");
for (const entry of result.passiveListenerDebug) {
  if (entry.time < 9 || entry.time > 12.2) {
    continue;
  }
  if (entry.ownerSlot !== 0) {
    continue;
  }
  if (
    entry.eventType === "BATTLE_SKILL_HIT"
    || entry.eventType === "ACTOR_BUFF_APPLIED"
    || entry.eventType === "WEAPON_BUFF_APPLIED"
  ) {
    console.log(JSON.stringify({
      time: Number(entry.time.toFixed(3)),
      eventType: entry.eventType,
      ownerSlot: entry.ownerSlot,
      ownerId: entry.ownerId,
      listenerKind: entry.listenerKind,
      listenerPresent: entry.listenerPresent,
      label: entry.label,
      sourceSlot: entry.sourceSlot,
      commandId: entry.commandId,
      hitName: entry.hitName,
      buffId: entry.buffId,
    }));
  }
}

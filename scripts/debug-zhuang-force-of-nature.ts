import { buildPartySnapshots, buildPartySnapshotsByVariant } from "../src/lib/combat/buildSnapshots";
import { makeEnemyModifierSnapshot, simulateRotation } from "../src/lib/combat/simulateRotation";
import { calculateEnemyStats } from "../src/lib/enemy/enemyScaling";
import { ENEMIES } from "../src/data/enemies";
import type { CharacterCombatSnapshot } from "../src/lib/combat/rotation";
import { makeDefaultExampleBuildZhuangFangyi } from "../src/stores/buildListStore";

const build = makeDefaultExampleBuildZhuangFangyi();
const currentBuildState = build.currentBuildState;
const rotationState = build.rotationState;
const scheme = rotationState.schemes.find((entry) => entry.id === rotationState.activeSchemeId) ?? rotationState.schemes[0];

if (!scheme) {
  throw new Error("active scheme not found");
}

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
if (!enemy) {
  throw new Error("enemy not found");
}

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
});

function summarizeForceOfNature(snapshotTime: number, gameTime: number, buffs: { id: string; label: string; expiresAt: number; timeScale: string; effects?: Record<string, number> }[]) {
  return {
    time: Number(snapshotTime.toFixed(3)),
    gameTime: Number(gameTime.toFixed(3)),
    count: buffs.length,
    buffs: buffs.map((buff) => ({
      id: buff.id,
      expiresAt: Number(buff.expiresAt.toFixed(3)),
      timeScale: buff.timeScale,
      electricAmp: buff.effects?.ELECTRIC_DMG_AMP_PCT ?? 0,
    })),
  };
}

console.log("=== Actor State Timeline (slot 0, 8.8s-12.4s) ===");
for (const state of result.actorStateTimeline) {
  if (state.slot !== 0 || state.time < 8.8 || state.time > 12.4) {
    continue;
  }
  const forceBuffs = state.activeBuffs.filter((buff) => buff.id.startsWith("zhuangfangyi_force_of_nature"));
  console.log(JSON.stringify(summarizeForceOfNature(state.time, state.gameTime, forceBuffs)));
}

console.log("=== Damage Timeline (slot 0, 8.8s-12.4s) ===");
for (const entry of result.timeline) {
  if (entry.slot !== 0 || entry.time < 8.8 || entry.time > 12.4) {
    continue;
  }
  if (
    entry.commandId !== "zhuangfangyi_ultimate_battle_skill"
    && !/Thunder Strike/.test(entry.hitName ?? "")
  ) {
    continue;
  }
  console.log(JSON.stringify({
    time: Number(entry.time.toFixed(3)),
    gameTime: Number(entry.gameTime.toFixed(3)),
    commandId: entry.commandId,
    hitName: entry.hitName,
    damage: Math.round(entry.damage),
    electricAmp: entry.calculationContext?.attackerMods.ELECTRIC_DMG_AMP_PCT ?? 0,
    allDmg: entry.calculationContext?.attackerMods.ALL_DMG_PCT ?? 0,
    battleSkillElectric: entry.calculationContext?.attackerMods.BATTLE_SKILL_ELECTRIC_DMG_PCT ?? 0,
  }));
}

const targetTimeline = result.timeline.filter((entry) =>
  entry.slot === 0
  && entry.time >= 8.8
  && entry.time <= 12.4
  && /Thunder Strike/.test(entry.hitName ?? ""),
);

console.log("=== Thunder Strike Snapshots ===");
for (const entry of targetTimeline) {
  const actorStatesAtTime = result.actorStateTimeline
    .filter((state) => state.slot === 0 && Math.abs(state.time - entry.time) < 0.0001)
    .map((state) => summarizeForceOfNature(
      state.time,
      state.gameTime,
      state.activeBuffs.filter((buff) => buff.id.startsWith("zhuangfangyi_force_of_nature")),
    ));
  const matchingEvents = result.events
    .filter((event) =>
      Math.abs(event.time - entry.time) < 0.0001
      && (event.sourceSlot ?? event.slot) === 0
      && (
        /BATTLE_SKILL_HIT|ACTOR_BUFF_APPLIED/.test(event.type)
        || event.commandId === "zhuangfangyi_ultimate_battle_skill"
      ),
    )
    .map((event) => ({
      time: Number(event.time.toFixed(3)),
      gameTime: Number(event.gameTime.toFixed(3)),
      type: event.type,
      commandId: event.commandId,
      hitName: event.hitName,
      buffId: event.buffId,
      label: event.label,
    }));
  const passiveDebug = result.passiveListenerDebug
    .filter((debugEntry) =>
      Math.abs(debugEntry.time - entry.time) < 0.0001
      && debugEntry.ownerSlot === 0
      && debugEntry.eventType === "BATTLE_SKILL_HIT",
    )
    .map((debugEntry) => ({
      time: Number(debugEntry.time.toFixed(3)),
      listenerKind: debugEntry.listenerKind,
      eventType: debugEntry.eventType,
      commandId: debugEntry.commandId,
      hitName: debugEntry.hitName,
      listenerPresent: debugEntry.listenerPresent,
    }));
  console.log(JSON.stringify({
    time: Number(entry.time.toFixed(3)),
    gameTime: Number(entry.gameTime.toFixed(3)),
    hitName: entry.hitName,
    damage: Math.round(entry.damage),
    electricAmp: entry.calculationContext?.attackerMods.ELECTRIC_DMG_AMP_PCT ?? 0,
    statesAtSameTime: actorStatesAtTime,
    eventsAtSameTime: matchingEvents,
    passiveDebugAtSameTime: passiveDebug,
  }));
}

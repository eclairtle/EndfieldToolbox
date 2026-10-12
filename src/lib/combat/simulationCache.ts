import { simulateRotation } from "@/lib/combat/simulateRotation";
import type {
  RotationSimulationResult,
  RotationStep,
  EnemyActionWindow,
  EnemySlotState,
  RotationSimulationCheckpoint,
  RotationSimulationInitialState,
  RotationSimulationInitialResourceState,
} from "@/lib/combat/rotation";

export type RotationSimulationArgs = Parameters<typeof simulateRotation>[0];

export type RotationSimulationCheckpointSummary = {
  chunkIndex: number;
  chunkStartTime: number;
  chunkEndTime: number;
  actionCount: number;
  hitCount: number;
  eventCount: number;
};

export type RotationSimulationInvalidation =
  | {
      kind: "exact";
      reason: "identical_inputs";
      earliestTime: null;
      checkpointChunkIndex: null;
    }
  | {
      kind: "timeline_local";
      reason: "rotation_changed" | "enemy_action_windows_changed";
      earliestTime: number;
      checkpointChunkIndex: number;
    }
  | {
      kind: "full";
      reason:
        | "no_previous_entry"
        | "party_changed"
        | "party_variants_changed"
        | "enemy_slots_changed"
        | "targeting_changed"
        | "enemy_base_changed"
        | "consumables_changed"
        | "contracts_changed"
        // Stage-owned triggers can change state from combat initialization, so no later checkpoint is valid.
        | "internal_triggers_changed"
        | "custom_triggers_changed"
        | "trigger_variables_changed";
      earliestTime: null;
      checkpointChunkIndex: null;
    };

export type RotationSimulationCacheResult = {
  result: RotationSimulationResult;
  invalidation: RotationSimulationInvalidation;
  checkpoints: RotationSimulationCheckpointSummary[];
  reusedCachedResult: boolean;
};

export type RotationSimulationRecomputeDebug = {
  invalidation: RotationSimulationInvalidation;
  recalculatedCheckpointCount: number;
  recalculatedCheckpointTimes: number[];
  reusedThroughCheckpointTime: number | null;
};

type CacheEntry = {
  args: RotationSimulationArgs;
  exactSignature: string;
  result: RotationSimulationResult;
  checkpoints: RotationSimulationCheckpointSummary[];
};

const DEFAULT_CHUNK_SECONDS = 15;

function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value == null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value) as T;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  if (value instanceof Map) {
    const cloned = new Map();
    seen.set(value, cloned);
    for (const [key, entry] of value.entries()) {
      cloned.set(deepClone(key, seen), deepClone(entry, seen));
    }
    return cloned as T;
  }
  if (value instanceof Set) {
    const cloned = new Set();
    seen.set(value, cloned);
    for (const entry of value.values()) {
      cloned.add(deepClone(entry, seen));
    }
    return cloned as T;
  }
  if (Array.isArray(value)) {
    const cloned: unknown[] = [];
    seen.set(value, cloned);
    for (const entry of value) {
      cloned.push(deepClone(entry, seen));
    }
    return cloned as T;
  }
  const cloned = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
  seen.set(value, cloned);
  for (const key of Reflect.ownKeys(value)) {
    cloned[key] = deepClone((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return cloned as T;
}

function rebaseRealTime(value: number, offset: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  return value - offset;
}

function rebaseGameTime(value: number, offset: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  return value - offset;
}

function rebaseByTimeScale(value: number, timeScale: "real" | "game", realOffset: number, gameOffset: number): number {
  return timeScale === "real"
    ? rebaseRealTime(value, realOffset)
    : rebaseGameTime(value, gameOffset);
}

function rebaseRuntimeStatuses(
  statuses: RotationSimulationCheckpoint["runtime"]["runtimeStatuses"],
  realOffset: number,
  gameOffset: number,
): RotationSimulationCheckpoint["runtime"]["runtimeStatuses"] {
  return statuses.map((status) => ({
    ...status,
    expiresAt: rebaseByTimeScale(status.expiresAt, status.timeScale, realOffset, gameOffset),
    metadata: status.metadata == null ? status.metadata : {
      ...status.metadata,
      ...(typeof status.metadata.nextTickAtGameTime === "number"
        ? { nextTickAtGameTime: rebaseGameTime(status.metadata.nextTickAtGameTime as number, gameOffset) }
        : {}),
      ...(typeof status.metadata.nextRampAtGameTime === "number"
        ? { nextRampAtGameTime: rebaseGameTime(status.metadata.nextRampAtGameTime as number, gameOffset) }
        : {}),
      ...(typeof status.metadata.nextPeriodAt === "number"
        ? { nextPeriodAt: rebaseRealTime(status.metadata.nextPeriodAt as number, realOffset) }
        : {}),
    },
  }));
}

function rebaseActiveComboWindows(
  windows: RotationSimulationCheckpoint["runtime"]["activeComboWindowBySlot"],
  gameOffset: number,
): RotationSimulationCheckpoint["runtime"]["activeComboWindowBySlot"] {
  return new Map(
    [...windows.entries()].map(([slot, window]) => [
      slot,
      {
        ...window,
        readyAt: rebaseGameTime(window.readyAt, gameOffset),
        expiresAt: rebaseGameTime(window.expiresAt, gameOffset),
        perfectTimingStartAt:
          typeof window.perfectTimingStartAt === "number"
            ? rebaseGameTime(window.perfectTimingStartAt, gameOffset)
            : undefined,
        perfectTimingEndAt:
          typeof window.perfectTimingEndAt === "number"
            ? rebaseGameTime(window.perfectTimingEndAt, gameOffset)
            : undefined,
        consumedAt:
          typeof window.consumedAt === "number"
            ? rebaseGameTime(window.consumedAt, gameOffset)
            : undefined,
      },
    ]),
  );
}

function rebaseRotationEventTime<T extends { time: number; gameTime: number }>(
  event: T,
  realOffset: number,
  gameOffset: number,
): T {
  return {
    ...event,
    time: rebaseRealTime(event.time, realOffset),
    gameTime: rebaseGameTime(event.gameTime, gameOffset),
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, entry: unknown) => {
    if (entry instanceof Map) {
      return { __type: "Map", entries: [...entry.entries()] };
    }
    if (entry instanceof Set) {
      return { __type: "Set", values: [...entry.values()] };
    }
    return entry;
  });
}

function makeGlobalSignature(args: RotationSimulationArgs): string {
  return stableStringify({
    party: args.party,
    partyVariantsBySlot: args.partyVariantsBySlot ?? {},
    initialVariantIndex: args.initialVariantIndex ?? 0,
    enemySlots: args.enemySlots ?? [],
    targetedEnemySlotId: args.targetedEnemySlotId ?? null,
    enemyId: args.enemyId,
    enemyLevel: args.enemyLevel,
    enemyStats: args.enemyStats,
    enemyMods: args.enemyMods,
    enemyStaggerGauge: args.enemyStaggerGauge,
    enemyStaggerNodes: args.enemyStaggerNodes ?? [],
    enemyStaggerRecoverySeconds: args.enemyStaggerRecoverySeconds,
    enemyFinisherMultiplier: args.enemyFinisherMultiplier ?? null,
    enemyFinisherSpGain: args.enemyFinisherSpGain ?? null,
    enemyHpBaseOverrides: args.enemyHpBaseOverrides ?? {},
    enemyStaggerOverrides: args.enemyStaggerOverrides ?? {},
    battleStartConsumableIdsBySlot: args.battleStartConsumableIdsBySlot ?? [],
    battleStartControlledOperatorSlot: args.battleStartControlledOperatorSlot ?? 0,
    contingencyContracts: args.contingencyContracts ?? [],
    internalCombatTriggerDefinitionIds: (args.internalCombatTriggerDefinitions ?? []).map((entry) => entry.trigger.id),
    customTriggers: args.customTriggers ?? [],
    customTriggerVariables: args.customTriggerVariables ?? [],
    initialState: args.initialState ?? null,
    relayStartTime: args.relayStartTime ?? null,
    relayStartGameTime: args.relayStartGameTime ?? null,
    emitRotationRelayedEvent: args.emitRotationRelayedEvent ?? false,
  });
}

function makeExactSignature(args: RotationSimulationArgs): string {
  return stableStringify({
    global: makeGlobalSignature(args),
    rotation: args.rotation,
    enemyActionWindows: args.enemyActionWindows ?? [],
  });
}

function getEarliestRotationStepDiffTime(
  previousSteps: RotationStep[],
  nextSteps: RotationStep[],
): number | null {
  const previousById = new Map(previousSteps.map((step) => [step.id, step]));
  const nextById = new Map(nextSteps.map((step) => [step.id, step]));
  let earliest = Number.POSITIVE_INFINITY;
  for (const stepId of new Set([...previousById.keys(), ...nextById.keys()])) {
    const previous = previousById.get(stepId) ?? null;
    const next = nextById.get(stepId) ?? null;
    if (stableStringify(previous) === stableStringify(next)) continue;
    earliest = Math.min(
      earliest,
      previous?.startTime ?? Number.POSITIVE_INFINITY,
      next?.startTime ?? Number.POSITIVE_INFINITY,
    );
  }
  if (Number.isFinite(earliest)) return earliest;

  // Ordering can affect same-timestamp command resolution even when the step
  // payloads themselves are unchanged.
  const previousOrder = previousSteps.map((step) => step.id);
  const nextOrder = nextSteps.map((step) => step.id);
  if (stableStringify(previousOrder) !== stableStringify(nextOrder)) {
    return Math.min(
      ...previousSteps.map((step) => step.startTime ?? Number.POSITIVE_INFINITY),
      ...nextSteps.map((step) => step.startTime ?? Number.POSITIVE_INFINITY),
      0,
    );
  }
  return null;
}

function getEarliestEnemyWindowDiffTime(
  previousWindows: EnemyActionWindow[],
  nextWindows: EnemyActionWindow[],
): number | null {
  const maxLength = Math.max(previousWindows.length, nextWindows.length);
  for (let index = 0; index < maxLength; index += 1) {
    const previous = previousWindows[index] ?? null;
    const next = nextWindows[index] ?? null;
    if (stableStringify(previous) === stableStringify(next)) {
      continue;
    }
    const previousTime = previous?.startTime ?? Number.POSITIVE_INFINITY;
    const nextTime = next?.startTime ?? Number.POSITIVE_INFINITY;
    const earliest = Math.min(previousTime, nextTime);
    return Number.isFinite(earliest) ? earliest : 0;
  }
  return null;
}

function getCheckpointChunkIndexAtTime(time: number, chunkSeconds: number): number {
  if (!(time > 0) || !(chunkSeconds > 0)) {
    return 0;
  }
  return Math.max(0, Math.floor(time / chunkSeconds));
}

function requiresFullRecomputeForEarliestTime(time: number): boolean {
  return !(time > 0);
}

function buildCheckpointSummaries(
  result: RotationSimulationResult,
  chunkSeconds: number,
): RotationSimulationCheckpointSummary[] {
  if ((result.simulationCheckpoints?.length ?? 0) > 0) {
    const actionsByStartTime = [...result.actions].sort((left, right) => left.realStartTime - right.realStartTime);
    let actionIndex = 0;
    return result.simulationCheckpoints!.map((checkpoint) => {
      while (
        actionIndex < actionsByStartTime.length
        && actionsByStartTime[actionIndex]!.realStartTime <= checkpoint.time + 0.0001
      ) {
        actionIndex += 1;
      }
      return {
        chunkIndex: checkpoint.chunkIndex,
        chunkStartTime: Math.max(0, checkpoint.chunkIndex - 1) * chunkSeconds,
        chunkEndTime: checkpoint.time,
        actionCount: checkpoint.outputCounts.timelineCount >= 0 ? actionIndex : 0,
        hitCount: checkpoint.outputCounts.timelineCount,
        eventCount: checkpoint.outputCounts.eventCount,
      };
    });
  }
  if (!(chunkSeconds > 0)) {
    return [];
  }
  const finalTime = Math.max(0, result.totalTime ?? 0);
  const chunkCount = Math.max(1, Math.ceil(finalTime / chunkSeconds));
  const summaries: RotationSimulationCheckpointSummary[] = [];
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const chunkStartTime = chunkIndex * chunkSeconds;
    const chunkEndTime = Math.min(finalTime, chunkStartTime + chunkSeconds);
    summaries.push({
      chunkIndex,
      chunkStartTime,
      chunkEndTime,
      actionCount: result.actions.filter(
        (action) => action.realStartTime < chunkEndTime + 0.0001 && action.realEndTime >= chunkStartTime - 0.0001,
      ).length,
      hitCount: result.timeline.filter(
        (entry) => entry.time >= chunkStartTime - 0.0001 && entry.time < chunkEndTime + 0.0001,
      ).length,
      eventCount: result.events.filter(
        (entry) => entry.time >= chunkStartTime - 0.0001 && entry.time < chunkEndTime + 0.0001,
      ).length,
    });
  }
  return summaries;
}

export function buildResumeOutputPrefix(
  result: RotationSimulationResult,
  checkpoint: NonNullable<RotationSimulationResult["simulationCheckpoints"]>[number],
) {
  return {
    totalDamage: checkpoint.outputCounts.totalDamage,
    riggedCritCount: checkpoint.outputCounts.riggedCritCount,
    damageBySlot: result.damageBySlot.map((entry) => ({
      slot: entry.slot,
      damage: checkpoint.runtime.damageBySlot.get(entry.slot) ?? 0,
    })),
    timeline: result.timeline.slice(0, checkpoint.outputCounts.timelineCount),
    enemyTimelineHits: result.enemyTimelineHits.slice(0, checkpoint.outputCounts.enemyTimelineHitCount),
    events: result.events.slice(0, checkpoint.outputCounts.eventCount),
    comboWindows: result.comboWindows.slice(0, checkpoint.outputCounts.comboWindowCount),
    actorStateTimeline: result.actorStateTimeline.slice(0, checkpoint.outputCounts.actorStateCount),
    enemyStateTimeline: result.enemyStateTimeline.slice(0, checkpoint.outputCounts.enemyStateCount),
    enemyLifecycleTimeline: result.enemyLifecycleTimeline.slice(0, checkpoint.outputCounts.enemyLifecycleCount),
    enemyTargetTimeline: result.enemyTargetTimeline.slice(0, checkpoint.outputCounts.enemyTargetCount),
    countdownTimeline: result.countdownTimeline.slice(0, checkpoint.outputCounts.countdownCount),
    relayTimeline: result.relayTimeline.slice(0, checkpoint.outputCounts.relayCount),
    enemyTransitionTimeline: result.enemyTransitionTimeline.slice(0, checkpoint.outputCounts.enemyTransitionCount),
    comboTriggerDebug: result.comboTriggerDebug.slice(0, checkpoint.outputCounts.comboTriggerDebugCount),
    passiveListenerDebug: result.passiveListenerDebug.slice(0, checkpoint.outputCounts.passiveListenerDebugCount),
    statusChangeLog: result.statusChangeLog.slice(0, checkpoint.outputCounts.statusChangeLogCount),
    simulationCheckpoints: (result.simulationCheckpoints ?? []).filter((entry) => entry.time <= checkpoint.time + 0.0001),
    warnings: [...(result.warnings ?? [])],
    actionRuntimeByStepId: result.actions
      .filter((action) => action.realStartTime <= checkpoint.time + 0.0001)
      .map((action) => ({
        stepId: action.stepId,
        resolvedComboCooldownSeconds: action.resolvedComboCooldownSeconds,
        nullified: action.nullified === true,
        interrupted: action.interrupted === true,
      })),
  };
}

/**
 * Relay rotations inherit runtime through buildInitialStateFromCheckpoint, but
 * their displayed timelines use a fresh local time axis. Only cumulative
 * counters may cross that boundary; carrying lifecycle/state/event history
 * would replay old records at the new rotation's matching local timestamps.
 */
export function buildRelayCumulativeOutputPrefix(
  result: RotationSimulationResult,
  checkpoint: NonNullable<RotationSimulationResult["simulationCheckpoints"]>[number],
) {
  return {
    totalDamage: checkpoint.outputCounts.totalDamage,
    riggedCritCount: checkpoint.outputCounts.riggedCritCount,
    damageBySlot: result.damageBySlot.map((entry) => ({
      slot: entry.slot,
      damage: checkpoint.runtime.damageBySlot.get(entry.slot) ?? 0,
    })),
    timeline: [],
    enemyTimelineHits: [],
    events: [],
    comboWindows: [],
    actorStateTimeline: [],
    enemyStateTimeline: [],
    enemyLifecycleTimeline: [],
    enemyTargetTimeline: [],
    countdownTimeline: [],
    relayTimeline: [],
    enemyTransitionTimeline: [],
    comboTriggerDebug: [],
    passiveListenerDebug: [],
    statusChangeLog: [],
    simulationCheckpoints: [],
    warnings: [],
    actionRuntimeByStepId: [],
  };
}

export function buildInitialStateFromCheckpoint(
  checkpoint: RotationSimulationCheckpoint,
  relayTime = checkpoint.time,
  relayGameTime = checkpoint.gameTime,
  displayTimeOffset = relayTime,
  displayGameTimeOffset = relayGameTime,
  initialResources?: RotationSimulationInitialResourceState,
): RotationSimulationInitialState {
  const runtime = deepClone(checkpoint.runtime);
  const checkpointResources: RotationSimulationInitialResourceState = {
    teamSpGenerated: runtime.teamSpGenerated ?? 0,
    teamSpReturned: runtime.teamSpReturned ?? 0,
    spRegenRate: runtime.spRegenRate ?? 8,
    energyBySlot: deepClone(runtime.energyBySlot ?? new Map()),
    energyMaxBySlot: deepClone(runtime.energyMaxBySlot ?? new Map()),
  };
  return {
    startTime: 0,
    startGameTime: 0,
    displayTimeOffset,
    displayGameTimeOffset,
    initialResources: initialResources ?? checkpointResources,
    sequences: deepClone(checkpoint.sequences),
    runtime: {
      ...runtime,
      timedEnemyDebuffs: runtime.timedEnemyDebuffs.map((debuff) => ({
        ...debuff,
        expiresAt: rebaseByTimeScale(debuff.expiresAt, debuff.timeScale, relayTime, relayGameTime),
      })),
      runtimeStatuses: rebaseRuntimeStatuses(runtime.runtimeStatuses, relayTime, relayGameTime),
      comboCooldownUntilBySlot: new Map(
        [...runtime.comboCooldownUntilBySlot.entries()].map(([slot, time]) => [slot, rebaseRealTime(time, relayTime)]),
      ),
      comboCooldownPauseIntervalsBySlot: new Map(
        [...runtime.comboCooldownPauseIntervalsBySlot.entries()].map(([slot, intervals]) => [
          slot,
          intervals.map((interval) => ({
            startTime: rebaseRealTime(interval.startTime, relayTime),
            endTime: rebaseRealTime(interval.endTime, relayTime),
          })),
        ]),
      ),
      activeComboWindowBySlot: rebaseActiveComboWindows(runtime.activeComboWindowBySlot, relayGameTime),
      lastComboTriggerTimeBySlot: new Map(
        [...runtime.lastComboTriggerTimeBySlot.entries()].map(([slot, time]) => [slot, rebaseRealTime(time, relayTime)]),
      ),
      listenerCooldowns: new Map(
        [...runtime.listenerCooldowns.entries()].map(([key, cooldown]) => [
          key,
          {
            ...cooldown,
            expiresAt: rebaseByTimeScale(cooldown.expiresAt, cooldown.timeScale, relayTime, relayGameTime),
          },
        ]),
      ),
      timedContractDamageModifiers: runtime.timedContractDamageModifiers.map((modifier) => ({
        ...modifier,
        expiresAt: rebaseByTimeScale(modifier.expiresAt, modifier.timeScale, relayTime, relayGameTime),
      })),
      interruptedAtByStepId: new Map(
        [...runtime.interruptedAtByStepId.entries()].map(([stepId, time]) => [stepId, rebaseRealTime(time, relayTime)]),
      ),
      pendingArtsBursts: runtime.pendingArtsBursts.map((burst) => ({
        ...burst,
        executeGameTime: rebaseGameTime(burst.executeGameTime, relayGameTime),
      })),
      pendingExecuteHits: runtime.pendingExecuteHits.map((hit) => ({
        ...hit,
        executionTime: rebaseRealTime(hit.executionTime, relayTime),
        executionGameTime: rebaseGameTime(hit.executionGameTime, relayGameTime),
        registerTime: rebaseRealTime(hit.registerTime, relayTime),
        registerGameTime: rebaseGameTime(hit.registerGameTime, relayGameTime),
      })),
      pendingTriggerResumes: runtime.pendingTriggerResumes.map((resume) => ({
        ...resume,
        event: rebaseRotationEventTime(resume.event, relayTime, relayGameTime),
        executionTime: rebaseRealTime(resume.executionTime, relayTime),
        executionGameTime: rebaseGameTime(resume.executionGameTime, relayGameTime),
      })),
      pendingEnemyListenerWindowEnds: runtime.pendingEnemyListenerWindowEnds.map((entry) => ({
        ...entry,
        executionTime: rebaseRealTime(entry.executionTime, relayTime),
        executionGameTime: rebaseGameTime(entry.executionGameTime, relayGameTime),
      })),
      triggerExecutionBlockedUntil: rebaseRealTime(runtime.triggerExecutionBlockedUntil, relayTime),
      recentTriggerExecutionTimes: runtime.recentTriggerExecutionTimes.map((time) => rebaseRealTime(time, relayTime)),
      switchBackLockedUntilBySlot: new Map(
        [...runtime.switchBackLockedUntilBySlot.entries()].map(([slot, time]) => [slot, rebaseRealTime(time, relayTime)]),
      ),
      enemyRuntimeBySlot: new Map(
        [...runtime.enemyRuntimeBySlot.entries()].map(([slotId, enemyRuntime]) => [
          slotId,
          {
            ...enemyRuntime,
            spawnTime: rebaseRealTime(enemyRuntime.spawnTime, relayTime),
            deadAt: typeof enemyRuntime.deadAt === "number" ? rebaseRealTime(enemyRuntime.deadAt, relayTime) : undefined,
            staggerLastUpdateTime: rebaseRealTime(enemyRuntime.staggerLastUpdateTime, relayTime),
          },
        ]),
      ),
      enemyHpHistoryBySlot: new Map(
        [...runtime.enemyHpHistoryBySlot.entries()].map(([slotId, history]) => [
          slotId,
          history.map((entry) => ({
            ...entry,
            time: rebaseRealTime(entry.time, relayTime),
          })),
        ]),
      ),
      enemyHpDeltaHistoryBySlot: new Map(
        [...runtime.enemyHpDeltaHistoryBySlot.entries()].map(([slotId, history]) => [
          slotId,
          history.map((entry) => ({
            ...entry,
            time: rebaseRealTime(entry.time, relayTime),
          })),
        ]),
      ),
    },
  };
}

function analyzeInvalidation(
  previousArgs: RotationSimulationArgs | null,
  nextArgs: RotationSimulationArgs,
  chunkSeconds: number,
): RotationSimulationInvalidation {
  if (!previousArgs) {
    return {
      kind: "full",
      reason: "no_previous_entry",
      earliestTime: null,
      checkpointChunkIndex: null,
    };
  }

  if (makeGlobalSignature(previousArgs) !== makeGlobalSignature(nextArgs)) {
    const previousChecks: Array<{
      reason: Extract<RotationSimulationInvalidation, { kind: "full" }>["reason"];
      previous: unknown;
      next: unknown;
    }> = [
      { reason: "party_changed", previous: previousArgs.party, next: nextArgs.party },
      { reason: "party_variants_changed", previous: previousArgs.partyVariantsBySlot ?? {}, next: nextArgs.partyVariantsBySlot ?? {} },
      { reason: "enemy_slots_changed", previous: previousArgs.enemySlots ?? [], next: nextArgs.enemySlots ?? [] },
      { reason: "targeting_changed", previous: previousArgs.targetedEnemySlotId ?? null, next: nextArgs.targetedEnemySlotId ?? null },
      {
        reason: "enemy_base_changed",
        previous: {
          enemyId: previousArgs.enemyId,
          enemyLevel: previousArgs.enemyLevel,
          enemyStats: previousArgs.enemyStats,
          enemyMods: previousArgs.enemyMods,
          enemyStaggerGauge: previousArgs.enemyStaggerGauge,
          enemyStaggerNodes: previousArgs.enemyStaggerNodes ?? [],
          enemyStaggerRecoverySeconds: previousArgs.enemyStaggerRecoverySeconds,
          enemyFinisherMultiplier: previousArgs.enemyFinisherMultiplier ?? null,
          enemyFinisherSpGain: previousArgs.enemyFinisherSpGain ?? null,
          enemyStaggerOverrides: previousArgs.enemyStaggerOverrides ?? {},
        },
        next: {
          enemyId: nextArgs.enemyId,
          enemyLevel: nextArgs.enemyLevel,
          enemyStats: nextArgs.enemyStats,
          enemyMods: nextArgs.enemyMods,
          enemyStaggerGauge: nextArgs.enemyStaggerGauge,
          enemyStaggerNodes: nextArgs.enemyStaggerNodes ?? [],
          enemyStaggerRecoverySeconds: nextArgs.enemyStaggerRecoverySeconds,
          enemyFinisherMultiplier: nextArgs.enemyFinisherMultiplier ?? null,
          enemyFinisherSpGain: nextArgs.enemyFinisherSpGain ?? null,
          enemyStaggerOverrides: nextArgs.enemyStaggerOverrides ?? {},
        },
      },
      { reason: "consumables_changed", previous: previousArgs.battleStartConsumableIdsBySlot ?? [], next: nextArgs.battleStartConsumableIdsBySlot ?? [] },
      { reason: "contracts_changed", previous: previousArgs.contingencyContracts ?? [], next: nextArgs.contingencyContracts ?? [] },
      {
        reason: "internal_triggers_changed",
        previous: (previousArgs.internalCombatTriggerDefinitions ?? []).map((entry) => entry.trigger.id),
        next: (nextArgs.internalCombatTriggerDefinitions ?? []).map((entry) => entry.trigger.id),
      },
      { reason: "custom_triggers_changed", previous: previousArgs.customTriggers ?? [], next: nextArgs.customTriggers ?? [] },
      { reason: "trigger_variables_changed", previous: previousArgs.customTriggerVariables ?? [], next: nextArgs.customTriggerVariables ?? [] },
    ];
    const match = previousChecks.find((entry) => stableStringify(entry.previous) !== stableStringify(entry.next));
    return {
      kind: "full",
      reason: match?.reason ?? "party_changed",
      earliestTime: null,
      checkpointChunkIndex: null,
    };
  }

  const rotationDiffTime = getEarliestRotationStepDiffTime(
    previousArgs.rotation.steps ?? [],
    nextArgs.rotation.steps ?? [],
  );
  if (rotationDiffTime != null || stableStringify(previousArgs.rotation.groups ?? []) !== stableStringify(nextArgs.rotation.groups ?? [])) {
    const earliestTime = rotationDiffTime ?? 0;
    if (requiresFullRecomputeForEarliestTime(earliestTime)) {
      return {
        kind: "full",
        reason: "party_changed",
        earliestTime: null,
        checkpointChunkIndex: null,
      };
    }
    return {
      kind: "timeline_local",
      reason: "rotation_changed",
      earliestTime,
      checkpointChunkIndex: getCheckpointChunkIndexAtTime(earliestTime, chunkSeconds),
    };
  }

  const enemyWindowDiffTime = getEarliestEnemyWindowDiffTime(
    previousArgs.enemyActionWindows ?? [],
    nextArgs.enemyActionWindows ?? [],
  );
  if (enemyWindowDiffTime != null) {
    if (requiresFullRecomputeForEarliestTime(enemyWindowDiffTime)) {
      return {
        kind: "full",
        reason: "enemy_base_changed",
        earliestTime: null,
        checkpointChunkIndex: null,
      };
    }
    return {
      kind: "timeline_local",
      reason: "enemy_action_windows_changed",
      earliestTime: enemyWindowDiffTime,
      checkpointChunkIndex: getCheckpointChunkIndexAtTime(enemyWindowDiffTime, chunkSeconds),
    };
  }

  return {
    kind: "exact",
    reason: "identical_inputs",
    earliestTime: null,
    checkpointChunkIndex: null,
  };
}

export function createRotationSimulationCache(options?: {
  chunkSeconds?: number;
  onRecompute?: (debug: RotationSimulationRecomputeDebug) => void;
}) {
  const chunkSeconds = options?.chunkSeconds ?? DEFAULT_CHUNK_SECONDS;
  let previousEntry: CacheEntry | null = null;

  const simulate = (args: RotationSimulationArgs): RotationSimulationCacheResult => {
    const invalidation = analyzeInvalidation(previousEntry?.args ?? null, args, chunkSeconds);
    const exactSignature = makeExactSignature(args);

    if (previousEntry && previousEntry.exactSignature === exactSignature) {
      return {
        result: previousEntry.result,
        invalidation,
        checkpoints: previousEntry.checkpoints,
        reusedCachedResult: true,
      };
    }

    let result: RotationSimulationResult;
    let reusedThroughCheckpointTime: number | null = null;
    let reusedCheckpointCount = 0;
    if (
      previousEntry
      && invalidation.kind === "timeline_local"
      && (previousEntry.result.simulationCheckpoints?.length ?? 0) > 0
    ) {
      const checkpoint = [...(previousEntry.result.simulationCheckpoints ?? [])]
        .filter((entry) => entry.time < invalidation.earliestTime - 0.0001)
        .sort((left, right) => right.time - left.time)[0];
      if (checkpoint) {
        reusedThroughCheckpointTime = checkpoint.time;
        reusedCheckpointCount = (previousEntry.result.simulationCheckpoints ?? [])
          .filter((entry) => entry.time <= checkpoint.time + 0.0001)
          .length;
        result = simulateRotation({
          ...args,
          resumeFromCheckpoint: checkpoint,
          resumeOutputPrefix: buildResumeOutputPrefix(previousEntry.result, checkpoint),
        });
      } else {
        result = simulateRotation(args);
      }
    } else {
      result = simulateRotation(args);
    }
    const checkpoints = buildCheckpointSummaries(result, chunkSeconds);
    const recalculatedCheckpoints = (result.simulationCheckpoints ?? []).slice(reusedCheckpointCount);
    options?.onRecompute?.({
      invalidation,
      recalculatedCheckpointCount: recalculatedCheckpoints.length,
      recalculatedCheckpointTimes: recalculatedCheckpoints.map((checkpoint) => checkpoint.time),
      reusedThroughCheckpointTime,
    });
    previousEntry = {
      args: deepClone(args),
      exactSignature,
      result,
      checkpoints,
    };
    return {
      result,
      invalidation,
      checkpoints,
      reusedCachedResult: false,
    };
  };

  const clear = () => {
    previousEntry = null;
  };

  return {
    simulate,
    clear,
  };
}

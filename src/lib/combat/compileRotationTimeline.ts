import type { ResolvedCommandAtLevel } from "@/lib/commands";
import type {
  CharacterCombatSnapshot,
  CompiledRotationAction,
  Rotation,
  RotationTimeExtension,
} from "@/lib/combat/rotation";

type TimelineActionInput = {
  stepId: string;
  slot: CharacterCombatSnapshot["slot"];
  characterName: string;
  command: ResolvedCommandAtLevel;
  realStartTime: number;
};

type CancelCategory =
  | "basic_sequence"
  | "battle_skill"
  | "combo_skill"
  | "ultimate"
  | "dive_attack"
  | "finisher"
  | "switch"
  | "dodge"
  | "jump"
  | "other";

type PreparedTimelineAction = TimelineActionInput & {
  resolvedRealStartTime: number;
  canceledAt?: number;
};

function round(value: number, factor: number = 1000): number {
  return Math.round(value * factor) / factor;
}

export class RotationTimeContext {
  constructor(private readonly extensions: RotationTimeExtension[]) {}

  toGameTime(realTime: number): number {
    for (const ext of this.extensions) {
      const freezeRealStart = ext.time;
      const freezeRealEnd = ext.time + ext.amount;

      if (realTime >= freezeRealStart && realTime < freezeRealEnd) {
        return ext.gameTime;
      }

      if (realTime < freezeRealStart) {
        return realTime - ext.cumulativeFreezeTime;
      }
    }

    const last = this.extensions[this.extensions.length - 1];
    if (!last) {
      return realTime;
    }

    return realTime - (last.cumulativeFreezeTime + last.amount);
  }

  getShiftedEndTime(startTime: number, duration: number, excludeStepId: string | null = null): number {
    let endTime = round(startTime + duration);
    let stable = false;
    let iterations = 0;

    while (!stable && iterations < 20) {
      iterations += 1;
      let pausedWithinInterval = 0;

      for (const ext of this.extensions) {
        const sourceIds = ext.sourceStepIds ?? ext.sourceStepId.split(",");
        if (excludeStepId && sourceIds.includes(excludeStepId)) {
          continue;
        }

        const extStart = ext.time;
        const extEnd = ext.time + ext.amount;
        const overlapStart = Math.max(startTime, extStart);
        const overlapEnd = Math.min(endTime, extEnd);

        if (overlapEnd > overlapStart) {
          pausedWithinInterval += overlapEnd - overlapStart;
        }
      }

      const nextEndTime = round(startTime + duration + pausedWithinInterval);
      stable = Math.abs(nextEndTime - endTime) < 0.0001;
      endTime = nextEndTime;
    }

    return endTime;
  }
}

function getCancelCategory(command: ResolvedCommandAtLevel): CancelCategory {
  if (command.genericActionType === "switch") return "switch";
  if (command.genericActionType === "dodge") return "dodge";
  if (command.genericActionType === "jump") return "jump";
  if (command.attackType === "ULTIMATE") return "ultimate";
  if (command.basicAttackVariant === "dive_attack") return "dive_attack";
  if (command.basicAttackVariant === "final_strike") return "finisher";
  if (command.attackType === "COMBO_SKILL") return "combo_skill";
  if (command.attackType === "BATTLE_SKILL") return "battle_skill";
  if (command.attackType === "BASIC_ATTACK") return "basic_sequence";
  return "other";
}

function isUncancellable(command: ResolvedCommandAtLevel): boolean {
  const category = getCancelCategory(command);
  return (
    category === "jump" ||
    category === "dive_attack" ||
    category === "ultimate" ||
    category === "finisher" ||
    category === "switch"
  );
}

function canCancel(later: ResolvedCommandAtLevel, earlier: ResolvedCommandAtLevel): boolean {
  const laterCategory = getCancelCategory(later);
  const earlierCategory = getCancelCategory(earlier);

  if (laterCategory === earlierCategory) {
    return false;
  }

  if (isUncancellable(earlier)) {
    return false;
  }

  if (laterCategory === "ultimate") {
    return true;
  }

  if (earlierCategory === "basic_sequence") {
    return laterCategory !== "basic_sequence";
  }

  if (earlierCategory === "battle_skill") {
    return laterCategory === "combo_skill" || laterCategory === "switch" || laterCategory === "dodge";
  }

  if (earlierCategory === "combo_skill") {
    return laterCategory === "switch" || laterCategory === "dodge";
  }

  if (earlierCategory === "dodge") {
    return laterCategory === "jump" || laterCategory === "combo_skill";
  }

  return false;
}

function buildTimelineInputs(rotation: Rotation, party: CharacterCombatSnapshot[]): TimelineActionInput[] {
  const partyBySlot = new Map(party.map((member) => [member.slot, member]));
  const actions: TimelineActionInput[] = [];
  const currentRealTimeBySlot = new Map<CharacterCombatSnapshot["slot"], number>();
  const usedSwitchFrames = new Set<number>();

  for (const step of rotation.steps) {
    const actor = partyBySlot.get(step.slot);
    if (!actor) {
      continue;
    }

    const command = actor.commands.find((candidate) => candidate.id === step.commandId);
    if (!command) {
      continue;
    }

    const slotCursor = currentRealTimeBySlot.get(step.slot) ?? 0;
    let realStartTime = step.startTime ?? slotCursor;

    if (command.genericActionType === "switch") {
      let frame = Math.round(realStartTime * 60);
      while (usedSwitchFrames.has(frame)) {
        frame += 1;
      }
      usedSwitchFrames.add(frame);
      realStartTime = frame / 60;
    }

    actions.push({
      stepId: step.id,
      slot: step.slot,
      characterName: actor.characterName,
      command,
      realStartTime: round(realStartTime),
    });

    currentRealTimeBySlot.set(step.slot, round(Math.max(slotCursor, realStartTime) + command.durationFrames / 60));
  }

  return actions;
}

function calculateTimeExtensions(actions: TimelineActionInput[]): RotationTimeExtension[] {
  const freezeSources = actions
    .filter((action) => action.command.timeFreezeSeconds > 0)
    .map((action) => ({
      start: round(action.realStartTime),
      end: round(action.realStartTime + action.command.timeFreezeSeconds),
      stepId: action.stepId,
      cutscene: action.command.cutscene,
    }));

  const boundaries = Array.from(
    new Set(
      freezeSources.flatMap((source) => [source.start, source.end]),
    ),
  ).sort((a, b) => a - b);

  const out: RotationTimeExtension[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]!;
    const segmentEnd = boundaries[index + 1]!;
    const coveringSources = freezeSources.filter(
      (source) => source.start <= segmentStart && source.end >= segmentEnd,
    );

    if (coveringSources.length === 0 || segmentEnd <= segmentStart) {
      continue;
    }

    const previous = out[out.length - 1];
    const cumulativeFreezeTime = previous
      ? round(previous.cumulativeFreezeTime + previous.amount)
      : 0;

    const sourceStepIds = coveringSources.map((source) => source.stepId);
    out.push({
      time: segmentStart,
      gameTime: round(segmentStart - cumulativeFreezeTime),
      amount: round(segmentEnd - segmentStart),
      sourceStepId: sourceStepIds.join(","),
      sourceStepIds,
      cumulativeFreezeTime,
      cutscene: coveringSources.some((source) => source.cutscene),
    });
  }

  return out;
}

function calculatePreparedTimeExtensions(actions: PreparedTimelineAction[]): RotationTimeExtension[] {
  const freezeSources = actions
    .map((action) => {
      const freezeDuration = Math.max(
        0,
        Math.min(
          action.command.timeFreezeSeconds,
          (action.canceledAt ?? Number.POSITIVE_INFINITY) - action.resolvedRealStartTime,
        ),
      );

      return {
        start: round(action.resolvedRealStartTime),
        end: round(action.resolvedRealStartTime + freezeDuration),
        stepId: action.stepId,
        cutscene: action.command.cutscene,
      };
    })
    .filter((source) => source.end > source.start);

  const boundaries = Array.from(new Set(freezeSources.flatMap((source) => [source.start, source.end]))).sort(
    (a, b) => a - b,
  );

  const out: RotationTimeExtension[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]!;
    const segmentEnd = boundaries[index + 1]!;
    const coveringSources = freezeSources.filter(
      (source) => source.start <= segmentStart && source.end >= segmentEnd,
    );

    if (coveringSources.length === 0 || segmentEnd <= segmentStart) {
      continue;
    }

    const previous = out[out.length - 1];
    const cumulativeFreezeTime = previous
      ? round(previous.cumulativeFreezeTime + previous.amount)
      : 0;

    const sourceStepIds = coveringSources.map((source) => source.stepId);
    out.push({
      time: segmentStart,
      gameTime: round(segmentStart - cumulativeFreezeTime),
      amount: round(segmentEnd - segmentStart),
      sourceStepId: sourceStepIds.join(","),
      sourceStepIds,
      cumulativeFreezeTime,
      cutscene: coveringSources.some((source) => source.cutscene),
    });
  }

  return out;
}

function clampToCutsceneEnd(realStartTime: number, timeExtensions: RotationTimeExtension[], excludeStepId: string): number {
  let currentStart = realStartTime;
  let changed = true;

  while (changed) {
    changed = false;

    for (const ext of timeExtensions) {
      const sourceIds = ext.sourceStepIds ?? ext.sourceStepId.split(",");
      if (!ext.cutscene || sourceIds.includes(excludeStepId)) {
        continue;
      }

      const extEnd = ext.time + ext.amount;
      if (currentStart >= ext.time && currentStart < extEnd) {
        currentStart = extEnd;
        changed = true;
      }
    }
  }

  return round(currentStart);
}

function resolveAction(
  action: PreparedTimelineAction,
  timeContext: RotationTimeContext,
  timeExtensions: RotationTimeExtension[],
): CompiledRotationAction {
  const rawRealStartTime = clampToCutsceneEnd(action.resolvedRealStartTime, timeExtensions, action.stepId);
  const naturalRealEndTime = timeContext.getShiftedEndTime(
    rawRealStartTime,
    action.command.durationFrames / 60,
    action.stepId,
  );
  const realEndTime = round(Math.min(naturalRealEndTime, action.canceledAt ?? Number.POSITIVE_INFINITY));

  return {
    stepId: action.stepId,
    slot: action.slot,
    characterName: action.characterName,
    commandId: action.command.id,
    commandName: action.command.name,
    startTime: timeContext.toGameTime(rawRealStartTime),
    endTime: timeContext.toGameTime(realEndTime),
    realStartTime: rawRealStartTime,
    realEndTime,
    timeFreezeSeconds: action.command.timeFreezeSeconds,
    cutscene: action.command.cutscene,
  };
}

function prepareActions(
  actionInputs: TimelineActionInput[],
  provisionalTimeContext: RotationTimeContext,
  provisionalExtensions: RotationTimeExtension[],
): PreparedTimelineAction[] {
  const prepared = actionInputs.map((action) => ({
    ...action,
    resolvedRealStartTime: round(clampToCutsceneEnd(action.realStartTime, provisionalExtensions, action.stepId)),
    canceledAt: undefined as number | undefined,
  }));

  const preparedBySlot = new Map<CharacterCombatSnapshot["slot"], PreparedTimelineAction[]>();
  for (const action of prepared) {
    const slotActions = preparedBySlot.get(action.slot) ?? [];
    slotActions.push(action);
    preparedBySlot.set(action.slot, slotActions);
  }

  for (const slotActions of preparedBySlot.values()) {
    slotActions.sort((a, b) => {
      if (a.resolvedRealStartTime !== b.resolvedRealStartTime) {
        return a.resolvedRealStartTime - b.resolvedRealStartTime;
      }

      return actionInputs.findIndex((entry) => entry.stepId === a.stepId)
        - actionInputs.findIndex((entry) => entry.stepId === b.stepId);
    });

    let active: PreparedTimelineAction | null = null;

    for (const current of slotActions) {
      if (!active) {
        active = current;
        continue;
      }

      const activeEnd = round(
        Math.min(
          provisionalTimeContext.getShiftedEndTime(
            active.resolvedRealStartTime,
            active.command.durationFrames / 60,
            active.stepId,
          ),
          active.canceledAt ?? Number.POSITIVE_INFINITY,
        ),
      );

      if (current.resolvedRealStartTime < activeEnd - 0.001) {
        if (canCancel(current.command, active.command)) {
          active.canceledAt = current.resolvedRealStartTime;
        } else {
          current.resolvedRealStartTime = activeEnd;
        }
      }

      if (current.command.genericActionType === "switch") {
        current.resolvedRealStartTime = round(Math.round(current.resolvedRealStartTime * 60) / 60);
      }

      active = current;
    }
  }

  const usedSwitchFrames = new Set<number>();
  for (const action of [...prepared].sort((a, b) => a.resolvedRealStartTime - b.resolvedRealStartTime)) {
    if (action.command.genericActionType !== "switch") {
      continue;
    }

    let frame = Math.round(action.resolvedRealStartTime * 60);
    while (usedSwitchFrames.has(frame)) {
      frame += 1;
    }
    usedSwitchFrames.add(frame);
    action.resolvedRealStartTime = frame / 60;
  }

  return prepared;
}

export function compileRotationTimeline(args: {
  rotation: Rotation;
  party: CharacterCombatSnapshot[];
}): {
  actions: CompiledRotationAction[];
  timeExtensions: RotationTimeExtension[];
  timeContext: RotationTimeContext;
} {
  const actionInputs = buildTimelineInputs(args.rotation, args.party);
  const provisionalExtensions = calculateTimeExtensions(actionInputs);
  const provisionalTimeContext = new RotationTimeContext(provisionalExtensions);
  const preparedActions = prepareActions(actionInputs, provisionalTimeContext, provisionalExtensions);
  const timeExtensions = calculatePreparedTimeExtensions(preparedActions);
  const timeContext = new RotationTimeContext(timeExtensions);

  const actions = preparedActions.map((action) =>
    resolveAction(action, timeContext, timeExtensions),
  );

  return {
    actions,
    timeExtensions,
    timeContext,
  };
}

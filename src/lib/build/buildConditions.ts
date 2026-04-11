import type { AscensionStage } from "@/lib/build/progression";
import type { PotentialLevel } from "@/lib/build/progression";

export type EliteStage = 0 | 1 | 2 | 3 | 4;

export type BuildCondition = {
  minEliteStage?: EliteStage;
  minPotentialLevel?: PotentialLevel;
  requiresUniqueTalentsEnabled?: string[];
  requiresUniqueTalentsDisabled?: string[];
};

export type BuildConditionState = {
  ascensionStage: AscensionStage;
  potentialLevel?: PotentialLevel;
  uniqueTalentToggles: Record<string, boolean>;
  uniqueTalentConditions?: Record<string, BuildCondition | undefined>;
  uniqueTalentDefaults?: Record<string, boolean | undefined>;
};

export function getEliteStage(ascensionStage: AscensionStage): EliteStage {
  return ascensionStage;
}

function isUniqueTalentEnabledInternal(
  key: string,
  state: BuildConditionState,
  path: Set<string>,
): boolean {
  if (path.has(key)) {
    return false;
  }

  const isEnabled = state.uniqueTalentToggles[key] === true || state.uniqueTalentDefaults?.[key] === true;
  if (!isEnabled) {
    return false;
  }

  const condition = state.uniqueTalentConditions?.[key];
  if (!condition) {
    return true;
  }

  const nextPath = new Set(path);
  nextPath.add(key);
  return isBuildConditionMet(condition, state, nextPath);
}

export function isUniqueTalentEnabled(
  key: string,
  state: BuildConditionState,
): boolean {
  return isUniqueTalentEnabledInternal(key, state, new Set());
}

export function isBuildConditionMet(
  condition: BuildCondition | undefined,
  state: BuildConditionState,
  path: Set<string> = new Set(),
): boolean {
  if (!condition) {
    return true;
  }

  if ((condition.minEliteStage ?? 0) > getEliteStage(state.ascensionStage)) {
    return false;
  }

  if ((condition.minPotentialLevel ?? 0) > (state.potentialLevel ?? 0)) {
    return false;
  }

  for (const key of condition.requiresUniqueTalentsEnabled ?? []) {
    if (!isUniqueTalentEnabledInternal(key, state, path)) {
      return false;
    }
  }

  for (const key of condition.requiresUniqueTalentsDisabled ?? []) {
    if (isUniqueTalentEnabledInternal(key, state, path)) {
      return false;
    }
  }

  return true;
}

import type { ExecuteHitCritRigOption } from "@/lib/commands";
import type { CritRigMode, CritRiggingRule } from "@/lib/combat/rotation";

export function buildCritRigHitKey(
  stepId: string,
  hitIndex: number,
  repeatIndex: number,
  executeCritRigId?: string,
) {
  return `${stepId}:${hitIndex}:${repeatIndex}:${executeCritRigId ?? ""}`;
}

export function getCritRigModeFromRules(
  rules: CritRiggingRule[],
  args: {
    stepId: string;
    hitIndex: number;
    repeatIndex: number;
    executeCritRigId?: string;
  },
): CritRigMode | undefined {
  const critRigModeByHitKey = new Map<string, CritRigMode>();
  for (const rule of rules) {
    if (rule.enabled === false) {
      continue;
    }
    critRigModeByHitKey.set(
      buildCritRigHitKey(rule.stepId, rule.hitIndex, rule.repeatIndex, rule.executeCritRigId),
      rule.mode,
    );
  }

  return critRigModeByHitKey.get(
    buildCritRigHitKey(args.stepId, args.hitIndex, args.repeatIndex, args.executeCritRigId),
  ) ?? (
    args.executeCritRigId
      ? critRigModeByHitKey.get(buildCritRigHitKey(args.stepId, args.hitIndex, args.repeatIndex))
      : undefined
  );
}

export function createCritRigModeResolver(rules: CritRiggingRule[]) {
  const enabledRules = rules.filter((rule) => rule.enabled !== false);
  const critRigModeByHitKey = new Map<string, CritRigMode>();
  for (const rule of enabledRules) {
    critRigModeByHitKey.set(
      buildCritRigHitKey(rule.stepId, rule.hitIndex, rule.repeatIndex, rule.executeCritRigId),
      rule.mode,
    );
  }

  return (
    stepId: string,
    hitIndex: number,
    repeatIndex: number,
    executeCritRigId?: string,
  ): CritRigMode | undefined => (
    critRigModeByHitKey.get(buildCritRigHitKey(stepId, hitIndex, repeatIndex, executeCritRigId))
    ?? (
      executeCritRigId
        ? critRigModeByHitKey.get(buildCritRigHitKey(stepId, hitIndex, repeatIndex))
        : undefined
    )
  );
}

export function resolveExecuteCritRigId(
  options: ExecuteHitCritRigOption[] | undefined,
  args: {
    hitRefId?: string;
    hitName?: string;
  },
) {
  return options?.find((option) =>
    (option.hitRefIds?.includes(args.hitRefId ?? "") ?? false)
    || (option.hitNames?.includes(args.hitName ?? "") ?? false)
  )?.id;
}

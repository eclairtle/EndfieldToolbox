import type { CombatUnit } from "@/lib/combat";
import type { CombatContext } from "@/lib/combat";
import {
  applyStatus,
  findFirstStatusByAlias,
  type StatusDefinition,
} from "./status";

import type { ElementType } from "@/data/characters";

type InflictionPayload = {
  element: ElementType;
};

function makeArtsInfliction(element: ElementType): StatusDefinition {
  return {
    id: `${element.toLowerCase()}_infliction`,
    alias: "arts_infliction",
    stacking: "REFRESH_STACKS",
    maxStacks: 4,
    duration: 20,
  };
}

function triggerArtsBurst(
  ctx: CombatContext,
  target: CombatUnit,
  element: ElementType,
  level: number,
  sourceId?: string,
) {
  ctx.events.push({
    type: "DAMAGE",
    label: `${element} Burst`,
    sourceId,
    targetId: target.id,
    damageType: element,
    multiplier: 0.5 * level, // placeholder
  });
}

function makeCombustion(level: 1 | 2 | 3 | 4, durationSeconds = 10): StatusDefinition {
  return {
    id: `combustion_lv${level}`,
    alias: "combustion",
    stacking: "REPLACE",
    duration: durationSeconds,
    tickInterval: 1,
    onTick(ctx, target) {
      ctx.events.push({
        type: "DAMAGE",
        label: "Combustion",
        targetId: target.id,
        damageType: "HEAT",
        multiplier: 0.2 * level,
      });
    },
  };
}

function makeElectrification(level: 1 | 2 | 3 | 4): StatusDefinition {
  const dmgTakenValues = [0.2, 0.3, 0.4, 0.5] as const;
  const durations = [12, 18, 24, 30] as const;

  return {
    id: `electrification_lv${level}`,
    alias: "electrification",
    stacking: "REPLACE",
    duration: durations[level - 1]!,
    modifiers: {
      DMG_TAKEN_PCT: dmgTakenValues[level - 1],
    },
    onApply(ctx, target) {
      ctx.events.push({
        type: "DAMAGE",
        label: "Electrification",
        targetId: target.id,
        damageType: "ELECTRIC",
        multiplier: 1.0 * level,
      });
    },
  };
}

function makeCorrosion(level: 1 | 2 | 3 | 4): StatusDefinition {
  return {
    id: `corrosion_lv${level}`,
    alias: "corrosion",
    stacking: "REPLACE",
    duration: 15,
    tickInterval: 1,
    onApply(ctx, target, status) {
      ctx.events.push({
        type: "DAMAGE",
        label: "Corrosion",
        targetId: target.id,
        damageType: "NATURE",
        multiplier: 0.5 * level,
      });

      status.payload = {
        elapsedSeconds: 0,
      };
    },
    onTick(_ctx, _target, status) {
      const elapsed = Number(status.payload?.elapsedSeconds ?? 0) + 1;
      status.payload = {
        ...status.payload,
        elapsedSeconds: elapsed,
      };

      const reduction = ((1 + level) * elapsed) / 100;

      status.def.modifiers = {
        PHYSICAL_RESIST_PCT: 0,
        HEAT_RESIST_PCT: -reduction,
        CRYO_RESIST_PCT: -reduction,
        ELECTRIC_RESIST_PCT: -reduction,
        NATURE_RESIST_PCT: -reduction,
        AETHER_RESIST_PCT: 0,
      };
    },
    onExpire(_ctx, _target, status) {
      status.def.modifiers = undefined;
    },
  };
}

function makeSolidification(level: 1 | 2 | 3 | 4): StatusDefinition {
  const durations = [6, 7, 8, 9] as const;

  return {
    id: `solidification_lv${level}`,
    alias: "solidification",
    stacking: "REPLACE",
    duration: durations[level - 1]!,
    onApply(ctx, target) {
      ctx.events.push({
        type: "DAMAGE",
        label: "Solidification",
        targetId: target.id,
        damageType: "CRYO",
        multiplier: 1.0 * level,
      });
    },
  };
}

function triggerArtsReaction(
  ctx: CombatContext,
  target: CombatUnit,
  applied: ElementType,
  consumedStacks: number,
  sourceId?: string,
) {
  const level = Math.max(1, Math.min(4, consumedStacks)) as 1 | 2 | 3 | 4;

  switch (applied) {
    case "Heat":
      applyStatus({
        ctx,
        target,
        def: makeCombustion(level),
        sourceId,
      });
      return;

    case "Electric":
      applyStatus({
        ctx,
        target,
        def: makeElectrification(level),
        sourceId,
      });
      return;

    case "Nature":
      applyStatus({
        ctx,
        target,
        def: makeCorrosion(level),
        sourceId,
      });
      return;

    case "Cryo":
      applyStatus({
        ctx,
        target,
        def: makeSolidification(level),
        sourceId,
      });
      return;
  }
}

export function applyArtsInfliction(args: {
  ctx: CombatContext;
  target: CombatUnit;
  element: ElementType;
  sourceId?: string;
}) {
  const { ctx, target, element, sourceId } = args;

  const existing = findFirstStatusByAlias(target, "arts_infliction");

  if (!existing) {
    applyStatus({
      ctx,
      target,
      def: makeArtsInfliction(element),
      sourceId,
      payload: { element } satisfies InflictionPayload,
    });
    return;
  }

  const currentElement = existing.payload?.element as ElementType | undefined;
  const currentStacks = existing.stacks;

  if (currentElement === element) {
    const refreshed = applyStatus({
      ctx,
      target,
      def: makeArtsInfliction(element),
      sourceId,
      payload: { element } satisfies InflictionPayload,
    });

    const burstLevel = refreshed?.stacks ?? Math.min(4, currentStacks + 1);
    triggerArtsBurst(ctx, target, element, burstLevel, sourceId);
    return;
  }

  // different element present: consume old infliction and trigger reaction
  target.statuses = target.statuses.filter((s) => s.uid !== existing.uid);
  triggerArtsReaction(ctx, target, element, currentStacks, sourceId);
}

export function applySpecialLaevatainCombustion(args: {
  ctx: CombatContext;
  target: CombatUnit;
  reactionLevel: 1 | 2 | 3 | 4;
  sourceId?: string;
}) {
  const { ctx, target, reactionLevel, sourceId } = args;

  applyStatus({
    ctx,
    target,
    def: makeCombustion(reactionLevel, 5),
    sourceId,
  });
}
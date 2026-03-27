import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { CombatContext, CombatUnit } from "./combat";
import type { EnemyInstance } from "@/data/enemies";

export type StatusModifiers = Partial<ModifierStats>;

export type StatusStackingRule =
  | "REFRESH_STACKS"      // one status instance, stack count increases, duration resets
  | "INDEPENDENT_STACKS"  // each application creates its own timed instance
  | "REPLACE"             // replace existing same alias with new one
  | "IGNORE_WHEN_PRESENT" // if present, do nothing
  | "REFRESH_ONLY";       // do not increase stacks, only refresh duration


export type StatusDefinition = {
  id: string;
  alias: string; // statuses with same alias interact for refresh/replace
  stacking: StatusStackingRule;

  maxStacks?: number;
  duration: number;
  tickInterval?: number | null;

  modifiers?: StatusModifiers;

  onApply?: (ctx: CombatContext, target: CombatUnit, status: AppliedStatus) => void;
  onRefresh?: (ctx: CombatContext, target: CombatUnit, status: AppliedStatus) => void;
  onExpire?: (ctx: CombatContext, target: CombatUnit, status: AppliedStatus) => void;
  onTick?: (ctx: CombatContext, target: CombatUnit, status: AppliedStatus) => void;
};

export type AppliedStatus = {
  uid: string;           // unique runtime id
  def: StatusDefinition; // definition
  stacks: number;
  remaining: number;
  nextTick: number | null;
  source?: string;
  payload?: Record<string, unknown>;
};

let statusUidCounter = 0;

function makeAppliedStatus(
  def: StatusDefinition,
  source?: string,
  payload?: Record<string, unknown>,
): AppliedStatus {
  return {
    uid: `status_${++statusUidCounter}`,
    def,
    stacks: 1,
    remaining: def.duration,
    nextTick: def.tickInterval != null ? def.tickInterval : null,
    source,
    payload,
  };
}

function findStatusesByAlias(
  statuses: AppliedStatus[],
  alias: string,
): AppliedStatus[] {
  return statuses.filter((s) => s.def.alias === alias);
}

export function applyStatus(args: {
  ctx: CombatContext;
  target: CombatUnit;
  def: StatusDefinition;
  sourceId?: string;
  payload?: Record<string, unknown>;
}) {
  const { ctx, target, def, sourceId, payload } = args;
  const existing = findStatusesByAlias(target.statuses, def.alias);

  switch (def.stacking) {
    case "REFRESH_STACKS": {
      const current = existing[0];

      if (!current) {
        const next = makeAppliedStatus(def, sourceId, payload);
        target.statuses.push(next);
        def.onApply?.(ctx, target, next);
        ctx.events.push({
          type: "STATUS_APPLIED",
          label: def.id,
          targetId: target.id,
        });
        return next;
      }

      current.stacks = Math.min(def.maxStacks ?? 1, current.stacks + 1);
      current.remaining = def.duration;
      current.nextTick = def.tickInterval != null ? def.tickInterval : null;
      current.payload = payload ?? current.payload;

      current.def.onRefresh?.(ctx, target, current);
      return current;
    }

    case "INDEPENDENT_STACKS": {
      const currentCount = existing.length;
      const maxStacks = def.maxStacks ?? Infinity;
      if (currentCount >= maxStacks) return undefined;

      const next = makeAppliedStatus(def, sourceId, payload);
      target.statuses.push(next);
      def.onApply?.(ctx, target, next);
      ctx.events.push({
        type: "STATUS_APPLIED",
        label: def.id,
        targetId: target.id,
      });
      return next;
    }

    case "REPLACE": {
      for (const s of existing) {
        s.def.onExpire?.(ctx, target, s);
      }
      if (existing.length > 0) {
        ctx.events.push({
          type: "STATUS_EXPIRED",
          label: def.alias,
          targetId: target.id,
        });
      }

      target.statuses = target.statuses.filter((s) => s.def.alias !== def.alias);

      const next = makeAppliedStatus(def, sourceId, payload);
      target.statuses.push(next);
      def.onApply?.(ctx, target, next);
      ctx.events.push({
        type: "STATUS_APPLIED",
        label: def.id,
        targetId: target.id,
      });
      return next;
    }

    case "IGNORE_WHEN_PRESENT": {
      if (existing.length > 0) return undefined;

      const next = makeAppliedStatus(def, sourceId, payload);
      target.statuses.push(next);
      def.onApply?.(ctx, target, next);
      ctx.events.push({
        type: "STATUS_APPLIED",
        label: def.id,
        targetId: target.id,
      });
      return next;
    }

    case "REFRESH_ONLY": {
      const current = existing[0];

      if (!current) {
        const next = makeAppliedStatus(def, sourceId, payload);
        target.statuses.push(next);
        def.onApply?.(ctx, target, next);
        ctx.events.push({
          type: "STATUS_APPLIED",
          label: def.id,
          targetId: target.id,
        });
        return next;
      }

      current.remaining = def.duration;
      current.nextTick = def.tickInterval != null ? def.tickInterval : null;
      current.payload = payload ?? current.payload;

      current.def.onRefresh?.(ctx, target, current);
      return current;
    }
  }
}

export function resolveUnitModifiers(
  baseModifiers: ModifierStats,
  statuses: AppliedStatus[],
): ModifierStats {
  const out: ModifierStats = { ...baseModifiers };

  for (const status of statuses) {
    const mods = status.def.modifiers;
    if (!mods) continue;

    for (const [key, value] of Object.entries(mods)) {
      if (value == null) continue;
      out[key as ModifierStatKey] += value * status.stacks;
    }
  }

  return out;
}

export function findFirstStatusByAlias(
  unit: CombatUnit,
  alias: string,
): AppliedStatus | undefined {
  return unit.statuses.find((s) => s.def.alias === alias);
}

function advanceStatusesForUnit(ctx: CombatContext, unit: CombatUnit, dt: number) {
  for (const status of unit.statuses) {
    status.remaining -= dt;

    if (status.def.tickInterval != null && status.nextTick != null) {
      while (status.remaining > 0 && status.nextTick <= 0) {
        status.def.onTick?.(ctx, unit, status);
        status.nextTick += status.def.tickInterval;
      }
      status.nextTick -= dt;
    }
  }

  const expired = unit.statuses.filter((s) => s.remaining <= 0);

  for (const status of expired) {
    status.def.onExpire?.(ctx, unit, status);
    ctx.events.push({
      type: "STATUS_EXPIRED",
      label: status.def.id,
      targetId: unit.id,
    });
  }

  unit.statuses = unit.statuses.filter((s) => s.remaining > 0);
}

export function advanceCombatTime(ctx: CombatContext, dt: number) {
  ctx.time += dt;

  for (const unit of ctx.players) {
    advanceStatusesForUnit(ctx, unit, dt);
  }
  for (const unit of ctx.enemies) {
    advanceStatusesForUnit(ctx, unit, dt);
  }
}
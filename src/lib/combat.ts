import type { EnemyInstance } from "@/data/enemies";
import type { ModifierStats } from "@/lib/build/stats";
import type { AppliedStatus } from "./status";

export type CombatContext = {
  time: number;

  players: CombatUnit[];
  enemies: CombatUnit[];

  events: CombatEvent[];
};

export type CombatEvent = {
  type: string;
  label: string;
  sourceId?: string;
  targetId: string;
  damageType?: string;
  multiplier?: number;
};

export type CombatSide = "PLAYER" | "ENEMY";

export type CombatUnit = {
  id: string;
  name: string;
  side: CombatSide;

  hp: number;
  maxHp: number;

  modifiers: ModifierStats;
  statuses: AppliedStatus[];
};

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
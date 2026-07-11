import type { EnemySlotId, PartySlot } from "@/lib/combat/rotation";
import type { TimeScale } from "@/lib/commands";

export type UnifiedStatusScope = "enemy" | "actor" | "team" | "global";

export type UnifiedStatusKind =
  | "reaction_status"
  | "effect_status"
  | "team_status"
  | "link_status"
  | "actor_buff"
  | "infliction"
  | "special_stack";

export type UnifiedCombatStatus = {
  instanceId: string;
  id: string;
  label: string;
  scope: UnifiedStatusScope;
  kind: UnifiedStatusKind;
  expiresAt: number;
  timeScale: TimeScale;
  ownerSlot?: PartySlot;
  targetSlot?: PartySlot;
  enemySlotId?: EnemySlotId;
  stacks?: number;
  hidden?: boolean;
  fieldStatus?: boolean;
  metadata?: Record<string, unknown>;
};

export type UnifiedStatusChangeType =
  | "added"
  | "removed"
  | "refreshed"
  | "expired"
  | "replaced"
  | "stack_changed"
  | "updated";

export type UnifiedStatusChangeLogEntry = {
  sequence: number;
  time: number;
  gameTime: number;
  stepId?: string;
  changeType: UnifiedStatusChangeType;
  reason: string;
  status: UnifiedCombatStatus;
  previousStatus?: UnifiedCombatStatus;
};

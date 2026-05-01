import type { PartySlot } from "@/lib/combat/rotation";
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
  id: string;
  label: string;
  scope: UnifiedStatusScope;
  kind: UnifiedStatusKind;
  expiresAt: number;
  timeScale: TimeScale;
  ownerSlot?: PartySlot;
  targetSlot?: PartySlot;
  stacks?: number;
  hidden?: boolean;
  metadata?: Record<string, unknown>;
};

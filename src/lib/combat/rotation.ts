import type { ModifierStats } from "@/lib/build/stats";
import type { EnemyResolvedStats } from "@/lib/enemy/enemyScaling";
import type { ResolvedCommandAtLevel } from "@/lib/commands";
import type { ElementType } from "@/data/characters";

export type PartySlot = 0 | 1 | 2 | 3;

export type RotationStep = {
  id: string;
  slot: PartySlot;
  commandId: string;
  label?: string;
};

export type Rotation = {
  steps: RotationStep[];
};

export type CharacterCombatSnapshot = {
  slot: PartySlot;
  characterId: string;
  characterName: string;

  finalAtk: number;
  mods: ModifierStats;

  commands: ResolvedCommandAtLevel[];
};

export type DamageTimelineEntry = {
  time: number;
  stepId: string;
  slot: PartySlot;
  characterName: string;
  commandId: string;
  commandName: string;
  hitIndex: number;
  hitName?: string;

  damageType: ElementType;

  multiplier: number;
  damage: number;
};

export type RotationSimulationResult = {
  totalDamage: number;
  totalTime: number;
  timeline: DamageTimelineEntry[];
};
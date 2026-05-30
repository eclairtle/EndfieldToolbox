import type { TimeScale } from "@/lib/commands";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { ResolvedCommandHitAtLevel } from "@/lib/commands";
import type { CommandHitEffectDefinition } from "@/lib/commands";
import type { CharacterClass } from "@/data/characters";

export type CombatHookCharacterRef = {
  slot: 0 | 1 | 2 | 3;
  characterId: string;
  characterName: string;
};

export type CombatHookEnemyArtsInflictionState = {
  element: "Heat" | "Cryo" | "Electric" | "Nature";
  stacks: number;
  expiresAtGameTime: number;
};

export type CombatResolvedHitHookContext = {
  self: CombatHookCharacterRef;
  time: number;
  gameTime: number;
  stepId: string;
  source: {
    slot: 0 | 1 | 2 | 3;
    characterId: string;
    characterName: string;
    commandId: string;
    commandName: string;
    hitIndex: number;
    hitName?: string;
    isControlledOperatorHit: boolean;
  };
  flags: {
    isFinalStrikeOfBasicSequence: boolean;
    isFinisherHit: boolean;
  };
  state: {
    getEnemyArtsInfliction(): CombatHookEnemyArtsInflictionState | null;
    getEnemyVulnerabilityStacks(): number;
    setEnemyArtsInfliction(value: CombatHookEnemyArtsInflictionState | null): void;
    hasEnemyStatus(statusId: string): boolean;
    hasStatus(args: { statusId: string; target?: "enemy" | "self" | "global" }): boolean;
    getStatusSourceStepId(args: { statusId: string; target?: "enemy" | "self" | "global" }): string | null;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    getSelfMeltingFlameStacks(): number;
    gainSelfMeltingFlameStacks(stacks: number, label?: string): void;
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    getSelfAttr(attr: "STR" | "AGI" | "INT" | "WIL"): number;
    getSelfCommandHit(commandId: string, hitIndex: number): ResolvedCommandHitAtLevel | null;
    applySelfBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      infiniteDuration?: boolean;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
    }): void;
    applyOtherTeammatesBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      infiniteDuration?: boolean;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      classes?: CharacterClass[];
    }): void;
    applyEnemyDebuff(args: {
      debuffId: string;
      label: string;
      stat: ModifierStatKey;
      value: number;
      durationSeconds: number;
      timeScale?: TimeScale;
    }): void;
    gainTeamLinkStacks(args: {
      stacks: number;
      durationSeconds: number;
      timeScale?: TimeScale;
      label?: string;
    }): void;
    gainTeamStatusStacks(args: {
      statusId: string;
      label: string;
      stacks: number;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      durationSeconds: number;
      timeScale?: TimeScale;
    }): number;
    consumeTeamStatusStacks(args: {
      statusId: string;
      stacks: number;
    }): { consumed: number; remaining: number };
    getTeamStatusStackCount(statusId: string): number;
    applyCommandHitHealing(args: {
      commandId: string;
      hitIndex: number;
      target?: "controlled" | "self";
      label?: string;
    }): number;
    grantReturnedSp(amount: number, label: string): void;
    markTriggerOnce(key: string): boolean;
    repeatCurrentHitOnce(key: string): boolean;
    triggerSelfCombo(args?: {
      label?: string;
      sourceEventType?: string;
      comboCommandId?: string;
    }): boolean;
    emitEvent(event: {
      type: string;
      label: string;
      target?: "enemy";
      stackDelta?: number;
      durationSeconds?: number;
      timeScale?: TimeScale;
    }): void;
    applyEffects(args: { effects: CommandHitEffectDefinition[]; stepId?: string }): void;
    shortenSelfComboCooldownByRatio(ratio: number): void;
  };
};

export type CombatActionStartHookContext = {
  self: CombatHookCharacterRef;
  time: number;
  gameTime: number;
  stepId: string;
    source: {
      slot: 0 | 1 | 2 | 3;
      characterId: string;
      characterName: string;
      commandId: string;
      commandName: string;
      attackType: "BASIC_ATTACK" | "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE" | "TALENT" | "GENERIC";
    };
  state: {
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    resetSelfComboCooldown(): void;
    shortenSelfComboCooldownByRatio(ratio: number): void;
  };
};

export type CombatEventHookContext = {
  self: CombatHookCharacterRef;
  event: {
    type: string;
    time: number;
    gameTime: number;
    stepId?: string;
    commandId?: string;
    commandName?: string;
    slot?: 0 | 1 | 2 | 3;
    sourceSlot?: 0 | 1 | 2 | 3;
    label: string;
    commandAttackType?: "BASIC_ATTACK" | "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE" | "TALENT" | "REACTION" | "GENERIC";
    amount?: number;
    consumedElement?: "Heat" | "Cryo" | "Electric" | "Nature";
    consumedStacks?: number;
  };
  state: {
    getEnemyArtsInfliction(): CombatHookEnemyArtsInflictionState | null;
    getEnemyVulnerabilityStacks(): number;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    getSelfCommandHit(commandId: string, hitIndex: number): ResolvedCommandHitAtLevel | null;
    applySelfBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      infiniteDuration?: boolean;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
    }): void;
    applyOtherTeammatesBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      infiniteDuration?: boolean;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      classes?: CharacterClass[];
    }): void;
    applyBuffToSlot(args: {
      slot: 0 | 1 | 2 | 3;
      buffId: string;
      label: string;
      durationSeconds: number;
      infiniteDuration?: boolean;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
    }): void;
    gainTeamLinkStacks(args: {
      stacks: number;
      durationSeconds: number;
      timeScale?: TimeScale;
      label?: string;
    }): void;
    gainTeamStatusStacks(args: {
      statusId: string;
      label: string;
      stacks: number;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      durationSeconds: number;
      timeScale?: TimeScale;
    }): number;
    consumeTeamStatusStacks(args: {
      statusId: string;
      stacks: number;
    }): { consumed: number; remaining: number };
    getTeamStatusStackCount(statusId: string): number;
    applyCommandHitHealing(args: {
      commandId: string;
      hitIndex: number;
      target?: "controlled" | "self";
      label?: string;
    }): number;
    grantReturnedSp(amount: number, label: string): void;
    markTriggerOnce(key: string): boolean;
    triggerSelfCombo(args?: {
      label?: string;
      sourceEventType?: string;
      comboCommandId?: string;
    }): boolean;
    resetSelfComboCooldown(): void;
    shortenSelfComboCooldownByRatio(ratio: number): void;
    hasStatus(args: { statusId: string; target?: "enemy" | "self" | "global" }): boolean;
    getStatusSourceStepId(args: { statusId: string; target?: "enemy" | "self" | "global" }): string | null;
    emitEvent(event: {
      type: string;
      label: string;
      target?: "enemy";
      stackDelta?: number;
      durationSeconds?: number;
      timeScale?: TimeScale;
    }): void;
    applyEffects(args: { effects: CommandHitEffectDefinition[]; stepId?: string }): void;
  };
};

export type CharacterCombatHooks = {
  onResolvedHit?: (ctx: CombatResolvedHitHookContext) => void;
  onActionStart?: (ctx: CombatActionStartHookContext) => void;
  onEvent?: (ctx: CombatEventHookContext) => void;
};

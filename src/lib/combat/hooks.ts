import type { TimeScale } from "@/lib/commands";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { ResolvedCommandHitAtLevel } from "@/lib/commands";
import type { CommandHitEffectDefinition } from "@/lib/commands";
import type { CharacterClass } from "@/data/characters";
import type { CombatEffectTree } from "@/lib/combat/effectTree";
import type { EnemySlotId, RotationCombatEvent } from "@/lib/combat/rotation";

export type CombatHookEnemySelector = "primary" | "targeted";
export type CombatHookEnemyRef =
  | EnemySlotId
  | {
    enemy?: CombatHookEnemySelector;
    enemySlotId?: EnemySlotId;
  };

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
  effectTree?: CombatEffectTree;
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
  enemySlotId?: EnemySlotId;
  affectedEnemySlotIds: EnemySlotId[];
  flags: {
    isFinalStrikeOfBasicSequence: boolean;
    isFinisherHit: boolean;
    dealsDamage: boolean;
  };
  state: {
    getPrimaryEnemySlotId(): EnemySlotId | null;
    getActiveEnemySlotIds(): EnemySlotId[];
    getAffectedEnemySlotIds(): EnemySlotId[];
    getEnemyArtsInfliction(enemyRef?: CombatHookEnemyRef): CombatHookEnemyArtsInflictionState | null;
    getEnemyHpRatio(enemyRef?: CombatHookEnemyRef): number;
    getEnemyVulnerabilityStacks(enemyRef?: CombatHookEnemyRef): number;
    setEnemyArtsInfliction(value: CombatHookEnemyArtsInflictionState | null, enemyRef?: CombatHookEnemyRef): void;
    hasEnemyStatus(statusId: string, enemyRef?: CombatHookEnemyRef): boolean;
    hasStatus(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): boolean;
    getStatusSourceStepId(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): string | null;
    getStatusRemainingSeconds(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    getStatusStackCount(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    getActorStatusStackCount(args: {
      slot: 0 | 1 | 2 | 3;
      statusId: string;
    }): number;
    consumeEnemyStatusStacks(args: {
      statusId: string;
      maxConsumed: number;
      useLevelAsStacks?: boolean;
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    getSelfBuffRemainingSeconds(buffId: string): number;
    getSelfMeltingFlameStacks(): number;
    gainSelfMeltingFlameStacks(stacks: number, label?: string): void;
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    getSelfAttr(attr: "STR" | "AGI" | "INT" | "WIL"): number;
    getActorModifierValue(args: {
      slot: 0 | 1 | 2 | 3;
      stat: ModifierStatKey;
    }): number;
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
    clearTeamCryoDebuffs(): void;
    applyCommandHitHealing(args: {
      commandId: string;
      hitIndex: number;
      target?: "controlled" | "self";
      label?: string;
    }): number;
    restoreHpToSlot(args: {
      slot: 0 | 1 | 2 | 3;
      baseAmount: number;
      label?: string;
    }): number;
    applyStatusToSlot(args: {
      slot: 0 | 1 | 2 | 3;
      statusId: string;
      label?: string;
      effects?: Partial<ModifierStats>;
      blocksOperatorArtsInflictionElements?: Array<"Heat" | "Cryo" | "Electric" | "Nature">;
      durationSeconds: number;
      timeScale?: TimeScale;
      hidden?: boolean;
      stacks?: number;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      independentStacks?: boolean;
      pauseStatusIds?: string[];
      periods?: number;
      maxPeriods?: number;
      initialEffects?: CommandHitEffectDefinition[];
      periodicEffects?: CommandHitEffectDefinition[];
      expireEffects?: CommandHitEffectDefinition[];
      removeEffects?: CommandHitEffectDefinition[];
    }): void;
    grantReturnedSp(amount: number, label: string): void;
    grantGeneratedSp(amount: number, label: string): void;
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
    applyEffects(args: { effects: CommandHitEffectDefinition[]; stepId?: string; effectTree?: CombatEffectTree }): void;
    applyEffectsToEnemySlot(args: {
      enemySlotId: EnemySlotId;
      effects: CommandHitEffectDefinition[];
      stepId?: string;
      effectTree?: CombatEffectTree;
    }): void;
    shortenSelfComboCooldownByRatio(ratio: number): void;
    pauseTeamComboCooldowns(args: { durationSeconds: number }): void;
  };
};

export type CombatActionStartHookContext = {
  self: CombatHookCharacterRef;
  time: number;
  gameTime: number;
  stepId: string;
  effectTree?: CombatEffectTree;
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
    pauseTeamComboCooldowns(args: { durationSeconds: number }): void;
  };
};

export type CombatEventHookContext = {
  self: CombatHookCharacterRef;
  event: {
    type: string;
    time: number;
    gameTime: number;
    effectTree?: CombatEffectTree;
    stepId?: string;
    enemySlotId?: EnemySlotId;
    affectedEnemySlotIds?: EnemySlotId[];
    commandId?: string;
    commandName?: string;
    hitName?: string;
    dealsDamage?: boolean;
    slot?: 0 | 1 | 2 | 3;
    sourceSlot?: 0 | 1 | 2 | 3;
    label: string;
    commandAttackType?: "BASIC_ATTACK" | "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE" | "TALENT" | "REACTION" | "GENERIC";
    amount?: number;
    consumedElement?: "Heat" | "Cryo" | "Electric" | "Nature";
    consumedStacks?: number;
    enemyHpRatio?: number;
    enemyHadOriginiumCrystal?: boolean;
    enemyHadPhysicalSusceptibility?: boolean;
    enemyWasStaggered?: boolean;
    forcedReaction?: boolean;
  };
  state: {
    getPrimaryEnemySlotId(): EnemySlotId | null;
    getActiveEnemySlotIds(): EnemySlotId[];
    getAffectedEnemySlotIds(): EnemySlotId[];
    getEnemyArtsInfliction(enemyRef?: CombatHookEnemyRef): CombatHookEnemyArtsInflictionState | null;
    getEnemyHpRatio(enemyRef?: CombatHookEnemyRef): number;
    getEnemyVulnerabilityStacks(enemyRef?: CombatHookEnemyRef): number;
    getActorModifierValue(args: {
      slot: 0 | 1 | 2 | 3;
      stat: ModifierStatKey;
    }): number;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    getSelfBuffRemainingSeconds(buffId: string): number;
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
    clearTeamCryoDebuffs(): void;
    applyCommandHitHealing(args: {
      commandId: string;
      hitIndex: number;
      target?: "controlled" | "self";
      label?: string;
    }): number;
    restoreHpToSlot(args: {
      slot: 0 | 1 | 2 | 3;
      baseAmount: number;
      label?: string;
    }): number;
    applyStatusToSlot(args: {
      slot: 0 | 1 | 2 | 3;
      statusId: string;
      label?: string;
      effects?: Partial<ModifierStats>;
      blocksOperatorArtsInflictionElements?: Array<"Heat" | "Cryo" | "Electric" | "Nature">;
      durationSeconds: number;
      timeScale?: TimeScale;
      hidden?: boolean;
      stacks?: number;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      independentStacks?: boolean;
      pauseStatusIds?: string[];
      periods?: number;
      maxPeriods?: number;
      initialEffects?: CommandHitEffectDefinition[];
      periodicEffects?: CommandHitEffectDefinition[];
      expireEffects?: CommandHitEffectDefinition[];
      removeEffects?: CommandHitEffectDefinition[];
    }): void;
    grantReturnedSp(amount: number, label: string): void;
    grantGeneratedSp(amount: number, label: string): void;
    markTriggerOnce(key: string): boolean;
    triggerSelfCombo(args?: {
      label?: string;
      sourceEventType?: string;
      comboCommandId?: string;
    }): boolean;
    resetSelfComboCooldown(): void;
    shortenSelfComboCooldownByRatio(ratio: number): void;
    pauseTeamComboCooldowns(args: { durationSeconds: number }): void;
    hasStatus(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): boolean;
    getStatusSourceStepId(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): string | null;
    getStatusRemainingSeconds(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    getStatusStackCount(args: {
      statusId: string;
      target?: "enemy" | "self" | "global" | "field";
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    getActorStatusStackCount(args: {
      slot: 0 | 1 | 2 | 3;
      statusId: string;
    }): number;
    consumeEnemyStatusStacks(args: {
      statusId: string;
      maxConsumed: number;
      useLevelAsStacks?: boolean;
      enemy?: CombatHookEnemySelector;
      enemySlotId?: EnemySlotId;
    }): number;
    emitEvent(event: {
      type: string;
      label: string;
      target?: "enemy";
      stackDelta?: number;
      durationSeconds?: number;
      timeScale?: TimeScale;
    }): void;
    applyEffects(args: { effects: CommandHitEffectDefinition[]; stepId?: string; effectTree?: CombatEffectTree }): void;
    applyEffectsToEnemySlot(args: {
      enemySlotId: EnemySlotId;
      effects: CommandHitEffectDefinition[];
      stepId?: string;
      effectTree?: CombatEffectTree;
    }): void;
  };
};

export type CharacterCombatHooks = {
  eventTypes?: readonly RotationCombatEvent["type"][];
  onResolvedHit?: (ctx: CombatResolvedHitHookContext) => void;
  onActionStart?: (ctx: CombatActionStartHookContext) => void;
  onEvent?: (ctx: CombatEventHookContext) => void;
};

import type { TimeScale } from "@/lib/commands";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { ResolvedCommandHitAtLevel } from "@/lib/commands";
import type { CommandHitEffectDefinition } from "@/lib/commands";
import type { CharacterClass } from "@/data/characters";
import type { CombatEffectTree } from "@/lib/combat/effectTree";

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
  flags: {
    isFinalStrikeOfBasicSequence: boolean;
    isFinisherHit: boolean;
    dealsDamage: boolean;
  };
  state: {
    getEnemyArtsInfliction(): CombatHookEnemyArtsInflictionState | null;
    getEnemyHpRatio(): number;
    getEnemyVulnerabilityStacks(): number;
    setEnemyArtsInfliction(value: CombatHookEnemyArtsInflictionState | null): void;
    hasEnemyStatus(statusId: string): boolean;
    hasStatus(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): boolean;
    getStatusSourceStepId(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): string | null;
    getStatusStackCount(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): number;
    consumeEnemyStatusStacks(args: {
      statusId: string;
      maxConsumed: number;
      useLevelAsStacks?: boolean;
    }): number;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    getSelfBuffRemainingSeconds(buffId: string): number;
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
    applyEffects(args: { effects: CommandHitEffectDefinition[]; stepId?: string; effectTree?: CombatEffectTree }): void;
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
  };
  state: {
    getEnemyArtsInfliction(): CombatHookEnemyArtsInflictionState | null;
    getEnemyHpRatio(): number;
    getEnemyVulnerabilityStacks(): number;
    hasSelfBuff(buffId: string): boolean;
    getSelfBuffStackCount(buffId: string): number;
    getSelfBuffRemainingSeconds(buffId: string): number;
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
    pauseTeamComboCooldowns(args: { durationSeconds: number }): void;
    hasStatus(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): boolean;
    getStatusSourceStepId(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): string | null;
    getStatusStackCount(args: { statusId: string; target?: "enemy" | "self" | "global" | "field" }): number;
    consumeEnemyStatusStacks(args: {
      statusId: string;
      maxConsumed: number;
      useLevelAsStacks?: boolean;
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
  };
};

export type CharacterCombatHooks = {
  onResolvedHit?: (ctx: CombatResolvedHitHookContext) => void;
  onActionStart?: (ctx: CombatActionStartHookContext) => void;
  onEvent?: (ctx: CombatEventHookContext) => void;
};

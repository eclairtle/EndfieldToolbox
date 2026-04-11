import type { TimeScale } from "@/lib/commands";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";

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
    setEnemyArtsInfliction(value: CombatHookEnemyArtsInflictionState | null): void;
    hasEnemyStatus(statusId: string): boolean;
    hasSelfBuff(buffId: string): boolean;
    getSelfMeltingFlameStacks(): number;
    gainSelfMeltingFlameStacks(stacks: number, label?: string): void;
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    applySelfBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
    }): void;
    applyOtherTeammatesBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
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
    grantReturnedSp(amount: number, label: string): void;
    markTriggerOnce(key: string): boolean;
    repeatCurrentHitOnce(key: string): boolean;
    triggerSelfCombo(args?: {
      label?: string;
      sourceEventType?: string;
    }): boolean;
    emitEvent(event: {
      type: string;
      label: string;
      target?: "enemy";
      stackDelta?: number;
      durationSeconds?: number;
      timeScale?: TimeScale;
    }): void;
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
    attackType: "BASIC_ATTACK" | "BATTLE_SKILL" | "COMBO_SKILL" | "ULTIMATE" | "GENERIC";
  };
  state: {
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    resetSelfComboCooldown(): void;
  };
};

export type CombatEventHookContext = {
  self: CombatHookCharacterRef;
  event: {
    type: string;
    time: number;
    gameTime: number;
    stepId?: string;
    slot?: 0 | 1 | 2 | 3;
    sourceSlot?: 0 | 1 | 2 | 3;
    label: string;
  };
  state: {
    hasSelfBuff(buffId: string): boolean;
    isSelfUniqueTalentEnabled(key: string): boolean;
    isSelfPotentialActive(level: number): boolean;
    applySelfBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
    }): void;
    applyOtherTeammatesBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: TimeScale;
      effects?: Partial<ModifierStats>;
      hidden?: boolean;
      stackGroup?: string;
      maxStacks?: number;
    }): void;
    gainTeamLinkStacks(args: {
      stacks: number;
      durationSeconds: number;
      timeScale?: TimeScale;
      label?: string;
    }): void;
    markTriggerOnce(key: string): boolean;
    triggerSelfCombo(args?: {
      label?: string;
      sourceEventType?: string;
    }): boolean;
    resetSelfComboCooldown(): void;
  };
};

export type CharacterCombatHooks = {
  onResolvedHit?: (ctx: CombatResolvedHitHookContext) => void;
  onActionStart?: (ctx: CombatActionStartHookContext) => void;
  onEvent?: (ctx: CombatEventHookContext) => void;
};

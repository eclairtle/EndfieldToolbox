import type { CharacterBuildSlot } from "@/stores/buildStore";
import { CHARACTERS } from "@/data/characters";
import { WEAPONS } from "@/data/weapons";
import { GEARS } from "@/data/gears";
import { computeFinalStats } from "@/lib/build/stats";
import {
  applyCommandModifierStats,
  resolveCommandsAtLevel,
  resolveExecuteHitsAtLevel,
  type ResolvedCommandAtLevel,
  type ResolvedExecuteHitAtLevel,
} from "@/lib/commands";
import type { CharacterCombatSnapshot, PartySlot } from "@/lib/combat/rotation";
import { getActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import { combineModifierPartials, getWeaponUniqueStaticModifiers } from "@/lib/combat/weaponEffects";

function findCharacter(id: string) {
  return CHARACTERS.find((char) => char.id === id) ?? null;
}

function findWeapon(id: string) {
  return WEAPONS.find((weapon) => weapon.id === id) ?? null;
}

function findGear(id: string) {
  return GEARS.find((gear) => gear.id === id) ?? null;
}

function toPartySlot(index: number): PartySlot {
  return Math.max(0, Math.min(3, index)) as PartySlot;
}

export function createGenericCommands(): ResolvedCommandAtLevel[] {
  return [
    {
      id: "__switch",
      name: "Switch",
      skill: "basic",
      attackType: "GENERIC",
      damageType: "Physical",
      mode: undefined,
      durationFrames: 0,
      spCost: 0,
      energyCost: 0,
      energyGain: 0,
      timeFreezeSeconds: 0,
      cutscene: false,
      comboCooldownSeconds: 0,
      comboCooldownTimeScale: "real",
      comboCooldownStartsAt: "start",
      comboWindowDelaySeconds: 0,
      comboWindowDurationSeconds: 10,
      perfectTimingDelaySeconds: 0,
      perfectTimingDurationSeconds: 0,
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "switch",
      overlapMode: "normal",
      delayedEnd: false,
      noFinisherTransform: false,
      requiresControlledOperator: false,
      showNameInHitTimeline: false,
      showNameInTimeline: true,
      commandModifiers: {},
      reactionHits: false,
      executeHits: false,
      initialEffects: [],
      transforms: [],
      hits: [],
    },
    {
      id: "__switch_build",
      name: "Swap Build",
      skill: "basic",
      attackType: "GENERIC",
      damageType: "Physical",
      mode: undefined,
      durationFrames: 60,
      spCost: 0,
      energyCost: 0,
      energyGain: 0,
      timeFreezeSeconds: 0,
      cutscene: false,
      comboCooldownSeconds: 0,
      comboCooldownTimeScale: "real",
      comboCooldownStartsAt: "start",
      comboWindowDelaySeconds: 0,
      comboWindowDurationSeconds: 10,
      perfectTimingDelaySeconds: 0,
      perfectTimingDurationSeconds: 0,
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "switch_build",
      overlapMode: "transient",
      delayedEnd: false,
      noFinisherTransform: false,
      requiresControlledOperator: false,
      showNameInHitTimeline: true,
      showNameInTimeline: true,
      commandModifiers: {},
      reactionHits: false,
      executeHits: false,
      initialEffects: [],
      transforms: [],
      hits: [],
    },
    {
      id: "__dodge",
      name: "Dodge",
      skill: "basic",
      attackType: "GENERIC",
      damageType: "Physical",
      mode: undefined,
      durationFrames: 30,
      spCost: 0,
      energyCost: 0,
      energyGain: 0,
      timeFreezeSeconds: 0,
      cutscene: false,
      comboCooldownSeconds: 0,
      comboCooldownTimeScale: "real",
      comboCooldownStartsAt: "start",
      comboWindowDelaySeconds: 0,
      comboWindowDurationSeconds: 10,
      perfectTimingDelaySeconds: 0,
      perfectTimingDurationSeconds: 0,
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "dodge",
      overlapMode: "normal",
      delayedEnd: false,
      noFinisherTransform: false,
      requiresControlledOperator: true,
      showNameInHitTimeline: false,
      showNameInTimeline: true,
      commandModifiers: {},
      reactionHits: false,
      executeHits: false,
      initialEffects: [],
      transforms: [],
      hits: [],
    },
    {
      id: "__jump",
      name: "Jump",
      skill: "basic",
      attackType: "GENERIC",
      damageType: "Physical",
      mode: undefined,
      durationFrames: 60,
      spCost: 0,
      energyCost: 0,
      energyGain: 0,
      timeFreezeSeconds: 0,
      cutscene: false,
      comboCooldownSeconds: 0,
      comboCooldownTimeScale: "real",
      comboCooldownStartsAt: "start",
      comboWindowDelaySeconds: 0,
      comboWindowDurationSeconds: 10,
      perfectTimingDelaySeconds: 0,
      perfectTimingDurationSeconds: 0,
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "jump",
      overlapMode: "normal",
      delayedEnd: false,
      noFinisherTransform: false,
      requiresControlledOperator: true,
      showNameInHitTimeline: false,
      showNameInTimeline: true,
      commandModifiers: {},
      reactionHits: false,
      executeHits: false,
      initialEffects: [],
      transforms: [],
      hits: [],
    },
  ];
}

function buildSlotForVariant(
  slot: CharacterBuildSlot,
  variantIndex: number,
  activeVariantIndex?: number,
): CharacterBuildSlot {
  if (activeVariantIndex != null && variantIndex === activeVariantIndex) {
    return slot;
  }
  const characterId = slot.selectedCharId;
  if (!characterId) {
    return slot;
  }
  const variants = slot.characterBuilds[characterId];
  const variant = Array.isArray(variants) ? variants[variantIndex] : null;
  if (!variant) {
    return slot;
  }
  return {
    ...slot,
    characterAscension: variant.characterAscension,
    characterPotential: variant.characterPotential,
    level: variant.level,
    characterTalentToggles: { ...variant.characterTalentToggles },
    uniqueTalentToggles: { ...variant.uniqueTalentToggles },
    characterSkillLevels: { ...variant.characterSkillLevels },
    selectedWeaponId: variant.selectedWeaponId,
    weaponAscension: variant.weaponAscension,
    weaponPotential: variant.weaponPotential,
    weaponLevel: variant.weaponLevel,
    weaponSkillLevels: [...variant.weaponSkillLevels],
    armor: variant.armor ? { gearId: variant.armor.gearId, subLevels: [...variant.armor.subLevels] } : null,
    gloves: variant.gloves ? { gearId: variant.gloves.gearId, subLevels: [...variant.gloves.subLevels] } : null,
    kit1: variant.kit1 ? { gearId: variant.kit1.gearId, subLevels: [...variant.kit1.subLevels] } : null,
    kit2: variant.kit2 ? { gearId: variant.kit2.gearId, subLevels: [...variant.kit2.subLevels] } : null,
  };
}

function createGenericExecuteHits(): Record<string, ResolvedExecuteHitAtLevel> {
  return {
    set_swordmancer_extra_hit: {
      id: "set_swordmancer_extra_hit",
      skill: "basic",
      commandId: "__set_swordmancer",
      commandName: "Swordmancer",
      hit: {
        name: "Swordmancer Trigger",
        multiplier: 2.5,
        flatAmount: 0,
        scalingStat: "ATK",
        stagger: 10,
        spGenerated: 0,
        spReturned: 0,
        requiresControlledOperator: false,
        offsetFrames: 0,
        registerOffsetFrames: 0,
        times: 1,
        repeatIntervalFrames: 0,
        repeatRegisterOffsetWithInterval: true,
        energyReturn: 0,
        ignoreUltimateGainEfficiency: false,
        attackType: "GENERIC",
        damageType: "Physical",
        noCrit: false,
        effects: [],
        postEffects: [],
      },
    },
  };
}

export function buildCombatSnapshot(slot: CharacterBuildSlot, index: number): CharacterCombatSnapshot | null {
  if (!slot.selectedCharId || !slot.selectedWeaponId) {
    return null;
  }

  const char = findCharacter(slot.selectedCharId);
  const weapon = findWeapon(slot.selectedWeaponId);
  if (!char || !weapon) {
    return null;
  }

  const gearBases = [
    slot.armor ? findGear(slot.armor.gearId) : null,
    slot.gloves ? findGear(slot.gloves.gearId) : null,
    slot.kit1 ? findGear(slot.kit1.gearId) : null,
    slot.kit2 ? findGear(slot.kit2.gearId) : null,
  ];
  const activeGearSet = getActiveGearSetInfo(gearBases);
  const weaponStaticModifiers = getWeaponUniqueStaticModifiers({
    weaponId: weapon.id,
    uniqueSkillLevel: slot.weaponSkillLevels[2] ?? 1,
  });

  const finalStats = computeFinalStats({
    char,
    level: slot.level,
    weapon,
    weaponLevel: slot.weaponLevel,
    weaponSkillLevels: slot.weaponSkillLevels,
    gearBases,
    gearInstances: [slot.armor, slot.gloves, slot.kit1, slot.kit2],
    extraModifierDeltas: combineModifierPartials(
      activeGearSet?.staticModifiers,
      weaponStaticModifiers,
    ),
    characterAscensionStage: slot.characterAscension,
    characterPotential: slot.characterPotential,
    characterTalentToggles: slot.characterTalentToggles,
    uniqueTalentToggles: slot.uniqueTalentToggles,
    weaponAscensionStage: slot.weaponAscension,
    weaponPotential: slot.weaponPotential,
  });

  const buildState = {
    ascensionStage: slot.characterAscension,
    potentialLevel: slot.characterPotential,
    uniqueTalentToggles: slot.uniqueTalentToggles,
    uniqueTalentConditions: Object.fromEntries(
      Object.entries(char.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.condition]),
    ),
    uniqueTalentDefaults: Object.fromEntries(
      Object.entries(char.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.defaultEnabled === true]),
    ),
  } as const;

  let commands = resolveCommandsAtLevel(char.commands ?? [], slot.characterSkillLevels, buildState);
  if (char.mutateResolvedCommands) {
    commands = char.mutateResolvedCommands(commands, { buildState });
  }
  commands = applyCommandModifierStats(commands, finalStats.mods);
  let executeHits = resolveExecuteHitsAtLevel(char.executeHits ?? [], slot.characterSkillLevels, buildState);
  if (char.mutateResolvedExecuteHits) {
    executeHits = char.mutateResolvedExecuteHits(executeHits, { buildState });
  }
  executeHits = {
    ...createGenericExecuteHits(),
    ...executeHits,
  };

  return {
    slot: toPartySlot(index),
    characterId: char.id,
    characterName: char.name,
    characterClass: char.class,
    level: slot.level,
    weaponId: weapon.id,
    weaponSkillLevels: [...slot.weaponSkillLevels],
    ascensionStage: slot.characterAscension,
    potentialLevel: slot.characterPotential,
    uniqueTalentToggles: { ...slot.uniqueTalentToggles },
    uniqueTalentConditions: Object.fromEntries(
      Object.entries(char.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.condition]),
    ),
    uniqueTalentDefaults: Object.fromEntries(
      Object.entries(char.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.defaultEnabled === true]),
    ),
    conditionalModifiers: [...(char.conditionalModifiers ?? [])],
    finalAtk: finalStats.finalATK,
    maxHp: finalStats.finalHP,
    baseHp: finalStats.baseHP,
    finalDef: finalStats.statsCard.DEF,
    baseAtk: finalStats.baseATK,
    weaponAtk: finalStats.weaponATK,
    attributeBonus: finalStats.attributeBonus,
    attributeScaling: { ...finalStats.attributeScaling },
    attrs: {
      STR: finalStats.statsCard.STR,
      AGI: finalStats.statsCard.AGI,
      INT: finalStats.statsCard.INT,
      WIL: finalStats.statsCard.WIL,
    },
    mods: finalStats.mods,
    activeGearSet: activeGearSet ?? undefined,
    commands: [...commands, ...createGenericCommands()],
    executeHits,
    combatHooks: char.combatHooks,
    restrictEnergyGainToOwnBattleOrComboCommands: char.restrictEnergyGainToOwnBattleOrComboCommands === true,
  };
}

export function buildPartySnapshots(slots: CharacterBuildSlot[]): CharacterCombatSnapshot[] {
  return slots
    .map((slot, index) => buildCombatSnapshot(slot, index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null);
}

export function buildPartySnapshotsByVariant(
  slots: CharacterBuildSlot[],
  variantIndex: number,
  activeVariantIndex?: number,
): CharacterCombatSnapshot[] {
  return slots
    .map((slot, index) => buildCombatSnapshot(buildSlotForVariant(slot, variantIndex, activeVariantIndex), index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null);
}

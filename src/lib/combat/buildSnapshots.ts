import type { CharacterBuildSlot } from "@/stores/buildStore";
import { CHARACTERS } from "@/data/characters";
import { WEAPONS } from "@/data/weapons";
import { GEARS } from "@/data/gears";
import { computeFinalStats } from "@/lib/build/stats";
import { applyCommandModifierStats, resolveCommandsAtLevel, type ResolvedCommandAtLevel } from "@/lib/commands";
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
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "switch",
      requiresControlledOperator: false,
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
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "dodge",
      requiresControlledOperator: true,
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
      spGeneratedOnEnd: 0,
      spReturnedOnEnd: 0,
      hiddenInLibrary: true,
      expandsToCommandIds: [],
      basicAttackVariant: undefined,
      sequenceSegmentIndex: undefined,
      sequenceSegmentTotal: undefined,
      splitMultiplier: false,
      genericActionType: "jump",
      requiresControlledOperator: true,
      transforms: [],
      hits: [],
    },
  ];
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

  return {
    slot: toPartySlot(index),
    characterId: char.id,
    characterName: char.name,
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
    finalAtk: finalStats.finalATK,
    mods: finalStats.mods,
    activeGearSet: activeGearSet ?? undefined,
    commands: [...commands, ...createGenericCommands()],
    combatHooks: char.combatHooks,
  };
}

export function buildPartySnapshots(slots: CharacterBuildSlot[]): CharacterCombatSnapshot[] {
  return slots
    .map((slot, index) => buildCombatSnapshot(slot, index))
    .filter((snapshot): snapshot is CharacterCombatSnapshot => snapshot != null);
}

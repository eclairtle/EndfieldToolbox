import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { CHARACTERS, type CharacterBase } from "@/data/characters";
import { WEAPONS, type WeaponBase } from "@/data/weapons";
import { GEARS, type GearBase } from "@/data/gears";
import { getActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import { combineModifierPartials, getWeaponUniqueStaticModifiers } from "@/lib/combat/weaponEffects";

import { computeFinalStats } from "@/lib/build/stats";
import {
  makeGearInstance,
  type GearInstance,
  type GearSubLevel,
} from "@/lib/build/gearInstances";
import {
  clampCharacterLevelToAscension,
  clampWeaponSkillLevel,
  getWeaponSkill1Range,
  getWeaponSkill2Range,
  getWeaponSkill3Range,
  type AscensionStage,
  type PotentialLevel,
} from "@/lib/build/progression";
import {
  makeDefaultCharacterSkillLevels,
  type CharacterSkillLevels,
  type CharacterSkillKey,
} from "@/lib/build/characterSkills";
import type { BuffInstance } from "@/lib/buffs";
import type { CharacterTalentKey, CharacterTalentToggles } from "@/lib/build/characterTalents";
import { applyCommandModifierStats, resolveCommandsDefinition, resolveCommandsAtLevel } from "@/lib/commands";
import { isBuildConditionMet } from "@/lib/build/buildConditions";

function firstOrThrow<T>(arr: T[], name: string): T {
  const value = arr[0];
  if (!value) throw new Error(`${name} is empty`);
  return value;
}
const BUILD_VARIANT_COUNT = 4;

export type CharacterBuildSlot = {
  id: string;
  label: string;

  selectedCharId: string;
  characterAscension: AscensionStage;
  characterPotential: PotentialLevel;
  level: number;

  characterTalentToggles: CharacterTalentToggles;
  uniqueTalentToggles: Record<string, boolean>;
  characterSkillLevels: CharacterSkillLevels;

  selectedWeaponId: string;
  weaponAscension: AscensionStage;
  weaponPotential: PotentialLevel;
  weaponLevel: number;
  weaponSkillLevels: number[];

  armor: GearInstance | null;
  gloves: GearInstance | null;
  kit1: GearInstance | null;
  kit2: GearInstance | null;

  activeBuffs: BuffInstance[];
  characterBuilds: Record<string, CharacterBuildSnapshot[]>;
  weaponBuilds: Record<string, WeaponBuildSnapshot>;
};

export type BuildStoreStateSnapshot = {
  slots: CharacterBuildSlot[];
  activeSlotIndex: number;
  activeVariantIndex?: number;
};

type CharacterBuildSnapshot = {
  characterAscension: AscensionStage;
  characterPotential: PotentialLevel;
  level: number;
  characterTalentToggles: CharacterTalentToggles;
  uniqueTalentToggles: Record<string, boolean>;
  characterSkillLevels: CharacterSkillLevels;
  selectedWeaponId: string;
  weaponAscension: AscensionStage;
  weaponPotential: PotentialLevel;
  weaponLevel: number;
  weaponSkillLevels: number[];
  armor: GearInstance | null;
  gloves: GearInstance | null;
  kit1: GearInstance | null;
  kit2: GearInstance | null;
};

type WeaponBuildSnapshot = {
  weaponAscension: AscensionStage;
  weaponPotential: PotentialLevel;
  weaponLevel: number;
  weaponSkillLevels: number[];
};

function makeDefaultTalentToggles(): CharacterTalentToggles {
  return {
    TALENT_1: true,
    TALENT_2: true,
    TALENT_3: true,
    TALENT_4: true,
  };
}

function makeLevel9CharacterSkillLevels(): CharacterSkillLevels {
  return {
    basic: 9,
    battleSkill: 9,
    comboSkill: 9,
    ultimate: 9,
  };
}

function getDefaultPotentialByRarity(rarity: number | undefined): PotentialLevel {
  return rarity === 6 ? 0 : 5;
}

function makeAllUniqueTalentTogglesEnabled(character: CharacterBase): Record<string, boolean> {
  return Object.fromEntries(
    Object.keys(character.uniqueTalentDefs ?? {}).map((key) => [key, true]),
  );
}

function remapLevelWithRangeChange(
  value: number,
  prevMin: number,
  prevMax: number,
  nextMin: number,
  nextMax: number,
) {
  if (value <= prevMin) {
    return nextMin;
  }
  if (value >= prevMax) {
    return nextMax;
  }
  return Math.max(nextMin, Math.min(nextMax, value));
}

function makeDefaultSlot(index: number): CharacterBuildSlot {
  return {
    id: `slot_${index + 1}`,
    label: `Character ${index + 1}`,

    selectedCharId: "",
    characterAscension: 4,
    characterPotential: 0,
    level: 1,

    characterTalentToggles: makeDefaultTalentToggles(),
    uniqueTalentToggles: {},
    characterSkillLevels: makeDefaultCharacterSkillLevels(),

    selectedWeaponId: "",
    weaponAscension: 4,
    weaponPotential: 0,
    weaponLevel: 1,
    weaponSkillLevels: [1, 1, 1],

    armor: null,
    gloves: null,
    kit1: null,
    kit2: null,

    activeBuffs: [],
    characterBuilds: {},
    weaponBuilds: {},
  };
}

export function createDefaultBuildStoreStateSnapshot(): BuildStoreStateSnapshot {
  return {
    slots: [makeDefaultSlot(0), makeDefaultSlot(1), makeDefaultSlot(2), makeDefaultSlot(3)],
    activeSlotIndex: 0,
    activeVariantIndex: 0,
  };
}

function cloneSnapshotSlots(slotsValue: CharacterBuildSlot[]): CharacterBuildSlot[] {
  return JSON.parse(JSON.stringify(slotsValue)) as CharacterBuildSlot[];
}

export const useBuildStore = defineStore("buildStore", () => {
  const slots = ref<CharacterBuildSlot[]>([
    makeDefaultSlot(0),
    makeDefaultSlot(1),
    makeDefaultSlot(2),
    makeDefaultSlot(3),
  ]);

  const activeSlotIndex = ref(0);
  const activeVariantIndex = ref(0);

  const activeSlot = computed(() => slots.value[activeSlotIndex.value]);

  function getCharacterById(id: string): CharacterBase {
    return CHARACTERS.find((c) => c.id === id) ?? firstOrThrow(CHARACTERS, "CHARACTERS");
  }

  function getWeaponById(id: string): WeaponBase {
    return WEAPONS.find((w) => w.id === id) ?? firstOrThrow(WEAPONS, "WEAPONS");
  }

  function findGear(id: string): GearBase | null {
    return GEARS.find((g) => g.id === id) ?? null;
  }

  const selectedChar = computed<CharacterBase | null>(() => {
    if (!activeSlot.value!.selectedCharId) return null;
    return getCharacterById(activeSlot.value!.selectedCharId);
  });

  const availableWeapons = computed(() => {
    const character = selectedChar.value;
    if (!character) return [];
    return WEAPONS.filter((w) => w.weaponType === character.weaponType);
  });

  const selectedWeapon = computed<WeaponBase | null>(() => {
    if (!activeSlot.value!.selectedWeaponId) return null;
    return availableWeapons.value.find((w) => w.id === activeSlot.value!.selectedWeaponId) ?? null;
  });

  const armorOptions = computed(() => GEARS.filter((g) => g.slot === "ARMOR"));
  const gloveOptions = computed(() => GEARS.filter((g) => g.slot === "GLOVES"));
  const kitOptions = computed(() => GEARS.filter((g) => g.slot === "KIT"));

  const selectedGearObjects = computed(() => ({
    armor: activeSlot.value!.armor ? findGear(activeSlot.value!.armor.gearId) : null,
    gloves: activeSlot.value!.gloves ? findGear(activeSlot.value!.gloves.gearId) : null,
    kit1: activeSlot.value!.kit1 ? findGear(activeSlot.value!.kit1.gearId) : null,
    kit2: activeSlot.value!.kit2 ? findGear(activeSlot.value!.kit2.gearId) : null,
  }));

  const activeGearSet = computed(() =>
    getActiveGearSetInfo([
      selectedGearObjects.value.armor,
      selectedGearObjects.value.gloves,
      selectedGearObjects.value.kit1,
      selectedGearObjects.value.kit2,
    ]),
  );

  const resolvedCommandsDefinition = computed(() =>
    resolveCommandsDefinition(selectedChar.value?.commands ?? []),
  );

  const buildConditionState = computed(() => ({
    ascensionStage: activeSlot.value!.characterAscension,
    potentialLevel: activeSlot.value!.characterPotential,
    uniqueTalentToggles: activeSlot.value!.uniqueTalentToggles,
    uniqueTalentConditions: Object.fromEntries(
      Object.entries(selectedChar.value?.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.condition]),
    ),
    uniqueTalentDefaults: Object.fromEntries(
      Object.entries(selectedChar.value?.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.defaultEnabled === true]),
    ),
  }));

  const benchmarkResults = computed(() => {
    const character = selectedChar.value;
    const finalStats = out.value;

    if (!character || !finalStats) return [];

    return (character.benchmarks ?? []).map((bm) => {
      const result = bm.compute({
        char: character,
        finalStats,
        resolvedCommands: resolvedCommands.value,
        slot: activeSlot.value!,
      });

      return {
        id: bm.id,
        name: bm.name,
        label: result.label,
        value: result.value,
        suffix: result.suffix,
      };
    });
  });

  function normalizeWeaponSkillLevels(slot: CharacterBuildSlot) {
    const s1 = getWeaponSkill1Range(slot.weaponAscension);
    const s2 = getWeaponSkill2Range(slot.weaponAscension);
    const s3 = getWeaponSkill3Range(slot.weaponPotential);

    slot.weaponSkillLevels = [
      clampWeaponSkillLevel(slot.weaponSkillLevels[0] ?? s1.min, s1.min, s1.max),
      clampWeaponSkillLevel(slot.weaponSkillLevels[1] ?? s2.min, s2.min, s2.max),
      clampWeaponSkillLevel(slot.weaponSkillLevels[2] ?? s3.min, s3.min, s3.max),
    ];
  }

  function setWeaponSkillLevelsToMax(slot: CharacterBuildSlot) {
    const s1 = getWeaponSkill1Range(slot.weaponAscension);
    const s2 = getWeaponSkill2Range(slot.weaponAscension);
    const s3 = getWeaponSkill3Range(slot.weaponPotential);
    slot.weaponSkillLevels = [s1.max, s2.max, s3.max];
  }

function makeWeaponBuildKey(characterId: string, weaponId: string) {
  return `${characterId}::${weaponId}`;
}

function cloneGearInstance(instance: GearInstance | null): GearInstance | null {
  if (!instance) return null;
  return {
    gearId: instance.gearId,
    subLevels: [...instance.subLevels] as GearSubLevel[],
  };
}

function snapshotCurrentCharacterBuild(slot: CharacterBuildSlot) {
  if (!slot.selectedCharId) return;
  const existing = slot.characterBuilds[slot.selectedCharId];
  const variants: CharacterBuildSnapshot[] = Array.isArray(existing)
    ? [...existing]
    : [];
  while (variants.length < BUILD_VARIANT_COUNT) {
    variants.push({
      characterAscension: slot.characterAscension,
      characterPotential: slot.characterPotential,
      level: slot.level,
      characterTalentToggles: { ...slot.characterTalentToggles },
      uniqueTalentToggles: { ...slot.uniqueTalentToggles },
      characterSkillLevels: { ...slot.characterSkillLevels },
      selectedWeaponId: slot.selectedWeaponId,
      weaponAscension: slot.weaponAscension,
      weaponPotential: slot.weaponPotential,
      weaponLevel: slot.weaponLevel,
      weaponSkillLevels: [...slot.weaponSkillLevels],
      armor: cloneGearInstance(slot.armor),
      gloves: cloneGearInstance(slot.gloves),
      kit1: cloneGearInstance(slot.kit1),
      kit2: cloneGearInstance(slot.kit2),
    });
  }
  variants[activeVariantIndex.value] = {
      characterAscension: slot.characterAscension,
      characterPotential: slot.characterPotential,
      level: slot.level,
      characterTalentToggles: { ...slot.characterTalentToggles },
      uniqueTalentToggles: { ...slot.uniqueTalentToggles },
      characterSkillLevels: { ...slot.characterSkillLevels },
      selectedWeaponId: slot.selectedWeaponId,
      weaponAscension: slot.weaponAscension,
      weaponPotential: slot.weaponPotential,
      weaponLevel: slot.weaponLevel,
      weaponSkillLevels: [...slot.weaponSkillLevels],
      armor: cloneGearInstance(slot.armor),
      gloves: cloneGearInstance(slot.gloves),
      kit1: cloneGearInstance(slot.kit1),
      kit2: cloneGearInstance(slot.kit2),
    };
  slot.characterBuilds[slot.selectedCharId] = variants;
  }

  function snapshotCurrentWeaponBuild(slot: CharacterBuildSlot) {
    if (!slot.selectedCharId || !slot.selectedWeaponId) return;
    const key = makeWeaponBuildKey(slot.selectedCharId, slot.selectedWeaponId);
    slot.weaponBuilds[key] = {
      weaponAscension: slot.weaponAscension,
      weaponPotential: slot.weaponPotential,
      weaponLevel: slot.weaponLevel,
      weaponSkillLevels: [...slot.weaponSkillLevels],
    };
  }

  function setActiveSlot(index: number) {
    if (index < 0 || index > 3) return;
    activeSlotIndex.value = index;
  }

  function setCharacter(id: string) {
    snapshotCurrentWeaponBuild(activeSlot.value!);
    snapshotCurrentCharacterBuild(activeSlot.value!);

    activeSlot.value!.selectedCharId = id;
    if (!id) {
      activeSlot.value!.selectedWeaponId = "";
      return;
    }
    const nextCharacter = getCharacterById(id);

    const allowedWeapons = WEAPONS.filter(
      (w) => w.weaponType === nextCharacter.weaponType,
    );

    const cachedCharacterBuilds = activeSlot.value!.characterBuilds[id];
    const cachedCharacterBuild = Array.isArray(cachedCharacterBuilds)
      ? cachedCharacterBuilds[activeVariantIndex.value]
      : null;
    if (cachedCharacterBuild) {
      activeSlot.value!.characterAscension = cachedCharacterBuild.characterAscension;
      activeSlot.value!.characterPotential = cachedCharacterBuild.characterPotential;
      activeSlot.value!.level = cachedCharacterBuild.level;
      activeSlot.value!.characterTalentToggles = {
        ...cachedCharacterBuild.characterTalentToggles,
      };
      activeSlot.value!.characterSkillLevels = { ...cachedCharacterBuild.characterSkillLevels };
      activeSlot.value!.armor = cloneGearInstance(cachedCharacterBuild.armor);
      activeSlot.value!.gloves = cloneGearInstance(cachedCharacterBuild.gloves);
      activeSlot.value!.kit1 = cloneGearInstance(cachedCharacterBuild.kit1);
      activeSlot.value!.kit2 = cloneGearInstance(cachedCharacterBuild.kit2);

      const allowedTalentKeys = new Set(Object.keys(nextCharacter.uniqueTalentDefs ?? {}));
      const nextUniqueToggles: Record<string, boolean> = {};
      for (const key of allowedTalentKeys) {
        nextUniqueToggles[key] = cachedCharacterBuild.uniqueTalentToggles?.[key] === true;
      }
      activeSlot.value!.uniqueTalentToggles = nextUniqueToggles;
      activeSlot.value!.selectedWeaponId = cachedCharacterBuild.selectedWeaponId;
      activeSlot.value!.weaponAscension = cachedCharacterBuild.weaponAscension;
      activeSlot.value!.weaponPotential = cachedCharacterBuild.weaponPotential;
      activeSlot.value!.weaponLevel = cachedCharacterBuild.weaponLevel;
      activeSlot.value!.weaponSkillLevels = [...cachedCharacterBuild.weaponSkillLevels];
    } else {
      const defaultCharacterPotential = getDefaultPotentialByRarity(nextCharacter.rarity);
      activeSlot.value!.characterAscension = 4;
      activeSlot.value!.characterPotential = defaultCharacterPotential;
      activeSlot.value!.level = 90;
      activeSlot.value!.characterTalentToggles = makeDefaultTalentToggles();
      activeSlot.value!.characterSkillLevels = makeLevel9CharacterSkillLevels();
      activeSlot.value!.uniqueTalentToggles = makeAllUniqueTalentTogglesEnabled(nextCharacter);
      activeSlot.value!.armor = null;
      activeSlot.value!.gloves = null;
      activeSlot.value!.kit1 = null;
      activeSlot.value!.kit2 = null;
      activeSlot.value!.selectedWeaponId = "";
    }

    if (!allowedWeapons.some((w) => w.id === activeSlot.value!.selectedWeaponId)) {
      activeSlot.value!.selectedWeaponId = "";
    }
    if (activeSlot.value!.selectedCharId && !activeSlot.value!.selectedWeaponId && allowedWeapons.length > 0) {
      activeSlot.value!.selectedWeaponId = allowedWeapons[0]!.id;
    }
    if (cachedCharacterBuild && activeSlot.value!.selectedWeaponId) {
      normalizeWeaponSkillLevels(activeSlot.value!);
    } else {
      loadWeaponBuild();
    }
  }

  function setCharacterLevel(level: number) {
    activeSlot.value!.level = clampCharacterLevelToAscension(level, activeSlot.value!.characterAscension);
  }

  function setCharacterAscension(stage: AscensionStage) {
    const previousStage = activeSlot.value!.characterAscension;
    activeSlot.value!.characterAscension = stage;
    activeSlot.value!.level = remapLevelWithRangeChange(
      activeSlot.value!.level,
      previousStage === 0 ? 1 : previousStage * 20,
      previousStage === 4 ? 90 : previousStage * 20 + 20,
      stage === 0 ? 1 : stage * 20,
      stage === 4 ? 90 : stage * 20 + 20,
    );
  }

  function setCharacterPotential(potential: PotentialLevel) {
    activeSlot.value!.characterPotential = potential;
  }

  function toggleTalent(key: CharacterTalentKey) {
    activeSlot.value!.characterTalentToggles[key] =
      !activeSlot.value!.characterTalentToggles[key];
  }

  function toggleUniqueTalent(key: string) {
    const talent = selectedChar.value?.uniqueTalentDefs?.[key];
    if (
      talent &&
      !isBuildConditionMet(talent.condition, {
        ascensionStage: activeSlot.value!.characterAscension,
        uniqueTalentToggles: activeSlot.value!.uniqueTalentToggles,
        uniqueTalentConditions: Object.fromEntries(
          Object.entries(selectedChar.value?.uniqueTalentDefs ?? {}).map(([innerKey, innerTalent]) => [innerKey, innerTalent.condition]),
        ),
        uniqueTalentDefaults: Object.fromEntries(
          Object.entries(selectedChar.value?.uniqueTalentDefs ?? {}).map(([innerKey, innerTalent]) => [innerKey, innerTalent.defaultEnabled === true]),
        ),
      })
    ) {
      return;
    }

    activeSlot.value!.uniqueTalentToggles[key] =
      !activeSlot.value!.uniqueTalentToggles[key];
  }

  function setCharacterSkillLevel(key: CharacterSkillKey, value: number) {
    activeSlot.value!.characterSkillLevels[key] = value;
  }

  function setWeapon(id: string) {
    snapshotCurrentWeaponBuild(activeSlot.value!);
    activeSlot.value!.selectedWeaponId = id;
    loadWeaponBuild();
  }

  function loadWeaponBuildForSlot(slot: CharacterBuildSlot) {
    if (!slot.selectedCharId || !slot.selectedWeaponId) {
      slot.weaponAscension = 4;
      slot.weaponPotential = 0;
      slot.weaponLevel = 90;
      setWeaponSkillLevelsToMax(slot);
      return;
    }

    const key = makeWeaponBuildKey(
      slot.selectedCharId,
      slot.selectedWeaponId,
    );
    const cachedWeaponBuild = slot.weaponBuilds[key];

    if (cachedWeaponBuild) {
      slot.weaponAscension = cachedWeaponBuild.weaponAscension;
      slot.weaponPotential = cachedWeaponBuild.weaponPotential;
      slot.weaponLevel = cachedWeaponBuild.weaponLevel;
      slot.weaponSkillLevels = [...cachedWeaponBuild.weaponSkillLevels];
      normalizeWeaponSkillLevels(slot);
      return;
    }

    const selectedWeaponDef = getWeaponById(slot.selectedWeaponId);
    const defaultWeaponPotential = getDefaultPotentialByRarity(selectedWeaponDef?.rarity);
    slot.weaponAscension = 4;
    slot.weaponPotential = defaultWeaponPotential;
    slot.weaponLevel = 90;
    setWeaponSkillLevelsToMax(slot);
  }

  function loadWeaponBuild() {
    loadWeaponBuildForSlot(activeSlot.value!);
  }

  function setWeaponLevel(level: number) {
    activeSlot.value!.weaponLevel = clampCharacterLevelToAscension(level, activeSlot.value!.weaponAscension);
  }

  function setWeaponAscension(stage: AscensionStage) {
    const previousStage = activeSlot.value!.weaponAscension;
    const prevS1 = getWeaponSkill1Range(previousStage);
    const prevS2 = getWeaponSkill2Range(previousStage);
    const nextS1 = getWeaponSkill1Range(stage);
    const nextS2 = getWeaponSkill2Range(stage);

    activeSlot.value!.weaponAscension = stage;
    activeSlot.value!.weaponLevel = remapLevelWithRangeChange(
      activeSlot.value!.weaponLevel,
      previousStage === 0 ? 1 : previousStage * 20,
      previousStage === 4 ? 90 : previousStage * 20 + 20,
      stage === 0 ? 1 : stage * 20,
      stage === 4 ? 90 : stage * 20 + 20,
    );

    activeSlot.value!.weaponSkillLevels[0] = remapLevelWithRangeChange(
      activeSlot.value!.weaponSkillLevels[0] ?? prevS1.min,
      prevS1.min,
      prevS1.max,
      nextS1.min,
      nextS1.max,
    );
    activeSlot.value!.weaponSkillLevels[1] = remapLevelWithRangeChange(
      activeSlot.value!.weaponSkillLevels[1] ?? prevS2.min,
      prevS2.min,
      prevS2.max,
      nextS2.min,
      nextS2.max,
    );
    normalizeWeaponSkillLevels(activeSlot.value!);
  }

  function setWeaponPotential(potential: PotentialLevel) {
    const previousPotential = activeSlot.value!.weaponPotential;
    const prevS3 = getWeaponSkill3Range(previousPotential);
    const nextS3 = getWeaponSkill3Range(potential);

    activeSlot.value!.weaponPotential = potential;
    activeSlot.value!.weaponSkillLevels[2] = remapLevelWithRangeChange(
      activeSlot.value!.weaponSkillLevels[2] ?? prevS3.min,
      prevS3.min,
      prevS3.max,
      nextS3.min,
      nextS3.max,
    );
    normalizeWeaponSkillLevels(activeSlot.value!);
  }

  function updateWeaponSkillLevel(payload: { index: number; value: number }) {
    const s1 = getWeaponSkill1Range(activeSlot.value!.weaponAscension);
    const s2 = getWeaponSkill2Range(activeSlot.value!.weaponAscension);
    const s3 = getWeaponSkill3Range(activeSlot.value!.weaponPotential);

    const ranges = [s1, s2, s3];
    const range = ranges[payload.index];
    if (!range) return;

    activeSlot.value!.weaponSkillLevels[payload.index] = clampWeaponSkillLevel(
      payload.value,
      range.min,
      range.max,
    );
  }

  function setGear(slotName: "armor" | "gloves" | "kit1" | "kit2", gearId: string) {
    const gear = findGear(gearId);
    const next = gear ? makeGearInstance(gear) : null;
    activeSlot.value![slotName] = next;
  }

  function updateGearSubLevel(
    slotName: "armor" | "gloves" | "kit1" | "kit2",
    index: number,
    value: GearSubLevel,
  ) {
    const target = activeSlot.value![slotName];
    if (!target) return;
    target.subLevels[index] = value;
  }

  function resetGuestUser() {
    const next = createDefaultBuildStoreStateSnapshot();
    slots.value = next.slots;
    activeSlotIndex.value = next.activeSlotIndex;
    activeVariantIndex.value = next.activeVariantIndex ?? 0;
  }

  function setActiveVariantIndex(index: number) {
    if (index < 0 || index >= BUILD_VARIANT_COUNT || index === activeVariantIndex.value) {
      return;
    }
    for (const slot of slots.value) {
      snapshotCurrentWeaponBuild(slot);
      snapshotCurrentCharacterBuild(slot);
    }
    activeVariantIndex.value = index;
    const previousActiveSlotIndex = activeSlotIndex.value;
    for (const slot of slots.value) {
      if (!slot.selectedCharId) {
        continue;
      }
      const cachedCharacterBuilds = slot.characterBuilds[slot.selectedCharId];
      const cached = Array.isArray(cachedCharacterBuilds) ? cachedCharacterBuilds[index] : null;
      if (!cached) {
        continue;
      }
      slot.characterAscension = cached.characterAscension;
      slot.characterPotential = cached.characterPotential;
      slot.level = cached.level;
      slot.characterTalentToggles = { ...cached.characterTalentToggles };
      slot.characterSkillLevels = { ...cached.characterSkillLevels };
      slot.armor = cloneGearInstance(cached.armor);
      slot.gloves = cloneGearInstance(cached.gloves);
      slot.kit1 = cloneGearInstance(cached.kit1);
      slot.kit2 = cloneGearInstance(cached.kit2);
      slot.uniqueTalentToggles = { ...cached.uniqueTalentToggles };
      slot.selectedWeaponId = cached.selectedWeaponId;
      slot.weaponAscension = cached.weaponAscension;
      slot.weaponPotential = cached.weaponPotential;
      slot.weaponLevel = cached.weaponLevel;
      slot.weaponSkillLevels = [...cached.weaponSkillLevels];
      normalizeWeaponSkillLevels(slot);
    }
    activeSlotIndex.value = previousActiveSlotIndex;
  }

  function exportStateSnapshot(): BuildStoreStateSnapshot {
    return {
      slots: cloneSnapshotSlots(slots.value),
      activeSlotIndex: activeSlotIndex.value,
      activeVariantIndex: activeVariantIndex.value,
    };
  }

  function hydrateStateSnapshot(snapshot: BuildStoreStateSnapshot) {
    if (!snapshot || !Array.isArray(snapshot.slots) || snapshot.slots.length !== 4) {
      return;
    }

    const normalizedSlots = cloneSnapshotSlots(snapshot.slots);
    for (const slot of normalizedSlots) {
      slot.uniqueTalentToggles = slot.uniqueTalentToggles ?? {};
      const normalizedCharacterBuilds: Record<string, CharacterBuildSnapshot[]> = {};
      for (const [characterId, raw] of Object.entries(slot.characterBuilds ?? {})) {
        if (Array.isArray(raw)) {
          const variants = raw.slice(0, BUILD_VARIANT_COUNT).map((entry) => ({
            ...entry,
            weaponAscension: entry.weaponAscension ?? slot.weaponAscension,
            weaponPotential: entry.weaponPotential ?? slot.weaponPotential,
            weaponLevel: entry.weaponLevel ?? slot.weaponLevel,
            weaponSkillLevels: Array.isArray(entry.weaponSkillLevels)
              ? [...entry.weaponSkillLevels]
              : [...slot.weaponSkillLevels],
          }));
          while (variants.length < BUILD_VARIANT_COUNT) {
            variants.push(variants[0] ? { ...variants[0] } : {
              characterAscension: slot.characterAscension,
              characterPotential: slot.characterPotential,
              level: slot.level,
              characterTalentToggles: { ...slot.characterTalentToggles },
              uniqueTalentToggles: { ...slot.uniqueTalentToggles },
              characterSkillLevels: { ...slot.characterSkillLevels },
              selectedWeaponId: slot.selectedWeaponId,
              weaponAscension: slot.weaponAscension,
              weaponPotential: slot.weaponPotential,
              weaponLevel: slot.weaponLevel,
              weaponSkillLevels: [...slot.weaponSkillLevels],
              armor: cloneGearInstance(slot.armor),
              gloves: cloneGearInstance(slot.gloves),
              kit1: cloneGearInstance(slot.kit1),
              kit2: cloneGearInstance(slot.kit2),
            });
          }
          normalizedCharacterBuilds[characterId] = variants;
        } else if (raw && typeof raw === "object") {
          const legacy = raw as CharacterBuildSnapshot;
          const normalizedLegacy: CharacterBuildSnapshot = {
            ...legacy,
            weaponAscension: legacy.weaponAscension ?? slot.weaponAscension,
            weaponPotential: legacy.weaponPotential ?? slot.weaponPotential,
            weaponLevel: legacy.weaponLevel ?? slot.weaponLevel,
            weaponSkillLevels: Array.isArray(legacy.weaponSkillLevels)
              ? [...legacy.weaponSkillLevels]
              : [...slot.weaponSkillLevels],
          };
          normalizedCharacterBuilds[characterId] = Array.from(
            { length: BUILD_VARIANT_COUNT },
            () => ({ ...normalizedLegacy }),
          );
        }
      }
      slot.characterBuilds = normalizedCharacterBuilds;
      slot.weaponBuilds = slot.weaponBuilds ?? {};
    }

    slots.value = normalizedSlots;
    activeSlotIndex.value =
      typeof snapshot.activeSlotIndex === "number" && snapshot.activeSlotIndex >= 0 && snapshot.activeSlotIndex < 4
        ? snapshot.activeSlotIndex
        : 0;
    activeVariantIndex.value =
      typeof snapshot.activeVariantIndex === "number"
      && snapshot.activeVariantIndex >= 0
      && snapshot.activeVariantIndex < BUILD_VARIANT_COUNT
        ? snapshot.activeVariantIndex
        : 0;
  }

  const out = computed(() => {
    if (!selectedChar.value || !selectedWeapon.value) return null;
    const weaponStaticModifiers = getWeaponUniqueStaticModifiers({
      weaponId: selectedWeapon.value.id,
      uniqueSkillLevel: activeSlot.value!.weaponSkillLevels[2] ?? 1,
    });
    return computeFinalStats({
      char: selectedChar.value,
      level: activeSlot.value!.level,
      weapon: selectedWeapon.value,
      weaponLevel: activeSlot.value!.weaponLevel,
      weaponSkillLevels: activeSlot.value!.weaponSkillLevels,

      characterAscensionStage: activeSlot.value!.characterAscension,
      characterPotential: activeSlot.value!.characterPotential,
      characterTalentToggles: activeSlot.value!.characterTalentToggles,
      uniqueTalentToggles: activeSlot.value!.uniqueTalentToggles,
      weaponAscensionStage: activeSlot.value!.weaponAscension,
      weaponPotential: activeSlot.value!.weaponPotential,

      gearBases: [
        selectedGearObjects.value.armor,
        selectedGearObjects.value.gloves,
        selectedGearObjects.value.kit1,
        selectedGearObjects.value.kit2,
      ],
      gearInstances: [
        activeSlot.value!.armor,
        activeSlot.value!.gloves,
        activeSlot.value!.kit1,
        activeSlot.value!.kit2,
      ],
      extraModifierDeltas: combineModifierPartials(
        activeGearSet.value?.staticModifiers,
        weaponStaticModifiers,
      ),
    });
  });

  const resolvedCommands = computed(() => {
    const character = selectedChar.value;
    if (!character) {
      return [];
    }

    let commands = resolveCommandsAtLevel(
      resolvedCommandsDefinition.value,
      activeSlot.value!.characterSkillLevels,
      buildConditionState.value,
    );

    if (character.mutateResolvedCommands) {
      commands = character.mutateResolvedCommands(commands, {
        buildState: buildConditionState.value,
      });
    }

    return out.value ? applyCommandModifierStats(commands, out.value.mods) : commands;
  });

  return {
    slots,
    activeSlotIndex,
    activeVariantIndex,
    activeSlot,
    setActiveSlot,
    setActiveVariantIndex,

    selectedChar,
    selectedWeapon,
    availableWeapons,

    armorOptions,
    gloveOptions,
    kitOptions,
    selectedGearObjects,
    activeGearSet,
    resolvedCommands,
    benchmarkResults,

    out,

    setCharacter,
    setCharacterLevel,
    setCharacterAscension,
    setCharacterPotential,
    toggleTalent,
    toggleUniqueTalent,
    setCharacterSkillLevel,

    setWeapon,
    setWeaponLevel,
    setWeaponAscension,
    setWeaponPotential,
    updateWeaponSkillLevel,

    setGear,
    updateGearSubLevel,
    exportStateSnapshot,
    hydrateStateSnapshot,
    resetGuestUser,
  };
});

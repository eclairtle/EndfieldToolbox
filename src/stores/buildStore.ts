import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

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
  characterBuilds: Record<string, CharacterBuildSnapshot>;
  weaponBuilds: Record<string, WeaponBuildSnapshot>;
};

type CharacterBuildSnapshot = {
  characterAscension: AscensionStage;
  characterPotential: PotentialLevel;
  level: number;
  characterTalentToggles: CharacterTalentToggles;
  uniqueTalentToggles: Record<string, boolean>;
  characterSkillLevels: CharacterSkillLevels;
  selectedWeaponId: string;
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
    TALENT_1: false,
    TALENT_2: false,
    TALENT_3: false,
    TALENT_4: false,
  };
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

const STORAGE_KEY = "combat-simulator-build-store-v1";

export const useBuildStore = defineStore("buildStore", () => {
  const slots = ref<CharacterBuildSlot[]>([
    makeDefaultSlot(0),
    makeDefaultSlot(1),
    makeDefaultSlot(2),
    makeDefaultSlot(3),
  ]);

  const activeSlotIndex = ref(0);

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        slots?: CharacterBuildSlot[];
        activeSlotIndex?: number;
      };

      if (parsed.slots && parsed.slots.length === 4) {
        slots.value = parsed.slots;
        for (const slot of slots.value) {
          slot.uniqueTalentToggles = slot.uniqueTalentToggles ?? {};
          slot.characterBuilds = slot.characterBuilds ?? {};
          slot.weaponBuilds = slot.weaponBuilds ?? {};
        }
      }

      if (
        typeof parsed.activeSlotIndex === "number" &&
        parsed.activeSlotIndex >= 0 &&
        parsed.activeSlotIndex < 4
      ) {
        activeSlotIndex.value = parsed.activeSlotIndex;
      }
    } catch (err) {
      console.warn("Failed to load build store from localStorage", err);
    }
  }

  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slots: slots.value,
        activeSlotIndex: activeSlotIndex.value,
      }),
    );
  }

  loadFromStorage();

  watch(
    [slots, activeSlotIndex],
    () => {
      saveToStorage();
    },
    { deep: true },
  );

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

  function makeWeaponBuildKey(characterId: string, weaponId: string) {
    return `${characterId}::${weaponId}`;
  }

  function snapshotCurrentCharacterBuild(slot: CharacterBuildSlot) {
    if (!slot.selectedCharId) return;
    slot.characterBuilds[slot.selectedCharId] = {
      characterAscension: slot.characterAscension,
      characterPotential: slot.characterPotential,
      level: slot.level,
      characterTalentToggles: { ...slot.characterTalentToggles },
      uniqueTalentToggles: { ...slot.uniqueTalentToggles },
      characterSkillLevels: { ...slot.characterSkillLevels },
      selectedWeaponId: slot.selectedWeaponId,
      armor: slot.armor ? structuredClone(slot.armor) : null,
      gloves: slot.gloves ? structuredClone(slot.gloves) : null,
      kit1: slot.kit1 ? structuredClone(slot.kit1) : null,
      kit2: slot.kit2 ? structuredClone(slot.kit2) : null,
    };
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

    const cachedCharacterBuild = activeSlot.value!.characterBuilds[id];
    if (cachedCharacterBuild) {
      activeSlot.value!.characterAscension = cachedCharacterBuild.characterAscension;
      activeSlot.value!.characterPotential = cachedCharacterBuild.characterPotential;
      activeSlot.value!.level = cachedCharacterBuild.level;
      activeSlot.value!.characterTalentToggles = {
        ...cachedCharacterBuild.characterTalentToggles,
      };
      activeSlot.value!.characterSkillLevels = { ...cachedCharacterBuild.characterSkillLevels };
      activeSlot.value!.armor = cachedCharacterBuild.armor ? structuredClone(cachedCharacterBuild.armor) : null;
      activeSlot.value!.gloves = cachedCharacterBuild.gloves ? structuredClone(cachedCharacterBuild.gloves) : null;
      activeSlot.value!.kit1 = cachedCharacterBuild.kit1 ? structuredClone(cachedCharacterBuild.kit1) : null;
      activeSlot.value!.kit2 = cachedCharacterBuild.kit2 ? structuredClone(cachedCharacterBuild.kit2) : null;

      const allowedTalentKeys = new Set(Object.keys(nextCharacter.uniqueTalentDefs ?? {}));
      const nextUniqueToggles: Record<string, boolean> = {};
      for (const key of allowedTalentKeys) {
        nextUniqueToggles[key] = cachedCharacterBuild.uniqueTalentToggles?.[key] === true;
      }
      activeSlot.value!.uniqueTalentToggles = nextUniqueToggles;
      activeSlot.value!.selectedWeaponId = cachedCharacterBuild.selectedWeaponId;
    } else {
      activeSlot.value!.characterAscension = 4;
      activeSlot.value!.characterPotential = 0;
      activeSlot.value!.level = 1;
      activeSlot.value!.characterTalentToggles = makeDefaultTalentToggles();
      activeSlot.value!.characterSkillLevels = makeDefaultCharacterSkillLevels();
      activeSlot.value!.uniqueTalentToggles = {};
      activeSlot.value!.armor = null;
      activeSlot.value!.gloves = null;
      activeSlot.value!.kit1 = null;
      activeSlot.value!.kit2 = null;
      activeSlot.value!.selectedWeaponId = "";
    }

    if (!allowedWeapons.some((w) => w.id === activeSlot.value!.selectedWeaponId)) {
      activeSlot.value!.selectedWeaponId = "";
    }
    loadWeaponBuild();
  }

  function setCharacterLevel(level: number) {
    activeSlot.value!.level = level;
  }

  function setCharacterAscension(stage: AscensionStage) {
    activeSlot.value!.characterAscension = stage;
    activeSlot.value!.level = clampCharacterLevelToAscension(activeSlot.value!.level, stage);
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

  function loadWeaponBuild() {
    if (!activeSlot.value!.selectedCharId || !activeSlot.value!.selectedWeaponId) {
      activeSlot.value!.weaponAscension = 4;
      activeSlot.value!.weaponPotential = 0;
      activeSlot.value!.weaponLevel = 1;
      activeSlot.value!.weaponSkillLevels = [1, 1, 1];
      return;
    }

    const key = makeWeaponBuildKey(
      activeSlot.value!.selectedCharId,
      activeSlot.value!.selectedWeaponId,
    );
    const cachedWeaponBuild = activeSlot.value!.weaponBuilds[key];

    if (cachedWeaponBuild) {
      activeSlot.value!.weaponAscension = cachedWeaponBuild.weaponAscension;
      activeSlot.value!.weaponPotential = cachedWeaponBuild.weaponPotential;
      activeSlot.value!.weaponLevel = cachedWeaponBuild.weaponLevel;
      activeSlot.value!.weaponSkillLevels = [...cachedWeaponBuild.weaponSkillLevels];
      normalizeWeaponSkillLevels(activeSlot.value!);
      return;
    }

    activeSlot.value!.weaponAscension = 4;
    activeSlot.value!.weaponPotential = 0;
    activeSlot.value!.weaponLevel = 1;
    activeSlot.value!.weaponSkillLevels = [1, 1, 1];
    normalizeWeaponSkillLevels(activeSlot.value!);
  }

  function setWeaponLevel(level: number) {
    activeSlot.value!.weaponLevel = level;
  }

  function setWeaponAscension(stage: AscensionStage) {
    activeSlot.value!.weaponAscension = stage;
    activeSlot.value!.weaponLevel = clampCharacterLevelToAscension(
      activeSlot.value!.weaponLevel,
      stage,
    );
    normalizeWeaponSkillLevels(activeSlot.value!);
  }

  function setWeaponPotential(potential: PotentialLevel) {
    activeSlot.value!.weaponPotential = potential;
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
    activeSlot,
    setActiveSlot,

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
  };
});

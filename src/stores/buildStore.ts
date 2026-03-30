import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

import { CHARACTERS, type CharacterBase } from "@/data/characters";
import { WEAPONS, type WeaponBase } from "@/data/weapons";
import { GEARS, type GearBase } from "@/data/gears";

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
import { resolveCommandsDefinition, resolveCommandsAtLevel } from "@/lib/commands";

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
  const defaultCharacter = firstOrThrow(CHARACTERS, "CHARACTERS");
  const defaultWeapon = firstOrThrow(WEAPONS, "WEAPONS");

  return {
    id: `slot_${index + 1}`,
    label: `Character ${index + 1}`,

    selectedCharId: defaultCharacter.id,
    characterAscension: 4,
    characterPotential: 0,
    level: 1,

    characterTalentToggles: makeDefaultTalentToggles(),
    uniqueTalentToggles: {},
    characterSkillLevels: makeDefaultCharacterSkillLevels(),

    selectedWeaponId: defaultWeapon.id,
    weaponAscension: 4,
    weaponPotential: 0,
    weaponLevel: 1,
    weaponSkillLevels: [1, 1, 1],

    armor: null,
    gloves: null,
    kit1: null,
    kit2: null,

    activeBuffs: [],
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

  const selectedChar = computed(() => getCharacterById(activeSlot.value!.selectedCharId));

  const availableWeapons = computed(() =>
    WEAPONS.filter((w) => w.weaponType === selectedChar.value.weaponType),
  );

  const selectedWeapon = computed(() => {
    return (
      availableWeapons.value.find((w) => w.id === activeSlot.value!.selectedWeaponId) ??
      availableWeapons.value[0] ??
      firstOrThrow(WEAPONS, "WEAPONS")
    );
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

  const resolvedCommandsDefinition = computed(() =>
    resolveCommandsDefinition(selectedChar.value.commands ?? []),
  );

  const resolvedCommands = computed(() =>
    resolveCommandsAtLevel(
      resolvedCommandsDefinition.value,
      activeSlot.value!.characterSkillLevels,
    ),
  );

  const benchmarkResults = computed(() => {
    return (selectedChar.value.benchmarks ?? []).map((bm) => {
      const result = bm.compute({
        char: selectedChar.value,
        finalStats: out.value,
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

  function setActiveSlot(index: number) {
    if (index < 0 || index > 3) return;
    activeSlotIndex.value = index;
  }

  function setCharacter(id: string) {
    activeSlot.value!.selectedCharId = id;
    const nextCharacter = getCharacterById(id);

    const allowedWeapons = WEAPONS.filter(
      (w) => w.weaponType === nextCharacter.weaponType,
    );

    if (!allowedWeapons.some((w) => w.id === activeSlot.value!.selectedWeaponId)) {
      const fallback = allowedWeapons[0];
      if (fallback) {
        activeSlot.value!.selectedWeaponId = fallback.id;
      }
    }

    const allowedTalentKeys = new Set(Object.keys(nextCharacter.uniqueTalentDefs ?? {}));
    const nextUniqueToggles: Record<string, boolean> = {};
    for (const key of allowedTalentKeys) {
      nextUniqueToggles[key] = activeSlot.value!.uniqueTalentToggles?.[key] === true;
    }
    activeSlot.value!.uniqueTalentToggles = nextUniqueToggles;
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
    activeSlot.value!.uniqueTalentToggles[key] =
      !activeSlot.value!.uniqueTalentToggles[key];
  }

  function setCharacterSkillLevel(key: CharacterSkillKey, value: number) {
    activeSlot.value!.characterSkillLevels[key] = value;
  }

  function setWeapon(id: string) {
    activeSlot.value!.selectedWeaponId = id;
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

  const out = computed(() =>
    computeFinalStats({
      char: selectedChar.value,
      level: activeSlot.value!.level,
      weapon: selectedWeapon.value,
      weaponLevel: activeSlot.value!.weaponLevel,
      weaponSkillLevels: activeSlot.value!.weaponSkillLevels,

      characterAscensionStage: activeSlot.value!.characterAscension,
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
    }),
  );

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

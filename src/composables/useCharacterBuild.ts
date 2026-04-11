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
} from "@/lib/build/characterSkills";
import {
  resolveCommandsDefinition,
  resolveCommandsAtLevel,
} from "@/lib/commands";
import type { BuffInstance } from "@/lib/buffs";
import type { CharacterTalentToggles, CharacterTalentKey } from "@/lib/build/characterTalents";
import { getWeaponUniqueStaticModifiers } from "@/lib/combat/weaponEffects";

function firstOrThrow<T>(arr: T[], name: string): T {
  const value = arr[0];
  if (!value) {
    throw new Error(`${name} is empty`);
  }
  return value;
}

export function useCharacterBuild() {
  const defaultCharacter: CharacterBase = firstOrThrow(CHARACTERS, "CHARACTERS");
  const selectedCharId = ref<string>(defaultCharacter.id);

  const selectedChar = computed<CharacterBase>(() => {
    return CHARACTERS.find((c) => c.id === selectedCharId.value) ?? defaultCharacter;
  });

  const availableWeapons = computed(() =>
    WEAPONS.filter((w) => w.weaponType === selectedChar.value.weaponType)
  );

  const defaultWeapon: WeaponBase =
    availableWeapons.value[0] ?? firstOrThrow(WEAPONS, "WEAPONS");

  const selectedWeaponId = ref<string>(defaultWeapon.id);

  const selectedWeapon = computed<WeaponBase>(() => {
    return (
      availableWeapons.value.find((w) => w.id === selectedWeaponId.value) ??
      availableWeapons.value[0] ??
      defaultWeapon
    );
  });

  const characterAscension = ref<AscensionStage>(4);
  const characterPotential = ref<PotentialLevel>(0);

  const weaponAscension = ref<AscensionStage>(4);
  const weaponPotential = ref<PotentialLevel>(0);

  const characterTalentToggles = ref<CharacterTalentToggles>({
    TALENT_1: false,
    TALENT_2: false,
    TALENT_3: false,
    TALENT_4: false,
  });

  const level = ref<number>(1);
  const weaponLevel = ref<number>(1);

  const weaponSkillLevels = ref<number[]>([1, 1, 1]);

  const atkPct = ref<number>(0);
  const flatAtk = ref<number>(0);
  const hpPct = ref<number>(0);

  const armor = ref<GearInstance | null>(null);
  const gloves = ref<GearInstance | null>(null);
  const kit1 = ref<GearInstance | null>(null);
  const kit2 = ref<GearInstance | null>(null);

  const activeBuffs = ref<BuffInstance[]>([]);

  const characterSkillLevels = ref<CharacterSkillLevels>(
    makeDefaultCharacterSkillLevels()
  );

  function findGear(id: string): GearBase | null {
    return GEARS.find((g) => g.id === id) ?? null;
  }

  function setGear(slot: "armor" | "gloves" | "kit1" | "kit2", gearId: string) {
    const gear = findGear(gearId);
    const next = gear ? makeGearInstance(gear) : null;

    if (slot === "armor") armor.value = next;
    else if (slot === "gloves") gloves.value = next;
    else if (slot === "kit1") kit1.value = next;
    else kit2.value = next;
  }

  function updateGearSubLevel(
    slot: "armor" | "gloves" | "kit1" | "kit2",
    index: number,
    value: GearSubLevel,
  ) {
    const target =
      slot === "armor"
        ? armor.value
        : slot === "gloves"
          ? gloves.value
          : slot === "kit1"
            ? kit1.value
            : kit2.value;

    if (!target) return;

    target.subLevels[index] = value;
  }

  function updateWeaponSkillLevel(payload: { index: number; value: number }) {
    const s1 = getWeaponSkill1Range(weaponAscension.value);
    const s2 = getWeaponSkill2Range(weaponAscension.value);
    const s3 = getWeaponSkill3Range(weaponPotential.value);

    const ranges = [s1, s2, s3];
    const range = ranges[payload.index];
    if (!range) return;

    const next = [...weaponSkillLevels.value];
    next[payload.index] = clampWeaponSkillLevel(payload.value, range.min, range.max);
    weaponSkillLevels.value = next;
  }

  function normalizeWeaponSkillLevels() {
    const s1 = getWeaponSkill1Range(weaponAscension.value);
    const s2 = getWeaponSkill2Range(weaponAscension.value);
    const s3 = getWeaponSkill3Range(weaponPotential.value);

    weaponSkillLevels.value = [
      clampWeaponSkillLevel(weaponSkillLevels.value[0] ?? s1.min, s1.min, s1.max),
      clampWeaponSkillLevel(weaponSkillLevels.value[1] ?? s2.min, s2.min, s2.max),
      clampWeaponSkillLevel(weaponSkillLevels.value[2] ?? s3.min, s3.min, s3.max),
    ];
  }

  function toggleTalent(key: CharacterTalentKey) {
    characterTalentToggles.value[key] = !characterTalentToggles.value[key];
  }

  const weaponPassiveResolution = computed(() => {
    return {
      modsDelta: getWeaponUniqueStaticModifiers({
        weaponId: selectedWeapon.value.id,
        uniqueSkillLevel: weaponSkillLevels.value[2] ?? 1,
      }),
      buffDefinitions: [],
    };
  });

  watch(
    weaponPassiveResolution,
    () => {
      activeBuffs.value = [];
    },
    { immediate: true }
  );

  const armorOptions = computed<GearBase[]>(() =>
    GEARS.filter((g) => g.slot === "ARMOR")
  );

  const gloveOptions = computed<GearBase[]>(() =>
    GEARS.filter((g) => g.slot === "GLOVES")
  );

  const kitOptions = computed<GearBase[]>(() =>
    GEARS.filter((g) => g.slot === "KIT")
  );

  const selectedGearObjects = computed(() => ({
    armor: armor.value ? findGear(armor.value.gearId) : null,
    gloves: gloves.value ? findGear(gloves.value.gearId) : null,
    kit1: kit1.value ? findGear(kit1.value.gearId) : null,
    kit2: kit2.value ? findGear(kit2.value.gearId) : null,
  }));

  const resolvedCommandsDefinition = computed(() =>
    resolveCommandsDefinition(selectedChar.value.commands ?? [])
  );

  const resolvedCommands = computed(() =>
    resolveCommandsAtLevel(resolvedCommandsDefinition.value, characterSkillLevels.value, {
      ascensionStage: characterAscension.value,
      uniqueTalentToggles: {},
      uniqueTalentConditions: Object.fromEntries(
        Object.entries(selectedChar.value.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.condition]),
      ),
      uniqueTalentDefaults: Object.fromEntries(
        Object.entries(selectedChar.value.uniqueTalentDefs ?? {}).map(([key, talent]) => [key, talent.defaultEnabled === true]),
      ),
    })
  );

  const out = computed(() =>
    computeFinalStats({
      char: selectedChar.value,
      level: level.value,
      weapon: selectedWeapon.value,
      weaponLevel: weaponLevel.value,
      weaponSkillLevels: weaponSkillLevels.value,

      characterAscensionStage: characterAscension.value,
      characterPotential: characterPotential.value,
      characterTalentToggles: characterTalentToggles.value,
      weaponAscensionStage: weaponAscension.value,
      weaponPotential: weaponPotential.value,

      gearBases: [
        selectedGearObjects.value.armor,
        selectedGearObjects.value.gloves,
        selectedGearObjects.value.kit1,
        selectedGearObjects.value.kit2,
      ],
      gearInstances: [
        armor.value,
        gloves.value,
        kit1.value,
        kit2.value,
      ],

      extraModifierDeltas: weaponPassiveResolution.value.modsDelta,
      buffDefinitions: weaponPassiveResolution.value.buffDefinitions,
      buffStates: activeBuffs.value,

      atkPct: atkPct.value,
      flatAtk: flatAtk.value,
      hpPct: hpPct.value,
    })
  );

  const benchmarkResults = computed(() => {
    return (selectedChar.value.benchmarks ?? []).map((bm) => {
      const result = bm.compute({
        char: selectedChar.value,
        finalStats: out.value,
        resolvedCommands: resolvedCommands.value,
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

  watch(characterAscension, (stage) => {
    level.value = clampCharacterLevelToAscension(level.value, stage);
  });

  watch(weaponAscension, (stage) => {
    weaponLevel.value = clampCharacterLevelToAscension(weaponLevel.value, stage);
    normalizeWeaponSkillLevels();
  });

  watch(weaponPotential, () => {
    normalizeWeaponSkillLevels();
  });

  watch(selectedWeaponId, () => {
    normalizeWeaponSkillLevels();
  });

  watch(selectedCharId, () => {
    const firstAllowed = availableWeapons.value[0];
    if (!firstAllowed) return;

    const currentAllowed = availableWeapons.value.some(
      (w) => w.id === selectedWeaponId.value,
    );

    if (!currentAllowed) {
      selectedWeaponId.value = firstAllowed.id;
    }
  });

  normalizeWeaponSkillLevels();

  return {
    CHARACTERS,

    selectedCharId,
    selectedChar,

    availableWeapons,
    selectedWeaponId,
    selectedWeapon,

    characterAscension,
    characterPotential,
    characterTalentToggles,
    characterSkillLevels,

    weaponAscension,
    weaponPotential,
    weaponSkillLevels,

    level,
    weaponLevel,

    atkPct,
    flatAtk,
    hpPct,

    armor,
    gloves,
    kit1,
    kit2,

    armorOptions,
    gloveOptions,
    kitOptions,
    selectedGearObjects,

    activeBuffs,
    weaponPassiveResolution,

    resolvedCommands,
    benchmarkResults,
    out,

    setGear,
    updateGearSubLevel,
    updateWeaponSkillLevel,
    toggleTalent,
  };
}

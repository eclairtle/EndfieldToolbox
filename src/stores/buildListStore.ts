import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  BUILD_LIST_STORAGE_KEY,
  BUILD_STORE_STORAGE_KEY,
  ROTATION_ENEMY_COMMANDS_STORAGE_KEY,
  ROTATION_SCHEMES_STORAGE_KEY,
  ROTATION_SP_STORAGE_KEY,
} from "@/lib/storageKeys";
import type { BuildStoreStateSnapshot } from "@/stores/buildStore";
import { createDefaultBuildStoreStateSnapshot } from "@/stores/buildStore";
import type { RotationSchemesState } from "@/lib/combat/rotationSchemes";
import { createDefaultRotationSchemesState } from "@/lib/combat/rotationSchemes";

export type BuildSummarySnapshot = {
  totalDamage: number | null;
  dps: number | null;
  updatedAt: number | null;
};

export type DamageTallyTiming = {
  enabled: boolean;
  startTime: number;
  endTime: number;
};

export type SavedBuild = {
  id: string;
  name: string;
  currentBuildState: BuildStoreStateSnapshot;
  plannedBuildState: BuildStoreStateSnapshot;
  rotationState: RotationSchemesState;
  summary: BuildSummarySnapshot;
  damageTallyTiming: DamageTallyTiming;
};

function makeBuildId() {
  return `build_${Math.random().toString(36).slice(2, 10)}`;
}

function makeDefaultBuild(index: number): SavedBuild {
  return {
    id: makeBuildId(),
    name: `Build ${index}`,
    currentBuildState: createDefaultBuildStoreStateSnapshot(),
    plannedBuildState: createDefaultBuildStoreStateSnapshot(),
    rotationState: createDefaultRotationSchemesState(),
    summary: {
      totalDamage: null,
      dps: null,
      updatedAt: null,
    },
    damageTallyTiming: {
      enabled: false,
      startTime: 0,
      endTime: 60,
    },
  };
}

function makeDefaultExampleBuildLastRite(): SavedBuild {
  const build = makeDefaultBuild(1);
  build.id = "build_sb34yazo";
  build.name = "别礼大王11秒罗丹";

  const [slot1, slot2, slot3, slot4] = build.currentBuildState.slots;
  if (slot1 && slot2 && slot3 && slot4) {
    slot1.selectedCharId = "lastrite";
    slot1.characterAscension = 4;
    slot1.characterPotential = 5;
    slot1.level = 90;
    slot1.selectedWeaponId = "khravengger";
    slot1.weaponAscension = 4;
    slot1.weaponPotential = 5;
    slot1.weaponLevel = 90;
    slot1.weaponSkillLevels = [9, 9, 9];
    slot1.characterSkillLevels = { basic: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 };
    slot1.uniqueTalentToggles = {
      lastrite_talent_cryo_sus_1: true,
      lastrite_talent_cryo_sus_2: true,
      lastrite_talent_ult_sus_scale_1: true,
      lastrite_talent_ult_sus_scale_2: true,
    };
    slot1.armor = { gearId: "item_equip_t4_suit_attri01_body_03", subLevels: [1, 3, 3] };
    slot1.gloves = { gearId: "item_equip_t4_suit_burst01_hand_01", subLevels: [3, 1, 3] };
    slot1.kit1 = { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 1, 3] };
    slot1.kit2 = { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 2, 3] };

    slot2.selectedCharId = "ardelia";
    slot2.characterAscension = 4;
    slot2.characterPotential = 5;
    slot2.level = 90;
    slot2.selectedWeaponId = "dreams_of_the_starry_beach";
    slot2.weaponAscension = 4;
    slot2.weaponPotential = 5;
    slot2.weaponLevel = 90;
    slot2.weaponSkillLevels = [9, 4, 9];
    slot2.characterSkillLevels = { basic: 9, battleSkill: 12, comboSkill: 9, ultimate: 10 };
    slot2.uniqueTalentToggles = {
      ardelia_friendly_presence_1: true,
      ardelia_friendly_presence_2: true,
      ardelia_friendly_presence_3: true,
      ardelia_mountainpeak_surfer: true,
    };
    slot2.armor = { gearId: "item_equip_t4_suit_criti01_body_03", subLevels: [0, 0, 0] };
    slot2.gloves = { gearId: "item_equip_t4_suit_fire_natr01_hand_03", subLevels: [0, 0, 0] };
    slot2.kit1 = { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] };
    slot2.kit2 = { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] };

    slot3.selectedCharId = "xaihi";
    slot3.characterAscension = 4;
    slot3.characterPotential = 5;
    slot3.level = 90;
    slot3.selectedWeaponId = "detonation_unit";
    slot3.weaponAscension = 4;
    slot3.weaponPotential = 5;
    slot3.weaponLevel = 90;
    slot3.weaponSkillLevels = [9, 9, 9];
    slot3.characterSkillLevels = { basic: 9, battleSkill: 10, comboSkill: 9, ultimate: 12 };
    slot3.uniqueTalentToggles = {
      xaihi_execute_process_1: true,
      xaihi_execute_process_2: true,
      xaihi_freeze_protocol: true,
    };
    slot3.armor = { gearId: "item_equip_t4_suit_usp02_body_01", subLevels: [0, 0, 0] };
    slot3.gloves = { gearId: "item_equip_t4_suit_usp02_hand_02", subLevels: [3, 0, 0] };
    slot3.kit1 = { gearId: "item_equip_t4_suit_usp02_edc_02", subLevels: [0, 0, 0] };
    slot3.kit2 = { gearId: "item_equip_t4_suit_atb01_edc_04", subLevels: [0, 3, 3] };

    slot4.selectedCharId = "perlica";
    slot4.characterAscension = 4;
    slot4.characterPotential = 5;
    slot4.level = 90;
    slot4.selectedWeaponId = "stanza_of_memorials";
    slot4.weaponAscension = 4;
    slot4.weaponPotential = 5;
    slot4.weaponLevel = 90;
    slot4.weaponSkillLevels = [7, 3, 9];
    slot4.characterSkillLevels = { basic: 9, battleSkill: 9, comboSkill: 9, ultimate: 9 };
    slot4.uniqueTalentToggles = {
      perlica_talent_staggered_damage_1: true,
      perlica_talent_staggered_damage_2: true,
      perlica_talent_combo_chain_1: true,
    };
    slot4.armor = { gearId: "item_equip_t4_suit_pulse_cryst01_body_01", subLevels: [0, 0, 3] };
    slot4.gloves = { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [0, 0, 2] };
    slot4.kit1 = { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] };
    slot4.kit2 = { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] };
  }
  build.currentBuildState.activeSlotIndex = 2;
  build.plannedBuildState = cloneJson(build.currentBuildState);
  build.plannedBuildState.activeSlotIndex = 3;

  const scheme = build.rotationState.schemes[0];
  if (scheme) {
    scheme.id = "rotation_xpzih3i3";
    scheme.name = "Rotation 1";
    scheme.rotation.steps = [
      { id: "step_yx248t0q", slot: 0, commandId: "lastrite_battle_skill", startTime: -9.9 },
      { id: "step_r7a98fhj", slot: 2, commandId: "xaihi_battle_skill", startTime: -9.2 },
      { id: "step_rbtfoijo", slot: 2, commandId: "xaihi_ultimate", startTime: -5.3 },
      { id: "step_0ll65ix7", slot: 1, commandId: "ardelia_ultimate", startTime: -3.7 },
      { id: "step_d99fzzg9", slot: 3, commandId: "perlica_ultimate", startTime: -1.9 },
      { id: "step_yw36e18u", slot: 0, commandId: "lastrite_basic_sequence_1", startTime: -8.9, groupId: "group_dlwvzyjf" },
      { id: "step_mc4sfksf", slot: 0, commandId: "lastrite_basic_sequence_2", startTime: -8.3, groupId: "group_dlwvzyjf" },
      { id: "step_vb0qnjs4", slot: 0, commandId: "lastrite_basic_sequence_3", startTime: -7.5, groupId: "group_dlwvzyjf" },
      { id: "step_sayh2y3n", slot: 0, commandId: "lastrite_basic_sequence_4", startTime: -5.7, groupId: "group_dlwvzyjf" },
      { id: "step_o34mcvu9", slot: 2, commandId: "__switch", startTime: 0.3 },
      { id: "step_y5x7jpux", slot: 2, commandId: "xaihi_basic_sequence_1", startTime: 0.6 },
      { id: "step_50cdfocb", slot: 2, commandId: "xaihi_basic_sequence_2", startTime: 1.1 },
      { id: "step_1r8o9gqg", slot: 2, commandId: "xaihi_basic_sequence_3", startTime: 1.7 },
      { id: "step_7b12jbas", slot: 2, commandId: "xaihi_basic_sequence_4", startTime: 2.2 },
      { id: "step_n1002i5p", slot: 2, commandId: "xaihi_basic_sequence_5", startTime: 2.9 },
      { id: "step_a4k932pm", slot: 0, commandId: "lastrite_battle_skill", startTime: 0.6 },
      { id: "step_zcgyg92f", slot: 2, commandId: "xaihi_combo_skill", startTime: 3.7 },
      { id: "step_102updpe", slot: 3, commandId: "perlica_combo_skill", startTime: 3.7 },
      { id: "step_8f4unvna", slot: 1, commandId: "ardelia_combo_skill", startTime: 3.7 },
      { id: "step_yor7p2qw", slot: 2, commandId: "xaihi_basic_sequence_1", startTime: 4.7 },
      { id: "step_2utrngbe", slot: 2, commandId: "xaihi_basic_sequence_2", startTime: 5.8 },
      { id: "step_d40hb14d", slot: 2, commandId: "xaihi_basic_sequence_3", startTime: 6.3 },
      { id: "step_j5fh0b24", slot: 2, commandId: "xaihi_basic_sequence_4", startTime: 6.8 },
      { id: "step_ps6kgcpg", slot: 2, commandId: "xaihi_basic_sequence_5", startTime: 7 },
      { id: "step_wqic1zyf", slot: 0, commandId: "lastrite_battle_skill", startTime: 5.8 },
      { id: "step_v5h1csgs", slot: 1, commandId: "ardelia_battle_skill", startTime: 6.2 },
      { id: "step_lx6tljsh", slot: 0, commandId: "lastrite_combo_skill", startTime: 8.2 },
    ];
    scheme.rotation.groups = [{ id: "group_dlwvzyjf", name: "group 1" }];
    scheme.rotation.critRiggingRules = [];
    build.rotationState.activeSchemeId = scheme.id;
  }

  build.rotationState.enemyLevel = 90;
  build.summary = {
    totalDamage: 2134915.1116965273,
    dps: 190617.42068718997,
    updatedAt: 1778205335297,
  };
  build.damageTallyTiming = {
    enabled: false,
    startTime: 0,
    endTime: 60,
  };
  return build;
}

function seedDefaultRotationUiStateForBuild(build: SavedBuild) {
  if (typeof window === "undefined") {
    return;
  }
  const activeSchemeId = build.rotationState.activeSchemeId;
  if (!activeSchemeId) {
    return;
  }

  const spRaw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
  let spParsed: { byBuild?: Record<string, { byScheme?: Record<string, unknown> }> } = {};
  if (spRaw) {
    try {
      spParsed = JSON.parse(spRaw) as typeof spParsed;
    } catch {
      spParsed = {};
    }
  }
  if (!spParsed.byBuild) {
    spParsed.byBuild = {};
  }
  spParsed.byBuild[build.id] = {
    byScheme: {
      [activeSchemeId]: {
        initialSp: 200,
        spRegenRate: 8,
        startingEnergyBySlot: [0, 0, 0, 0],
        consumableBySlot: [null, null, null, null],
      },
    },
  };
  window.localStorage.setItem(ROTATION_SP_STORAGE_KEY, JSON.stringify(spParsed));

  const enemyRaw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
  let enemyParsed: { byBuild?: Record<string, { byScheme?: Record<string, Record<string, unknown[]>> }> } = {};
  if (enemyRaw) {
    try {
      enemyParsed = JSON.parse(enemyRaw) as typeof enemyParsed;
    } catch {
      enemyParsed = {};
    }
  }
  if (!enemyParsed.byBuild) {
    enemyParsed.byBuild = {};
  }
  enemyParsed.byBuild[build.id] = {
    byScheme: {
      [activeSchemeId]: {
        rhodagn: [],
      },
    },
  };
  window.localStorage.setItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY, JSON.stringify(enemyParsed));
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function coerceBuildStateSnapshot(value: unknown): BuildStoreStateSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<BuildStoreStateSnapshot>;
  if (!Array.isArray(maybe.slots) || maybe.slots.length !== 4) {
    return null;
  }

  const activeSlotIndex =
    typeof maybe.activeSlotIndex === "number" && maybe.activeSlotIndex >= 0 && maybe.activeSlotIndex < 4
      ? maybe.activeSlotIndex
      : 0;

  return {
    slots: cloneJson(maybe.slots),
    activeSlotIndex,
  };
}

function coerceRotationStateSnapshot(value: unknown): RotationSchemesState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<RotationSchemesState>;
  if (!Array.isArray(maybe.schemes) || maybe.schemes.length === 0) {
    return null;
  }

  return cloneJson(maybe as RotationSchemesState);
}

function loadLegacySingleBuild(): { buildState: BuildStoreStateSnapshot; rotationState: RotationSchemesState } | null {
  try {
    const legacyBuildRaw = localStorage.getItem(BUILD_STORE_STORAGE_KEY);
    const legacyRotationRaw = localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
    const legacyBuild = legacyBuildRaw ? coerceBuildStateSnapshot(JSON.parse(legacyBuildRaw)) : null;
    const legacyRotation = legacyRotationRaw ? coerceRotationStateSnapshot(JSON.parse(legacyRotationRaw)) : null;
    if (!legacyBuild || !legacyRotation) {
      return null;
    }
    return {
      buildState: legacyBuild,
      rotationState: legacyRotation,
    };
  } catch (error) {
    console.warn("Failed to migrate legacy single-build storage", error);
    return null;
  }
}

function isBuildRuntimeBlank(build: SavedBuild): boolean {
  const hasAnyCharacter = build.currentBuildState.slots.some((slot) => Boolean(slot.selectedCharId));
  const hasAnyWeapon = build.currentBuildState.slots.some((slot) => Boolean(slot.selectedWeaponId));
  const hasAnyGear = build.currentBuildState.slots.some((slot) =>
    Boolean(slot.armor?.gearId || slot.gloves?.gearId || slot.kit1?.gearId || slot.kit2?.gearId),
  );
  const hasAnyRotationSteps = build.rotationState.schemes.some((scheme) => (scheme.rotation.steps?.length ?? 0) > 0);
  return !hasAnyCharacter && !hasAnyWeapon && !hasAnyGear && !hasAnyRotationSteps;
}

export const useBuildListStore = defineStore("buildListStore", () => {
  const MAX_BUILDS_PER_USER = 6;
  const builds = ref<SavedBuild[]>([]);
  const activeBuildId = ref<string>("");

  function createSeededDefaultBuilds() {
    const first = makeDefaultBuild(1);
    const example = makeDefaultExampleBuildLastRite();
    seedDefaultRotationUiStateForBuild(example);
    return {
      builds: [example, first],
      activeBuildId: example.id,
    };
  }

  function normalizeStoredBuild(
    raw: Partial<SavedBuild> & { buildState?: BuildStoreStateSnapshot },
    index: number,
  ): SavedBuild {
    const fallback = makeDefaultBuild(index + 1);
    const legacyBuildState =
      raw.buildState && Array.isArray(raw.buildState.slots) && raw.buildState.slots.length === 4
        ? cloneJson(raw.buildState)
        : null;
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : fallback.id,
      name: typeof raw.name === "string" && raw.name ? raw.name : fallback.name,
      currentBuildState:
        raw.currentBuildState && Array.isArray(raw.currentBuildState.slots) && raw.currentBuildState.slots.length === 4
          ? cloneJson(raw.currentBuildState)
          : legacyBuildState ?? fallback.currentBuildState,
      plannedBuildState:
        raw.plannedBuildState && Array.isArray(raw.plannedBuildState.slots) && raw.plannedBuildState.slots.length === 4
          ? cloneJson(raw.plannedBuildState)
          : legacyBuildState ?? fallback.plannedBuildState,
      rotationState:
        raw.rotationState && Array.isArray(raw.rotationState.schemes) && raw.rotationState.schemes.length > 0
          ? cloneJson(raw.rotationState)
          : fallback.rotationState,
      summary: {
        totalDamage:
          typeof raw.summary?.totalDamage === "number" && Number.isFinite(raw.summary.totalDamage)
            ? raw.summary.totalDamage
            : null,
        dps:
          typeof raw.summary?.dps === "number" && Number.isFinite(raw.summary.dps)
            ? raw.summary.dps
            : null,
        updatedAt:
          typeof raw.summary?.updatedAt === "number" && Number.isFinite(raw.summary.updatedAt)
            ? raw.summary.updatedAt
            : null,
      },
      damageTallyTiming: {
        enabled: raw.damageTallyTiming?.enabled === true,
        startTime:
          typeof raw.damageTallyTiming?.startTime === "number" && Number.isFinite(raw.damageTallyTiming.startTime)
            ? raw.damageTallyTiming.startTime
            : 0,
        endTime:
          typeof raw.damageTallyTiming?.endTime === "number" && Number.isFinite(raw.damageTallyTiming.endTime)
            ? raw.damageTallyTiming.endTime
            : 60,
      },
    };
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(BUILD_LIST_STORAGE_KEY);
    if (!raw) {
      const legacySingleBuild = loadLegacySingleBuild();
      if (legacySingleBuild) {
        const first = makeDefaultBuild(1);
        first.currentBuildState = legacySingleBuild.buildState;
        first.plannedBuildState = cloneJson(legacySingleBuild.buildState);
        first.rotationState = legacySingleBuild.rotationState;
        builds.value = [first];
        activeBuildId.value = first.id;
        return;
      }

      const seeded = createSeededDefaultBuilds();
      builds.value = seeded.builds;
      activeBuildId.value = seeded.activeBuildId;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { builds?: Partial<SavedBuild>[]; activeBuildId?: string };
      const normalized = Array.isArray(parsed.builds)
        ? parsed.builds.map((entry, index) => normalizeStoredBuild(entry, index))
        : [];

      if (normalized.length === 0) {
        const first = makeDefaultBuild(1);
        builds.value = [first];
        activeBuildId.value = first.id;
        return;
      }

      builds.value = normalized;
      activeBuildId.value =
        typeof parsed.activeBuildId === "string" && normalized.some((build) => build.id === parsed.activeBuildId)
          ? parsed.activeBuildId
          : normalized[0]!.id;

      if (normalized.length === 1 && isBuildRuntimeBlank(normalized[0]!)) {
        const legacySingleBuild = loadLegacySingleBuild();
        if (legacySingleBuild) {
          normalized[0]!.currentBuildState = legacySingleBuild.buildState;
          normalized[0]!.plannedBuildState = cloneJson(legacySingleBuild.buildState);
          normalized[0]!.rotationState = legacySingleBuild.rotationState;
        }
      }
    } catch (error) {
      console.warn("Failed to load build list from localStorage", error);
      const first = makeDefaultBuild(1);
      builds.value = [first];
      activeBuildId.value = first.id;
    }
  }

  function saveToStorage() {
    localStorage.setItem(
      BUILD_LIST_STORAGE_KEY,
      JSON.stringify({
        builds: builds.value,
        activeBuildId: activeBuildId.value,
      }),
    );
  }

  loadFromStorage();

  watch([builds, activeBuildId], saveToStorage, { deep: true });

  const activeBuild = computed(() => builds.value.find((build) => build.id === activeBuildId.value) ?? null);

  function createBuild(): string | null {
    if (builds.value.length >= MAX_BUILDS_PER_USER) {
      return null;
    }
    const next = makeDefaultBuild(builds.value.length + 1);
    builds.value.push(next);
    return next.id;
  }

  function setActiveBuild(id: string) {
    if (builds.value.some((build) => build.id === id)) {
      activeBuildId.value = id;
    }
  }

  function updateBuildRuntime(args: {
    buildId: string;
    currentBuildState: BuildStoreStateSnapshot;
    plannedBuildState: BuildStoreStateSnapshot;
    rotationState: RotationSchemesState;
    summary?: { totalDamage: number; dps: number };
    damageTallyTiming?: DamageTallyTiming;
  }) {
    const target = builds.value.find((build) => build.id === args.buildId);
    if (!target) {
      return;
    }

    target.currentBuildState = cloneJson(args.currentBuildState);
    target.plannedBuildState = cloneJson(args.plannedBuildState);
    target.rotationState = cloneJson(args.rotationState);
    if (args.summary) {
      target.summary = {
        totalDamage: args.summary.totalDamage,
        dps: args.summary.dps,
        updatedAt: Date.now(),
      };
    }
    if (args.damageTallyTiming) {
      target.damageTallyTiming = cloneJson(args.damageTallyTiming);
    }
  }

  function renameBuild(id: string, name: string) {
    const target = builds.value.find((build) => build.id === id);
    const trimmed = name.trim();
    if (!target || !trimmed) {
      return;
    }
    target.name = trimmed;
  }

  function removeBuild(id: string) {
    const index = builds.value.findIndex((build) => build.id === id);
    if (index < 0) {
      return;
    }
    builds.value.splice(index, 1);

    if (builds.value.length === 0) {
      const first = makeDefaultBuild(1);
      builds.value = [first];
      activeBuildId.value = first.id;
      return;
    }

    if (activeBuildId.value === id) {
      activeBuildId.value = builds.value[Math.max(0, index - 1)]!.id;
    }
  }

  function resetAll() {
    const seeded = createSeededDefaultBuilds();
    builds.value = seeded.builds;
    activeBuildId.value = seeded.activeBuildId;
    localStorage.removeItem(BUILD_LIST_STORAGE_KEY);
  }

  return {
    builds,
    activeBuildId,
    activeBuild,
    createBuild,
    setActiveBuild,
    updateBuildRuntime,
    renameBuild,
    removeBuild,
    resetAll,
  };
});

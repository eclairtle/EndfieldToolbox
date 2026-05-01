import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  BUILD_LIST_STORAGE_KEY,
  BUILD_STORE_STORAGE_KEY,
  ROTATION_SCHEMES_STORAGE_KEY,
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

export type SavedBuild = {
  id: string;
  name: string;
  currentBuildState: BuildStoreStateSnapshot;
  plannedBuildState: BuildStoreStateSnapshot;
  rotationState: RotationSchemesState;
  summary: BuildSummarySnapshot;
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
  };
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
  const builds = ref<SavedBuild[]>([]);
  const activeBuildId = ref<string>("");

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

      const first = makeDefaultBuild(1);
      builds.value = [first];
      activeBuildId.value = first.id;
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

  function createBuild() {
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
    const first = makeDefaultBuild(1);
    builds.value = [first];
    activeBuildId.value = first.id;
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

import { computed, ref, watch, type Ref } from "vue";
import type { Rotation } from "@/lib/combat/rotation";
import { ROTATION_SCHEMES_STORAGE_KEY } from "@/lib/storageKeys";

export type RotationScheme = {
  id: string;
  name: string;
  rotation: Rotation;
};

export type RotationSchemesState = {
  schemes: RotationScheme[];
  activeSchemeId: string;
  enemyLevel: number;
};

let stateRef: Ref<RotationSchemesState> | null = null;
let initialized = false;
const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";
let activeBuildScopeId = BUILD_STORAGE_SCOPE_DEFAULT;

function createRotation(): Rotation {
  return { steps: [], groups: [], critRiggingRules: [] };
}

function createScheme(index: number): RotationScheme {
  return {
    id: `rotation_${Math.random().toString(36).slice(2, 10)}`,
    name: `Rotation ${index}`,
    rotation: createRotation(),
  };
}

export function createDefaultRotationSchemesState(): RotationSchemesState {
  const scheme = createScheme(1);
  return {
    schemes: [scheme],
    activeSchemeId: scheme.id,
    enemyLevel: 90,
  };
}

function normalizeRotation(value: Partial<Rotation> | null | undefined): Rotation {
  return {
    steps: Array.isArray(value?.steps) ? value.steps : [],
    groups: Array.isArray(value?.groups) ? value.groups : [],
    critRiggingRules: Array.isArray(value?.critRiggingRules) ? value.critRiggingRules : [],
  };
}

function normalizeState(value: Partial<RotationSchemesState> | null | undefined): RotationSchemesState {
  const schemes = Array.isArray(value?.schemes)
    ? value.schemes.map((scheme, index) => ({
        id: typeof scheme?.id === "string" && scheme.id ? scheme.id : `rotation_${index}`,
        name: typeof scheme?.name === "string" && scheme.name ? scheme.name : `Rotation ${index + 1}`,
        rotation: normalizeRotation(scheme?.rotation),
      }))
    : [];

  if (schemes.length === 0) {
    return createDefaultRotationSchemesState();
  }

  const activeSchemeId =
    typeof value?.activeSchemeId === "string" && schemes.some((scheme) => scheme.id === value.activeSchemeId)
      ? value.activeSchemeId
      : schemes[0]!.id;

  return {
    schemes,
    activeSchemeId,
    enemyLevel:
      typeof value?.enemyLevel === "number" && Number.isFinite(value.enemyLevel)
        ? Math.max(1, Math.min(100, Math.round(value.enemyLevel)))
        : 90,
  };
}

function cloneRotationSchemesState(value: RotationSchemesState): RotationSchemesState {
  return JSON.parse(JSON.stringify(value)) as RotationSchemesState;
}

function getBuildScopeId(buildId: string | null | undefined): string {
  return typeof buildId === "string" && buildId.length > 0
    ? buildId
    : BUILD_STORAGE_SCOPE_DEFAULT;
}

function loadStateForScope(scopeId: string): RotationSchemesState {
  if (typeof window === "undefined") {
    return createDefaultRotationSchemesState();
  }

  const raw = window.localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
  if (!raw) {
    return createDefaultRotationSchemesState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const parsedRecord = parsed as Record<string, unknown>;
      const byBuild = parsedRecord.byBuild;
      if (byBuild && typeof byBuild === "object") {
        const scoped = (byBuild as Record<string, unknown>)[scopeId];
        return normalizeState((scoped ?? null) as Partial<RotationSchemesState> | null);
      }
    }

    return normalizeState(parsed as Partial<RotationSchemesState>);
  } catch (error) {
    console.warn("Failed to load rotation schemes from localStorage", error);
    return createDefaultRotationSchemesState();
  }
}

function persistStateForScope(scopeId: string, state: RotationSchemesState) {
  if (typeof window === "undefined") {
    return;
  }

  const next = cloneRotationSchemesState(state);
  let byBuild: Record<string, RotationSchemesState> = {};
  const raw = window.localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const parsedRecord = parsed as Record<string, unknown>;
        const existingByBuild = parsedRecord.byBuild;
        if (existingByBuild && typeof existingByBuild === "object") {
          byBuild = existingByBuild as Record<string, RotationSchemesState>;
        } else {
          byBuild[BUILD_STORAGE_SCOPE_DEFAULT] = normalizeState(parsed as Partial<RotationSchemesState>);
        }
      }
    } catch {
      byBuild = {};
    }
  }

  byBuild[scopeId] = next;
  window.localStorage.setItem(ROTATION_SCHEMES_STORAGE_KEY, JSON.stringify({ byBuild }));
}

function ensureState(buildIdRef?: Ref<string | undefined>): Ref<RotationSchemesState> {
  const initialScope = getBuildScopeId(buildIdRef?.value);
  activeBuildScopeId = initialScope;
  if (!stateRef) {
    stateRef = ref(loadStateForScope(initialScope)) as Ref<RotationSchemesState>;
  }

  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    watch(
      stateRef,
      (value) => {
        persistStateForScope(activeBuildScopeId, value);
      },
      { deep: true },
    );
  }

  if (buildIdRef) {
    watch(
      buildIdRef,
      (nextBuildId) => {
        activeBuildScopeId = getBuildScopeId(nextBuildId);
        if (stateRef) {
          stateRef.value = loadStateForScope(activeBuildScopeId);
        }
      },
      { immediate: true },
    );
  }

  return stateRef;
}

export function useRotationSchemes(buildIdRef?: Ref<string | undefined>) {
  const state = ensureState(buildIdRef);

  const activeScheme = computed(() =>
    state.value.schemes.find((scheme) => scheme.id === state.value.activeSchemeId) ?? state.value.schemes[0]!,
  );

  const activeRotation = computed({
    get: () => activeScheme.value.rotation,
    set: (value: Rotation) => {
      const target = state.value.schemes.find((scheme) => scheme.id === state.value.activeSchemeId);
      if (target) {
        target.rotation = normalizeRotation(value);
      }
    },
  });

  function setActiveScheme(id: string) {
    if (state.value.schemes.some((scheme) => scheme.id === id)) {
      state.value.activeSchemeId = id;
    }
  }

  function addScheme() {
    const scheme = createScheme(state.value.schemes.length + 1);
    state.value.schemes.push(scheme);
    state.value.activeSchemeId = scheme.id;
  }

  function renameActiveScheme(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const target = state.value.schemes.find((scheme) => scheme.id === state.value.activeSchemeId);
    if (target) {
      target.name = trimmed;
    }
  }

  function removeActiveScheme() {
    if (state.value.schemes.length <= 1) {
      activeRotation.value = createRotation();
      return;
    }

    const index = state.value.schemes.findIndex((scheme) => scheme.id === state.value.activeSchemeId);
    state.value.schemes.splice(index, 1);
    state.value.activeSchemeId = state.value.schemes[Math.max(0, index - 1)]!.id;
  }

  function resetRotationSchemes() {
    state.value = createDefaultRotationSchemesState();
    if (typeof window !== "undefined") {
      persistStateForScope(activeBuildScopeId, state.value);
    }
  }

  function hydrateRotationSchemes(value: Partial<RotationSchemesState> | null | undefined) {
    state.value = normalizeState(value);
  }

  function exportRotationSchemes(): RotationSchemesState {
    return cloneRotationSchemesState(state.value);
  }

  return {
    rotationSchemes: state,
    activeScheme,
    activeRotation,
    setActiveScheme,
    addScheme,
    renameActiveScheme,
    removeActiveScheme,
    hydrateRotationSchemes,
    exportRotationSchemes,
    resetRotationSchemes,
  };
}

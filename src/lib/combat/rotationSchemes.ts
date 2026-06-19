import { computed, ref, watch, type Ref } from "vue";
import type { Rotation } from "@/lib/combat/rotation";
import { getDefaultEnemyCommandPlacements, type EnemyCommandPlacement } from "@/lib/enemy/enemyActionWindows";
import { ROTATION_ENEMY_COMMANDS_STORAGE_KEY } from "@/lib/storageKeys";
import { ROTATION_SCHEMES_STORAGE_KEY } from "@/lib/storageKeys";

export type RotationScheme = {
  id: string;
  name: string;
  rotation: Rotation;
  enemyCommandsByEnemy?: Record<string, EnemyCommandPlacement[]>;
};

export type RotationSchemesState = {
  schemes: RotationScheme[];
  activeSchemeId: string;
  selectedEnemyId: string;
  enemyLevel: number;
};

let stateRef: Ref<RotationSchemesState> | null = null;
let initialized = false;
const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";
let activeBuildScopeId = BUILD_STORAGE_SCOPE_DEFAULT;
const MAX_ROTATION_SCHEMES_PER_BUILD = 2;

function createRotation(): Rotation {
  return { steps: [], groups: [], critRiggingRules: [] };
}

function createScheme(index: number): RotationScheme {
  return {
    id: `rotation_${Math.random().toString(36).slice(2, 10)}`,
    name: `Rotation ${index}`,
    rotation: createRotation(),
    enemyCommandsByEnemy: {},
  };
}

export function createDefaultRotationSchemesState(): RotationSchemesState {
  const scheme = createScheme(1);
  return {
    schemes: [scheme],
    activeSchemeId: scheme.id,
    selectedEnemyId: "rhodagn",
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

function normalizeEnemyCommandPlacement(
  value: Partial<EnemyCommandPlacement> | null | undefined,
): EnemyCommandPlacement | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (typeof value.id !== "string" || !value.id || typeof value.commandId !== "string" || !value.commandId) {
    return null;
  }
  return {
    id: value.id,
    commandId: value.commandId,
    startTime: Math.max(0, Number(value.startTime ?? 0)),
    interrupted: value.interrupted === true,
    interruptedSpGain: Math.max(0, Number(value.interruptedSpGain ?? 0)),
    interruptedStagger: Math.max(0, Number(value.interruptedStagger ?? 0)),
  };
}

function normalizeEnemyCommandsByEnemy(
  value: unknown,
): Record<string, EnemyCommandPlacement[]> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const result: Record<string, EnemyCommandPlacement[]> = {};
  for (const [enemyId, placements] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(placements)) {
      continue;
    }
    result[enemyId] = placements
      .map((placement) => normalizeEnemyCommandPlacement(placement as Partial<EnemyCommandPlacement>))
      .filter((placement): placement is EnemyCommandPlacement => placement != null);
  }
  return result;
}

function readLegacyEnemyCommandsForScope(
  scopeId: string,
): Record<string, Record<string, EnemyCommandPlacement[]>> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as {
      byBuild?: Record<string, { byScheme?: Record<string, Record<string, Partial<EnemyCommandPlacement>[]>> }>;
      byScheme?: Record<string, Record<string, Partial<EnemyCommandPlacement>[]>>;
    };
    const scoped = parsed.byBuild?.[scopeId]?.byScheme;
    const byScheme = scoped ?? parsed.byScheme ?? {};
    const result: Record<string, Record<string, EnemyCommandPlacement[]>> = {};
    for (const [schemeId, byEnemy] of Object.entries(byScheme)) {
      result[schemeId] = normalizeEnemyCommandsByEnemy(byEnemy);
    }
    return result;
  } catch {
    return {};
  }
}

function normalizeState(
  value: Partial<RotationSchemesState> | null | undefined,
  legacyEnemyCommandsByScheme: Record<string, Record<string, EnemyCommandPlacement[]>> = {},
): RotationSchemesState {
  const schemes = Array.isArray(value?.schemes)
    ? value.schemes.map((scheme, index) => ({
        id: typeof scheme?.id === "string" && scheme.id ? scheme.id : `rotation_${index}`,
        name: typeof scheme?.name === "string" && scheme.name ? scheme.name : `Rotation ${index + 1}`,
        rotation: normalizeRotation(scheme?.rotation),
        enemyCommandsByEnemy: {
          ...legacyEnemyCommandsByScheme[typeof scheme?.id === "string" ? scheme.id : `rotation_${index}`],
          ...normalizeEnemyCommandsByEnemy(scheme?.enemyCommandsByEnemy),
        },
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
    selectedEnemyId:
      typeof value?.selectedEnemyId === "string" && value.selectedEnemyId.length > 0
        ? value.selectedEnemyId
        : "rhodagn",
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
    const legacyEnemyCommandsByScheme = readLegacyEnemyCommandsForScope(scopeId);
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const parsedRecord = parsed as Record<string, unknown>;
      const byBuild = parsedRecord.byBuild;
      if (byBuild && typeof byBuild === "object") {
        const scoped = (byBuild as Record<string, unknown>)[scopeId];
        return normalizeState((scoped ?? null) as Partial<RotationSchemesState> | null, legacyEnemyCommandsByScheme);
      }
    }

    return normalizeState(parsed as Partial<RotationSchemesState>, legacyEnemyCommandsByScheme);
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

  function addScheme(): boolean {
    if (state.value.schemes.length >= MAX_ROTATION_SCHEMES_PER_BUILD) {
      return false;
    }
    const scheme = createScheme(state.value.schemes.length + 1);
    state.value.schemes.push(scheme);
    state.value.activeSchemeId = scheme.id;
    return true;
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

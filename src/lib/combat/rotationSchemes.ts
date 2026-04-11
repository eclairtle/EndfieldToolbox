import { computed, ref, watch, type Ref } from "vue";
import type { Rotation } from "@/lib/combat/rotation";

export type RotationScheme = {
  id: string;
  name: string;
  rotation: Rotation;
};

export type RotationSchemesState = {
  schemes: RotationScheme[];
  activeSchemeId: string;
};

const STORAGE_KEY = "combat-simulator-rotation-schemes-v1";

let stateRef: Ref<RotationSchemesState> | null = null;
let initialized = false;

function createRotation(): Rotation {
  return { steps: [], groups: [] };
}

function createScheme(index: number): RotationScheme {
  return {
    id: `rotation_${Math.random().toString(36).slice(2, 10)}`,
    name: `Rotation ${index}`,
    rotation: createRotation(),
  };
}

function createDefaultState(): RotationSchemesState {
  const scheme = createScheme(1);
  return {
    schemes: [scheme],
    activeSchemeId: scheme.id,
  };
}

function normalizeRotation(value: Partial<Rotation> | null | undefined): Rotation {
  return {
    steps: Array.isArray(value?.steps) ? value.steps : [],
    groups: Array.isArray(value?.groups) ? value.groups : [],
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
    return createDefaultState();
  }

  const activeSchemeId =
    typeof value?.activeSchemeId === "string" && schemes.some((scheme) => scheme.id === value.activeSchemeId)
      ? value.activeSchemeId
      : schemes[0]!.id;

  return {
    schemes,
    activeSchemeId,
  };
}

function loadState(): RotationSchemesState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    return normalizeState(JSON.parse(raw) as Partial<RotationSchemesState>);
  } catch (error) {
    console.warn("Failed to load rotation schemes from localStorage", error);
    return createDefaultState();
  }
}

function ensureState(): Ref<RotationSchemesState> {
  if (!stateRef) {
    stateRef = ref(loadState()) as Ref<RotationSchemesState>;
  }

  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    watch(
      stateRef,
      (value) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      },
      { deep: true },
    );
  }

  return stateRef;
}

export function useRotationSchemes() {
  const state = ensureState();

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

  return {
    rotationSchemes: state,
    activeScheme,
    activeRotation,
    setActiveScheme,
    addScheme,
    renameActiveScheme,
    removeActiveScheme,
  };
}

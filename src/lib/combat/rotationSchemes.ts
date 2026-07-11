import { computed, ref, watch, type Ref } from "vue";
import type { EnemySlotState, Rotation } from "@/lib/combat/rotation";
import { getDefaultEnemyCommandPlacements, type EnemyCommandPlacement } from "@/lib/enemy/enemyActionWindows";
import type { ActiveContingencyContract } from "@/lib/combat/contracts";
import type { CustomCombatTrigger, TriggerVariableDefinition } from "@/lib/combat/triggers";
import { normalizeCustomCombatTriggers, normalizeCustomTriggerVariables, sanitizeTriggersAgainstVariables } from "@/lib/combat/triggers";
import { ROTATION_ENEMY_COMMANDS_STORAGE_KEY } from "@/lib/storageKeys";
import { ROTATION_CONTRACTS_STORAGE_KEY } from "@/lib/storageKeys";
import { ROTATION_SCHEMES_STORAGE_KEY } from "@/lib/storageKeys";
import { ROTATION_SP_STORAGE_KEY } from "@/lib/storageKeys";

export type RotationTeamSpConfig = {
  initialSp: number;
  spRegenRate: number;
  startingEnergyBySlot: number[];
  consumableBySlot: (string | null)[];
};

export type RotationSchemeLocale = "en" | "zh-CN";
export type LocalizedRotationSchemeText = Partial<Record<RotationSchemeLocale, string>>;

export type RotationScheme = {
  id: string;
  name: string;
  description?: string;
  nameByLocale?: LocalizedRotationSchemeText;
  descriptionByLocale?: LocalizedRotationSchemeText;
  rotation: Rotation;
  simulationMode?: "independent" | "relay_from_previous";
  relayDisplayTimeOffset?: number;
  relayDisplayGameTimeOffset?: number;
  teamSpConfig?: RotationTeamSpConfig;
  activeContracts?: ActiveContingencyContract[];
  triggers?: CustomCombatTrigger[];
  triggerVariables?: TriggerVariableDefinition[];
  enemyCommandsByEnemy?: Record<string, EnemyCommandPlacement[]>;
  enemyCommandsBySlot?: Record<string, EnemyCommandPlacement[]>;
};

export type RotationSchemesState = {
  schemes: RotationScheme[];
  activeSchemeId: string;
  enemySlots?: EnemySlotState[];
  targetedEnemySlotId?: string;
  selectedEnemyId: string;
  enemyLevel: number;
};

let stateRef: Ref<RotationSchemesState> | null = null;
let initialized = false;
const BUILD_STORAGE_SCOPE_DEFAULT = "__default__";
let activeBuildScopeId = BUILD_STORAGE_SCOPE_DEFAULT;
const MAX_ROTATION_SCHEMES_PER_BUILD = 4;

function createRotation(): Rotation {
  return { steps: [], groups: [], critRiggingRules: [] };
}

function createScheme(index: number): RotationScheme {
  return {
    id: `rotation_${Math.random().toString(36).slice(2, 10)}`,
    name: `Rotation ${index}`,
    description: "",
    nameByLocale: {},
    descriptionByLocale: {},
    rotation: createRotation(),
    simulationMode: "independent",
    teamSpConfig: makeDefaultTeamSpConfig(),
    activeContracts: [],
    triggers: [],
    triggerVariables: [],
    enemyCommandsByEnemy: {},
    enemyCommandsBySlot: {},
  };
}

export function createDefaultRotationSchemesState(): RotationSchemesState {
  const scheme = createScheme(1);
  const defaultEnemySlot: EnemySlotState = {
    slotId: "enemy_slot_1",
    enemyId: "rhodagn",
    level: 90,
    spawnTimeEnabled: false,
    spawnTime: 0,
    noDeath: false,
  };
  return {
    schemes: [scheme],
    activeSchemeId: scheme.id,
    enemySlots: [defaultEnemySlot],
    targetedEnemySlotId: defaultEnemySlot.slotId,
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

function makeDefaultTeamSpConfig(): RotationTeamSpConfig {
  return {
    initialSp: 200,
    spRegenRate: 8,
    startingEnergyBySlot: [100, 100, 100, 100],
    consumableBySlot: [null, null, null, null],
  };
}

function normalizeTeamSpConfig(value: Partial<RotationTeamSpConfig> | null | undefined): RotationTeamSpConfig {
  return {
    initialSp: value?.initialSp ?? 200,
    spRegenRate: value?.spRegenRate ?? 8,
    startingEnergyBySlot: Array.isArray(value?.startingEnergyBySlot)
      ? [0, 1, 2, 3].map((index) => Math.max(0, Math.min(100, value?.startingEnergyBySlot?.[index] ?? 100)))
      : [100, 100, 100, 100],
    consumableBySlot: Array.isArray(value?.consumableBySlot)
      ? [0, 1, 2, 3].map((index) => {
        const id = value?.consumableBySlot?.[index];
        return typeof id === "string" && id.length > 0 ? id : null;
      })
      : [null, null, null, null],
  };
}

function normalizeLocalizedRotationSchemeText(value: unknown): LocalizedRotationSchemeText {
  if (!value || typeof value !== "object") {
    return {};
  }
  const record = value as Record<string, unknown>;
  const out: LocalizedRotationSchemeText = {};
  if (typeof record.en === "string") {
    const trimmed = record.en.trim();
    if (trimmed) {
      out.en = trimmed;
    }
  }
  if (typeof record["zh-CN"] === "string") {
    const trimmed = record["zh-CN"].trim();
    if (trimmed) {
      out["zh-CN"] = trimmed;
    }
  }
  return out;
}

function getLocalizedRotationSchemeText(
  localized: LocalizedRotationSchemeText | null | undefined,
  locale: RotationSchemeLocale,
  legacyFallback = "",
): string {
  const primary = localized?.[locale]?.trim();
  if (primary) {
    return primary;
  }
  return legacyFallback.trim();
}

export function getRotationSchemeLocalizedName(
  scheme: RotationScheme,
  locale: RotationSchemeLocale,
): string {
  return getLocalizedRotationSchemeText(scheme.nameByLocale, locale, scheme.name);
}

export function getRotationSchemeLocalizedDescription(
  scheme: RotationScheme,
  locale: RotationSchemeLocale,
): string {
  return getLocalizedRotationSchemeText(scheme.descriptionByLocale, locale, scheme.description ?? "");
}

function readLegacySpConfigsForScope(
  scopeId: string,
): Record<string, RotationTeamSpConfig> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as
      | Partial<RotationTeamSpConfig>
      | { byScheme?: Record<string, Partial<RotationTeamSpConfig>> }
      | { byBuild?: Record<string, { byScheme?: Record<string, Partial<RotationTeamSpConfig>> }> }
      | null;
    if (parsed && typeof parsed === "object" && "byBuild" in parsed && parsed.byBuild) {
      const scoped = parsed.byBuild[scopeId]?.byScheme ?? {};
      return Object.fromEntries(
        Object.entries(scoped).map(([schemeId, config]) => [schemeId, normalizeTeamSpConfig(config)]),
      );
    }
    if (parsed && typeof parsed === "object" && "byScheme" in parsed && parsed.byScheme) {
      return Object.fromEntries(
        Object.entries(parsed.byScheme).map(([schemeId, config]) => [schemeId, normalizeTeamSpConfig(config)]),
      );
    }
    return { __legacy__: normalizeTeamSpConfig(parsed as Partial<RotationTeamSpConfig>) };
  } catch {
    return {};
  }
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

function normalizeActiveContracts(
  value: unknown,
): ActiveContingencyContract[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const typed = entry as { id?: unknown; variantId?: unknown };
      return typeof typed.id === "string" && typed.id.length > 0 && typeof typed.variantId === "string" && typed.variantId.length > 0
        ? { id: typed.id, variantId: typed.variantId }
        : null;
    })
    .filter((entry): entry is ActiveContingencyContract => entry != null);
}

function readLegacyContractsForScope(
  scopeId: string,
): Record<string, ActiveContingencyContract[]> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(ROTATION_CONTRACTS_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as {
      byBuild?: Record<string, { byScheme?: Record<string, unknown> }>;
      byScheme?: Record<string, unknown>;
    };
    const scoped = parsed.byBuild?.[scopeId]?.byScheme;
    const byScheme = scoped ?? parsed.byScheme ?? {};
    return Object.fromEntries(
      Object.entries(byScheme).map(([schemeId, value]) => [schemeId, normalizeActiveContracts(value)]),
    );
  } catch {
    return {};
  }
}

function normalizeState(
  value: Partial<RotationSchemesState> | null | undefined,
  legacyEnemyCommandsByScheme: Record<string, Record<string, EnemyCommandPlacement[]>> = {},
  legacyContractsByScheme: Record<string, ActiveContingencyContract[]> = {},
  legacySpConfigsByScheme: Record<string, RotationTeamSpConfig> = {},
): RotationSchemesState {
  const normalizeSchemeSimulationMode = (
    mode: unknown,
    index: number,
  ): NonNullable<RotationScheme["simulationMode"]> => {
    if (index === 0) {
      return "independent";
    }
    return mode === "relay_from_previous" ? "relay_from_previous" : "independent";
  };
  const schemes = Array.isArray(value?.schemes)
      ? value.schemes.map((scheme, index) => ({
        id: typeof scheme?.id === "string" && scheme.id ? scheme.id : `rotation_${index}`,
        name: typeof scheme?.name === "string" && scheme.name ? scheme.name : `Rotation ${index + 1}`,
        description: typeof scheme?.description === "string" ? scheme.description : "",
        nameByLocale: normalizeLocalizedRotationSchemeText(scheme?.nameByLocale),
        descriptionByLocale: normalizeLocalizedRotationSchemeText(scheme?.descriptionByLocale),
        rotation: normalizeRotation(scheme?.rotation),
        simulationMode: normalizeSchemeSimulationMode(scheme?.simulationMode, index),
        relayDisplayTimeOffset:
          typeof scheme?.relayDisplayTimeOffset === "number" && Number.isFinite(scheme.relayDisplayTimeOffset)
            ? scheme.relayDisplayTimeOffset
            : undefined,
        relayDisplayGameTimeOffset:
          typeof scheme?.relayDisplayGameTimeOffset === "number" && Number.isFinite(scheme.relayDisplayGameTimeOffset)
            ? scheme.relayDisplayGameTimeOffset
            : undefined,
        teamSpConfig: scheme?.teamSpConfig
          ? normalizeTeamSpConfig(scheme.teamSpConfig)
          : (legacySpConfigsByScheme[typeof scheme?.id === "string" ? scheme.id : `rotation_${index}`]
            ?? legacySpConfigsByScheme.__legacy__
            ?? makeDefaultTeamSpConfig()),
        activeContracts:
          normalizeActiveContracts(scheme?.activeContracts).length > 0
            ? normalizeActiveContracts(scheme?.activeContracts)
            : (legacyContractsByScheme[typeof scheme?.id === "string" ? scheme.id : `rotation_${index}`] ?? []),
        triggers: sanitizeTriggersAgainstVariables(
          normalizeCustomCombatTriggers(scheme?.triggers),
          normalizeCustomTriggerVariables(scheme?.triggerVariables),
        ),
        triggerVariables: normalizeCustomTriggerVariables(scheme?.triggerVariables),
        enemyCommandsByEnemy: {
          ...legacyEnemyCommandsByScheme[typeof scheme?.id === "string" ? scheme.id : `rotation_${index}`],
          ...normalizeEnemyCommandsByEnemy(scheme?.enemyCommandsByEnemy),
        },
        enemyCommandsBySlot:
          scheme?.enemyCommandsBySlot && typeof scheme.enemyCommandsBySlot === "object"
            ? Object.fromEntries(
                Object.entries(scheme.enemyCommandsBySlot as Record<string, unknown>).map(([slotId, placements]) => [
                  slotId,
                  Array.isArray(placements)
                    ? placements
                        .map((placement) => normalizeEnemyCommandPlacement(placement as Partial<EnemyCommandPlacement>))
                        .filter((placement): placement is EnemyCommandPlacement => placement != null)
                    : [],
                ]),
              )
            : {},
      }))
    : [];

  if (schemes.length === 0) {
    return createDefaultRotationSchemesState();
  }

  const activeSchemeId =
    typeof value?.activeSchemeId === "string" && schemes.some((scheme) => scheme.id === value.activeSchemeId)
      ? value.activeSchemeId
      : schemes[0]!.id;

  const legacySelectedEnemyId =
    typeof value?.selectedEnemyId === "string" && value.selectedEnemyId.length > 0
      ? value.selectedEnemyId
      : "rhodagn";
  const legacyEnemyLevel =
    typeof value?.enemyLevel === "number" && Number.isFinite(value.enemyLevel)
      ? Math.max(1, Math.min(100, Math.round(value.enemyLevel)))
      : 90;
  const normalizedEnemySlots = Array.isArray(value?.enemySlots)
    ? value.enemySlots
        .map((slot, index) => {
          if (!slot || typeof slot !== "object") {
            return {
              slotId: `enemy_slot_${index + 1}`,
              enemyId: legacySelectedEnemyId,
              level: legacyEnemyLevel,
              spawnTimeEnabled: false,
              spawnTime: 0,
              noDeath: false,
            };
          }
          const slotId =
            typeof slot.slotId === "string" && slot.slotId.length > 0
              ? slot.slotId
              : `enemy_slot_${index + 1}`;
          const enemyId =
            typeof slot.enemyId === "string" && slot.enemyId.length > 0
              ? slot.enemyId
              : legacySelectedEnemyId;
          const level =
            typeof slot.level === "number" && Number.isFinite(slot.level)
              ? Math.max(1, Math.min(100, Math.round(slot.level)))
              : legacyEnemyLevel;
          const spawnTimeEnabled = slot.spawnTimeEnabled === true;
          const spawnTimeRaw = typeof slot.spawnTime === "number" && Number.isFinite(slot.spawnTime)
            ? slot.spawnTime
            : 0;
          const spawnTime = Math.round(spawnTimeRaw * 1000) / 1000;
          const noDeath = slot.noDeath === true;
          return { slotId, enemyId, level, spawnTimeEnabled, spawnTime, noDeath };
        })
        .slice(0, 10)
    : [];
  const enemySlots = normalizedEnemySlots.length > 0
    ? normalizedEnemySlots
    : [{ slotId: "enemy_slot_1", enemyId: legacySelectedEnemyId, level: legacyEnemyLevel, spawnTimeEnabled: false, spawnTime: 0, noDeath: false }];
  const targetedEnemySlotId =
    typeof value?.targetedEnemySlotId === "string" && enemySlots.some((slot) => slot.slotId === value.targetedEnemySlotId)
      ? value.targetedEnemySlotId
      : enemySlots[0]!.slotId;

  return {
    schemes,
    activeSchemeId,
    enemySlots,
    targetedEnemySlotId,
    selectedEnemyId: legacySelectedEnemyId,
    enemyLevel: legacyEnemyLevel,
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
    const legacyContractsByScheme = readLegacyContractsForScope(scopeId);
    const legacySpConfigsByScheme = readLegacySpConfigsForScope(scopeId);
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const parsedRecord = parsed as Record<string, unknown>;
      const byBuild = parsedRecord.byBuild;
      if (byBuild && typeof byBuild === "object") {
        const scoped = (byBuild as Record<string, unknown>)[scopeId];
        return normalizeState((scoped ?? null) as Partial<RotationSchemesState> | null, legacyEnemyCommandsByScheme, legacyContractsByScheme, legacySpConfigsByScheme);
      }
    }

    return normalizeState(parsed as Partial<RotationSchemesState>, legacyEnemyCommandsByScheme, legacyContractsByScheme, legacySpConfigsByScheme);
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

  function updateActiveSchemeLocalizedMetadata(args: {
    locale: RotationSchemeLocale;
    name: string;
    description: string;
  }) {
    const trimmedName = args.name.trim();
    if (!trimmedName) {
      return;
    }

    const target = state.value.schemes.find((scheme) => scheme.id === state.value.activeSchemeId);
    if (!target) {
      return;
    }

    const nextNameByLocale = { ...(target.nameByLocale ?? {}) };
    nextNameByLocale[args.locale] = trimmedName;
    target.nameByLocale = nextNameByLocale;

    const trimmedDescription = args.description.trim();
    const nextDescriptionByLocale = { ...(target.descriptionByLocale ?? {}) };
    if (trimmedDescription) {
      nextDescriptionByLocale[args.locale] = trimmedDescription;
    } else {
      delete nextDescriptionByLocale[args.locale];
    }
    target.descriptionByLocale = nextDescriptionByLocale;
  }

  function setActiveSchemeSimulationMode(mode: "independent" | "relay_from_previous") {
    const targetIndex = state.value.schemes.findIndex((scheme) => scheme.id === state.value.activeSchemeId);
    if (targetIndex < 0) {
      return;
    }
    const target = state.value.schemes[targetIndex]!;
    target.simulationMode = targetIndex === 0 ? "independent" : mode;
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
    updateActiveSchemeLocalizedMetadata,
    setActiveSchemeSimulationMode,
    removeActiveScheme,
    hydrateRotationSchemes,
    exportRotationSchemes,
    resetRotationSchemes,
  };
}

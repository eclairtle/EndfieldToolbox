import type { EnemyBase } from "@/data/enemies";

export const CONTINGENCY_CONTRACTS_STAGE_ID = "contingency_contracts" as const;
export const NO_STAGE_ID = "none" as const;
export type StagePresetId = typeof NO_STAGE_ID | typeof CONTINGENCY_CONTRACTS_STAGE_ID;

export type CustomStageSettings = {
  name: string;
  name_cn?: string;
  contractsEnabled: boolean;
  lockInitialEnergy: boolean;
  initialEnergyPct: number;
  disableConsumables: boolean;
  enemyHpMultipliers: Record<string, number>;
  enemyHpBaseOverrides: Record<string, number>;
};

export type CustomStageDefinition = CustomStageSettings & {
  id: string;
  initialSp: number;
  spRegenRate: number;
};

export type BuildStageSettings = {
  mode: "preset" | "custom";
  presetId: StagePresetId;
  customStageId?: string;
  initialSp: number;
  spRegenRate: number;
  custom: CustomStageSettings;
};

export const MAX_CUSTOM_STAGES = 3;

export function makeCustomStageDefinition(index = 1): CustomStageDefinition {
  return {
    id: `custom_stage_${Math.random().toString(36).slice(2, 10)}`,
    name: `Custom Stage ${index}`,
    name_cn: `自定义关卡 ${index}`,
    contractsEnabled: false,
    lockInitialEnergy: false,
    initialEnergyPct: 100,
    disableConsumables: false,
    initialSp: 200,
    spRegenRate: 8,
    enemyHpMultipliers: {},
    enemyHpBaseOverrides: {},
  };
}

export function normalizeCustomStageDefinitions(value: unknown): CustomStageDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CUSTOM_STAGES).map((entry, index) => {
    const raw = entry && typeof entry === "object" ? entry as Partial<CustomStageDefinition> : {};
    const legacy = normalizeBuildStageSettings({ mode: "custom", initialSp: raw.initialSp, spRegenRate: raw.spRegenRate, custom: raw });
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : `custom_stage_${index + 1}`,
      ...legacy.custom,
      initialSp: legacy.initialSp,
      spRegenRate: legacy.spRegenRate,
    };
  });
}

export type ResolvedStageSettings = {
  id: StagePresetId | "custom";
  name: string;
  name_cn?: string;
  contractsEnabled: boolean;
  lockInitialEnergy: boolean;
  initialEnergyPct: number;
  disableConsumables: boolean;
  enemyHpMultipliers: Record<string, number>;
  enemyHpBaseOverrides: Record<string, number>;
  initialSp: number;
  spRegenRate: number;
};

export const STAGE_PRESETS: ResolvedStageSettings[] = [{
  id: NO_STAGE_ID,
  name: "None",
  name_cn: "无",
  contractsEnabled: false,
  lockInitialEnergy: false,
  initialEnergyPct: 100,
  disableConsumables: false,
  enemyHpMultipliers: {},
  enemyHpBaseOverrides: {},
  initialSp: 200,
  spRegenRate: 8,
}, {
  id: CONTINGENCY_CONTRACTS_STAGE_ID,
  name: "Contingency Contracts",
  name_cn: "危机合约",
  contractsEnabled: true,
  lockInitialEnergy: true,
  initialEnergyPct: 0,
  disableConsumables: true,
  enemyHpMultipliers: {
    aggeloi_heavy_ram_alpha: 1.3,
    aggeloi_effigy: 1.1,
    tidalklast: 1.3,
  },
  // These replace the former Ram (CC) and Hedron (CC) enemy copies.
  enemyHpBaseOverrides: {
    aggeloi_ram: 180,
    hedron: 198,
  },
  initialSp: 200,
  spRegenRate: 8,
}];

export const LEGACY_STAGE_ENEMY_ID_MAP: Record<string, string> = {
  aggeloi_ram_cc: "aggeloi_ram",
  hedron_cc: "hedron",
};

export function migrateLegacyStageEnemyIds<T>(value: T): T {
  if (typeof value === "string") {
    return (LEGACY_STAGE_ENEMY_ID_MAP[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => migrateLegacyStageEnemyIds(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, migrateLegacyStageEnemyIds(entry)])) as T;
  }
  return value;
}

export function makeDefaultBuildStageSettings(): BuildStageSettings {
  return {
    mode: "preset",
    presetId: NO_STAGE_ID,
    customStageId: undefined,
    initialSp: 200,
    spRegenRate: 8,
    custom: {
      name: "Custom Stage",
      name_cn: "自定义关卡",
      contractsEnabled: false,
      lockInitialEnergy: false,
      initialEnergyPct: 100,
      disableConsumables: false,
      enemyHpMultipliers: {},
      enemyHpBaseOverrides: {},
    },
  };
}

export function normalizeBuildStageSettings(value: unknown): BuildStageSettings {
  const fallback = makeDefaultBuildStageSettings();
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<BuildStageSettings>;
  const customRaw = raw.custom && typeof raw.custom === "object" ? raw.custom : fallback.custom;
  const overrides = Object.fromEntries(Object.entries(customRaw.enemyHpBaseOverrides ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0)
    .map(([enemyId, hp]) => [LEGACY_STAGE_ENEMY_ID_MAP[enemyId] ?? enemyId, Math.max(1, Math.round(hp))]));
  const multipliers = Object.fromEntries(Object.entries(customRaw.enemyHpMultipliers ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0)
    .map(([enemyId, multiplier]) => [LEGACY_STAGE_ENEMY_ID_MAP[enemyId] ?? enemyId, Math.max(0.01, multiplier)]));
  return {
    mode: raw.mode === "custom" ? "custom" : "preset",
    presetId: raw.presetId === CONTINGENCY_CONTRACTS_STAGE_ID
      ? CONTINGENCY_CONTRACTS_STAGE_ID
      : NO_STAGE_ID,
    customStageId: typeof raw.customStageId === "string" ? raw.customStageId : undefined,
    initialSp: typeof raw.initialSp === "number" && Number.isFinite(raw.initialSp)
      ? Math.max(0, raw.initialSp)
      : fallback.initialSp,
    spRegenRate: typeof raw.spRegenRate === "number" && Number.isFinite(raw.spRegenRate)
      ? Math.max(0, raw.spRegenRate)
      : fallback.spRegenRate,
    custom: {
      name: typeof customRaw.name === "string" && customRaw.name.trim() ? customRaw.name.trim() : fallback.custom.name,
      name_cn: typeof customRaw.name_cn === "string" && customRaw.name_cn.trim() ? customRaw.name_cn.trim() : undefined,
      contractsEnabled: customRaw.contractsEnabled === true,
      lockInitialEnergy: customRaw.lockInitialEnergy === true,
      initialEnergyPct: typeof customRaw.initialEnergyPct === "number" && Number.isFinite(customRaw.initialEnergyPct)
        ? Math.max(0, Math.min(100, customRaw.initialEnergyPct))
        : fallback.custom.initialEnergyPct,
      disableConsumables: customRaw.disableConsumables === true,
      enemyHpMultipliers: multipliers,
      enemyHpBaseOverrides: overrides,
    },
  };
}

export function getStageDisplayName(
  stage: Pick<ResolvedStageSettings, "name" | "name_cn">,
  locale: "en" | "zh-CN",
): string {
  return locale === "zh-CN" && stage.name_cn?.trim() ? stage.name_cn.trim() : stage.name;
}

export function resolveBuildStageSettings(value: BuildStageSettings, customStages: CustomStageDefinition[] = []): ResolvedStageSettings {
  const normalized = normalizeBuildStageSettings(value);
  if (normalized.mode === "custom") {
    const shared = customStages.find((stage) => stage.id === normalized.customStageId);
    if (shared) {
      const { id: _customStageId, ...settings } = shared;
      return { id: "custom", ...settings };
    }
    return {
      id: "custom",
      ...normalized.custom,
      initialSp: normalized.initialSp,
      spRegenRate: normalized.spRegenRate,
    };
  }
  const preset = STAGE_PRESETS.find((stage) => stage.id === normalized.presetId) ?? STAGE_PRESETS[0]!;
  return {
    ...preset,
    initialSp: normalized.initialSp,
    spRegenRate: normalized.spRegenRate,
  };
}

export function resolveEnemyBaseForStage(base: EnemyBase, stage: ResolvedStageSettings): EnemyBase {
  const canonicalId = LEGACY_STAGE_ENEMY_ID_MAP[base.id] ?? base.id;
  const trueBaseHp = stage.enemyHpBaseOverrides[canonicalId] ?? base.baseHpLv1;
  const resolvedBaseHp = Math.max(1, trueBaseHp * (stage.enemyHpMultipliers[canonicalId] ?? 1));
  return resolvedBaseHp === base.baseHpLv1 ? base : { ...base, baseHpLv1: resolvedBaseHp };
}

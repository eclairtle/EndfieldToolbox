import type { BuildStoreStateSnapshot, CharacterBuildSlot } from "@/stores/buildStore";
import type { SavedBuild } from "@/stores/buildListStore";
import type { RotationScheme, RotationSchemesState } from "@/lib/combat/rotationSchemes";
import type { RotationStep, EnemyRotationStep, RotationGroup, CritRiggingRule } from "@/lib/combat/rotation";

type JsonRecord = Record<string, unknown>;

export type CanonicalOperatorBuild = {
  characterId: string;
  characterAscension: number;
  characterPotential: number;
  level: number;
  characterTalentToggles: Record<string, boolean>;
  uniqueTalentToggles: Record<string, boolean>;
  characterSkillLevels: CharacterBuildSlot["characterSkillLevels"];
  weapon: {
    weaponId: string;
    weaponAscension: number;
    weaponPotential: number;
    weaponLevel: number;
    weaponSkillLevels: number[];
  };
  gear: {
    armor: CharacterBuildSlot["armor"];
    gloves: CharacterBuildSlot["gloves"];
    kit1: CharacterBuildSlot["kit1"];
    kit2: CharacterBuildSlot["kit2"];
  };
};

export type CanonicalParty = {
  activeVariantIndex: number;
  slots: Array<{
    slot: number;
    label: string;
    activeBuffs: CharacterBuildSlot["activeBuffs"];
    variants: Array<
      | { index: number; build: CanonicalOperatorBuild }
      | { index: number; sameAsVariantIndex: number }
    >;
  }>;
};

export type PostgresqlTemplateSeed = {
  schemaVersion: 1;
  activeBuildId: string;
  builds: JsonRecord[];
  buildRevisions: JsonRecord[];
  rotations: JsonRecord[];
  rotationSteps: JsonRecord[];
  enemySteps: JsonRecord[];
  rotationGroups: JsonRecord[];
  critRiggingRules: JsonRecord[];
  simulationSummaries: JsonRecord[];
};

export type PostgresqlTemplatePreviewSeed = {
  schemaVersion: 1;
  activeBuildId: string;
  buildPreviews: JsonRecord[];
};

export type PostgresqlBuildPreview = {
  id: string;
  name: string;
  description: string;
  nameByLocale: Record<string, string>;
  descriptionByLocale: Record<string, string>;
  slots: Array<{
    slot: number;
    characterId: string;
    weaponId: string;
    gearIds: Array<string | null>;
  }>;
  stage: {
    kind: "preset" | "custom";
    id: string;
    name: string;
    nameByLocale: Record<string, string>;
  };
  summary: SavedBuild["summary"];
};

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveCanonicalVariants(rawSlot: JsonRecord): CanonicalOperatorBuild[] {
  const resolved: CanonicalOperatorBuild[] = [];
  const entries = asArray(rawSlot.variants)
    .map(asRecord)
    .sort((left, right) => Number(left.index ?? 0) - Number(right.index ?? 0));
  for (const entry of entries) {
    const index = Number(entry.index);
    if (!Number.isInteger(index) || index < 0 || index > 3) continue;
    if (entry.build && typeof entry.build === "object") {
      resolved[index] = clone(entry.build as CanonicalOperatorBuild);
      continue;
    }
    // `sameAs` remains readable for schema-v1 fixtures created before the
    // reference was given its less ambiguous transport name.
    const sameAs = Number(entry.sameAsVariantIndex ?? entry.sameAs);
    if (!Number.isInteger(sameAs) || sameAs < 0 || sameAs >= index || !resolved[sameAs]) {
      throw new Error(`Invalid sameAsVariantIndex reference ${String(entry.sameAsVariantIndex ?? entry.sameAs)} for variant ${index}`);
    }
    resolved[index] = clone(resolved[sameAs]!);
  }
  if (!resolved[0]) {
    throw new Error("Every canonical party slot must define variant 0");
  }
  while (resolved.length < 4) resolved.push(clone(resolved[0]!));
  return resolved;
}

function toCharacterBuildSnapshot(build: CanonicalOperatorBuild) {
  return {
    characterAscension: build.characterAscension,
    characterPotential: build.characterPotential,
    level: build.level,
    characterTalentToggles: clone(build.characterTalentToggles),
    uniqueTalentToggles: clone(build.uniqueTalentToggles),
    characterSkillLevels: clone(build.characterSkillLevels),
    selectedWeaponId: build.weapon.weaponId,
    weaponAscension: build.weapon.weaponAscension,
    weaponPotential: build.weapon.weaponPotential,
    weaponLevel: build.weapon.weaponLevel,
    weaponSkillLevels: clone(build.weapon.weaponSkillLevels),
    armor: clone(build.gear.armor),
    gloves: clone(build.gear.gloves),
    kit1: clone(build.gear.kit1),
    kit2: clone(build.gear.kit2),
  };
}

export function canonicalPartyToBuildState(value: unknown): BuildStoreStateSnapshot {
  const party = asRecord(value) as unknown as CanonicalParty;
  const activeVariantIndex = Math.max(0, Math.min(3, Number(party.activeVariantIndex ?? 0)));
  const slots = asArray(party.slots)
    .map(asRecord)
    .sort((left, right) => Number(left.slot ?? 0) - Number(right.slot ?? 0))
    .map((rawSlot, slotIndex) => {
      const variants = resolveCanonicalVariants(rawSlot);
      const active = variants[activeVariantIndex] ?? variants[0]!;
      const activeSnapshot = toCharacterBuildSnapshot(active);
      return {
        id: `slot_${slotIndex + 1}`,
        label: typeof rawSlot.label === "string" ? rawSlot.label : `Character ${slotIndex + 1}`,
        selectedCharId: active.characterId,
        ...activeSnapshot,
        activeBuffs: clone(asArray(rawSlot.activeBuffs)) as CharacterBuildSlot["activeBuffs"],
        characterBuilds: {
          [active.characterId]: variants.map(toCharacterBuildSnapshot),
        },
        // Editor-only weapon history is deliberately not part of a canonical
        // uploaded build. It is rebuilt naturally as the user edits.
        weaponBuilds: {},
      } as CharacterBuildSlot;
    });
  if (slots.length !== 4) {
    throw new Error(`Canonical party must contain exactly 4 slots; received ${slots.length}`);
  }
  return { slots, activeSlotIndex: 0, activeVariantIndex };
}

function rowsForRotation<T extends JsonRecord>(rows: JsonRecord[], rotationId: string): T[] {
  return rows
    .filter((row) => row.rotationId === rotationId)
    .sort((left, right) => Number(left.sequence ?? 0) - Number(right.sequence ?? 0))
    .map((row) => {
      const { rotationId: _rotationId, sequence: _sequence, ...payload } = row;
      return clone(payload) as T;
    });
}

function revisionToRotationState(seed: PostgresqlTemplateSeed, revision: JsonRecord): RotationSchemesState {
  const rotations = seed.rotations
    .filter((row) => row.revisionId === revision.id)
    .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0));
  const schemes = rotations.map((row) => {
    const databaseRotationId = String(row.id);
    const id = String(row.schemeId ?? row.id);
    return {
      id,
      name: String(row.name ?? "Rotation"),
      description: String(row.description ?? ""),
      nameByLocale: clone(asRecord(row.nameByLocale)),
      descriptionByLocale: clone(asRecord(row.descriptionByLocale)),
      simulationMode: row.simulationMode === "relay_from_previous" ? "relay_from_previous" : "independent",
      teamSpConfig: clone(row.teamSpConfig),
      activeContracts: clone(asArray(row.activeContracts)),
      triggers: clone(asArray(row.triggers)),
      triggerVariables: clone(asArray(row.triggerVariables)),
      stageSettings: row.stageSettings == null ? undefined : clone(row.stageSettings),
      rotation: {
        steps: rowsForRotation<RotationStep>(seed.rotationSteps, databaseRotationId),
        enemySteps: rowsForRotation<EnemyRotationStep>(seed.enemySteps, databaseRotationId),
        groups: rowsForRotation<RotationGroup>(seed.rotationGroups, databaseRotationId),
        critRiggingRules: rowsForRotation<CritRiggingRule>(seed.critRiggingRules, databaseRotationId),
      },
    } as RotationScheme;
  });
  return {
    schemes,
    activeSchemeId: typeof revision.activeRotationId === "string" ? revision.activeRotationId : schemes[0]?.id ?? "",
    enemySlots: clone(asArray(revision.enemySlots)) as RotationSchemesState["enemySlots"],
    targetedEnemySlotId: typeof revision.targetedEnemySlotId === "string" ? revision.targetedEnemySlotId : undefined,
    selectedEnemyId: String(revision.selectedEnemyId ?? "rhodagn"),
    enemyLevel: Number(revision.enemyLevel ?? 90),
  };
}

function findCurrentRevision(seed: PostgresqlTemplateSeed, buildRow: JsonRecord): JsonRecord {
  const revision = seed.buildRevisions.find((row) => row.id === buildRow.currentRevisionId);
  if (!revision) throw new Error(`Missing current revision for build ${String(buildRow.id)}`);
  return revision;
}

function summaryForRevision(seed: PostgresqlTemplateSeed, revisionId: unknown): SavedBuild["summary"] {
  const summary = seed.simulationSummaries.find((row) => row.revisionId === revisionId) ?? {};
  return {
    totalDamage: typeof summary.totalDamage === "number" ? summary.totalDamage : null,
    dps: typeof summary.dps === "number" ? summary.dps : null,
    updatedAt: typeof summary.updatedAt === "number" ? summary.updatedAt : null,
  };
}

function interpretBuildRow(seed: PostgresqlTemplateSeed, buildRow: JsonRecord): SavedBuild {
  const revision = findCurrentRevision(seed, buildRow);
  return {
    id: String(buildRow.id),
    name: String(buildRow.name ?? "Build"),
    description: String(buildRow.description ?? ""),
    nameByLocale: clone(asRecord(buildRow.nameByLocale)),
    descriptionByLocale: clone(asRecord(buildRow.descriptionByLocale)),
    currentBuildState: canonicalPartyToBuildState(revision.currentParty),
    plannedBuildState: canonicalPartyToBuildState(revision.plannedParty),
    rotationState: revisionToRotationState(seed, revision),
    stageSettings: clone(revision.stageSettings) as SavedBuild["stageSettings"],
    customStages: clone(asArray(revision.customStages)) as SavedBuild["customStages"],
    scopedRotationUiState: { sp: null, contracts: null },
    summary: summaryForRevision(seed, revision.id),
    damageTallyTiming: clone(revision.damageTallyTiming) as SavedBuild["damageTallyTiming"],
    compareSettings: clone(revision.compareSettings) as SavedBuild["compareSettings"],
  };
}

export function interpretPostgresqlBuildPreviews(seedValue: unknown): { builds: PostgresqlBuildPreview[]; activeBuildId: string } {
  const seed = seedValue as PostgresqlTemplatePreviewSeed;
  if (seed?.schemaVersion !== 1) {
    throw new Error(`Unsupported PostgreSQL build schema version: ${String(seed?.schemaVersion)}`);
  }
  const builds = seed.buildPreviews.map((row) => {
    const summary = asRecord(row.summary);
    return {
      id: String(row.buildId),
      name: String(row.name ?? "Build"),
      description: String(row.description ?? ""),
      nameByLocale: clone(asRecord(row.nameByLocale)) as Record<string, string>,
      descriptionByLocale: clone(asRecord(row.descriptionByLocale)) as Record<string, string>,
      slots: clone(asArray(row.slots)) as PostgresqlBuildPreview["slots"],
      stage: (() => {
        const stage = asRecord(row.stage);
        return {
          kind: stage.kind === "custom" ? "custom" as const : "preset" as const,
          id: String(stage.id ?? "none"),
          name: String(stage.name ?? "None"),
          nameByLocale: clone(asRecord(stage.nameByLocale)) as Record<string, string>,
        };
      })(),
      summary: {
        totalDamage: typeof summary.totalDamage === "number" ? summary.totalDamage : null,
        dps: typeof summary.dps === "number" ? summary.dps : null,
        updatedAt: typeof summary.updatedAt === "number" ? summary.updatedAt : null,
      },
    };
  });
  return { builds, activeBuildId: seed.activeBuildId };
}

export function interpretPostgresqlBuildById(seedValue: unknown, buildId: string): SavedBuild | null {
  const seed = seedValue as PostgresqlTemplateSeed;
  if (seed?.schemaVersion !== 1) {
    throw new Error(`Unsupported PostgreSQL build schema version: ${String(seed?.schemaVersion)}`);
  }
  const buildRow = seed.builds.find((row) => row.id === buildId);
  return buildRow ? interpretBuildRow(seed, buildRow) : null;
}

export function interpretPostgresqlBuildRows(seedValue: unknown): { builds: SavedBuild[]; activeBuildId: string } {
  const seed = seedValue as PostgresqlTemplateSeed;
  if (seed?.schemaVersion !== 1) {
    throw new Error(`Unsupported PostgreSQL build schema version: ${String(seed?.schemaVersion)}`);
  }
  const builds = seed.builds.map((buildRow) => interpretBuildRow(seed, buildRow));
  return { builds, activeBuildId: seed.activeBuildId };
}

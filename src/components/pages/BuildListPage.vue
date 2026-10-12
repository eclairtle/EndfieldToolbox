<script setup lang="ts">
import { computed, ref } from "vue";
import { CHARACTERS } from "@/data/characters";
import { WEAPONS } from "@/data/weapons";
import { GEARS } from "@/data/gears";
import {
  getSavedBuildLocalizedDescription,
  getSavedBuildLocalizedName,
  type BuildListPreview,
  type BuildLocale,
  type SavedBuild,
} from "@/stores/buildListStore";
import { getCharacterImagePath, getWeaponImagePath, getGearImagePath } from "@/lib/assets/imagePaths";
import { useLocale } from "@/i18n/useLocale";
import {
  getCharacterDisplayNameByCharacter,
  getGearSetDisplayName,
  getWeaponDisplayNameByWeapon,
} from "@/i18n/domain/displayNames";
import { getStageDisplayName, resolveBuildStageSettings } from "@/lib/stages/stageSettings";
import { submitCommunityBuild } from "@/lib/persistence/communityBuildApi";

const props = defineProps<{
  userBuilds: SavedBuild[];
  templateBuilds: BuildListPreview[];
  communityBuilds: BuildListPreview[];
  communityBuildsLoading: boolean;
  communityBuildsError: string;
  activeBuildId: string;
}>();

const emit = defineEmits<{
  (e: "open", buildId: string): void;
  (e: "create"): void;
  (e: "import", build: unknown): void;
  (e: "copy", buildId: string): void;
  (e: "editMetadata", payload: { buildId: string; locale: BuildLocale; name: string; description: string }): void;
  (e: "delete", buildId: string): void;
  (e: "refreshCommunity"): void;
}>();

const charactersById = computed(() => new Map(CHARACTERS.map((character) => [character.id, character])));
const weaponsById = computed(() => new Map(WEAPONS.map((weapon) => [weapon.id, weapon])));
const gearsById = computed(() => new Map(GEARS.map((gear) => [gear.id, gear])));
const editingBuildId = ref<string | null>(null);
const nameDraft = ref("");
const descriptionDraft = ref("");
const pendingDeleteBuildId = ref<string | null>(null);
const importDialogOpen = ref(false);
const importScript = ref("");
const importError = ref("");
const uploadBuildId = ref<string | null>(null);
const uploadUsername = ref("");
const uploadError = ref("");
const uploadSubmitting = ref(false);
const previewSearch = ref("");
const searchDescriptions = ref(false);
const filterPopupOpen = ref(false);
const activeListTab = ref<"user" | "templates" | "community">("user");
const membershipFilterType = ref<"operator" | "weapon" | "gearSet">("operator");
const operatorFilters = ref<string[]>([]);
const weaponFilters = ref<string[]>([]);
const gearSetFilters = ref<string[]>([]);
const stageFilter = ref("");
type NumericFilterInput = string | number;
const minimumDamage = ref<NumericFilterInput>("");
const maximumDamage = ref<NumericFilterInput>("");
const minimumDps = ref<NumericFilterInput>("");
const maximumDps = ref<NumericFilterInput>("");
const { t, locale } = useLocale();
const MAX_BUILDS_PER_USER = 6;
const BUILD_LIST_TABS = ["user", "templates", "community"] as const;
const canCreateBuild = computed(() => props.userBuilds.length < MAX_BUILDS_PER_USER);
const currentBuildLocale = computed<BuildLocale>(() => locale.value === "zh-CN" ? "zh-CN" : "en");

type PreviewSlot = {
  key: string;
  characterId: string;
  weaponId: string;
  gearIds: Array<string | null>;
};

function getBuildPreviewSlots(build: SavedBuild | BuildListPreview): PreviewSlot[] {
  if ("slots" in build) {
    return build.slots.map((slot) => ({
      key: `slot_${slot.slot + 1}`,
      characterId: slot.characterId,
      weaponId: slot.weaponId,
      gearIds: slot.gearIds,
    }));
  }
  return build.currentBuildState.slots.map((slot) => ({
    key: slot.id,
    characterId: slot.selectedCharId,
    weaponId: slot.selectedWeaponId,
    gearIds: [slot.armor, slot.gloves, slot.kit1, slot.kit2].map((gear) => gear?.gearId ?? null),
  }));
}

function getSlotImages(slot: PreviewSlot) {
  const character = slot.characterId ? charactersById.value.get(slot.characterId) ?? null : null;
  const weapon = slot.weaponId ? weaponsById.value.get(slot.weaponId) ?? null : null;
  const gears = slot.gearIds.map((gearId) => (gearId ? gearsById.value.get(gearId) ?? null : null));

  return {
    characterPath: getCharacterImagePath(character),
    weaponPath: getWeaponImagePath(weapon),
    gearPaths: gears.map((gear) => getGearImagePath(gear)),
    characterName: getCharacterDisplayNameByCharacter(character) || t("ui.empty"),
  };
}

function getLocalizedBuildName(build: SavedBuild | BuildListPreview) {
  return getSavedBuildLocalizedName(build, currentBuildLocale.value);
}

function getLocalizedBuildDescription(build: SavedBuild | BuildListPreview) {
  return getSavedBuildLocalizedDescription(build, currentBuildLocale.value);
}

function getBuildPreviewStageName(build: SavedBuild | BuildListPreview) {
  if ("stage" in build) {
    return currentBuildLocale.value === "zh-CN"
      ? build.stage.nameByLocale["zh-CN"] || build.stage.name
      : build.stage.name;
  }
  const schemes = build.rotationState.schemes;
  let sourceIndex = schemes.length - 1;
  while (sourceIndex > 0 && schemes[sourceIndex]?.simulationMode === "relay_from_previous") {
    sourceIndex -= 1;
  }
  const settings = schemes[sourceIndex]?.stageSettings ?? build.stageSettings;
  const stage = resolveBuildStageSettings(settings, build.customStages ?? []);
  return getStageDisplayName(stage, currentBuildLocale.value);
}

function normalizedSearchValues(build: SavedBuild | BuildListPreview, includeDescription: boolean) {
  const values = [build.name, ...Object.values(build.nameByLocale ?? {})];
  if (includeDescription) {
    values.push(build.description ?? "", ...Object.values(build.descriptionByLocale ?? {}));
  }
  return values.map((value) => value.toLocaleLowerCase());
}

function numericFilterText(value: NumericFilterInput) {
  return typeof value === "number" ? String(value) : value.trim();
}

function finiteFilterNumber(value: NumericFilterInput) {
  const text = numericFilterText(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function getBuildStageKey(build: SavedBuild | BuildListPreview) {
  if ("stage" in build) return `${build.stage.kind}:${build.stage.id}`;
  const schemes = build.rotationState.schemes;
  let sourceIndex = schemes.length - 1;
  while (sourceIndex > 0 && schemes[sourceIndex]?.simulationMode === "relay_from_previous") sourceIndex -= 1;
  const settings = schemes[sourceIndex]?.stageSettings ?? build.stageSettings;
  const normalized = resolveBuildStageSettings(settings, build.customStages ?? []);
  return `${settings.mode === "custom" ? "custom" : "preset"}:${settings.mode === "custom" ? settings.customStageId ?? normalized.id : settings.presetId}`;
}

const allSearchableBuilds = computed<Array<SavedBuild | BuildListPreview>>(() => [
  ...props.userBuilds,
  ...props.templateBuilds,
  ...props.communityBuilds,
]);

const filterOptions = computed(() => {
  const operatorIds = new Set<string>();
  const weaponIds = new Set<string>();
  const gearSets = new Set<string>();
  const stages = new Map<string, string>();
  for (const build of allSearchableBuilds.value) {
    stages.set(getBuildStageKey(build), getBuildPreviewStageName(build));
    for (const slot of getBuildPreviewSlots(build)) {
      if (slot.characterId) operatorIds.add(slot.characterId);
      if (slot.weaponId) weaponIds.add(slot.weaponId);
      for (const gearId of slot.gearIds) {
        const setName = gearId ? gearsById.value.get(gearId)?.set : null;
        if (setName) gearSets.add(setName);
      }
    }
  }
  const byLabel = <T extends { label: string }>(left: T, right: T) => left.label.localeCompare(right.label, locale.value);
  return {
    operators: [...operatorIds].map((id) => ({
      id,
      label: getCharacterDisplayNameByCharacter(charactersById.value.get(id)) || id,
    })).sort(byLabel),
    weapons: [...weaponIds].map((id) => ({
      id,
      label: getWeaponDisplayNameByWeapon(weaponsById.value.get(id)) || id,
    })).sort(byLabel),
    gearSets: [...gearSets].map((id) => ({
      id,
      label: getGearSetDisplayName({ setName: id, fallbackName: id }),
    })).sort(byLabel),
    stages: [...stages].map(([id, label]) => ({ id, label })).sort(byLabel),
  };
});

function buildMatchesFilters(build: SavedBuild | BuildListPreview) {
  const query = previewSearch.value.trim().toLocaleLowerCase();
  const minDamage = finiteFilterNumber(minimumDamage.value);
  const maxDamage = finiteFilterNumber(maximumDamage.value);
  const minDps = finiteFilterNumber(minimumDps.value);
  const maxDps = finiteFilterNumber(maximumDps.value);
  const slots = getBuildPreviewSlots(build);
  if (query && !normalizedSearchValues(build, searchDescriptions.value).some((value) => value.includes(query))) return false;
  if (!operatorFilters.value.every((id) => slots.some((slot) => slot.characterId === id))) return false;
  if (!weaponFilters.value.every((id) => slots.some((slot) => slot.weaponId === id))) return false;
  if (!gearSetFilters.value.every((setName) => slots.some((slot) => slot.gearIds.some((gearId) => (
    gearId ? gearsById.value.get(gearId)?.set === setName : false
  ))))) return false;
  if (stageFilter.value && getBuildStageKey(build) !== stageFilter.value) return false;
  if (minDamage != null && (build.summary.totalDamage == null || build.summary.totalDamage < minDamage)) return false;
  if (maxDamage != null && (build.summary.totalDamage == null || build.summary.totalDamage > maxDamage)) return false;
  if (minDps != null && (build.summary.dps == null || build.summary.dps < minDps)) return false;
  if (maxDps != null && (build.summary.dps == null || build.summary.dps > maxDps)) return false;
  return true;
}

const filteredUserBuilds = computed(() => props.userBuilds.filter(buildMatchesFilters));
const filteredTemplateBuilds = computed(() => props.templateBuilds.filter(buildMatchesFilters));
const filteredCommunityBuilds = computed(() => props.communityBuilds.filter(buildMatchesFilters));
const displayedReadonlyBuilds = computed(() => activeListTab.value === "community"
  ? filteredCommunityBuilds.value
  : filteredTemplateBuilds.value);
const displayedReadonlyTotal = computed(() => activeListTab.value === "community"
  ? props.communityBuilds.length
  : props.templateBuilds.length);

type ActiveFilterTag = { key: string; label: string; remove: () => void };
const activeFilterTags = computed<ActiveFilterTag[]>(() => {
  const tags: ActiveFilterTag[] = [];
  const optionLabel = (options: Array<{ id: string; label: string }>, id: string) => options.find((option) => option.id === id)?.label ?? id;
  for (const id of operatorFilters.value) tags.push({ key: `operator:${id}`, label: `${t("buildList.operatorFilter")}: ${optionLabel(filterOptions.value.operators, id)}`, remove: () => { operatorFilters.value = operatorFilters.value.filter((value) => value !== id); } });
  for (const id of weaponFilters.value) tags.push({ key: `weapon:${id}`, label: `${t("buildList.weaponFilter")}: ${optionLabel(filterOptions.value.weapons, id)}`, remove: () => { weaponFilters.value = weaponFilters.value.filter((value) => value !== id); } });
  for (const id of gearSetFilters.value) tags.push({ key: `gear:${id}`, label: `${t("buildList.gearSetFilter")}: ${optionLabel(filterOptions.value.gearSets, id)}`, remove: () => { gearSetFilters.value = gearSetFilters.value.filter((value) => value !== id); } });
  if (stageFilter.value) tags.push({ key: "stage", label: `${t("buildList.stageLabel")}: ${optionLabel(filterOptions.value.stages, stageFilter.value)}`, remove: () => { stageFilter.value = ""; } });
  for (const [key, label, source] of [
    ["min-damage", `${t("rotation.totalDamage")} ≥`, minimumDamage],
    ["max-damage", `${t("rotation.totalDamage")} ≤`, maximumDamage],
    ["min-dps", `${t("rotation.dps")} ≥`, minimumDps],
    ["max-dps", `${t("rotation.dps")} ≤`, maximumDps],
  ] as const) {
    const value = numericFilterText(source.value);
    if (value) tags.push({ key, label: `${label} ${Number(value).toLocaleString()}`, remove: () => { source.value = ""; } });
  }
  return tags;
});

function clearPreviewFilters() {
  previewSearch.value = "";
  searchDescriptions.value = false;
  operatorFilters.value = [];
  weaponFilters.value = [];
  gearSetFilters.value = [];
  stageFilter.value = "";
  minimumDamage.value = "";
  maximumDamage.value = "";
  minimumDps.value = "";
  maximumDps.value = "";
}

function beginEdit(build: SavedBuild) {
  editingBuildId.value = build.id;
  nameDraft.value = getLocalizedBuildName(build);
  descriptionDraft.value = getLocalizedBuildDescription(build);
}

function cancelEdit() {
  editingBuildId.value = null;
  nameDraft.value = "";
  descriptionDraft.value = "";
}

function submitEdit(buildId: string) {
  const trimmedName = nameDraft.value.trim();
  if (!trimmedName) {
    cancelEdit();
    return;
  }
  emit("editMetadata", {
    buildId,
    locale: currentBuildLocale.value,
    name: trimmedName,
    description: descriptionDraft.value.trim(),
  });
  cancelEdit();
}

function requestDelete(buildId: string) {
  pendingDeleteBuildId.value = buildId;
}

function cancelDelete() {
  pendingDeleteBuildId.value = null;
}

function confirmDelete() {
  if (!pendingDeleteBuildId.value) {
    return;
  }
  emit("delete", pendingDeleteBuildId.value);
  pendingDeleteBuildId.value = null;
}

function isUserBuild(buildId: string) {
  return props.userBuilds.some((build) => build.id === buildId);
}

function openImportDialog() {
  if (!canCreateBuild.value) {
    return;
  }
  importScript.value = "";
  importError.value = "";
  importDialogOpen.value = true;
}

defineExpose({ openImportDialog });

function closeImportDialog() {
  importDialogOpen.value = false;
  importScript.value = "";
  importError.value = "";
}

function submitImport() {
  try {
    const parsed = JSON.parse(importScript.value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid build");
    }
    const candidate = parsed as {
      currentBuildState?: { slots?: unknown[] };
      buildState?: { slots?: unknown[] };
      rotationState?: { schemes?: unknown[] };
    };
    const slots = candidate.currentBuildState?.slots ?? candidate.buildState?.slots;
    if (!Array.isArray(slots) || slots.length !== 4 || !Array.isArray(candidate.rotationState?.schemes) || candidate.rotationState.schemes.length === 0) {
      throw new Error("invalid build");
    }
    emit("import", parsed);
    closeImportDialog();
  } catch {
    importError.value = t("buildList.importInvalid");
  }
}

function openUploadDialog(build: SavedBuild) {
  uploadBuildId.value = build.id;
  uploadUsername.value = "";
  uploadError.value = "";
}

function closeUploadDialog() {
  if (uploadSubmitting.value) return;
  uploadBuildId.value = null;
  uploadError.value = "";
}

async function submitUpload() {
  const build = props.userBuilds.find((entry) => entry.id === uploadBuildId.value);
  if (!build || uploadSubmitting.value) return;
  uploadSubmitting.value = true;
  uploadError.value = "";
  try {
    await submitCommunityBuild(build, uploadUsername.value);
    uploadBuildId.value = null;
    activeListTab.value = "community";
    emit("refreshCommunity");
  } catch {
    uploadError.value = t("buildList.communityUnderDevelopment");
  } finally {
    uploadSubmitting.value = false;
  }
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex gap-1 rounded-xl border border-[#d8d8d8] bg-[#f2f2f2] p-1">
      <button v-for="tab in BUILD_LIST_TABS" :key="tab" type="button" class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition" :class="activeListTab === tab ? 'bg-white text-[#222] shadow-sm' : 'text-[#666] hover:bg-white/60'" :title="tab === 'community' ? t('buildList.communityUnderDevelopment') : undefined" @click="activeListTab = tab">
        {{ tab === "user" ? t("buildList.userBuildsTitle") : tab === "templates" ? t("buildList.templatesTitle") : t("buildList.communityBuildsTitle") }}
      </button>
    </div>

    <div class="space-y-2 rounded-xl border border-[#d8d8d8] bg-white p-3 shadow-sm">
      <div class="flex flex-wrap items-end gap-2">
        <label class="min-w-[16rem] flex-1">
          <span class="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-[#707070]">{{ t("buildList.searchBuilds") }}</span>
          <input v-model="previewSearch" type="search" class="w-full rounded-md border border-[#cccccc] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#999]" :placeholder="t('buildList.searchPlaceholder')" />
        </label>
        <div class="relative">
          <button type="button" class="rounded-md border border-[#c8c8c8] bg-white px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f4f4f4]" @click="filterPopupOpen = !filterPopupOpen">
            {{ t("buildList.filters") }}<span v-if="activeFilterTags.length" class="ml-2 rounded-full bg-[#dbe44b] px-1.5 py-0.5 text-[10px]">{{ activeFilterTags.length }}</span>
          </button>
          <div v-if="filterPopupOpen" class="fixed inset-0 z-20" @click="filterPopupOpen = false" />
          <div v-if="filterPopupOpen" class="absolute right-0 z-30 mt-2 w-[min(64rem,calc(100vw-2rem))] rounded-xl border border-[#cfcfcf] bg-white p-5 shadow-xl">
            <label class="block max-w-xs">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ t("buildList.filterType") }}</span>
              <select v-model="membershipFilterType" class="w-full rounded-md border border-[#cccccc] bg-[#fafafa] px-3 py-2 text-sm">
                <option value="operator">{{ t("buildList.operatorFilter") }}</option>
                <option value="weapon">{{ t("buildList.weaponFilter") }}</option>
                <option value="gearSet">{{ t("buildList.gearSetFilter") }}</option>
              </select>
            </label>
            <fieldset class="mt-4">
              <legend class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ membershipFilterType === "operator" ? t("buildList.operatorFilter") : membershipFilterType === "weapon" ? t("buildList.weaponFilter") : t("buildList.gearSetFilter") }}
              </legend>
              <div v-if="membershipFilterType === 'operator'" class="grid max-h-72 grid-cols-1 gap-x-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"><label v-for="option in filterOptions.operators" :key="option.id" class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#f5f5f5]"><input v-model="operatorFilters" type="checkbox" :value="option.id" class="accent-[#b7c228]" />{{ option.label }}</label></div>
              <div v-else-if="membershipFilterType === 'weapon'" class="grid max-h-72 grid-cols-1 gap-x-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"><label v-for="option in filterOptions.weapons" :key="option.id" class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#f5f5f5]"><input v-model="weaponFilters" type="checkbox" :value="option.id" class="accent-[#b7c228]" />{{ option.label }}</label></div>
              <div v-else class="grid max-h-72 grid-cols-1 gap-x-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"><label v-for="option in filterOptions.gearSets" :key="option.id" class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#f5f5f5]"><input v-model="gearSetFilters" type="checkbox" :value="option.id" class="accent-[#b7c228]" />{{ option.label }}</label></div>
            </fieldset>
            <div class="mt-4 grid gap-3 border-t border-[#e4e4e4] pt-4 sm:grid-cols-3">
              <label><span class="mb-1 block text-xs font-semibold text-[#666]">{{ t("buildList.stageLabel") }}</span><select v-model="stageFilter" class="w-full rounded-md border border-[#cccccc] px-2 py-2 text-sm"><option value="">{{ t("buildList.anyOption") }}</option><option v-for="option in filterOptions.stages" :key="option.id" :value="option.id">{{ option.label }}</option></select></label>
              <fieldset class="grid grid-cols-2 gap-2"><legend class="mb-1 text-xs font-semibold text-[#666]">{{ t("rotation.totalDamage") }}</legend><input v-model="minimumDamage" type="number" min="0" class="min-w-0 rounded-md border border-[#cccccc] px-2 py-2 text-sm" :placeholder="t('buildList.minimum')" /><input v-model="maximumDamage" type="number" min="0" class="min-w-0 rounded-md border border-[#cccccc] px-2 py-2 text-sm" :placeholder="t('buildList.maximum')" /></fieldset>
              <fieldset class="grid grid-cols-2 gap-2"><legend class="mb-1 text-xs font-semibold text-[#666]">{{ t("rotation.dps") }}</legend><input v-model="minimumDps" type="number" min="0" class="min-w-0 rounded-md border border-[#cccccc] px-2 py-2 text-sm" :placeholder="t('buildList.minimum')" /><input v-model="maximumDps" type="number" min="0" class="min-w-0 rounded-md border border-[#cccccc] px-2 py-2 text-sm" :placeholder="t('buildList.maximum')" /></fieldset>
            </div>
            <div class="mt-4 flex items-center justify-between gap-3"><label class="flex items-center gap-2 text-sm text-[#555]"><input v-model="searchDescriptions" type="checkbox" class="accent-[#b7c228]" />{{ t("buildList.searchDescriptions") }}</label><div class="flex gap-2"><button type="button" class="rounded-md border border-[#d2d2d2] px-3 py-1.5 text-xs text-[#555] hover:bg-[#f4f4f4]" @click="clearPreviewFilters">{{ t("buildList.clearFilters") }}</button><button type="button" class="rounded-md border border-[#b7c228] bg-[#dbe44b] px-3 py-1.5 text-xs font-medium text-[#333]" @click="filterPopupOpen = false">{{ t("buildList.done") }}</button></div></div>
          </div>
        </div>
      </div>
      <div v-if="activeFilterTags.length" class="flex flex-wrap gap-1.5">
        <span v-for="tag in activeFilterTags" :key="tag.key" class="inline-flex items-center gap-1 rounded-full border border-[#cdd56a] bg-[#f8fad7] py-1 pl-2.5 pr-1 text-xs text-[#4d521e]">{{ tag.label }}<button type="button" class="flex h-5 w-5 items-center justify-center rounded-full text-sm hover:bg-[#e6eba0]" :aria-label="t('buildList.removeFilter')" @click="tag.remove()">×</button></span>
      </div>
    </div>

    <div v-if="activeListTab === 'user'" class="space-y-3">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-[#1b1b1b]">{{ t("buildList.userBuildsTitle") }}</h3>
        <span class="rounded-md border border-[#dddddd] bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#666]">{{ filteredUserBuilds.length }} / {{ userBuilds.length }}</span>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      <article
        v-for="build in filteredUserBuilds"
        :key="build.id"
        class="flex h-[560px] cursor-pointer flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
        :class="build.id === activeBuildId ? 'border-[#c8d13c]' : 'border-[#d6d6d6]'"
        @click="emit('open', build.id)"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 select-text" @click.stop>
            <h3 class="truncate text-lg font-semibold text-[#1b1b1b]">
              {{ getLocalizedBuildName(build) }}
            </h3>
          </div>

          <div class="flex items-center gap-2" @click.stop>
            <button type="button" class="rounded border border-[#b8c86a] bg-[#f7fadf] px-2 py-1 text-xs font-medium text-[#4f5b21] hover:bg-[#eef4bd]" @click="openUploadDialog(build)">{{ t("buildList.upload") }}</button>
            <button
              v-if="canCreateBuild"
              type="button"
              class="rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]"
              @click="emit('copy', build.id)"
            >
              {{ t("buildList.copy") }}
            </button>
            <button
              v-if="isUserBuild(build.id)"
              type="button"
              class="rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]"
              @click="beginEdit(build)"
            >
              {{ t("buildList.edit") }}
            </button>
            <button
              v-if="isUserBuild(build.id)"
              type="button"
              class="rounded border border-[#e0bcbc] bg-white px-2 py-1 text-xs text-[#8b2a2a] hover:bg-[#fdf3f3]"
              @click="requestDelete(build.id)"
            >
              {{ t("ui.delete") }}
            </button>
          </div>
        </div>

        <div class="flex-1 space-y-2 overflow-hidden">
          <div
            v-for="(slot, slotIndex) in getBuildPreviewSlots(build)"
            :key="slot.key"
            class="flex items-center gap-2 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2"
          >
            <img
              :src="getSlotImages(slot).characterPath"
              :alt="getSlotImages(slot).characterName"
              class="h-11 w-11 rounded-md border border-[#dadada] bg-white object-contain"
            />
            <img
              :src="getSlotImages(slot).weaponPath"
              :alt="t('builder.weapon')"
              class="h-8 w-8 rounded-md border border-[#dadada] bg-white object-contain"
            />
            <div class="flex items-center gap-1">
              <img
                v-for="(gearPath, gearIndex) in getSlotImages(slot).gearPaths"
                :key="`${slot.key}-gear-${gearIndex}`"
                :src="gearPath"
                :alt="t('builder.gear')"
                class="h-6 w-6 rounded border border-[#dadada] bg-white object-contain"
              />
            </div>
            <span class="ml-auto text-xs text-[#8a8a8a]">{{ t("builder.slot", { index: slotIndex + 1 }) }}</span>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-1.5">
          <span class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("buildList.stageLabel") }}</span>
          <span class="truncate pl-3 text-sm font-medium text-[#1b1b1b]">{{ getBuildPreviewStageName(build) }}</span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2">
            <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("rotation.totalDamage") }}</div>
            <div class="mt-1 text-sm font-semibold text-[#1b1b1b]">
              {{ build.summary.totalDamage == null ? "—" : Math.round(build.summary.totalDamage).toLocaleString() }}
            </div>
          </div>
          <div class="rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2">
            <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("rotation.dps") }}</div>
            <div class="mt-1 text-sm font-semibold text-[#1b1b1b]">
              {{ build.summary.dps == null ? "—" : Math.round(build.summary.dps).toLocaleString() }}
            </div>
          </div>
        </div>

        <div class="mt-2 rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2 select-text" @click.stop>
          <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("buildList.descriptionLabel") }}</div>
          <div class="mt-1 h-[7.5rem] overflow-y-auto whitespace-pre-wrap break-words pr-1 text-sm leading-6 text-[#1b1b1b]">
            {{ getLocalizedBuildDescription(build) || "—" }}
          </div>
        </div>
      </article>

      <div v-if="filteredUserBuilds.length === 0 && userBuilds.length > 0" class="col-span-full rounded-xl border border-dashed border-[#cccccc] bg-[#fafafa] px-5 py-10 text-center text-sm text-[#777]">{{ t("buildList.noMatchingBuilds") }}</div>

      <button
        v-if="canCreateBuild"
        type="button"
        class="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cfcfcf] bg-white p-4 text-[#666] transition hover:border-[#b8b8b8] hover:text-[#333]"
        @click="emit('create')"
      >
        <span class="text-5xl leading-none">+</span>
        <span class="mt-3 text-sm font-medium uppercase tracking-[0.16em]">{{ t("buildList.newBuild") }}</span>
      </button>
    </div>
    </div>

    <div v-else class="space-y-3">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-[#1b1b1b]">{{ activeListTab === "community" ? t("buildList.communityBuildsTitle") : t("buildList.templatesTitle") }}</h3>
        <span class="rounded-md border border-[#dddddd] bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#666]">{{ displayedReadonlyBuilds.length }} / {{ displayedReadonlyTotal }}</span>
        <button v-if="activeListTab === 'community'" type="button" class="rounded-md border border-[#d3d3d3] bg-white px-2.5 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]" :disabled="communityBuildsLoading" @click="emit('refreshCommunity')">{{ t("buildList.refresh") }}</button>
      </div>

      <div v-if="activeListTab === 'community' && communityBuildsLoading" class="rounded-xl border border-[#dddddd] bg-white px-5 py-12 text-center text-sm text-[#666]">{{ t("ui.loading") }}</div>
      <div v-else-if="activeListTab === 'community' && communityBuildsError" class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] px-5 py-8 text-center text-sm text-[#666]">{{ t("buildList.communityUnderDevelopment") }}</div>

      <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <article
          v-for="build in displayedReadonlyBuilds"
          :key="build.id"
          class="flex h-[560px] cursor-pointer flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
          :class="build.id === activeBuildId ? 'border-[#c8d13c]' : 'border-[#d6d6d6]'"
          @click="emit('open', build.id)"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 select-text" @click.stop>
              <h3 class="truncate text-lg font-semibold text-[#1b1b1b]">
                {{ getLocalizedBuildName(build) }}
              </h3>
            </div>

            <div class="flex items-center gap-2" @click.stop>
              <button
                v-if="canCreateBuild"
                type="button"
                class="rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]"
                @click="emit('copy', build.id)"
              >
                {{ t("buildList.saveAsNew") }}
              </button>
            </div>
          </div>

          <div class="flex-1 space-y-2 overflow-hidden">
            <div
              v-for="(slot, slotIndex) in getBuildPreviewSlots(build)"
              :key="slot.key"
              class="flex items-center gap-2 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-2"
            >
              <img
                :src="getSlotImages(slot).characterPath"
                :alt="getSlotImages(slot).characterName"
                class="h-11 w-11 rounded-md border border-[#dadada] bg-white object-contain"
              />
              <img
                :src="getSlotImages(slot).weaponPath"
                :alt="t('builder.weapon')"
                class="h-8 w-8 rounded-md border border-[#dadada] bg-white object-contain"
              />
              <div class="flex items-center gap-1">
                <img
                  v-for="(gearPath, gearIndex) in getSlotImages(slot).gearPaths"
                  :key="`${slot.key}-gear-${gearIndex}`"
                  :src="gearPath"
                  :alt="t('builder.gear')"
                  class="h-6 w-6 rounded border border-[#dadada] bg-white object-contain"
                />
              </div>
              <span class="ml-auto text-xs text-[#8a8a8a]">{{ t("builder.slot", { index: slotIndex + 1 }) }}</span>
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-1.5">
            <span class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("buildList.stageLabel") }}</span>
            <span class="truncate pl-3 text-sm font-medium text-[#1b1b1b]">{{ getBuildPreviewStageName(build) }}</span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2">
              <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("rotation.totalDamage") }}</div>
              <div class="mt-1 text-sm font-semibold text-[#1b1b1b]">
                {{ build.summary.totalDamage == null ? "—" : Math.round(build.summary.totalDamage).toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2">
              <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("rotation.dps") }}</div>
              <div class="mt-1 text-sm font-semibold text-[#1b1b1b]">
                {{ build.summary.dps == null ? "—" : Math.round(build.summary.dps).toLocaleString() }}
              </div>
            </div>
          </div>

          <div class="mt-2 rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2 select-text" @click.stop>
            <div class="text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">{{ t("buildList.descriptionLabel") }}</div>
            <div class="mt-1 h-[7.5rem] overflow-y-auto whitespace-pre-wrap break-words pr-1 text-sm leading-6 text-[#1b1b1b]">
              {{ getLocalizedBuildDescription(build) || "—" }}
            </div>
          </div>
        </article>
        <div v-if="displayedReadonlyBuilds.length === 0" class="col-span-full rounded-xl border border-dashed border-[#cccccc] bg-[#fafafa] px-5 py-12 text-center text-sm text-[#777]">
          {{ t("buildList.noMatchingBuilds") }}
        </div>
      </div>
    </div>

    <div
      v-if="importDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click="closeImportDialog"
    >
      <div class="w-full max-w-3xl rounded-xl border border-[#d9d9d9] bg-white p-5 shadow-lg" @click.stop>
        <div class="text-base font-semibold text-[#1b1b1b]">{{ t("buildList.importBuildTitle") }}</div>
        <p class="mt-2 text-sm text-[#666]">{{ t("buildList.importBuildBody") }}</p>
        <textarea
          v-model="importScript"
          rows="18"
          class="mt-4 w-full resize-y rounded-md border border-[#cccccc] bg-[#f8f8f8] px-3 py-2 font-mono text-xs text-[#1b1b1b] outline-none focus:border-[#999]"
          :placeholder="t('buildList.importBuildPlaceholder')"
          autofocus
        />
        <p v-if="importError" class="mt-2 text-sm text-[#a32929]">{{ importError }}</p>
        <div class="mt-4 flex items-center justify-end gap-2">
          <button type="button" class="rounded border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f3f3f3]" @click="closeImportDialog">
            {{ t("ui.cancel") }}
          </button>
          <button type="button" class="rounded border border-[#b8c22d] bg-[#d9e447] px-3 py-1.5 text-sm font-medium text-[#232323] hover:bg-[#ced93d]" @click="submitImport">
            {{ t("buildList.importBuild") }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="uploadBuildId" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click="closeUploadDialog">
      <form class="w-full max-w-lg rounded-xl border border-[#d9d9d9] bg-white p-5 shadow-lg" @click.stop @submit.prevent="submitUpload">
        <div class="text-lg font-semibold text-[#1b1b1b]">{{ t("buildList.uploadBuildTitle") }}</div>
        <p class="mt-2 text-sm leading-6 text-[#666]">{{ t("buildList.uploadBuildBody") }}</p>
        <label class="mt-4 block"><span class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ t("buildList.username") }}</span><input v-model="uploadUsername" type="text" maxlength="30" class="w-full rounded-md border border-[#cccccc] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#999]" :placeholder="t('buildList.usernameOptional')" /></label>
        <p v-if="uploadError" class="mt-3 break-words text-sm text-[#a32929]">{{ uploadError }}</p>
        <div class="mt-5 flex justify-end gap-2"><button type="button" class="rounded-md border border-[#d1d1d1] bg-white px-3 py-2 text-sm text-[#444] hover:bg-[#f3f3f3]" :disabled="uploadSubmitting" @click="closeUploadDialog">{{ t("ui.cancel") }}</button><button type="submit" class="rounded-md border border-[#b7c228] bg-[#dbe44b] px-3 py-2 text-sm font-medium text-[#333] disabled:opacity-50" :disabled="uploadSubmitting">{{ uploadSubmitting ? t("buildList.uploading") : t("buildList.submitUpload") }}</button></div>
      </form>
    </div>

    <div
      v-if="editingBuildId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="w-full max-w-2xl rounded-xl border border-[#d9d9d9] bg-white p-5 shadow-lg"
        @click.stop
      >
        <div class="text-base font-semibold text-[#1b1b1b]">{{ t("buildList.editBuildTitle") }}</div>
        <form class="mt-4 space-y-4" @submit.prevent="submitEdit(editingBuildId)">
          <label class="block">
            <div class="mb-1 text-sm font-medium text-[#444]">{{ t("buildList.nameLabel") }}</div>
            <input
              v-model="nameDraft"
              type="text"
              class="w-full rounded-md border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#1b1b1b] outline-none focus:border-[#b1b1b1]"
              maxlength="48"
              autofocus
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm font-medium text-[#444]">{{ t("buildList.descriptionLabel") }}</div>
            <textarea
              v-model="descriptionDraft"
              rows="5"
              class="w-full rounded-md border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#1b1b1b] outline-none focus:border-[#b1b1b1]"
              maxlength="1000"
            />
          </label>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f3f3f3]"
              @click="cancelEdit"
            >
              {{ t("ui.cancel") }}
            </button>
            <button
              type="submit"
              class="rounded border border-[#cecece] bg-[#f7f7f7] px-3 py-1.5 text-sm text-[#444] hover:bg-[#efefef]"
            >
              {{ t("ui.save") }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="pendingDeleteBuildId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click="cancelDelete"
    >
      <div
        class="w-full max-w-sm rounded-xl border border-[#d9d9d9] bg-white p-4 shadow-lg"
        @click.stop
      >
        <div class="text-base font-semibold text-[#1b1b1b]">{{ t("buildList.deleteBuildTitle") }}</div>
        <p class="mt-2 text-sm text-[#555]">
          {{ t("buildList.deleteBuildBody") }}
        </p>
        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f3f3f3]"
            @click="cancelDelete"
          >
            {{ t("ui.cancel") }}
          </button>
          <button
            type="button"
            class="rounded border border-[#d58b8b] bg-[#fff5f5] px-3 py-1.5 text-sm font-medium text-[#8b2a2a] hover:bg-[#fde8e8]"
            @click="confirmDelete"
          >
            {{ t("ui.delete") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

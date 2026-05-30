<script setup lang="ts">
import { computed, ref } from "vue";
import { CHARACTERS } from "@/data/characters";
import { WEAPONS } from "@/data/weapons";
import { GEARS } from "@/data/gears";
import type { SavedBuild } from "@/stores/buildListStore";
import type { CharacterBuildSlot } from "@/stores/buildStore";
import { getCharacterImagePath, getWeaponImagePath, getGearImagePath } from "@/lib/assets/imagePaths";
import { useLocale } from "@/i18n/useLocale";
import { getCharacterDisplayNameByCharacter } from "@/i18n/domain/displayNames";

const props = defineProps<{
  builds: SavedBuild[];
  activeBuildId: string;
}>();

const emit = defineEmits<{
  (e: "open", buildId: string): void;
  (e: "create"): void;
  (e: "copy", buildId: string): void;
  (e: "rename", payload: { buildId: string; name: string }): void;
  (e: "delete", buildId: string): void;
}>();

const charactersById = computed(() => new Map(CHARACTERS.map((character) => [character.id, character])));
const weaponsById = computed(() => new Map(WEAPONS.map((weapon) => [weapon.id, weapon])));
const gearsById = computed(() => new Map(GEARS.map((gear) => [gear.id, gear])));
const editingBuildId = ref<string | null>(null);
const renameDraft = ref("");
const pendingDeleteBuildId = ref<string | null>(null);
const { t } = useLocale();
const MAX_BUILDS_PER_USER = 6;
const buildCountLabel = computed(() => `${props.builds.length} / ${MAX_BUILDS_PER_USER}`);
const canCreateBuild = computed(() => props.builds.length < MAX_BUILDS_PER_USER);

function getSlotImages(slot: CharacterBuildSlot) {
  const character = slot.selectedCharId ? charactersById.value.get(slot.selectedCharId) ?? null : null;
  const weapon = slot.selectedWeaponId ? weaponsById.value.get(slot.selectedWeaponId) ?? null : null;
  const gears = [slot.armor, slot.gloves, slot.kit1, slot.kit2]
    .map((instance) => (instance?.gearId ? gearsById.value.get(instance.gearId) ?? null : null));

  return {
    characterPath: getCharacterImagePath(character),
    weaponPath: getWeaponImagePath(weapon),
    gearPaths: gears.map((gear) => getGearImagePath(gear)),
    characterName: getCharacterDisplayNameByCharacter(character) || t("ui.empty"),
  };
}

function beginRename(buildId: string, currentName: string) {
  editingBuildId.value = buildId;
  renameDraft.value = currentName;
}

function cancelRename() {
  editingBuildId.value = null;
  renameDraft.value = "";
}

function submitRename(buildId: string) {
  const trimmed = renameDraft.value.trim();
  if (!trimmed) {
    cancelRename();
    return;
  }
  emit("rename", { buildId, name: trimmed });
  cancelRename();
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
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-xs uppercase tracking-[0.26em] text-[#7d7d7d]">{{ t("buildList.manager") }}</div>
        <div class="mt-1 flex items-center gap-3">
          <h2 class="text-2xl font-semibold text-[#1b1b1b]">{{ t("buildList.title") }}</h2>
          <span class="rounded-md border border-[#dddddd] bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#666]">{{ buildCountLabel }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      <article
        v-for="build in builds"
        :key="build.id"
        class="cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
        :class="build.id === activeBuildId ? 'border-[#c8d13c]' : 'border-[#d6d6d6]'"
        @click="emit('open', build.id)"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3
              v-if="editingBuildId !== build.id"
              class="truncate text-lg font-semibold text-[#1b1b1b]"
            >
              {{ build.name }}
            </h3>
            <form
              v-else
              class="flex items-center gap-2"
              @submit.prevent="submitRename(build.id)"
              @click.stop
            >
              <input
                v-model="renameDraft"
                type="text"
                class="w-full rounded-md border border-[#cccccc] bg-white px-2 py-1 text-sm text-[#1b1b1b] outline-none focus:border-[#b1b1b1]"
                maxlength="48"
                autofocus
              />
              <button
                type="submit"
                class="rounded border border-[#cecece] bg-[#f7f7f7] px-2 py-1 text-xs text-[#444] hover:bg-[#efefef]"
              >
                {{ t("ui.save") }}
              </button>
              <button
                type="button"
                class="rounded border border-[#cecece] bg-[#f7f7f7] px-2 py-1 text-xs text-[#444] hover:bg-[#efefef]"
                @click="cancelRename"
              >
                {{ t("ui.cancel") }}
              </button>
            </form>
          </div>

          <div class="flex items-center gap-2" @click.stop>
            <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-xs font-medium text-[#666]">
              {{ build.summary.updatedAt ? t("ui.updated") : t("ui.notSimulated") }}
            </span>
            <button
              v-if="canCreateBuild"
              type="button"
              class="rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]"
              @click="emit('copy', build.id)"
            >
              Copy
            </button>
            <button
              v-if="editingBuildId !== build.id"
              type="button"
              class="rounded border border-[#d7d7d7] bg-white px-2 py-1 text-xs text-[#555] hover:bg-[#f4f4f4]"
              @click="beginRename(build.id, build.name)"
            >
              {{ t("ui.rename") }}
            </button>
            <button
              type="button"
              class="rounded border border-[#e0bcbc] bg-white px-2 py-1 text-xs text-[#8b2a2a] hover:bg-[#fdf3f3]"
              @click="requestDelete(build.id)"
            >
              {{ t("ui.delete") }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="(slot, slotIndex) in build.currentBuildState.slots"
            :key="slot.id"
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
                :key="`${slot.id}-gear-${gearIndex}`"
                :src="gearPath"
                :alt="t('builder.gear')"
                class="h-6 w-6 rounded border border-[#dadada] bg-white object-contain"
              />
            </div>
            <span class="ml-auto text-xs text-[#8a8a8a]">{{ t("builder.slot", { index: slotIndex + 1 }) }}</span>
          </div>
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
      </article>

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

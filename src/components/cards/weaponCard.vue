<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { CharacterBase } from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
import { getWeaponImagePath } from "@/lib/assets/imagePaths";
import { useLocale } from "@/i18n/useLocale";
import { getWeaponDisplayNameByWeapon } from "@/i18n/domain/displayNames";
import { getWeaponSkillDisplayName } from "@/i18n/domain/skillNames";
import {
  getWeaponSkillLiveBonus,
} from "@/lib/build/weaponSkillDisplay";
import {
  ASCENSION_LEVEL_CAPS,
  ASCENSION_LEVEL_MINS,
  getWeaponSkill1Range,
  getWeaponSkill2Range,
  getWeaponSkill3Range,
  type AscensionStage,
  type PotentialLevel,
} from "@/lib/build/progression";

const props = defineProps<{
  weapons: WeaponBase[];
  selectedWeaponId: string;
  weaponLocked?: boolean;
  weaponLevel: number;
  weaponAscensionStage: AscensionStage;
  weaponPotential: PotentialLevel;
  weaponSkillLevels: number[];
  compareWeaponLevel?: number;
  compareWeaponAscensionStage?: AscensionStage;
  compareWeaponPotential?: PotentialLevel;
  compareWeaponSkillLevels?: number[];
  character: CharacterBase | null;
  buildCostTitle?: string;
  buildCostLines?: { name: string; amount: number; iconPath?: string }[];
  buildCostNote?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:selectedWeaponId", value: string): void;
  (e: "update:weaponLevel", value: number): void;
  (e: "update:weaponAscensionStage", value: AscensionStage): void;
  (e: "update:weaponPotential", value: PotentialLevel): void;
  (e: "update:weaponSkillLevel", payload: { index: number; value: number }): void;
}>();

const selectedWeapon = computed<WeaponBase | null>(() => {
  return props.weapons.find((w) => w.id === props.selectedWeaponId) ?? null;
});
const { t } = useLocale();
const weaponImagePath = computed(() => getWeaponImagePath(selectedWeapon.value));
const isPickerOpen = ref(false);
const rarityFilter = ref<number | "all">("all");
const weaponLevelInput = ref<HTMLInputElement | null>(null);
const rarityOptions = computed(() =>
  [...new Set(props.weapons.map((weapon) => weapon.rarity ?? 0))]
    .filter((rarity) => rarity > 0)
    .sort((a, b) => b - a),
);
const filteredWeapons = computed(() =>
  props.weapons.filter((weapon) => {
    if (rarityFilter.value === "all") {
      return true;
    }
    return (weapon.rarity ?? 0) === rarityFilter.value;
  }),
);
const isBuildCostWarning = computed(() =>
  typeof props.buildCostNote === "string" && props.buildCostNote.startsWith("__warn__:"),
);
const buildCostNoteText = computed(() =>
  isBuildCostWarning.value
    ? (props.buildCostNote ?? "").replace(/^__warn__:/, "")
    : (props.buildCostNote ?? ""),
);

function formatCompareValue(currentValue: string | number, compareValue?: string | number) {
  if (compareValue == null || compareValue === currentValue) {
    return String(currentValue);
  }
  return `${currentValue} -> ${compareValue}`;
}

const skillRanges = computed(() => {
  return [
    getWeaponSkill1Range(props.weaponAscensionStage),
    getWeaponSkill2Range(props.weaponAscensionStage),
    getWeaponSkill3Range(props.weaponPotential),
  ];
});
const compareSkillRanges = computed(() => {
  const ascension = props.compareWeaponAscensionStage ?? props.weaponAscensionStage;
  const potential = props.compareWeaponPotential ?? props.weaponPotential;
  return [
    getWeaponSkill1Range(ascension),
    getWeaponSkill2Range(ascension),
    getWeaponSkill3Range(potential),
  ];
});

function syncWeaponLevelInput() {
  const input = weaponLevelInput.value;
  if (!input) {
    return;
  }
  const nextValue = String(props.weaponLevel);
  if (input.value !== nextValue) {
    input.value = nextValue;
  }
}

watch(
  () => [props.selectedWeaponId, props.weaponAscensionStage, props.weaponLevel] as const,
  () => {
    void nextTick(syncWeaponLevelInput);
  },
  { immediate: true, flush: "post" },
);

function updateSkill(index: number, value: number) {
  emit("update:weaponSkillLevel", { index, value });
}

function openPicker() {
  if (props.weaponLocked) {
    return;
  }
  isPickerOpen.value = true;
}

function closePicker() {
  isPickerOpen.value = false;
}

function pickWeapon(id: string) {
  emit("update:selectedWeaponId", id);
  closePicker();
}

function getLiveBonus(index: number) {
  const weapon = selectedWeapon.value;
  const skill = weapon?.skills[index];
  if (!weapon || !skill) {
    return "";
  }
  if (!props.character) {
    return t("builder.selectCharacterToPreviewWeaponSkill");
  }
  return getWeaponSkillLiveBonus(weapon, skill, props.weaponSkillLevels[index] ?? skillRanges.value[index]!.min, props.character);
}

</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">{{ t("builder.weapon") }}</h2>
    </div>

    <div class="grid gap-5">
      <div class="flex items-center gap-3">
        <button
          type="button"
          :disabled="weaponLocked"
          class="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[#d4d4d4] bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60"
          @click="openPicker"
        >
          <img
            :src="weaponImagePath"
            :alt="t('builder.weapon')"
            class="h-full w-full object-cover"
            @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
          />
        </button>
        <button
          type="button"
          :disabled="weaponLocked"
          class="min-h-11 flex-1 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 py-2 text-left text-sm text-[#444] disabled:cursor-not-allowed disabled:opacity-60"
          @click="openPicker"
        >
          {{ getWeaponDisplayNameByWeapon(selectedWeapon) || t("builder.selectedNone") }}
        </button>
      </div>

      <!-- Ascension -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.tuningStage") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ formatCompareValue(weaponAscensionStage, compareWeaponAscensionStage) }}
          </span>
        </div>

        <input
          :value="weaponAscensionStage"
          @input="emit('update:weaponAscensionStage', Number(($event.target as HTMLInputElement).value) as AscensionStage)"
          type="range"
          min="0"
          max="4"
          step="1"
          class="w-full accent-[#ece81a]"
        />

        <div class="flex justify-between text-xs text-[#8a8a8a]">
          <span>0</span>
          <span>4</span>
        </div>
      </div>

      <!-- Weapon Level -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.weaponLevel") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold tabular-nums">
            {{ formatCompareValue(weaponLevel, compareWeaponLevel) }}
          </span>
        </div>

        <input
          ref="weaponLevelInput"
          :value="weaponLevel"
          @input="emit('update:weaponLevel', Number(($event.target as HTMLInputElement).value))"
          type="range"
          :min="ASCENSION_LEVEL_MINS[weaponAscensionStage]"
          :max="ASCENSION_LEVEL_CAPS[weaponAscensionStage]"
          step="1"
          class="w-full accent-[#ece81a]"
        />

        <div class="flex justify-between text-xs text-[#8a8a8a]">
          <span>{{ ASCENSION_LEVEL_MINS[weaponAscensionStage] }}</span>
          <span>{{ ASCENSION_LEVEL_CAPS[weaponAscensionStage] }}</span>
        </div>
      </div>

      <!-- Potential -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.weaponPotential") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ formatCompareValue(`P${weaponPotential}`, compareWeaponPotential != null ? `P${compareWeaponPotential}` : undefined) }}
          </span>
        </div>

        <input
          :value="weaponPotential"
          @input="emit('update:weaponPotential', Number(($event.target as HTMLInputElement).value) as PotentialLevel)"
          type="range"
          min="0"
          max="5"
          step="1"
          class="w-full accent-[#ece81a]"
        />

        <div class="flex justify-between text-xs text-[#8a8a8a]">
          <span>P0</span>
          <span>P5</span>
        </div>
      </div>

      <!-- Skill cards -->
      <div class="space-y-4">
        <div
          v-for="(skill, i) in selectedWeapon?.skills ?? []"
          :key="skill.id + i"
          class="rounded-xl border border-[#dedede] bg-[#f7f7f7] p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-semibold">
                {{ t("builder.skillPrefix", { index: i + 1 }) }} · {{ getWeaponSkillDisplayName({ weapon: selectedWeapon, skillIndex: i, skillId: skill.id, fallbackName: skill.name }) }}
              </div>

              <div class="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-[#333]">
                {{ getLiveBonus(i) }}
              </div>
            </div>

            <span class="min-w-[92px] rounded-md bg-white px-2 py-1 text-sm font-semibold tabular-nums">
              {{
                formatCompareValue(
                  `${t("ui.levelShort")} ${weaponSkillLevels[i] ?? skillRanges[i]!.min}/${skillRanges[i]!.max}`,
                  compareWeaponSkillLevels?.[i] != null
                    ? `${t("ui.levelShort")} ${compareWeaponSkillLevels[i]}/${compareSkillRanges[i]!.max}`
                    : undefined,
                )
              }}
            </span>
          </div>

          <input
            :value="weaponSkillLevels[i] ?? skillRanges[i]!.min"
            @input="updateSkill(i, Number(($event.target as HTMLInputElement).value))"
            type="range"
            :min="skillRanges[i]!.min"
            :max="skillRanges[i]!.max"
            step="1"
            class="mt-3 w-full accent-[#ece81a]"
          />

          <div class="mt-1 flex justify-between text-xs text-[#8a8a8a]">
            <span>{{ skillRanges[i]!.min }}</span>
            <span>{{ skillRanges[i]!.max }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
        <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7a7a]">
          {{ buildCostTitle ?? t("builder.buildCost") }}
        </div>
        <div
          v-if="buildCostNote"
          class="mb-2 text-xs"
          :class="isBuildCostWarning ? 'text-[#c53030]' : 'text-[#777]'"
        >
          {{ buildCostNoteText }}
        </div>
        <div
          v-if="buildCostLines && buildCostLines.length > 0"
          class="space-y-1.5"
        >
          <div
            v-for="line in buildCostLines"
            :key="line.name"
            class="flex items-center justify-between gap-3"
          >
            <span class="flex min-w-0 items-center gap-2 text-[#666]">
              <img
                v-if="line.iconPath"
                :src="line.iconPath"
                :alt="line.name"
                class="h-4 w-4 shrink-0 rounded object-contain"
                loading="lazy"
              >
              <span class="truncate">{{ line.name }}</span>
            </span>
            <span class="font-semibold tabular-nums">{{ line.amount.toLocaleString() }}</span>
          </div>
        </div>
        <div
          v-else
          class="text-[#777]"
        >
          {{ t("ui.noAdditionalCost") }}
        </div>
      </div>
    </div>
  </section>

  <div
    v-if="isPickerOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click="closePicker"
  >
    <div
      class="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-lg"
      @click.stop
    >
      <div class="border-b border-[#ececec] px-5 py-4">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-base font-semibold">{{ t("builder.selectWeapon") }}</h3>
          <button
            type="button"
            class="rounded border border-[#d1d1d1] px-3 py-1 text-sm text-[#555] hover:bg-[#f3f3f3]"
            @click="closePicker"
          >
            {{ t("ui.close") }}
          </button>
        </div>

        <div class="mt-3 max-w-xs">
          <label class="grid gap-1 text-xs text-[#666]">
            <span>{{ t("builder.rarity") }}</span>
            <select
              v-model="rarityFilter"
              class="h-9 rounded-lg border border-[#d4d4d4] bg-[#fafafa] px-2 text-sm"
            >
              <option value="all">{{ t("ui.all") }}</option>
              <option
                v-for="rarity in rarityOptions"
                :key="`rarity-${rarity}`"
                :value="rarity"
              >
                {{ rarity }}★
              </option>
            </select>
          </label>
        </div>
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-5">
        <div class="mb-3">
          <button
            type="button"
            class="rounded border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#555] hover:bg-[#f3f3f3]"
            @click="pickWeapon('')"
          >
            {{ t("ui.clearSelection") }}
          </button>
        </div>

        <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            v-for="weapon in filteredWeapons"
            :key="weapon.id"
            type="button"
            class="relative overflow-visible rounded-xl border border-[#dcdcdc] bg-[#fafafa] text-left transition hover:border-[#c9c9c9] hover:bg-white"
            :class="weapon.id === selectedWeaponId ? 'ring-2 ring-[#d7d334]' : ''"
            @click="pickWeapon(weapon.id)"
          >
            <img
              :src="getWeaponImagePath(weapon)"
              :alt="getWeaponDisplayNameByWeapon(weapon)"
              class="aspect-[9/10] w-full bg-[#f0f0f0] object-contain"
              @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
            />
            <div class="p-2">
              <div class="truncate text-sm font-semibold text-[#222]">{{ getWeaponDisplayNameByWeapon(weapon) }}</div>
              <div class="mt-0.5 text-[11px] text-[#666]">
                {{ weapon.rarity ?? "?" }}★
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

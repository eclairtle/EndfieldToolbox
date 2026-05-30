<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { CharacterBase } from "@/data/characters";
import {
  ASCENSION_LEVEL_CAPS,
  ASCENSION_LEVEL_MINS,
  isCharacterTalentUnlocked,
  getCharacterTalentBonus,
  type AscensionStage,
  type PotentialLevel,
} from "@/lib/build/progression";
import { isBuildConditionMet } from "@/lib/build/buildConditions";
import {
  CHARACTER_TALENT_KEYS,
  type CharacterTalentKey,
  type CharacterTalentToggles,
} from "@/lib/build/characterTalents";
import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";
import { getCharacterImagePath } from "@/lib/assets/imagePaths";
import { useLocale } from "@/i18n/useLocale";
import { getCharacterDisplayNameByCharacter } from "@/i18n/domain/displayNames";
import {
  getCharacterUniqueTalentDisplayName,
} from "@/i18n/domain/skillNames";

const props = defineProps<{
  characters: CharacterBase[];
  selectedCharId: string;
  selectedCharacter: CharacterBase | null;
  characterLocked?: boolean;
  level: number;
  ascensionStage: AscensionStage;
  potential: PotentialLevel;
  compareLevel?: number;
  compareAscensionStage?: AscensionStage;
  comparePotential?: PotentialLevel;
  talentToggles: CharacterTalentToggles;
  uniqueTalentToggles: Record<string, boolean>;
  skillLevels: CharacterSkillLevels;
  compareSkillLevels?: Partial<CharacterSkillLevels>;
  buildCostTitle?: string;
  buildCostLines?: { name: string; amount: number; iconPath?: string }[];
  buildCostNote?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:selectedCharId", value: string): void;
  (e: "update:level", value: number): void;
  (e: "update:ascensionStage", value: AscensionStage): void;
  (e: "update:potential", value: PotentialLevel): void;
  (e: "toggle:talent", key: CharacterTalentKey): void;
  (e: "toggle:unique-talent", key: string): void;
  (e: "update:skill-level", payload: { key: CharacterSkillKey; value: number }): void;
}>();

const skillRows: { key: CharacterSkillKey; label: string }[] = [
  { key: "basic", label: "builder.basicAttack" },
  { key: "battleSkill", label: "builder.battleSkill" },
  { key: "comboSkill", label: "builder.comboSkill" },
  { key: "ultimate", label: "builder.ultimate" },
];
const { t } = useLocale();

const characterImagePath = computed(() => getCharacterImagePath(props.selectedCharacter));
const isPickerOpen = ref(false);
const rarityFilter = ref<number | "all">("all");
const elementFilter = ref<string>("all");
const weaponTypeFilter = ref<string>("all");
const levelInput = ref<HTMLInputElement | null>(null);

const rarityOptions = computed(() =>
  [...new Set(props.characters.map((character) => character.rarity))].sort((a, b) => b - a),
);
const elementOptions = computed(() =>
  [...new Set(props.characters.map((character) => character.element))].sort(),
);
const weaponTypeOptions = computed(() =>
  [...new Set(props.characters.map((character) => character.weaponType))].sort(),
);
const filteredCharacters = computed(() =>
  props.characters.filter((character) => {
    if (rarityFilter.value !== "all" && character.rarity !== rarityFilter.value) {
      return false;
    }
    if (elementFilter.value !== "all" && character.element !== elementFilter.value) {
      return false;
    }
    if (weaponTypeFilter.value !== "all" && character.weaponType !== weaponTypeFilter.value) {
      return false;
    }
    return true;
  }),
);
const formatSkillLevel = (value: number) => {
  if (value === 10) return "M1";
  if (value === 11) return "M2";
  if (value === 12) return "M3";
  return `${t("ui.levelShort")} ${value}`;
};

function formatCompareValue(currentValue: string | number, compareValue?: string | number) {
  if (compareValue == null || compareValue === currentValue) {
    return String(currentValue);
  }
  return `${currentValue} -> ${compareValue}`;
}

function syncLevelInput() {
  const input = levelInput.value;
  if (!input) {
    return;
  }
  const nextValue = String(props.level);
  if (input.value !== nextValue) {
    input.value = nextValue;
  }
}

watch(
  () => [props.selectedCharId, props.ascensionStage, props.level] as const,
  () => {
    void nextTick(syncLevelInput);
  },
  { immediate: true, flush: "post" },
);

function isUniqueTalentAvailable(key: string): boolean {
  const talent = props.selectedCharacter?.uniqueTalentDefs?.[key];
  if (!talent) {
    return false;
  }

  return isBuildConditionMet(talent.condition, {
    ascensionStage: props.ascensionStage,
    uniqueTalentToggles: props.uniqueTalentToggles,
    uniqueTalentConditions: Object.fromEntries(
      Object.entries(props.selectedCharacter?.uniqueTalentDefs ?? {}).map(([innerKey, innerTalent]) => [innerKey, innerTalent.condition]),
    ),
    uniqueTalentDefaults: Object.fromEntries(
      Object.entries(props.selectedCharacter?.uniqueTalentDefs ?? {}).map(([innerKey, innerTalent]) => [innerKey, innerTalent.defaultEnabled === true]),
    ),
  });
}

function isUniqueTalentShown(key: string): boolean {
  const talent = props.selectedCharacter?.uniqueTalentDefs?.[key];
  if (!talent) {
    return false;
  }
  return talent.defaultEnabled !== true;
}

function openPicker() {
  if (props.characterLocked) {
    return;
  }
  isPickerOpen.value = true;
}

function closePicker() {
  isPickerOpen.value = false;
}

function pickCharacter(id: string) {
  emit("update:selectedCharId", id);
  closePicker();
}
</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">{{ t("builder.character") }}</h2>
    </div>

    <div class="grid gap-5">
      <div class="flex items-center gap-3">
        <button
          type="button"
          :disabled="characterLocked"
          class="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[#d4d4d4] bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60"
          @click="openPicker"
        >
          <img
            :src="characterImagePath"
            alt="Character portrait"
            class="h-full w-full object-cover"
            @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
          />
        </button>
        <button
          type="button"
          :disabled="characterLocked"
          class="min-h-11 flex-1 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 py-2 text-left text-sm text-[#444] disabled:cursor-not-allowed disabled:opacity-60"
          @click="openPicker"
        >
          {{ getCharacterDisplayNameByCharacter(selectedCharacter) || t("builder.selectedNone") }}
        </button>
      </div>

      <template v-if="selectedCharacter">

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.eliteStage") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ formatCompareValue(ascensionStage, compareAscensionStage) }}
          </span>
        </div>

        <input
          :value="ascensionStage"
          @input="emit('update:ascensionStage', Number(($event.target as HTMLInputElement).value) as AscensionStage)"
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

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.level") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold tabular-nums">
            {{ formatCompareValue(level, compareLevel) }}
          </span>
        </div>

        <input
          ref="levelInput"
          :value="level"
          @input="emit('update:level', Number(($event.target as HTMLInputElement).value))"
          type="range"
          :min="ASCENSION_LEVEL_MINS[ascensionStage]"
          :max="ASCENSION_LEVEL_CAPS[ascensionStage]"
          step="1"
          class="w-full accent-[#ece81a]"
        />

        <div class="flex justify-between text-xs text-[#8a8a8a]">
          <span>{{ ASCENSION_LEVEL_MINS[ascensionStage] }}</span>
          <span>{{ ASCENSION_LEVEL_CAPS[ascensionStage] }}</span>
        </div>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">{{ t("builder.potential") }}</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ formatCompareValue(`P${potential}`, comparePotential != null ? `P${comparePotential}` : undefined) }}
          </span>
        </div>

        <input
          :value="potential"
          @input="emit('update:potential', Number(($event.target as HTMLInputElement).value) as PotentialLevel)"
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

      <div class="grid gap-2">
        <div class="text-sm font-medium text-[#555]">{{ t("builder.talents") }}</div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(key, index) in CHARACTER_TALENT_KEYS"
            :key="key"
            type="button"
            :disabled="!isCharacterTalentUnlocked(index, ascensionStage)"
            @click="emit('toggle:talent', key)"
            class="rounded-xl border px-3 py-3 text-left text-sm transition"
            :class="
              !isCharacterTalentUnlocked(index, ascensionStage)
                ? 'cursor-not-allowed border-[#d8d8d8] bg-[#efefef] text-[#9a9a9a]'
                : talentToggles[key]
                  ? 'border-[#c8d13c] bg-[#dfe86a] text-[#1b1b1b]'
                  : 'border-[#d4d4d4] bg-[#f8f8f8] text-[#333]'
            "
          >
            <div class="font-semibold">
              {{ t("builder.statTalentUp", { attr: t(`stats.${selectedCharacter.mainAttr}` as never), index: index + 1 }) }}
            </div>
            <div class="mt-1 text-xs">
              +{{ getCharacterTalentBonus(index) }} {{ t(`stats.${selectedCharacter.mainAttr}` as never) }}
            </div>
          </button>
        </div>
      </div>

      <div
        v-if="Object.keys(selectedCharacter.uniqueTalentDefs ?? {}).length > 0"
        class="grid gap-2"
      >
        <div class="text-sm font-medium text-[#555]">{{ t("builder.uniqueTalents") }}</div>

        <div class="grid gap-2">
          <button
            v-for="(talent, key) in selectedCharacter.uniqueTalentDefs"
            :key="key"
            v-show="isUniqueTalentShown(key)"
            type="button"
            :disabled="!isUniqueTalentAvailable(key)"
            @click="emit('toggle:unique-talent', key)"
            class="rounded-xl border px-3 py-3 text-left text-sm transition"
            :class="
              !isUniqueTalentAvailable(key)
                ? 'cursor-not-allowed border-[#d8d8d8] bg-[#efefef] text-[#9a9a9a]'
                : uniqueTalentToggles[key]
                ? 'border-[#c8d13c] bg-[#dfe86a] text-[#1b1b1b]'
                : 'border-[#d4d4d4] bg-[#f8f8f8] text-[#333]'
            "
          >
            <div class="font-semibold">{{ getCharacterUniqueTalentDisplayName({ character: selectedCharacter, talentKey: key, fallbackName: talent.name }) }}</div>
          </button>
        </div>
      </div>

      <div class="grid gap-3">
        <div class="text-sm font-medium text-[#555]">{{ t("builder.skillLevels") }}</div>

        <div
          v-for="row in skillRows"
          :key="row.key"
          class="rounded-xl border border-[#dedede] bg-[#f7f7f7] p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ t(row.label) }}</span>
            <span class="rounded-md bg-white px-2 py-1 text-sm font-semibold tabular-nums">
              {{ formatCompareValue(formatSkillLevel(skillLevels[row.key]), compareSkillLevels?.[row.key] != null ? formatSkillLevel(compareSkillLevels[row.key]!) : undefined) }}
            </span>
          </div>

          <input
            :value="skillLevels[row.key]"
            @input="emit('update:skill-level', {
              key: row.key,
              value: Number(($event.target as HTMLInputElement).value)
            })"
            type="range"
            min="1"
            max="12"
            step="1"
            class="mt-3 w-full accent-[#ece81a]"
          />

          <div class="mt-1 flex justify-between text-xs text-[#8a8a8a]">
            <span>1</span>
            <span>M3</span>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
        <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7a7a]">
          {{ buildCostTitle ?? t("builder.buildCost") }}
        </div>
        <div
          v-if="buildCostNote"
          class="mb-2 text-xs text-[#777]"
        >
          {{ buildCostNote }}
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
      </template>
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
          <h3 class="text-base font-semibold">{{ t("builder.selectCharacter") }}</h3>
          <button
            type="button"
            class="rounded border border-[#d1d1d1] px-3 py-1 text-sm text-[#555] hover:bg-[#f3f3f3]"
            @click="closePicker"
          >
            {{ t("ui.close") }}
          </button>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-3">
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

          <label class="grid gap-1 text-xs text-[#666]">
            <span>{{ t("builder.element") }}</span>
            <select
              v-model="elementFilter"
              class="h-9 rounded-lg border border-[#d4d4d4] bg-[#fafafa] px-2 text-sm"
            >
              <option value="all">{{ t("ui.all") }}</option>
              <option
                v-for="element in elementOptions"
                :key="`element-${element}`"
                :value="element"
              >
                {{ element }}
              </option>
            </select>
          </label>

          <label class="grid gap-1 text-xs text-[#666]">
            <span>{{ t("builder.weaponType") }}</span>
            <select
              v-model="weaponTypeFilter"
              class="h-9 rounded-lg border border-[#d4d4d4] bg-[#fafafa] px-2 text-sm"
            >
              <option value="all">{{ t("ui.all") }}</option>
              <option
                v-for="weaponType in weaponTypeOptions"
                :key="`weaponType-${weaponType}`"
                :value="weaponType"
              >
                {{ weaponType }}
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
            @click="pickCharacter('')"
          >
            {{ t("ui.clearSelection") }}
          </button>
        </div>

        <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            v-for="character in filteredCharacters"
            :key="character.id"
            type="button"
            class="overflow-hidden rounded-xl border border-[#dcdcdc] bg-[#fafafa] text-left transition hover:border-[#c9c9c9] hover:bg-white"
            :class="character.id === selectedCharId ? 'ring-2 ring-[#d7d334]' : ''"
            @click="pickCharacter(character.id)"
          >
            <img
              :src="getCharacterImagePath(character)"
              :alt="character.name"
              class="aspect-[9/10] w-full bg-[#f0f0f0] object-cover"
              @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
            />
            <div class="p-2">
              <div class="truncate text-sm font-semibold text-[#222]">{{ getCharacterDisplayNameByCharacter(character) }}</div>
              <div class="mt-0.5 truncate text-[11px] text-[#666]">
                {{ character.rarity }}★ · {{ character.element }} · {{ character.weaponType }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

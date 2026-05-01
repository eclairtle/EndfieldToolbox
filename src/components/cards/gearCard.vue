<script setup lang="ts">
import { computed, ref } from "vue";
import { isGearUpgradable, type GearBase } from "@/data/gears";
import type { GearInstance, GearSubLevel } from "@/lib/build/gearInstances";
import { effectiveGearSubLevel, scaledGearSubValue, formatGearSubValue } from "@/lib/build/gearScaling";
import type { AttrKey, CharacterStatKey, ModifierStatKey } from "@/lib/build/stats";
import { getGearImagePath } from "@/lib/assets/imagePaths";
import { useLocale } from "@/i18n/useLocale";
import { getGearDisplayNameByGear, getGearSetDisplayName } from "@/i18n/domain/displayNames";

const props = defineProps<{
  title: string;
  options: GearBase[];
  gearInstance: GearInstance | null;
}>();

const emit = defineEmits<{
  (e: "update:selectedGearId", value: string): void;
  (e: "update:subLevel", payload: { index: number; value: GearSubLevel }): void;
}>();

const selectedGearId = computed(() => props.gearInstance?.gearId ?? "");
const { t } = useLocale();
const NO_SET_OPTION = "__NO_SET__";

const selectedGear = computed<GearBase | null>(() => {
  const id = selectedGearId.value;
  if (!id) return null;
  return props.options.find((g) => g.id === id) ?? null;
});
const gearImagePath = computed(() => getGearImagePath(selectedGear.value));
const isPickerOpen = ref(false);
const rarityFilter = ref<number | "all">("all");
const setFilter = ref<string>("all");

function inferGearRarity(gear: GearBase): number {
  const match = gear.id.match(/_t(\d+)_/);
  if (!match) {
    return 0;
  }
  const tier = Number(match[1]);
  if (!Number.isFinite(tier)) {
    return 0;
  }
  return tier + 2;
}

const rarityOptions = computed(() =>
  [...new Set(props.options.map((gear) => inferGearRarity(gear)))]
    .filter((rarity) => rarity > 0)
    .sort((a, b) => b - a),
);
const setOptions = computed(() =>
  [...new Set(props.options.map((gear) => gear.set ?? NO_SET_OPTION))].sort((a, b) => {
    if (a === NO_SET_OPTION) return -1;
    if (b === NO_SET_OPTION) return 1;
    return a.localeCompare(b);
  }),
);
const filteredOptions = computed(() =>
  props.options.filter((gear) => {
    if (rarityFilter.value !== "all" && inferGearRarity(gear) !== rarityFilter.value) {
      return false;
    }
    if (setFilter.value !== "all" && (gear.set ?? NO_SET_OPTION) !== setFilter.value) {
      return false;
    }
    return true;
  }),
);

const selectedGearUpgradable = computed(() => (selectedGear.value ? isGearUpgradable(selectedGear.value) : false));

function modifierLabel(stat: ModifierStatKey) {
  const localized = t(`modifiers.${stat}` as const);
  return localized.startsWith("modifiers.") ? stat : localized;
}

function subLabel(stat: AttrKey | CharacterStatKey | ModifierStatKey): string {
  switch (stat) {
    case "STR":
    case "AGI":
    case "INT":
    case "WIL":
    case "HP":
    case "ATK":
      return t(`stats.${stat}` as const);

    case "MAIN_ATTR_PCT":
    case "SECONDARY_ATTR_PCT":
    case "CRIT_RATE_PCT":
    case "ULT_GAIN_PCT":
    case "ATK_PCT":
    case "PHYSICAL_DMG_PCT":
    case "ARTS_DMG_PCT":
    case "HEAT_NATURE_DMG_PCT":
    case "CRYO_ELECTRIC_DMG_PCT":
    case "HEAT_DMG_PCT":
    case "CRYO_DMG_PCT":
    case "ELECTRIC_DMG_PCT":
    case "NATURE_DMG_PCT":
    case "BASIC_ATK_DMG_PCT":
    case "BATTLE_SKILL_DMG_PCT":
    case "COMBO_SKILL_DMG_PCT":
    case "ULTIMATE_DMG_PCT":
    case "HEALING_PCT":
    case "FINAL_DMG_REDUCTION_PCT":
    case "ARTS_INTENSITY":
    case "ALL_DMG_PCT":
    case "DMG_VS_STAGGERED_PCT":
    case "CRIT_DMG_PCT":
    case "ULTIMATE_COST_REDUCTION_PCT":
    case "SKILL_DMG_PCT":
    case "DMG_TAKEN_PCT":
    case "ARTS_DMG_TAKEN_PCT":
    case "PHYSICAL_DMG_TAKEN_PCT":
    case "HEAT_DMG_TAKEN_PCT":
    case "CRYO_DMG_TAKEN_PCT":
    case "ELECTRIC_DMG_TAKEN_PCT":
    case "NATURE_DMG_TAKEN_PCT":
    case "AETHER_DMG_TAKEN_PCT":
    case "PHYSICAL_RESIST_PCT":
    case "HEAT_RESIST_PCT":
    case "CRYO_RESIST_PCT":
    case "ELECTRIC_RESIST_PCT":
    case "NATURE_RESIST_PCT":
    case "AETHER_RESIST_PCT":
    case "PHYSICAL_RESIST_IGNORE_PCT":
    case "HEAT_RESIST_IGNORE_PCT":
    case "CRYO_RESIST_IGNORE_PCT":
    case "ELECTRIC_RESIST_IGNORE_PCT":
    case "NATURE_RESIST_IGNORE_PCT":
    case "AETHER_RESIST_IGNORE_PCT":
    case "HEALING_RECEIVED_PCT":
    case "PHYSICAL_SUS_PCT":
    case "ARTS_SUS_PCT":
    case "HEAT_SUS_PCT":
    case "CRYO_SUS_PCT":
    case "ELECTRIC_SUS_PCT":
    case "NATURE_SUS_PCT":
    case "AETHER_SUS_PCT":
    case "DMG_AMP_PCT":
    case "PHYSICAL_DMG_AMP_PCT":
    case "HEAT_DMG_AMP_PCT":
    case "CRYO_DMG_AMP_PCT":
    case "ELECTRIC_DMG_AMP_PCT":
    case "NATURE_DMG_AMP_PCT":
    case "AETHER_DMG_AMP_PCT":
    case "FLAT_ATK":
    case "FLAT_HP":
    case "HP_PCT":
      return modifierLabel(stat);

    default:
      return stat;
  }
}

function onGearChange(value: string) {
  emit("update:selectedGearId", value);
}

function onSubLevelChange(index: number, value: number) {
  emit("update:subLevel", {
    index,
    value: value as GearSubLevel,
  });
}

function openPicker() {
  isPickerOpen.value = true;
}

function closePicker() {
  isPickerOpen.value = false;
}

function pickGear(id: string) {
  onGearChange(id);
  closePicker();
}

function localizeSetName(setName: string | null | undefined) {
  if (!setName) {
    return t("ui.noSet");
  }
  return getGearSetDisplayName({ setName, fallbackName: setName });
}
</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">{{ title }}</h2>
    </div>

    <div class="grid gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[#d4d4d4] bg-[#f5f5f5]"
          @click="openPicker"
        >
          <img
            :src="gearImagePath"
            :alt="t('builder.gear')"
            class="h-full w-full object-cover"
            @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
          />
        </button>
        <button
          type="button"
          class="min-h-11 flex-1 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 py-2 text-left text-sm text-[#444]"
          @click="openPicker"
        >
          {{ getGearDisplayNameByGear(selectedGear) || t("builder.selectedNone") }}
        </button>
      </div>

      <div
        v-if="selectedGear"
        class="rounded-xl border border-[#dedede] bg-[#f7f7f7] p-4"
      >
        <div class="mb-3 text-sm font-medium">
          {{ t("stats.DEF") }} +{{ selectedGear.defFlat }}
        </div>

        <div class="space-y-3">
          <div
            v-for="(sub, i) in selectedGear.subs"
            :key="sub.stat + i"
            class="rounded-lg border border-[#e3e3e3] bg-white p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">
                  {{ subLabel(sub.stat) }}
                </div>
                <div class="text-xs text-[#666]">
                  <template v-if="selectedGearUpgradable">
                  {{
                    formatGearSubValue(
                      sub.stat,
                      scaledGearSubValue(
                        sub.stat,
                        sub.value,
                        effectiveGearSubLevel(
                          gearInstance?.subLevels[i] ?? 0,
                          selectedGearUpgradable
                        )
                      )
                    )
                  }}
                  </template>
                </div>
              </div>

              <div class="text-sm font-semibold tabular-nums">
                <template v-if="selectedGearUpgradable">
                  {{ t("ui.levelShort") }} {{ gearInstance?.subLevels[i] ?? 0 }}
                </template>
                <template v-else>
                  {{
                    formatGearSubValue(
                      sub.stat,
                      scaledGearSubValue(sub.stat, sub.value, 0)
                    )
                  }}
                </template>
              </div>
            </div>

            <input
              v-if="selectedGearUpgradable"
              type="range"
              min="0"
              max="3"
              step="1"
              :value="gearInstance?.subLevels[i] ?? 0"
              @input="onSubLevelChange(i, Number(($event.target as HTMLInputElement).value))"
              class="mt-2 w-full accent-[#ece81a]"
            />

            <div
              v-if="selectedGearUpgradable"
              class="mt-1 flex justify-between text-xs text-[#8a8a8a]"
            >
              <span>0</span>
              <span>3</span>
            </div>
          </div>
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
          <h3 class="text-base font-semibold">{{ t("builder.selectGear", { title }) }}</h3>
          <button
            type="button"
            class="rounded border border-[#d1d1d1] px-3 py-1 text-sm text-[#555] hover:bg-[#f3f3f3]"
            @click="closePicker"
          >
            {{ t("ui.close") }}
          </button>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
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
            <span>{{ t("builder.set") }}</span>
            <select
              v-model="setFilter"
              class="h-9 rounded-lg border border-[#d4d4d4] bg-[#fafafa] px-2 text-sm"
            >
              <option value="all">{{ t("ui.all") }}</option>
              <option
                v-for="setName in setOptions"
                :key="`set-${setName}`"
                :value="setName"
              >
                {{ setName === NO_SET_OPTION ? t("ui.noSet") : localizeSetName(setName) }}
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
            @click="pickGear('')"
          >
            {{ t("ui.clearSelection") }}
          </button>
        </div>

        <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            v-for="gear in filteredOptions"
            :key="gear.id"
            type="button"
            class="overflow-hidden rounded-xl border border-[#dcdcdc] bg-[#fafafa] text-left transition hover:border-[#c9c9c9] hover:bg-white"
            :class="gear.id === selectedGearId ? 'ring-2 ring-[#d7d334]' : ''"
            @click="pickGear(gear.id)"
          >
            <img
              :src="getGearImagePath(gear)"
              :alt="gear.name"
              class="aspect-[9/10] w-full bg-[#f0f0f0] object-cover"
              @error="(($event.target as HTMLImageElement).src = '/icons/no_selection.svg')"
            />
            <div class="p-2">
              <div class="truncate text-sm font-semibold text-[#222]">{{ getGearDisplayNameByGear(gear) }}</div>
              <div class="mt-0.5 truncate text-[11px] text-[#666]">
                {{ inferGearRarity(gear) > 0 ? `${inferGearRarity(gear)}★` : "?" }} · {{ localizeSetName(gear.set) }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ActiveGearSetInfo } from "@/lib/combat/gearSetEffects";
import type { FinalStats, ModifierStatKey } from "@/lib/build/stats";
import { displayModifierEntries, modifierLabels } from "@/lib/modifierDisplay";
import { useLocale } from "@/i18n/useLocale";
import { getGearSetDescription, getGearSetDisplayName } from "@/i18n/domain/displayNames";

const props = defineProps<{
  characterName: string;
  weaponName: string;
  out: FinalStats;
  baselineOut?: FinalStats | null;
  plannerMode: "current" | "planner";
  activeGearSet: ActiveGearSetInfo | null;
  benchmarks: {
    id: string;
    name: string;
    label: string;
    value: number;
    suffix?: string;
  }[];
}>();

const emit = defineEmits<{
  (e: "update:planner-mode", value: "current" | "planner"): void;
  (e: "reset:planner-to-current"): void;
}>();

const statOrder = ["STR", "AGI", "INT", "WIL", "ATK", "HP", "DEF"] as const;
const isCompareMode = computed(() => props.plannerMode === "planner" && Boolean(props.baselineOut));
const { t } = useLocale();

function statLabel(stat: (typeof statOrder)[number]) {
  return t(`stats.${stat}` as const);
}

function modifierLabel(key: ModifierStatKey) {
  const localized = t(`modifiers.${key}` as const);
  return localized.startsWith("modifiers.") ? (modifierLabels[key] ?? key) : localized;
}

function formatModifierValue(key: ModifierStatKey, value: number) {
  if (
    key === "PHYSICAL_RESIST_PCT"
    || key === "HEAT_RESIST_PCT"
    || key === "CRYO_RESIST_PCT"
    || key === "ELECTRIC_RESIST_PCT"
    || key === "NATURE_RESIST_PCT"
    || key === "AETHER_RESIST_PCT"
  ) {
    return `${Math.round(value * 100)}`;
  }
  return key.endsWith("PCT") ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(1)}`;
}

const visibleModifierRows = computed(() => {
  if (!isCompareMode.value || !props.baselineOut) {
    return displayModifierEntries(props.out.mods).map((entry) => ({
      key: entry.key,
      label: modifierLabel(entry.key as ModifierStatKey),
      currentValue: null as number | null,
      plannedValue: props.out.mods[entry.key as ModifierStatKey],
      display: entry.value,
    }));
  }

  const currentEntries = displayModifierEntries(props.baselineOut.mods);
  const plannedEntries = displayModifierEntries(props.out.mods);
  const keySet = new Set<ModifierStatKey>();
  for (const entry of currentEntries) keySet.add(entry.key as ModifierStatKey);
  for (const entry of plannedEntries) keySet.add(entry.key as ModifierStatKey);

  return [...keySet].map((key) => {
    const currentValue = props.baselineOut!.mods[key];
    const plannedValue = props.out.mods[key];
    const changed = plannedValue !== currentValue;
    return {
      key,
      label: modifierLabel(key),
      currentValue,
      plannedValue,
      display: changed
        ? `${formatModifierValue(key, currentValue)} → ${formatModifierValue(key, plannedValue)}`
        : formatModifierValue(key, plannedValue),
    };
  });
});
</script>

<template>
  <aside class="lg:top-6">
    <section class="overflow-hidden rounded-2xl border border-[#cfcfcf] bg-white shadow-sm">
      <div class="bg-[#2e2e2e] px-5 py-4 text-white">
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs uppercase tracking-[0.24em] text-[#cfcfcf]">
            {{ t("summary.title") }}
          </div>
          <div class="flex rounded-full border border-[#565656] bg-[#3a3a3a] p-1 shadow-sm">
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] transition"
              :class="
                plannerMode === 'current'
                  ? 'bg-[#ece81a] text-[#1b1b1b]'
                  : 'text-[#d8d8d8] hover:bg-[#4a4a4a]'
              "
              @click="emit('update:planner-mode', 'current')"
            >
              {{ t("planner.current") }}
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] transition"
              :class="
                plannerMode === 'planner'
                  ? 'bg-[#ece81a] text-[#1b1b1b]'
                  : 'text-[#d8d8d8] hover:bg-[#4a4a4a]'
              "
              @click="emit('update:planner-mode', 'planner')"
            >
              {{ t("planner.planner") }}
            </button>
          </div>
        </div>
        <div class="mt-1 flex items-center gap-3">
          <div class="h-7 w-1 bg-[#ece81a]"></div>
          <h2 class="text-xl font-semibold">{{ characterName }}</h2>
        </div>
        <div
          v-if="plannerMode === 'planner'"
          class="mt-3"
        >
          <button
            type="button"
            class="rounded border border-[#6a6a6a] bg-[#3a3a3a] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#ececec] transition hover:bg-[#4a4a4a]"
            @click="emit('reset:planner-to-current')"
          >
            {{ t("planner.resetToCurrentValues") }}
          </button>
        </div>
      </div>

      <div class="space-y-5 p-5">
        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              {{ t("summary.finalStats") }}
            </h3>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="k in statOrder"
              :key="k"
              class="rounded-xl border border-[#dddddd] bg-[#fafafa] p-4"
            >
              <div class="text-xs font-medium tracking-[0.14em] text-[#7a7a7a]">
                {{ statLabel(k) }}
              </div>
              <div
                v-if="isCompareMode && baselineOut"
                class="mt-2 text-sm font-semibold tabular-nums"
                :class="out.statsCard[k] > baselineOut.statsCard[k] ? 'text-[#1b7f2a]' : out.statsCard[k] < baselineOut.statsCard[k] ? 'text-[#b42323]' : 'text-[#1b1b1b]'"
              >
                {{
                  out.statsCard[k] === baselineOut.statsCard[k]
                    ? out.statsCard[k]
                    : `${baselineOut.statsCard[k]} → ${out.statsCard[k]}`
                }}
              </div>
              <div
                v-else
                class="mt-2 text-2xl font-semibold tabular-nums"
              >
                {{ out.statsCard[k] }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              {{ t("summary.activeModifiers") }}
            </h3>
          </div>

          <div
            v-if="visibleModifierRows.length > 0"
            class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm"
          >
            <div
              v-for="entry in visibleModifierRows"
              :key="entry.key"
              class="flex justify-between gap-3"
            >
              <span class="text-[#666]">{{ entry.label }}</span>
              <span
                class="font-semibold tabular-nums"
                :class="
                  isCompareMode && entry.currentValue != null && entry.plannedValue > entry.currentValue
                    ? 'text-[#1b7f2a]'
                    : isCompareMode && entry.currentValue != null && entry.plannedValue < entry.currentValue
                      ? 'text-[#b42323]'
                      : ''
                "
              >
                {{ entry.display }}
              </span>
            </div>
          </div>

          <div
            v-else
            class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm text-[#777]"
          >
            {{ t("summary.noActiveModifiers") }}
          </div>
        </div>

        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              {{ t("summary.calculationSnapshot") }}
            </h3>
          </div>

          <div class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.characterBaseAtk") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="out.baseATK > baselineOut.baseATK ? 'text-[#1b7f2a]' : out.baseATK < baselineOut.baseATK ? 'text-[#b42323]' : ''">
                    {{ out.baseATK === baselineOut.baseATK ? out.baseATK : `${baselineOut.baseATK} → ${out.baseATK}` }}
                  </span>
                </template>
                <template v-else>{{ out.baseATK }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.weaponBaseAtk") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="out.weaponATK > baselineOut.weaponATK ? 'text-[#1b7f2a]' : out.weaponATK < baselineOut.weaponATK ? 'text-[#b42323]' : ''">
                    {{ out.weaponATK === baselineOut.weaponATK ? out.weaponATK : `${baselineOut.weaponATK} → ${out.weaponATK}` }}
                  </span>
                </template>
                <template v-else>{{ out.weaponATK }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.baseHp") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="out.baseHP > baselineOut.baseHP ? 'text-[#1b7f2a]' : out.baseHP < baselineOut.baseHP ? 'text-[#b42323]' : ''">
                    {{ out.baseHP === baselineOut.baseHP ? out.baseHP : `${baselineOut.baseHP} → ${out.baseHP}` }}
                  </span>
                </template>
                <template v-else>{{ out.baseHP }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.attributeBonus") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="out.attributeBonus > baselineOut.attributeBonus ? 'text-[#1b7f2a]' : out.attributeBonus < baselineOut.attributeBonus ? 'text-[#b42323]' : ''">
                    {{
                      out.attributeBonus === baselineOut.attributeBonus
                        ? `${(out.attributeBonus * 100).toFixed(2)}%`
                        : `${(baselineOut.attributeBonus * 100).toFixed(2)}% → ${(out.attributeBonus * 100).toFixed(2)}%`
                    }}
                  </span>
                </template>
                <template v-else>{{ (out.attributeBonus * 100).toFixed(2) }}%</template>
              </span>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              {{ t("summary.benchmarks") }}
            </h3>
          </div>

          <div
            v-if="benchmarks.length > 0"
            class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm"
          >
            <div
              v-for="bm in benchmarks"
              :key="bm.id"
              class="flex justify-between gap-3"
            >
              <span class="text-[#666]">{{ bm.label || bm.name }}</span>
              <span class="font-semibold tabular-nums">
                {{ Math.round(bm.value) }}{{ bm.suffix ?? "" }}
              </span>
            </div>
          </div>

          <div
            v-else
            class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm text-[#777]"
          >
            {{ t("summary.noBenchmarks") }}
          </div>
        </div>

        <div class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7a7a]">
            {{ t("summary.activeSetEffect") }}
          </div>

          <div
            v-if="activeGearSet"
            class="space-y-2 text-[#555]"
          >
            <div class="font-medium text-[#1b1b1b]">{{ getGearSetDisplayName({ setName: activeGearSet.name, fallbackName: activeGearSet.name }) }}</div>
            <div class="whitespace-pre-line text-[#555]">{{ getGearSetDescription({ setName: activeGearSet.name, fallbackDescription: activeGearSet.description }) }}</div>
          </div>
          <div
            v-else
            class="text-[#777]"
          >
            {{ t("summary.noSetEffect") }}
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>

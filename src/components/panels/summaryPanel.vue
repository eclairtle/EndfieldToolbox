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
  activeVariantIndex: number;
  compareEnabled: boolean;
  compareTargetVariant: number;
  setToSourceVariant: number;
  activeGearSet: ActiveGearSetInfo | null;
  gearContribution?: {
    attributes: { key: "STR" | "AGI" | "INT" | "WIL"; value: number }[];
    modifiers: { key: ModifierStatKey; value: number }[];
  } | null;
  benchmarks: {
    id: string;
    name: string;
    label: string;
    value: number;
    suffix?: string;
  }[];
}>();

const emit = defineEmits<{
  (e: "update:active-variant-index", value: number): void;
  (e: "update:compare-enabled", value: boolean): void;
  (e: "update:compare-target-variant", value: number): void;
  (e: "update:set-to-source-variant", value: number): void;
  (e: "apply:set-to-build"): void;
}>();

const statOrder = ["STR", "AGI", "INT", "WIL", "ATK", "HP", "DEF"] as const;
const isCompareMode = computed(() => Boolean(props.baselineOut));
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

function isAttributeStat(stat: (typeof statOrder)[number]) {
  return stat === "STR" || stat === "AGI" || stat === "INT" || stat === "WIL";
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

  const currentEntries = displayModifierEntries(props.out.mods);
  const plannedEntries = displayModifierEntries(props.baselineOut.mods);
  const keySet = new Set<ModifierStatKey>();
  for (const entry of currentEntries) keySet.add(entry.key as ModifierStatKey);
  for (const entry of plannedEntries) keySet.add(entry.key as ModifierStatKey);

  return [...keySet].map((key) => {
    const currentValue = props.out.mods[key];
    const plannedValue = props.baselineOut!.mods[key];
    const changed = plannedValue !== currentValue;
    return {
      key,
      label: modifierLabel(key),
      currentValue,
      plannedValue,
      display: changed
        ? `${formatModifierValue(key, currentValue)} → ${formatModifierValue(key, plannedValue)}`
        : formatModifierValue(key, currentValue),
    };
  });
});
</script>

<template>
  <aside>
    <section class="overflow-hidden rounded-2xl border border-[#cfcfcf] bg-white shadow-sm">
      <div class="bg-[#2e2e2e] px-5 py-4 text-white">
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs uppercase tracking-[0.24em] text-[#cfcfcf]">
            {{ t("summary.title") }}
          </div>
          <div class="flex rounded-full border border-[#565656] bg-[#3a3a3a] p-1 shadow-sm">
            <button
              v-for="index in [0, 1, 2, 3]"
              :key="index"
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] transition"
              :class="
                activeVariantIndex === index
                  ? 'bg-[#ece81a] text-[#1b1b1b]'
                  : 'text-[#d8d8d8] hover:bg-[#4a4a4a]'
              "
              @click="emit('update:active-variant-index', index)"
            >
              {{ `Build ${index + 1}` }}
            </button>
          </div>
        </div>
        <div class="mt-1 flex items-center gap-3">
          <div class="h-7 w-1 bg-[#ece81a]"></div>
          <h2 class="text-xl font-semibold">{{ characterName }}</h2>
        </div>
        <div class="mt-3 flex items-center gap-2 text-xs">
          <span class="uppercase tracking-[0.12em] text-[#d8d8d8]">{{ t("summary.setToBuild") }}</span>
          <select
            :value="setToSourceVariant"
            class="rounded border border-[#565656] bg-[#3a3a3a] px-2 py-1 text-xs text-[#ececec]"
            @change="emit('update:set-to-source-variant', Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="index in [0, 1, 2, 3]" :key="`setto-${index}`" :value="index">
              {{ `Build ${index + 1}` }}
            </option>
          </select>
          <button
            type="button"
            class="rounded border border-[#6a6a6a] bg-[#3a3a3a] px-2 py-1 font-medium uppercase tracking-[0.08em] text-[#ececec] transition hover:bg-[#4a4a4a]"
            @click="emit('apply:set-to-build')"
          >
            {{ t("summary.apply") }}
          </button>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label class="inline-flex items-center gap-2">
            <input
              :checked="compareEnabled"
              type="checkbox"
              class="h-4 w-4 accent-[#ece81a]"
              @change="emit('update:compare-enabled', ($event.target as HTMLInputElement).checked)"
            />
            <span class="uppercase tracking-[0.12em] text-[#d8d8d8]">{{ t("summary.compareBuilds") }}</span>
          </label>
          <template v-if="compareEnabled">
            <span class="text-[#bcbcbc]">{{ t("summary.vs") }}</span>
            <select
              :value="compareTargetVariant"
              class="rounded border border-[#565656] bg-[#3a3a3a] px-2 py-1 text-xs text-[#ececec]"
              @change="emit('update:compare-target-variant', Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="index in [0, 1, 2, 3]" :key="`cmp-target-${index}`" :value="index">
                {{ `Build ${index + 1}` }}
              </option>
            </select>
          </template>
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
              class="group relative rounded-xl border border-[#dddddd] bg-[#fafafa] p-4"
            >
              <div class="text-xs font-medium tracking-[0.14em] text-[#7a7a7a]">
                {{ statLabel(k) }}
              </div>
              <div
                v-if="isCompareMode && baselineOut"
                class="mt-2 text-sm font-semibold tabular-nums"
                :class="baselineOut.statsCard[k] > out.statsCard[k] ? 'text-[#1b7f2a]' : baselineOut.statsCard[k] < out.statsCard[k] ? 'text-[#b42323]' : 'text-[#1b1b1b]'"
              >
                {{
                  out.statsCard[k] === baselineOut.statsCard[k]
                    ? out.statsCard[k]
                    : `${out.statsCard[k]} → ${baselineOut.statsCard[k]}`
                }}
              </div>
              <div
                v-else
                class="mt-2 text-2xl font-semibold tabular-nums"
              >
                {{ out.statsCard[k] }}
              </div>

              <div
                v-if="isAttributeStat(k)"
                class="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-[#d8d8d8] bg-white p-2 text-xs text-[#444] shadow-lg group-hover:block"
              >
                <div class="mb-1 font-semibold text-[#222]">{{ statLabel(k) }} Breakdown</div>
                <div class="flex justify-between"><span>Operator Base</span><span class="tabular-nums">{{ out.attributeBreakdown[k].operatorBase }}</span></div>
                <div class="flex justify-between"><span>Operator Bonus</span><span class="tabular-nums">{{ out.attributeBreakdown[k].operatorBonus }}</span></div>
                <div class="flex justify-between"><span>Weapon Bonus</span><span class="tabular-nums">{{ out.attributeBreakdown[k].weaponBonus }}</span></div>
                <div class="flex justify-between"><span>Gear Bonus</span><span class="tabular-nums">{{ out.attributeBreakdown[k].gearBonus }}</span></div>
                <div class="mt-1 flex justify-between border-t border-[#ececec] pt-1"><span>% Multiplier</span><span class="tabular-nums">{{ out.attributeBreakdown[k].percentageMultiplierPct.toFixed(2) }}%</span></div>
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
                  <span :class="baselineOut.baseATK > out.baseATK ? 'text-[#1b7f2a]' : baselineOut.baseATK < out.baseATK ? 'text-[#b42323]' : ''">
                    {{ out.baseATK === baselineOut.baseATK ? out.baseATK : `${out.baseATK} → ${baselineOut.baseATK}` }}
                  </span>
                </template>
                <template v-else>{{ out.baseATK }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.weaponBaseAtk") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="baselineOut.weaponATK > out.weaponATK ? 'text-[#1b7f2a]' : baselineOut.weaponATK < out.weaponATK ? 'text-[#b42323]' : ''">
                    {{ out.weaponATK === baselineOut.weaponATK ? out.weaponATK : `${out.weaponATK} → ${baselineOut.weaponATK}` }}
                  </span>
                </template>
                <template v-else>{{ out.weaponATK }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.baseHp") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="baselineOut.baseHP > out.baseHP ? 'text-[#1b7f2a]' : baselineOut.baseHP < out.baseHP ? 'text-[#b42323]' : ''">
                    {{ out.baseHP === baselineOut.baseHP ? out.baseHP : `${out.baseHP} → ${baselineOut.baseHP}` }}
                  </span>
                </template>
                <template v-else>{{ out.baseHP }}</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">{{ t("summary.attributeBonus") }}</span>
              <span class="font-semibold tabular-nums">
                <template v-if="isCompareMode && baselineOut">
                  <span :class="baselineOut.attributeBonus > out.attributeBonus ? 'text-[#1b7f2a]' : baselineOut.attributeBonus < out.attributeBonus ? 'text-[#b42323]' : ''">
                    {{
                      out.attributeBonus === baselineOut.attributeBonus
                        ? `${(out.attributeBonus * 100).toFixed(2)}%`
                        : `${(out.attributeBonus * 100).toFixed(2)}% → ${(baselineOut.attributeBonus * 100).toFixed(2)}%`
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
            {{ t("summary.gearContribution") }}
          </div>

          <div
            v-if="gearContribution && (gearContribution.attributes.length > 0 || gearContribution.modifiers.length > 0)"
            class="space-y-2 text-[#555]"
          >
            <div
              v-for="entry in gearContribution.attributes"
              :key="`gear-attr-${entry.key}`"
              class="flex justify-between gap-3"
            >
              <span class="text-[#666]">{{ statLabel(entry.key) }}</span>
              <span class="font-semibold tabular-nums">+{{ entry.value }}</span>
            </div>
            <div
              v-for="entry in gearContribution.modifiers"
              :key="`gear-mod-${entry.key}`"
              class="flex justify-between gap-3"
            >
              <span class="text-[#666]">{{ modifierLabel(entry.key) }}</span>
              <span class="font-semibold tabular-nums">{{ formatModifierValue(entry.key, entry.value) }}</span>
            </div>
          </div>
          <div
            v-else
            class="text-[#777]"
          >
            {{ t("summary.noGearContribution") }}
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

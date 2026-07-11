<script setup lang="ts">
import { useLocale } from "@/i18n/useLocale";

type HitTimelineEntry = {
  stepId: string;
  hitIndex: number;
  time: number;
  multiplier: number;
  damageType: string;
  noCritDamage: number;
  critDamage: number;
  damage: number;
};

const props = defineProps<{
  selectedHitForDetails: HitTimelineEntry | null;
  selectedHitDetails: any;
  modifierStatKeys: readonly string[];
  defaultModifierStats: Record<string, number>;
  modifierLabels: Record<string, string>;
  getTimelineCommandTypeLabel: (entry: any) => string;
  formatDamage: (value: number) => string;
  formatModifierValue: (value: number, key: any, isPercent: boolean) => string;
  onClose: () => void;
}>();

const { t, locale } = useLocale();

function modifierLabel(key: string) {
  void locale.value;
  const localized = t(`modifiers.${key}` as const);
  return localized.startsWith("modifiers.") ? (props.modifierLabels[key] ?? key) : localized;
}

function localizeDamageType(label: string) {
  switch (label) {
    case "Physical":
      return t("hitDetails.physical");
    case "Arts":
      return t("hitDetails.arts");
    case "Heat":
      return t("hitDetails.heat");
    case "Cryo":
      return t("hitDetails.cryo");
    case "Electric":
      return t("hitDetails.electric");
    case "Nature":
      return t("hitDetails.nature");
    case "Aether":
      return t("hitDetails.aether");
    default:
      return label;
  }
}
</script>

<template>
  <div
    v-if="selectedHitForDetails"
    class="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4"
    @click.self="onClose"
  >
    <div class="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#d6d6d6] bg-white p-4 shadow-xl">
      <div class="mb-3 flex items-start justify-between gap-4">
        <div>
          <div class="text-sm font-semibold text-[#1b1b1b]">{{ t("rotation.commandHit") }}</div>
          <div class="text-xs text-[#666]">
            {{ getTimelineCommandTypeLabel(selectedHitForDetails) }} · {{ selectedHitForDetails.time.toFixed(2) }}s
          </div>
        </div>
        <button
          type="button"
          class="rounded-md border border-[#d7d7d7] px-2 py-1 text-xs text-[#444] transition hover:bg-[#f5f5f5]"
          @click="onClose"
        >
          {{ t("ui.close") }}
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3 text-xs text-[#333] sm:grid-cols-2">
        <div class="rounded-lg border border-[#ececec] bg-[#fafafa] p-3">
          <div class="font-semibold text-[#1b1b1b]">{{ t("hitDetails.hitInputs") }}</div>
          <div class="mt-1 space-y-1">
            <div>{{ t("hitDetails.multiplier") }}: {{ (selectedHitForDetails.multiplier * 100).toFixed(1) }}%</div>
            <div>{{ t("hitDetails.damageType") }}: {{ localizeDamageType(selectedHitForDetails.damageType) }}</div>
            <div>{{ t("hitDetails.noCrit") }}: {{ formatDamage(selectedHitForDetails.noCritDamage) }}</div>
            <div>{{ t("hitDetails.crit") }}: {{ formatDamage(selectedHitForDetails.critDamage) }}</div>
            <div>{{ t("hitDetails.average") }}: {{ formatDamage(selectedHitForDetails.damage) }}</div>
          </div>
        </div>

        <div v-if="selectedHitDetails" class="rounded-lg border border-[#ececec] bg-[#fafafa] p-3">
          <div class="font-semibold text-[#1b1b1b]">{{ t("hitDetails.calculationFactors") }}</div>
          <div class="mt-1 space-y-1">
            <div>{{ t("hitDetails.finalAtk") }}: {{ selectedHitDetails.ctx.finalAtk.toFixed(2) }}</div>
            <div>{{ t("hitDetails.dmgBonus") }}: +{{ (selectedHitDetails.totalDamageBonus * 100).toFixed(1) }}%</div>
            <div>{{ t("hitDetails.contractModifier") }}: ×{{ selectedHitDetails.contractDamageMultiplier.toFixed(4) }}</div>
            <div v-if="Math.abs(selectedHitDetails.contractFlatModifier) > 1e-9">{{ t("hitDetails.contractFlatModifier") }}: {{ formatDamage(selectedHitDetails.contractFlatModifier) }}</div>
            <div>{{ t("hitDetails.dmgAmp") }}: ×{{ selectedHitDetails.dmgAmpMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.dmgTaken") }}: ×{{ selectedHitDetails.damageTakenMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.resistance") }}: {{ (selectedHitDetails.effectiveResistance * 100).toFixed(1) }}% (×{{ selectedHitDetails.resistanceMultiplier.toFixed(4) }})</div>
            <div>{{ t("hitDetails.susceptibility") }}: ×{{ selectedHitDetails.susceptibilityMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.defense") }}: ×{{ selectedHitDetails.defenseMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.staggeredBonus") }}: ×{{ selectedHitDetails.staggeredMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.finisherBonus") }}: ×{{ selectedHitDetails.finisherBonusMultiplier.toFixed(4) }}</div>
            <div>{{ t("hitDetails.totalEnemyBonus") }}: ×{{ selectedHitDetails.totalEnemyMultiplier.toFixed(4) }}</div>
            <div v-if="selectedHitDetails.isReaction">{{ t("hitDetails.baseReactionMult") }}: {{ ((selectedHitDetails.ctx.reactionBaseMultiplier ?? selectedHitDetails.hit.multiplier) * 100).toFixed(1) }}%</div>
            <div v-if="selectedHitDetails.isReaction">{{ t("hitDetails.levelMult") }}: ×{{ selectedHitDetails.levelMultiplier.toFixed(4) }} (Lv {{ selectedHitDetails.ctx.applierLevel ?? 1 }})</div>
            <div v-if="selectedHitDetails.isReaction">{{ t("hitDetails.artsIntensity") }}: {{ selectedHitDetails.artsIntensity.toFixed(1) }} (×{{ selectedHitDetails.artsIntensityMultiplier.toFixed(4) }})</div>
            <div>{{ t("hitDetails.link") }}: ×{{ (1 + selectedHitDetails.ctx.linkMultiplier).toFixed(4) }}</div>
            <div>{{ t("hitDetails.avgCritMult") }}: ×{{ selectedHitDetails.critAverageMultiplier.toFixed(4) }}</div>
          </div>
        </div>
      </div>

      <div v-if="selectedHitDetails" class="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div class="rounded-lg border border-[#ececec] bg-white p-3">
          <div class="mb-1 font-semibold text-[#1b1b1b]">{{ t("hitDetails.attackerModifiers") }}</div>
          <div class="max-h-44 space-y-1 overflow-y-auto text-[#444]">
            <div
              v-for="key in modifierStatKeys.filter((statKey) => selectedHitDetails ? Math.abs(selectedHitDetails.ctx.attackerMods[statKey] - (defaultModifierStats[statKey] ?? 0)) > 1e-9 : false)"
              :key="`atk-${key}`"
              class="flex items-center justify-between gap-2"
            >
              <span class="truncate">{{ modifierLabel(key) }}</span>
              <span class="shrink-0">{{ formatModifierValue(selectedHitDetails.ctx.attackerMods[key], key, key.endsWith('_PCT')) }}</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white p-3">
          <div class="mb-1 font-semibold text-[#1b1b1b]">{{ t("hitDetails.enemyModifiers") }}</div>
          <div class="max-h-44 space-y-1 overflow-y-auto text-[#444]">
            <div
              v-for="key in modifierStatKeys.filter((statKey) => selectedHitDetails ? Math.abs(selectedHitDetails.ctx.enemyMods[statKey] - (defaultModifierStats[statKey] ?? 0)) > 1e-9 : false)"
              :key="`enemy-${key}`"
              class="flex items-center justify-between gap-2"
            >
              <span class="truncate">{{ modifierLabel(key) }}</span>
              <span class="shrink-0">{{ formatModifierValue(selectedHitDetails.ctx.enemyMods[key], key, key.endsWith('_PCT')) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

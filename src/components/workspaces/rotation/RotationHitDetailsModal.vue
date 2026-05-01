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

const { t } = useLocale();
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
          <div class="font-semibold text-[#1b1b1b]">Hit Inputs</div>
          <div class="mt-1 space-y-1">
            <div>Multiplier: {{ (selectedHitForDetails.multiplier * 100).toFixed(1) }}%</div>
            <div>Damage Type: {{ selectedHitForDetails.damageType }}</div>
            <div>No Crit: {{ formatDamage(selectedHitForDetails.noCritDamage) }}</div>
            <div>Crit: {{ formatDamage(selectedHitForDetails.critDamage) }}</div>
            <div>Average: {{ formatDamage(selectedHitForDetails.damage) }}</div>
          </div>
        </div>

        <div v-if="selectedHitDetails" class="rounded-lg border border-[#ececec] bg-[#fafafa] p-3">
          <div class="font-semibold text-[#1b1b1b]">Calculation Factors</div>
          <div class="mt-1 space-y-1">
            <div>Final ATK: {{ selectedHitDetails.ctx.finalAtk.toFixed(2) }}</div>
            <div>DMG Bonus: +{{ (selectedHitDetails.totalDamageBonus * 100).toFixed(1) }}%</div>
            <div>DMG Amp: ×{{ selectedHitDetails.dmgAmpMultiplier.toFixed(4) }}</div>
            <div>DMG Taken: ×{{ selectedHitDetails.damageTakenMultiplier.toFixed(4) }}</div>
            <div>Resistance: {{ (selectedHitDetails.effectiveResistance * 100).toFixed(1) }}% (×{{ selectedHitDetails.resistanceMultiplier.toFixed(4) }})</div>
            <div>Susceptibility: ×{{ selectedHitDetails.susceptibilityMultiplier.toFixed(4) }}</div>
            <div>Defense: ×{{ selectedHitDetails.defenseMultiplier.toFixed(4) }}</div>
            <div>Staggered Bonus: ×{{ selectedHitDetails.staggeredMultiplier.toFixed(4) }}</div>
            <div>Finisher Bonus: ×{{ selectedHitDetails.finisherBonusMultiplier.toFixed(4) }}</div>
            <div>Total Enemy Bonus: ×{{ selectedHitDetails.totalEnemyMultiplier.toFixed(4) }}</div>
            <div v-if="selectedHitDetails.isReaction">Base Reaction Mult: {{ ((selectedHitDetails.ctx.reactionBaseMultiplier ?? selectedHitDetails.hit.multiplier) * 100).toFixed(1) }}%</div>
            <div v-if="selectedHitDetails.isReaction">Level Mult: ×{{ selectedHitDetails.levelMultiplier.toFixed(4) }} (Lv {{ selectedHitDetails.ctx.applierLevel ?? 1 }})</div>
            <div v-if="selectedHitDetails.isReaction">Arts Intensity: {{ selectedHitDetails.artsIntensity.toFixed(1) }} (×{{ selectedHitDetails.artsIntensityMultiplier.toFixed(4) }})</div>
            <div>Link: ×{{ (1 + selectedHitDetails.ctx.linkMultiplier).toFixed(4) }}</div>
            <div>Avg Crit Mult: ×{{ selectedHitDetails.critAverageMultiplier.toFixed(4) }}</div>
          </div>
        </div>
      </div>

      <div v-if="selectedHitDetails" class="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div class="rounded-lg border border-[#ececec] bg-white p-3">
          <div class="mb-1 font-semibold text-[#1b1b1b]">Attacker Modifiers</div>
          <div class="max-h-44 space-y-1 overflow-y-auto text-[#444]">
            <div
              v-for="key in modifierStatKeys.filter((statKey) => selectedHitDetails ? Math.abs(selectedHitDetails.ctx.attackerMods[statKey] - (defaultModifierStats[statKey] ?? 0)) > 1e-9 : false)"
              :key="`atk-${key}`"
              class="flex items-center justify-between gap-2"
            >
              <span class="truncate">{{ modifierLabels[key] ?? key }}</span>
              <span class="shrink-0">{{ formatModifierValue(selectedHitDetails.ctx.attackerMods[key], key, key.endsWith('_PCT')) }}</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white p-3">
          <div class="mb-1 font-semibold text-[#1b1b1b]">Enemy Modifiers</div>
          <div class="max-h-44 space-y-1 overflow-y-auto text-[#444]">
            <div
              v-for="key in modifierStatKeys.filter((statKey) => selectedHitDetails ? Math.abs(selectedHitDetails.ctx.enemyMods[statKey] - (defaultModifierStats[statKey] ?? 0)) > 1e-9 : false)"
              :key="`enemy-${key}`"
              class="flex items-center justify-between gap-2"
            >
              <span class="truncate">{{ modifierLabels[key] ?? key }}</span>
              <span class="shrink-0">{{ formatModifierValue(selectedHitDetails.ctx.enemyMods[key], key, key.endsWith('_PCT')) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useBuildStore } from "@/stores/buildStore";

import CharacterCard from "@/components/cards/characterCard.vue";
import WeaponCard from "@/components/cards/weaponCard.vue";
import GearCard from "@/components/cards/gearCard.vue";
import SummaryPanel from "@/components/panels/summaryPanel.vue";
import { useEnemyState } from "@/composables/useEnemyState";
import { CHARACTERS } from "@/data/characters";
import RotationWorkspace from "@/components/workspaces/RotationWorkspace.vue";
import { useRotationSchemes } from "@/lib/combat/rotationSchemes";
import { buildPartySnapshots } from "@/lib/combat/buildSnapshots";
import { makeEnemyModifierSnapshot, simulateRotation } from "@/lib/combat/simulateRotation";

const workspace = ref<"builder" | "rotation">("builder");

const buildStore = useBuildStore();
const {
  slots,
  activeSlotIndex,
  activeSlot,
  selectedChar,
  selectedWeapon,
  availableWeapons,
  armorOptions,
  gloveOptions,
  kitOptions,
  selectedGearObjects,
  activeGearSet,
  benchmarkResults,
  out,
} = storeToRefs(buildStore);


const {
  ENEMIES,
  selectedEnemyId,
  selectedEnemy,
  enemyLevel,
  resolvedEnemyStats,
} = useEnemyState();

const { rotationSchemes, activeScheme, setActiveScheme } = useRotationSchemes();

const partySnapshots = computed(() => buildPartySnapshots(slots.value));
const builderRotationSimulation = computed(() => {
  if (partySnapshots.value.length === 0) {
    return null;
  }

  return simulateRotation({
    rotation: activeScheme.value.rotation,
    party: partySnapshots.value,
    enemyStats: resolvedEnemyStats.value,
    enemyMods: makeEnemyModifierSnapshot({
      resistances: {
        PHYSICAL_RESIST_PCT: selectedEnemy.value.resistances.Physical,
        HEAT_RESIST_PCT: selectedEnemy.value.resistances.Heat,
        CRYO_RESIST_PCT: selectedEnemy.value.resistances.Cryo,
        ELECTRIC_RESIST_PCT: selectedEnemy.value.resistances.Electric,
        NATURE_RESIST_PCT: selectedEnemy.value.resistances.Nature,
        AETHER_RESIST_PCT: selectedEnemy.value.resistances.Aether,
      },
    }),
    enemyStaggerGauge: selectedEnemy.value.staggerGauge,
    enemyStaggerRecoverySeconds: selectedEnemy.value.staggerRecoverySeconds,
  });
});

const builderRotationDps = computed(() => {
  const simulation = builderRotationSimulation.value;
  if (!simulation || simulation.totalTime <= 0) {
    return 0;
  }

  return simulation.totalDamage / simulation.totalTime;
});

const DAMAGE_CONTRIBUTION_COLORS = ["#d9cf57", "#73b45d", "#5c9fe8", "#d07fc7"];

const builderDamageContributions = computed(() => {
  const simulation = builderRotationSimulation.value;
  if (!simulation) {
    return [];
  }

  const totalDamage = simulation.totalDamage;
  return simulation.damageBySlot.map((entry, index) => ({
    ...entry,
    color: DAMAGE_CONTRIBUTION_COLORS[index % DAMAGE_CONTRIBUTION_COLORS.length],
    percent: totalDamage > 0 ? (entry.damage / totalDamage) * 100 : 0,
  }));
});
</script>

<template>
  <div class="min-h-screen w-full bg-[#ececec] text-[#1b1b1b]">
    <div class="w-full px-6 py-6">
      <div class="mb-6 border-b border-[#d0d0d0] pb-4">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex items-end gap-4">
            <div class="h-16 w-2 bg-[#ece81a]"></div>
            <div>
              <div class="text-xs uppercase tracking-[0.28em] text-[#7d7d7d]">
                Combat Simulator
              </div>
              <h1 class="text-3xl font-semibold tracking-tight">
                Endfield Toolbox
              </h1>
            </div>
          </div>

          <div class="flex rounded-full border border-[#d0d0d0] bg-white p-1 shadow-sm">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              :class="
                workspace === 'builder'
                  ? 'bg-[#ece81a] text-[#1b1b1b]'
                  : 'text-[#555] hover:bg-[#f3f3f3]'
              "
              @click="workspace = 'builder'"
            >
              Builder
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              :class="
                workspace === 'rotation'
                  ? 'bg-[#ece81a] text-[#1b1b1b]'
                  : 'text-[#555] hover:bg-[#f3f3f3]'
              "
              @click="workspace = 'rotation'"
            >
              Rotation
            </button>
          </div>
        </div>
      </div>

      <section
        v-if="workspace === 'builder'"
        class="mb-6 rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm"
      >
        <div class="mb-3 flex items-center gap-3">
          <div class="h-6 w-1 bg-[#ece81a]"></div>
          <h2 class="text-lg font-semibold">Party Slots</h2>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            v-for="(slot, index) in slots"
            :key="slot.id"
            type="button"
            @click="buildStore.setActiveSlot(index)"
            class="rounded-xl border px-4 py-3 text-left transition"
            :class="
              index === activeSlotIndex
                ? 'border-[#c8d13c] bg-[#dfe86a] text-[#1b1b1b]'
                : 'border-[#d4d4d4] bg-[#f8f8f8] text-[#333]'
            "
          >
            <div class="font-semibold">{{ slot.label }}</div>
            <div class="mt-1 text-sm">
              {{ slot.selectedCharId }}
            </div>
          </button>
        </div>
      </section>

      <!-- Full-width page layout -->
      <div
        v-if="workspace === 'builder'"
        class="grid grid-cols-1 gap-6 2xl:grid-cols-[720px_minmax(0,1fr)] xl:grid-cols-[560px_minmax(0,1fr)]"
      >
        <!-- Left controls -->
        <section class="min-w-0">
          <div class="grid gap-6 sm:grid-cols-2 2xl:grid-cols-2">
            <CharacterCard
              :characters="CHARACTERS"
              :selected-char-id="activeSlot!.selectedCharId"
              :selected-character="selectedChar"
              :level="activeSlot!.level"
              :ascension-stage="activeSlot!.characterAscension"
              :potential="activeSlot!.characterPotential"
              :talent-toggles="activeSlot!.characterTalentToggles"
              :unique-talent-toggles="activeSlot!.uniqueTalentToggles"
              :skill-levels="activeSlot!.characterSkillLevels"
              @update:selected-char-id="buildStore.setCharacter($event)"
              @update:level="buildStore.setCharacterLevel($event)"
              @update:ascension-stage="buildStore.setCharacterAscension($event)"
              @update:potential="buildStore.setCharacterPotential($event)"
              @toggle:talent="buildStore.toggleTalent($event)"
              @toggle:unique-talent="buildStore.toggleUniqueTalent($event)"
              @update:skill-level="buildStore.setCharacterSkillLevel($event.key, $event.value)"
            />

            <WeaponCard
              :weapons="availableWeapons"
              :selected-weapon-id="activeSlot!.selectedWeaponId"
              :weapon-level="activeSlot!.weaponLevel"
              :weapon-ascension-stage="activeSlot!.weaponAscension"
              :weapon-potential="activeSlot!.weaponPotential"
              :weapon-skill-levels="activeSlot!.weaponSkillLevels"
              :character="selectedChar"
              @update:selected-weapon-id="buildStore.setWeapon($event)"
              @update:weapon-level="buildStore.setWeaponLevel($event)"
              @update:weapon-ascension-stage="buildStore.setWeaponAscension($event)"
              @update:weapon-potential="buildStore.setWeaponPotential($event)"
              @update:weapon-skill-level="buildStore.updateWeaponSkillLevel($event)"
            />

            <GearCard
              title="Armor"
              :options="armorOptions"
              :gear-instance="activeSlot!.armor"
              @update:selected-gear-id="buildStore.setGear('armor', $event)"
              @update:sub-level="buildStore.updateGearSubLevel('armor', $event.index, $event.value)"
            />

            <GearCard
              title="Gloves"
              :options="gloveOptions"
              :gear-instance="activeSlot!.gloves"
              @update:selected-gear-id="buildStore.setGear('gloves', $event)"
              @update:sub-level="buildStore.updateGearSubLevel('gloves', $event.index, $event.value)"
            />

            <GearCard
              title="Kit 1"
              :options="kitOptions"
              :gear-instance="activeSlot!.kit1"
              @update:selected-gear-id="buildStore.setGear('kit1', $event)"
              @update:sub-level="buildStore.updateGearSubLevel('kit1', $event.index, $event.value)"
            />

            <GearCard
              title="Kit 2"
              :options="kitOptions"
              :gear-instance="activeSlot!.kit2"
              @update:selected-gear-id="buildStore.setGear('kit2', $event)"
              @update:sub-level="buildStore.updateGearSubLevel('kit2', $event.index, $event.value)"
            />
          </div>
        </section>

        <!-- Right workspace -->
        <section class="min-w-0 space-y-6">
          <SummaryPanel
            v-if="selectedChar && selectedWeapon && out"
            :character-name="selectedChar.name"
            :weapon-name="selectedWeapon.name"
            :out="out"
            :active-gear-set="activeGearSet"
            :benchmarks="benchmarkResults"
          />

          <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-4">
              <div>
                <div class="text-xs uppercase tracking-[0.24em] text-[#777]">Rotation</div>
                <div class="mt-1 text-lg font-semibold">Rotation Summary</div>
              </div>

              <label class="block min-w-[220px]">
                <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Rotation Scheme</div>
                <select
                  :value="activeScheme.id"
                  class="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                  @change="setActiveScheme(($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="scheme in rotationSchemes.schemes"
                    :key="scheme.id"
                    :value="scheme.id"
                  >
                    {{ scheme.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
                <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Total Damage</div>
                <div class="mt-2 text-3xl font-semibold text-[#1b1b1b]">
                  {{ Math.round(builderRotationSimulation?.totalDamage ?? 0).toLocaleString() }}
                </div>
              </div>
              <div class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
                <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">DPS</div>
                <div class="mt-2 text-3xl font-semibold text-[#1b1b1b]">
                  {{ Math.round(builderRotationDps).toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-if="builderDamageContributions.length > 0" class="mt-4 rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
              <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Damage Contribution</div>
              <div class="text-sm text-[#666]">Share of total rotation damage by character.</div>
              <div class="mt-3 h-4 overflow-hidden rounded-md border border-[#dadada] bg-[#f1f1f1]">
                <div class="flex h-full w-full">
                  <div
                    v-for="entry in builderDamageContributions"
                    :key="entry.slot"
                    class="h-full"
                    :style="{
                      width: `${entry.percent}%`,
                      backgroundColor: entry.color,
                    }"
                  />
                </div>
              </div>
              <div class="mt-3 space-y-2">
                <div
                  v-for="entry in builderDamageContributions"
                  :key="`builder-contribution-${entry.slot}`"
                  class="flex items-center justify-between gap-3 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: entry.color }" />
                    <span class="text-[#1b1b1b]">{{ entry.characterName }}</span>
                  </div>
                  <div class="text-[#555]">
                    {{ Math.round(entry.damage).toLocaleString() }} ({{ entry.percent.toFixed(1) }}%)
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-3 text-sm text-[#666]">
              {{ selectedEnemy.name }} Lv{{ enemyLevel }} · Real Time {{ (builderRotationSimulation?.totalTime ?? 0).toFixed(2) }}s · Game Time {{ (builderRotationSimulation?.totalGameTime ?? 0).toFixed(2) }}s
            </div>
          </section>

        </section>
      </div>

      <RotationWorkspace
        v-else
        :enemies="ENEMIES"
        :selected-enemy-id="selectedEnemyId"
        :enemy-name="selectedEnemy.name"
        :enemy-level="enemyLevel"
        :enemy-stats="resolvedEnemyStats"
        :enemy-stagger-gauge="selectedEnemy.staggerGauge"
        :enemy-stagger-recovery-seconds="selectedEnemy.staggerRecoverySeconds"
        @update:selected-enemy-id="selectedEnemyId = $event"
        @update:enemy-level="enemyLevel = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useBuildStore } from "@/stores/buildStore";

import CharacterCard from "@/components/cards/characterCard.vue";
import WeaponCard from "@/components/cards/weaponCard.vue";
import GearCard from "@/components/cards/gearCard.vue";
import SummaryPanel from "@/components/panels/summaryPanel.vue";
import { useEnemyState } from "@/composables/useEnemyState";
import EnemyPanel from "@/components/panels/enemyPanel.vue";
import { CHARACTERS } from "@/data/characters";

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
</script>

<template>
  <div class="min-h-screen w-full bg-[#ececec] text-[#1b1b1b]">
    <div class="w-full px-6 py-6">
      <div class="mb-6 border-b border-[#d0d0d0] pb-4">
        <div class="flex items-end gap-4">
          <div class="h-16 w-2 bg-[#ece81a]"></div>
          <div>
            <div class="text-xs uppercase tracking-[0.28em] text-[#7d7d7d]">
              Combat Simulator
            </div>
            <h1 class="text-3xl font-semibold tracking-tight">
              Character Builder
            </h1>
          </div>
        </div>
      </div>

      <section class="mb-6 rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
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
      <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[720px_minmax(0,1fr)] xl:grid-cols-[560px_minmax(0,1fr)]">
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
            :character-name="selectedChar.name"
            :weapon-name="selectedWeapon.name"
            :out="out"
            :gears="selectedGearObjects"
            :benchmarks="benchmarkResults"
          />

          <EnemyPanel
            :enemies="ENEMIES"
            :selected-enemy-id="selectedEnemyId"
            :enemy-level="enemyLevel"
            :stats="resolvedEnemyStats"
            @update:selected-enemy-id="selectedEnemyId = $event"
            @update:enemy-level="enemyLevel = $event"
          />
        </section>
      </div>
    </div>
  </div>
</template>

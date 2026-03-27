<script setup lang="ts">
import { computed } from "vue";
import type { CharacterBase } from "@/data/characters";
import type { WeaponBase } from "@/data/weapons";
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
  weaponLevel: number;
  weaponAscensionStage: AscensionStage;
  weaponPotential: PotentialLevel;
  weaponSkillLevels: number[];
  character: CharacterBase;
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

const skillRanges = computed(() => {
  return [
    getWeaponSkill1Range(props.weaponAscensionStage),
    getWeaponSkill2Range(props.weaponAscensionStage),
    getWeaponSkill3Range(props.weaponPotential),
  ];
});

function updateSkill(index: number, value: number) {
  emit("update:weaponSkillLevel", { index, value });
}
</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">Weapon</h2>
    </div>

    <div class="grid gap-5">
      <!-- Weapon select -->
      <label class="grid gap-2">
        <span class="text-sm font-medium text-[#555]">Selected Weapon</span>
        <select
          :value="selectedWeaponId"
          @change="emit('update:selectedWeaponId', ($event.target as HTMLSelectElement).value)"
          class="h-11 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 outline-none focus:border-[#bdbdbd] focus:bg-white"
        >
          <option v-for="w in weapons" :key="w.id" :value="w.id">
            {{ w.name }}
          </option>
        </select>
      </label>

      <!-- Ascension -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">Weapon Ascension</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ weaponAscensionStage }}
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
          <span class="text-sm font-medium text-[#555]">Weapon Level</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold tabular-nums">
            {{ weaponLevel }}
          </span>
        </div>

        <input
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
          <span class="text-sm font-medium text-[#555]">Weapon Potential</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            P{{ weaponPotential }}
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
                Skill {{ i + 1 }} · {{ skill.name }}
              </div>

              <div class="mt-1 text-xs font-medium text-[#333]">
                {{ getWeaponSkillLiveBonus(skill, skill.rank, weaponSkillLevels[i] ?? skillRanges[i]!.min, character) }}
              </div>

              <div class="mt-1 text-xs text-[#777]">
                Range: {{ skillRanges[i]?.min }} / {{ skillRanges[i]!.max }}
              </div>
            </div>

            <span class="rounded-md bg-white px-2 py-1 text-sm font-semibold tabular-nums">
              Lv {{ weaponSkillLevels[i] ?? skillRanges[i]!.min }}
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
    </div>
  </section>
</template>
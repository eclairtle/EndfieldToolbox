<script setup lang="ts">
import type { EnemyBase } from "@/data/enemies";

const props = defineProps<{
  enemies: EnemyBase[];
  selectedEnemyId: string;
  enemyLevel: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    resistances: {
      Physical: number;
      Heat: number;
      Cryo: number;
      Electric: number;
      Nature: number;
      Aether: number;
    };
  };
}>();

const emit = defineEmits<{
  (e: "update:selectedEnemyId", value: string): void;
  (e: "update:enemyLevel", value: number): void;
}>();

const resistRows = [
  ["Physical"],
  ["Heat"],
  ["Cryo"],
  ["Electric"],
  ["Nature"],
  ["Aether"],
] as const;
</script>

<template>
  <section class="rounded-2xl border border-[#cfcfcf] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">Enemy</h2>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="grid gap-4">
        <label class="grid gap-2">
          <select
            :value="selectedEnemyId"
            @change="emit('update:selectedEnemyId', ($event.target as HTMLSelectElement).value)"
            class="h-11 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 outline-none focus:border-[#bdbdbd] focus:bg-white"
          >
            <option v-for="e in enemies" :key="e.id" :value="e.id">
              {{ e.name }}
            </option>
          </select>
        </label>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-[#555]">Enemy Level</span>
            <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold tabular-nums">
              {{ enemyLevel }}
            </span>
          </div>

          <input
            :value="enemyLevel"
            @input="emit('update:enemyLevel', Number(($event.target as HTMLInputElement).value))"
            type="range"
            min="1"
            max="100"
            step="1"
            class="w-full accent-[#ece81a]"
          />

          <div class="flex justify-between text-xs text-[#8a8a8a]">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div class="mt-5 space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
        <div class="flex justify-between">
          <span class="text-[#666]">HP</span>
          <span class="font-semibold tabular-nums">{{ stats.hp }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#666]">ATK</span>
          <span class="font-semibold tabular-nums">{{ stats.atk }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#666]">DEF</span>
          <span class="font-semibold tabular-nums">{{ stats.def }}</span>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <div class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
        Resistances
      </div>

      <div class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
        <div
          v-for="[key] in resistRows"
          :key="key"
          class="flex justify-between"
        >
          <span class="text-[#666]">{{ key }}</span>
          <span class="font-semibold tabular-nums">
            {{ (stats.resistances[key] * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
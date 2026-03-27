<script setup lang="ts">
import { computed } from "vue";
import type { GearBase } from "@/data/gears";
import type { FinalStats } from "@/lib/build/stats";
import { displayModifierEntries } from "@/lib/modifierDisplay";

const props = defineProps<{
  characterName: string;
  weaponName: string;
  out: FinalStats;
  gears: {
    armor: GearBase | null;
    gloves: GearBase | null;
    kit1: GearBase | null;
    kit2: GearBase | null;
  };
  benchmarks: {
    id: string;
    name: string;
    label: string;
    value: number;
    suffix?: string;
  }[];
}>();

const statOrder = ["STR", "AGI", "INT", "WIL", "ATK", "HP", "DEF"] as const;

const visibleModifiers = computed(() => displayModifierEntries(props.out.mods));
</script>

<template>
  <aside class="lg:top-6">
    <section class="overflow-hidden rounded-2xl border border-[#cfcfcf] bg-white shadow-sm">
      <div class="bg-[#2e2e2e] px-5 py-4 text-white">
        <div class="text-xs uppercase tracking-[0.24em] text-[#cfcfcf]">
          Summary
        </div>
        <div class="mt-1 flex items-center gap-3">
          <div class="h-7 w-1 bg-[#ece81a]"></div>
          <h2 class="text-xl font-semibold">{{ characterName }}</h2>
        </div>
      </div>

      <div class="space-y-5 p-5">
        <!-- Final Stats -->
        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              Final Stats
            </h3>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="k in statOrder"
              :key="k"
              class="rounded-xl border border-[#dddddd] bg-[#fafafa] p-4"
            >
              <div class="text-xs font-medium tracking-[0.14em] text-[#7a7a7a]">
                {{ k }}
              </div>
              <div class="mt-2 text-2xl font-semibold tabular-nums">
                {{ out.statsCard[k] }}
              </div>
            </div>
          </div>
        </div>

        <!-- Active Modifiers -->
        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              Active Modifiers
            </h3>
          </div>

          <div
            v-if="visibleModifiers.length > 0"
            class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm"
          >
            <div
              v-for="entry in visibleModifiers"
              :key="entry.key"
              class="flex justify-between gap-3"
            >
              <span class="text-[#666]">{{ entry.label }}</span>
              <span class="font-semibold tabular-nums">{{ entry.value }}</span>
            </div>
          </div>

          <div
            v-else
            class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm text-[#777]"
          >
            No active modifiers beyond base defaults.
          </div>
        </div>

        <!-- Calculation Snapshot -->
        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              Calculation Snapshot
            </h3>
          </div>

          <div class="space-y-2 rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-[#666]">Character Base ATK</span>
              <span class="font-semibold tabular-nums">{{ out.baseATK }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">Weapon Base ATK</span>
              <span class="font-semibold tabular-nums">{{ out.weaponATK }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">Base HP</span>
              <span class="font-semibold tabular-nums">{{ out.baseHP }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#666]">Attribute Bonus</span>
              <span class="font-semibold tabular-nums">
                {{ (out.attributeBonus * 100).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Benchmarks -->
        <div>
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-1 bg-[#ece81a]"></div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5f5f]">
              Benchmarks
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
            No benchmarks defined.
          </div>
        </div>

        <!-- Build Info -->
        <div class="rounded-xl border border-[#dddddd] bg-[#f7f7f7] p-4 text-sm">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7a7a]">
            Current Build
          </div>

          <div class="space-y-1 text-[#555]">
            <div>
              Weapon:
              <span class="font-medium text-[#1b1b1b]">{{ weaponName }}</span>
            </div>
            <div>
              Armor:
              <span class="font-medium text-[#1b1b1b]">{{ gears.armor?.name ?? "—" }}</span>
            </div>
            <div>
              Gloves:
              <span class="font-medium text-[#1b1b1b]">{{ gears.gloves?.name ?? "—" }}</span>
            </div>
            <div>
              Kit 1:
              <span class="font-medium text-[#1b1b1b]">{{ gears.kit1?.name ?? "—" }}</span>
            </div>
            <div>
              Kit 2:
              <span class="font-medium text-[#1b1b1b]">{{ gears.kit2?.name ?? "—" }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>

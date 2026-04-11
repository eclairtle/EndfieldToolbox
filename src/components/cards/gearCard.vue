<script setup lang="ts">
import { computed } from "vue";
import { isGearUpgradable, type GearBase } from "@/data/gears";
import type { GearInstance, GearSubLevel } from "@/lib/build/gearInstances";
import { effectiveGearSubLevel, scaledGearSubValue, formatGearSubValue } from "@/lib/build/gearScaling";
import { modifierLabels } from "@/lib/modifierDisplay";
import type { AttrKey, CharacterStatKey, ModifierStatKey } from "@/lib/build/stats";

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

const selectedGear = computed<GearBase | null>(() => {
  const id = selectedGearId.value;
  if (!id) return null;
  return props.options.find((g) => g.id === id) ?? null;
});

const selectedGearUpgradable = computed(() => (selectedGear.value ? isGearUpgradable(selectedGear.value) : false));

function subLabel(stat: AttrKey | CharacterStatKey | ModifierStatKey): string {
  switch (stat) {
    case "STR":
      return "STR";
    case "AGI":
      return "AGI";
    case "INT":
      return "INT";
    case "WIL":
      return "WIL";
    case "HP":
      return "HP";

    case "MAIN_ATTR_PCT":
      return modifierLabels.MAIN_ATTR_PCT;
    case "SECONDARY_ATTR_PCT":
      return modifierLabels.SECONDARY_ATTR_PCT;
    case "CRIT_RATE_PCT":
      return modifierLabels.CRIT_RATE_PCT;
    case "ULT_GAIN_PCT":
      return modifierLabels.ULT_GAIN_PCT;
    case "ATK_PCT":
      return modifierLabels.ATK_PCT;
    case "PHYSICAL_DMG_PCT":
      return modifierLabels.PHYSICAL_DMG_PCT;
    case "ARTS_DMG_PCT":
      return modifierLabels.ARTS_DMG_PCT;
    case "HEAT_NATURE_DMG_PCT":
      return modifierLabels.HEAT_NATURE_DMG_PCT;
    case "HEAT_DMG_PCT":
      return modifierLabels.HEAT_DMG_PCT;
    case "CRYO_DMG_PCT":
      return modifierLabels.CRYO_DMG_PCT;
    case "ELECTRIC_DMG_PCT":
      return modifierLabels.ELECTRIC_DMG_PCT;
    case "NATURE_DMG_PCT":
      return modifierLabels.NATURE_DMG_PCT;
    case "BASIC_ATK_DMG_PCT":
      return modifierLabels.BASIC_ATK_DMG_PCT;
    case "BATTLE_SKILL_DMG_PCT":
      return modifierLabels.BATTLE_SKILL_DMG_PCT;
    case "COMBO_SKILL_DMG_PCT":
      return modifierLabels.COMBO_SKILL_DMG_PCT;
    case "ULTIMATE_DMG_PCT":
      return modifierLabels.ULTIMATE_DMG_PCT;
    case "HEALING_PCT":
      return modifierLabels.HEALING_PCT;
    case "FINAL_DMG_REDUCTION_PCT":
      return modifierLabels.FINAL_DMG_REDUCTION_PCT;
    case "ARTS_INTENSITY":
      return modifierLabels.ARTS_INTENSITY;
    case "ALL_DMG_PCT":
      return modifierLabels.ALL_DMG_PCT;
    case "DMG_VS_STAGGERED_PCT":
      return modifierLabels.DMG_VS_STAGGERED_PCT;

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
</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">{{ title }}</h2>
    </div>

    <div class="grid gap-4">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-[#555]">Selected Gear</span>
        <select
          :value="selectedGearId"
          @change="onGearChange(($event.target as HTMLSelectElement).value)"
          class="h-11 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 outline-none focus:border-[#bdbdbd] focus:bg-white"
        >
          <option value="">(None)</option>
          <option v-for="g in options" :key="g.id" :value="g.id">
            {{ g.name }}
          </option>
        </select>
      </label>

      <div
        v-if="selectedGear"
        class="rounded-xl border border-[#dedede] bg-[#f7f7f7] p-4"
      >
        <div class="mb-2 text-sm text-[#666]">
          Set: {{ selectedGear.set ?? "—" }}
        </div>

        <div class="mb-3 text-sm font-medium">
          DEF +{{ selectedGear.defFlat }}
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
                  Lv {{ gearInstance?.subLevels[i] ?? 0 }}
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
</template>

<script setup lang="ts">
import type { CharacterBase } from "@/data/characters";
import {
  ASCENSION_LEVEL_CAPS,
  ASCENSION_LEVEL_MINS,
  isCharacterTalentUnlocked,
  getCharacterTalentBonus,
  type AscensionStage,
  type PotentialLevel,
} from "@/lib/build/progression";
import {
  CHARACTER_TALENT_KEYS,
  type CharacterTalentKey,
  type CharacterTalentToggles,
} from "@/lib/build/characterTalents";
import type { CharacterSkillLevels, CharacterSkillKey } from "@/lib/build/characterSkills";

const props = defineProps<{
  characters: CharacterBase[];
  selectedCharId: string;
  selectedCharacter: CharacterBase;
  level: number;
  ascensionStage: AscensionStage;
  potential: PotentialLevel;
  talentToggles: CharacterTalentToggles;
  skillLevels: CharacterSkillLevels;
}>();

const emit = defineEmits<{
  (e: "update:selectedCharId", value: string): void;
  (e: "update:level", value: number): void;
  (e: "update:ascensionStage", value: AscensionStage): void;
  (e: "update:potential", value: PotentialLevel): void;
  (e: "toggle:talent", key: CharacterTalentKey): void;
  (e: "update:skill-level", payload: { key: CharacterSkillKey; value: number }): void;
}>();

const skillRows: { key: CharacterSkillKey; label: string }[] = [
  { key: "basic", label: "Basic Attack" },
  { key: "battleSkill", label: "Battle Skill" },
  { key: "comboSkill", label: "Combo Skill" },
  { key: "ultimate", label: "Ultimate" },
];
</script>

<template>
  <section class="rounded-2xl border border-[#d6d6d6] bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-6 w-1 bg-[#ece81a]"></div>
      <h2 class="text-lg font-semibold">Character</h2>
    </div>

    <div class="grid gap-5">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-[#555]">Selected Character</span>
        <select
          :value="selectedCharId"
          @change="emit('update:selectedCharId', ($event.target as HTMLSelectElement).value)"
          class="h-11 rounded-xl border border-[#d4d4d4] bg-[#f8f8f8] px-3 outline-none focus:border-[#bdbdbd] focus:bg-white"
        >
          <option v-for="c in characters" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </label>

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">Ascension Stage</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            {{ ascensionStage }}
          </span>
        </div>

        <input
          :value="ascensionStage"
          @input="emit('update:ascensionStage', Number(($event.target as HTMLInputElement).value) as AscensionStage)"
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

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">Level</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold tabular-nums">
            {{ level }}
          </span>
        </div>

        <input
          :value="level"
          @input="emit('update:level', Number(($event.target as HTMLInputElement).value))"
          type="range"
          :min="ASCENSION_LEVEL_MINS[ascensionStage]"
          :max="ASCENSION_LEVEL_CAPS[ascensionStage]"
          step="1"
          class="w-full accent-[#ece81a]"
        />

        <div class="flex justify-between text-xs text-[#8a8a8a]">
          <span>{{ ASCENSION_LEVEL_MINS[ascensionStage] }}</span>
          <span>{{ ASCENSION_LEVEL_CAPS[ascensionStage] }}</span>
        </div>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[#555]">Potential</span>
          <span class="rounded-md bg-[#f2f2f2] px-2 py-1 text-sm font-semibold">
            P{{ potential }}
          </span>
        </div>

        <input
          :value="potential"
          @input="emit('update:potential', Number(($event.target as HTMLInputElement).value) as PotentialLevel)"
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

      <div class="grid gap-2">
        <div class="text-sm font-medium text-[#555]">Talents</div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(key, index) in CHARACTER_TALENT_KEYS"
            :key="key"
            type="button"
            :disabled="!isCharacterTalentUnlocked(index, ascensionStage)"
            @click="emit('toggle:talent', key)"
            class="rounded-xl border px-3 py-3 text-left text-sm transition"
            :class="
              !isCharacterTalentUnlocked(index, ascensionStage)
                ? 'cursor-not-allowed border-[#d8d8d8] bg-[#efefef] text-[#9a9a9a]'
                : talentToggles[key]
                  ? 'border-[#c8d13c] bg-[#dfe86a] text-[#1b1b1b]'
                  : 'border-[#d4d4d4] bg-[#f8f8f8] text-[#333]'
            "
          >
            <div class="font-semibold">
              {{ selectedCharacter.mainAttr }} UP {{ index + 1 }}
            </div>
            <div class="mt-1 text-xs">
              +{{ getCharacterTalentBonus(index) }} {{ selectedCharacter.mainAttr }}
            </div>
          </button>
        </div>
      </div>

      <div class="grid gap-3">
        <div class="text-sm font-medium text-[#555]">Skill Levels</div>

        <div
          v-for="row in skillRows"
          :key="row.key"
          class="rounded-xl border border-[#dedede] bg-[#f7f7f7] p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ row.label }}</span>
            <span class="rounded-md bg-white px-2 py-1 text-sm font-semibold tabular-nums">
              Lv {{ skillLevels[row.key] }}
            </span>
          </div>

          <input
            :value="skillLevels[row.key]"
            @input="emit('update:skill-level', {
              key: row.key,
              value: Number(($event.target as HTMLInputElement).value)
            })"
            type="range"
            min="1"
            max="12"
            step="1"
            class="mt-3 w-full accent-[#ece81a]"
          />

          <div class="mt-1 flex justify-between text-xs text-[#8a8a8a]">
            <span>1</span>
            <span>12</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
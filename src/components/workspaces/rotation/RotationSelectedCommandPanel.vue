<script setup lang="ts">
import { ref } from "vue";
import { useLocale } from "@/i18n/useLocale";
import type {
  CharacterCombatSnapshot,
  CritRiggingRule,
  CompiledRotationAction,
  RotationStep,
  RotationTimeExtension,
} from "@/lib/combat/rotation";

type SelectedEnemyCommand = {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  interruptible: boolean;
  interrupted: boolean;
  interruptedSpGain: number;
  interruptedStagger: number;
};

const props = defineProps<{
  hasMultiSelection: boolean;
  selectedCommandsCount: number;
  hasAnySelectedCommand: boolean;
  selectedGroup: { id: string; name: string } | null;
  selectedEnemyCommand: SelectedEnemyCommand | null;
  selectedStep: RotationStep | null;
  selectedStepAction: CompiledRotationAction | null;
  selectedStepCommand: CharacterCombatSnapshot["commands"][number] | null;
  selectedStepValidation: string | null;
  selectedStepCritRigRules: CritRiggingRule[];
  selectedStepHitRigOptions: Array<{ hitIndex: number; repeatIndex: number; label: string }>;
  timeExtensions: RotationTimeExtension[];
  getEnemyCommandValidation: (commandPlacementId: string) => string | null;
  getLocalizedCommandBelongsType: (command: CharacterCombatSnapshot["commands"][number] | null | undefined) => string;
  getLocalizedCommandName: (
    command: CharacterCombatSnapshot["commands"][number] | null | undefined,
    characterId?: string,
    fallbackName?: string,
  ) => string;
  getCharacterIdBySlot: (slot: number) => string | undefined;
  toGameTimeFromExtensions: (realTime: number, timeExtensions: RotationTimeExtension[]) => number;
  onRemoveSelectedCommand: () => void;
  onGroupSelectedSteps: () => void;
  onUngroupSelectedSteps: () => void;
  onRenameSelectedGroup: (name: string) => void;
  onUpdateEnemyCommandPlacement: (id: string, patch: Partial<SelectedEnemyCommand>) => void;
  onUpdateSelectedStep: (patch: Partial<RotationStep>) => void;
  onUpdateSelectedStepCritRigging: (args: {
    hitIndex: number;
    repeatIndex: number;
    mode: "none" | "force_crit" | "force_non_crit";
  }) => void;
}>();

const { t } = useLocale();
const critRiggingExpanded = ref(false);

function getCritRigMode(hitIndex: number, repeatIndex: number): "none" | "force_crit" | "force_non_crit" {
  const rule = props.selectedStepCritRigRules.find((entry) => entry.hitIndex === hitIndex && entry.repeatIndex === repeatIndex);
  return rule?.mode ?? "none";
}
</script>

<template>
  <section class="rounded-xl border border-[#e4e4e4] bg-[#fbfbfb] p-4">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div class="text-sm font-semibold text-[#1b1b1b]">
        {{ hasMultiSelection ? t("rotation.commandsSelected", { count: selectedCommandsCount }) : t("rotation.selectedCommand") }}
      </div>
      <button
        v-if="hasAnySelectedCommand"
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e3bcbc] bg-white text-[#9a3131] transition hover:bg-[#fff1f1]"
        @click="onRemoveSelectedCommand"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M8 5V3.8c0-.44.36-.8.8-.8h2.4c.44 0 .8.36.8.8V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M6 7l.5 8.1c.03.5.45.9.95.9h5.1c.5 0 .92-.4.95-.9L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 9.2v4.6M11.5 9.2v4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div v-if="!hasAnySelectedCommand" class="text-sm text-[#6a6a6a]">
      {{ t("rotation.selectStepHint") }}
    </div>

    <div v-else-if="hasMultiSelection" class="space-y-3">
      <div class="rounded-xl border border-[#ececec] bg-white px-4 py-3 text-sm text-[#444]">
        {{ t("rotation.commandsSelectedHint", { count: selectedCommandsCount }) }}
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#333] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
          @click="onGroupSelectedSteps"
        >
          {{ t("rotation.group") }}
        </button>
        <button
          v-if="selectedGroup"
          type="button"
          class="rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#333] transition hover:border-[#c8d13c] hover:bg-[#fffde2]"
          @click="onUngroupSelectedSteps"
        >
          {{ t("rotation.ungroup") }}
        </button>
      </div>

      <label v-if="selectedGroup" class="block">
        <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.groupName") }}</div>
        <input
          :value="selectedGroup.name"
          type="text"
          class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
          @change="onRenameSelectedGroup(($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>

    <div v-else-if="selectedEnemyCommand" class="space-y-3">
      <div class="rounded-xl border border-[#ececec] bg-white px-4 py-3">
        <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
          Enemy Command
        </div>
        <div class="mt-1 text-lg font-medium text-[#1b1b1b]">
          {{ selectedEnemyCommand.label }}
        </div>
        <div
          v-if="getEnemyCommandValidation(selectedEnemyCommand.id)"
          class="mt-2 text-sm font-medium text-[#c23f3f]"
        >
          {{ getEnemyCommandValidation(selectedEnemyCommand.id) }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs text-[#5f5f5f]">
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.realStart", { value: selectedEnemyCommand.startTime.toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.gameStart", { value: toGameTimeFromExtensions(selectedEnemyCommand.startTime, timeExtensions).toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.realEnd", { value: selectedEnemyCommand.endTime.toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.gameEnd", { value: toGameTimeFromExtensions(selectedEnemyCommand.endTime, timeExtensions).toFixed(2) }) }}
        </div>
      </div>

      <label class="block">
        <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.realStartTime") }}</div>
        <input
          :value="selectedEnemyCommand.startTime.toFixed(3)"
          type="number"
          min="0"
          step="0.1"
          class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
          @input="
            onUpdateEnemyCommandPlacement(selectedEnemyCommand.id, {
              startTime: Math.max(0, Number(Number(($event.target as HTMLInputElement).value || 0).toFixed(3))),
            })
          "
        >
      </label>

      <div class="grid grid-cols-1 gap-2 text-sm text-[#444]">
        <label class="inline-flex items-center gap-2 rounded-lg border border-[#ececec] bg-white px-3 py-2">
          <input
            :checked="selectedEnemyCommand.interrupted"
            type="checkbox"
            class="h-4 w-4 accent-[#b86f24]"
            :disabled="!selectedEnemyCommand.interruptible"
            @change="
              onUpdateEnemyCommandPlacement(selectedEnemyCommand.id, {
                interrupted: ($event.target as HTMLInputElement).checked,
                interruptedSpGain: ($event.target as HTMLInputElement).checked ? selectedEnemyCommand.interruptedSpGain : 0,
                interruptedStagger: ($event.target as HTMLInputElement).checked ? selectedEnemyCommand.interruptedStagger : 0,
              })
            "
          >
          <span :class="selectedEnemyCommand.interruptible ? '' : 'text-[#999]'">Interrupted (nullify hits)</span>
          <span
            v-if="!selectedEnemyCommand.interruptible"
            class="rounded bg-[#efefef] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#777]"
          >
            Uninterruptible
          </span>
        </label>
        <label class="block" :class="selectedEnemyCommand.interrupted && selectedEnemyCommand.interruptible ? '' : 'opacity-60'">
          <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">SP Gain On Interrupt</div>
          <input
            :value="selectedEnemyCommand.interruptedSpGain"
            type="number"
            min="0"
            step="1"
            class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
            :disabled="!selectedEnemyCommand.interrupted || !selectedEnemyCommand.interruptible"
            @input="
              onUpdateEnemyCommandPlacement(selectedEnemyCommand.id, {
                interruptedSpGain: Math.max(0, Number(($event.target as HTMLInputElement).value || 0)),
              })
            "
          >
        </label>
        <label class="block" :class="selectedEnemyCommand.interrupted && selectedEnemyCommand.interruptible ? '' : 'opacity-60'">
          <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Stagger On Interrupt</div>
          <input
            :value="selectedEnemyCommand.interruptedStagger"
            type="number"
            min="0"
            step="1"
            class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
            :disabled="!selectedEnemyCommand.interrupted || !selectedEnemyCommand.interruptible"
            @input="
              onUpdateEnemyCommandPlacement(selectedEnemyCommand.id, {
                interruptedStagger: Math.max(0, Number(($event.target as HTMLInputElement).value || 0)),
              })
            "
          >
        </label>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div class="rounded-xl border border-[#ececec] bg-white px-4 py-3">
        <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">
          {{ getLocalizedCommandBelongsType(selectedStepCommand) }}
        </div>
        <div class="mt-1 text-lg font-medium text-[#1b1b1b]">
          {{ getLocalizedCommandName(selectedStepCommand, selectedStepAction ? getCharacterIdBySlot(selectedStepAction.slot) : undefined, selectedStepCommand?.name ?? selectedStep?.commandId) }}
        </div>
        <div
          v-if="selectedStepValidation"
          class="mt-2 text-sm font-medium text-[#c23f3f]"
        >
          {{ selectedStepValidation }}
        </div>
      </div>

      <div
        v-if="selectedStepAction"
        class="grid grid-cols-2 gap-2 text-xs text-[#5f5f5f]"
      >
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.realStart", { value: selectedStepAction.realStartTime.toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.gameStart", { value: selectedStepAction.startTime.toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.realEnd", { value: selectedStepAction.realEndTime.toFixed(2) }) }}
        </div>
        <div class="rounded-lg border border-[#ececec] bg-white px-3 py-2">
          {{ t("rotation.gameEnd", { value: selectedStepAction.endTime.toFixed(2) }) }}
        </div>
      </div>

      <label class="block">
        <div class="mb-1 text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">{{ t("rotation.realStartTime") }}</div>
        <input
          :value="selectedStep?.startTime?.toFixed(3) ?? ''"
          type="number"
          min="0"
          step="0.1"
          class="w-full rounded-lg border border-[#d7d7d7] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8d13c]"
          @input="
            onUpdateSelectedStep({
              startTime: ($event.target as HTMLInputElement).value === ''
                ? undefined
                : Number(Number(($event.target as HTMLInputElement).value).toFixed(3)),
            })
          "
        >
      </label>

      <div class="grid grid-cols-1 gap-2 text-sm text-[#444]">
        <label class="inline-flex items-center gap-2 rounded-lg border border-[#ececec] bg-white px-3 py-2">
          <input
            :checked="selectedStep?.missed === true"
            type="checkbox"
            class="h-4 w-4 accent-[#8f8f8f]"
            @change="
              onUpdateSelectedStep({
                missed: ($event.target as HTMLInputElement).checked,
              })
            "
          >
          <span>Missed (nullify hits)</span>
        </label>
        <label class="inline-flex items-center gap-2 rounded-lg border border-[#ececec] bg-white px-3 py-2">
          <input
            :checked="selectedStep?.interrupted === true"
            type="checkbox"
            class="h-4 w-4 accent-[#b86f24]"
            @change="
              onUpdateSelectedStep({
                interrupted: ($event.target as HTMLInputElement).checked,
              })
            "
          >
          <span>Interrupted (nullify hits)</span>
        </label>
      </div>

      <div v-if="selectedStepHitRigOptions.length > 0" class="rounded-xl border border-[#ececec] bg-white px-3 py-3">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-xs uppercase tracking-[0.16em] text-[#7a7a7a]">Crit Rigging</div>
          <button
            type="button"
            class="rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-1 text-xs text-[#333] transition hover:bg-[#f5f5f5]"
            @click="critRiggingExpanded = !critRiggingExpanded"
          >
            {{ critRiggingExpanded ? t("ui.collapse") : t("ui.expand") }}
          </button>
        </div>
        <div v-if="!critRiggingExpanded" class="text-xs text-[#8a8a8a]">
          Crit rigging hidden.
        </div>
        <div v-else class="space-y-2">
          <label
            v-for="hitOption in selectedStepHitRigOptions"
            :key="`crit-rig-${hitOption.hitIndex}-${hitOption.repeatIndex}`"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="text-[#333]">{{ hitOption.label }}</span>
            <select
              :value="getCritRigMode(hitOption.hitIndex, hitOption.repeatIndex)"
              class="h-9 min-w-[148px] rounded-lg border border-[#d7d7d7] bg-white px-2 text-sm outline-none transition focus:border-[#c8d13c]"
              @change="
                onUpdateSelectedStepCritRigging({
                  hitIndex: hitOption.hitIndex,
                  repeatIndex: hitOption.repeatIndex,
                  mode: ($event.target as HTMLSelectElement).value as 'none' | 'force_crit' | 'force_non_crit',
                })
              "
            >
              <option value="none">Default</option>
              <option value="force_crit">Rigged Crit</option>
              <option value="force_non_crit">Rigged Non-Crit</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

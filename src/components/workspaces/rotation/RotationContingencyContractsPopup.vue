<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  vm: any;
  embedded?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle", contractId: string, variantId: string): void;
  (e: "highlight", contractId: string, variantId: string): void;
}>();
</script>

<template>
  <div
    v-if="open"
    :class="embedded ? 'h-full min-h-0 overflow-y-auto' : 'fixed inset-0 z-[140] flex items-center justify-center bg-black/35 px-4 py-8'"
    @click.self="emit('close')"
  >
    <div :class="embedded ? 'w-full bg-[#cfcfcf] p-4 text-[#1b1b1b]' : 'w-full max-w-6xl rounded-2xl border border-[#505050] bg-[#cfcfcf] p-4 text-[#1b1b1b] shadow-2xl'">
      <div v-if="!embedded" class="mb-3 flex items-center justify-between gap-3">
        <div class="text-sm uppercase tracking-[0.2em] text-[#777]">{{ vm.locale === "zh-CN" ? "词条" : "Contingency Contracts" }}</div>
        <button
          type="button"
          class="rounded-md border border-[#d7d7d7] bg-[#f7f7f7] px-3 py-1.5 text-sm text-[#444] transition hover:bg-[#efefef]"
          @click="emit('close')"
        >
          {{ vm.t("ui.close") }}
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_340px]">
        <div class="space-y-3">
          <div class="contracts-scrollbar overflow-x-auto rounded-xl border border-[#6b6b6b] bg-[#b9b9b9] p-3">
            <div class="inline-flex min-w-full items-start gap-3">
              <div
                v-for="column in vm.visibleContingencyContractColumns"
                :key="column.key"
                class="self-start rounded-lg border border-[#7b7b7b] bg-[#c7c7c7] p-2"
                :style="{ minHeight: `${vm.CONTRACT_COLUMN_HEIGHT}px`, width: `${column.cardWidth + vm.CONTRACT_CARD_PADDING * 2}px` }"
              >
                <div class="flex items-start gap-2">
                  <div
                    v-for="family in column.families"
                    :key="`${column.key}:${family.key}`"
                    class="grid rounded-lg border border-[#7b7b7b] bg-[#d6d6d6] p-2"
                    :style="{
                      height: `${vm.CONTRACT_COLUMN_HEIGHT}px`,
                      width: `${family.cardWidth}px`,
                      gridTemplateRows: `repeat(3, ${vm.CONTRACT_LEVEL_ROW_HEIGHT}px)`,
                    }"
                  >
                    <template v-for="level in vm.CONTRACT_DISPLAY_LEVELS" :key="`${family.key}:${level}`">
                      <div class="flex min-h-[72px] items-center">
                        <div v-if="(family.entriesByLevel[level] ?? []).length > 0" class="flex flex-nowrap items-center gap-2">
                          <button
                            v-for="entry in family.entriesByLevel[level]"
                            :key="entry.variantId"
                            type="button"
                            class="group relative h-[72px] w-[72px] shrink-0 rounded-xl border bg-[#b4b4b4] p-1.5 transition"
                            :class="entry.isActive
                              ? 'border-[#ea4f4f] bg-[#ffdede]'
                              : 'border-[#8a8a8a] hover:border-[#dfc85c] hover:bg-[#ddd4a7]'"
                            :title="`${entry.name}\n${entry.description}`"
                            @mouseenter="emit('highlight', entry.contractId, entry.variantId)"
                            @focus="emit('highlight', entry.contractId, entry.variantId)"
                            @click="emit('toggle', entry.contractId, entry.variantId)"
                          >
                            <img
                              :src="entry.iconPath"
                              :alt="entry.name"
                              class="h-full w-full rounded-lg object-contain"
                              @error="(($event.target as HTMLImageElement).src = vm.EMPTY_SELECTION_ICON_PATH)"
                            >
                            <div
                              class="absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none shadow-sm"
                              :class="entry.isActive ? 'bg-[#a81b1b] text-white' : 'bg-white/92 text-[#444]'"
                            >
                              {{ `Lv ${entry.level}` }}
                            </div>
                          </button>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="vm.highlightedContract" class="rounded-xl border border-[#6b6b6b] bg-[#b9b9b9] p-3 text-xs">
            <div class="flex items-start gap-3">
              <img
                :src="vm.highlightedContract.iconPath"
                :alt="vm.highlightedContract.name"
                class="h-14 w-14 rounded-lg border border-[#8a8a8a] bg-[#d8d8d8] object-contain p-1"
                @error="(($event.target as HTMLImageElement).src = vm.EMPTY_SELECTION_ICON_PATH)"
              >
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-[#1b1b1b]">{{ vm.highlightedContract.name }}</div>
                <div class="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5e5e5e]">
                  {{ `Lv ${vm.highlightedContract.level}` }}
                </div>
                <div class="mt-2 text-[#3f3f3f]">{{ vm.highlightedContract.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="self-start rounded-xl border border-[#6b6b6b] bg-[#bdbdbd] p-3">
          <div class="text-sm font-semibold text-[#1b1b1b]">
            {{ vm.locale === "zh-CN" ? `总等级：${vm.contingencyTotalLevel}` : `Total Level: ${vm.contingencyTotalLevel}` }}
          </div>
          <div class="mt-3 text-xs uppercase tracking-[0.16em] text-[#777]">{{ vm.locale === "zh-CN" ? "已选词条" : "Selected Effects" }}</div>
          <div class="contracts-scrollbar mt-2 max-h-[392px] space-y-2 overflow-y-auto pr-1">
            <div
              v-for="entry in vm.activeContractSummary"
              :key="entry.id"
              class="rounded-md border border-[#7b7b7b] bg-[#d6d6d6] p-2 text-xs"
            >
              <div class="font-semibold text-[#1f1f1f]">{{ entry.name }}</div>
              <div class="mt-1 text-[#444]">{{ entry.description }}</div>
            </div>
            <div v-if="vm.activeContractSummary.length === 0" class="rounded-md border border-dashed border-[#8d8d8d] bg-[#cfcfcf] p-2 text-xs text-[#666]">
              {{ vm.locale === "zh-CN" ? "尚未选择词条。" : "No contracts selected." }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

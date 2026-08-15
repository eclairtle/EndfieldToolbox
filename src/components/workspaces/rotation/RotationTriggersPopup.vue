<script setup lang="ts">
import { ref, watch } from "vue";
import TriggerConditionNodeEditor from "@/components/workspaces/rotation/TriggerConditionNodeEditor.vue";
import TriggerActionListEditor from "@/components/workspaces/rotation/TriggerActionListEditor.vue";

const props = defineProps<{
  open: boolean;
  vm: any;
  enemies: any[];
  embedded?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const variableNameDraft = ref("");
const variableInitialValueDraft = ref("");

watch(
  () => [
    props.vm.selectedCustomTriggerVariable?.id,
    props.vm.selectedCustomTriggerVariable?.type,
  ] as const,
  () => {
    const variable = props.vm.selectedCustomTriggerVariable;
    variableNameDraft.value = String(variable?.name ?? "");
    variableInitialValueDraft.value = variable?.initialValue?.value == null
      ? ""
      : String(variable.initialValue.value);
  },
  { immediate: true },
);

function commitVariableName() {
  const variable = props.vm.selectedCustomTriggerVariable;
  if (!variable || variableNameDraft.value === variable.name) return;
  props.vm.setTriggerVariableName(variable, variableNameDraft.value);
}

function commitVariableInitialValue() {
  const variable = props.vm.selectedCustomTriggerVariable;
  if (!variable) return;
  if (variable.type === "string") {
    if (variableInitialValueDraft.value !== variable.initialValue.value) {
      props.vm.setTriggerVariableInitialString(variable, variableInitialValueDraft.value);
    }
    return;
  }
  if (variable.type === "number") {
    const value = Number(variableInitialValueDraft.value);
    const normalized = Number.isFinite(value) ? value : 0;
    variableInitialValueDraft.value = String(normalized);
    if (normalized !== variable.initialValue.value) {
      props.vm.setTriggerVariableInitialNumber(variable, normalized);
    }
    return;
  }
  if (variable.type === "boolean") {
    const value = variableInitialValueDraft.value === "true";
    if (value !== variable.initialValue.value) {
      props.vm.setTriggerVariableInitialBoolean(variable, value);
    }
  }
}

function getVariableTypeLabel(type: "string" | "number" | "boolean") {
  if (type === "string") return "STRING";
  if (type === "boolean") return "BOOLEAN";
  return "NUMBER";
}

function getVariableValueLabel(variable: any) {
  const value = variable?.initialValue?.value;
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function shouldHideVariableValue(variable: any) {
  return String(variable?.name ?? "").length > 24 || getVariableValueLabel(variable).length > 20;
}
</script>

<template>
  <div
    v-if="open"
    :class="embedded ? 'h-full min-h-0' : 'fixed inset-0 z-[145] flex items-center justify-center bg-black/35 px-4 py-8'"
    @click.self="emit('close')"
  >
    <div :class="embedded ? 'relative flex h-full min-h-0 flex-col overflow-hidden bg-[#d5d5d5] p-4 text-[#1b1b1b]' : 'relative flex h-[88vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[#505050] bg-[#d5d5d5] p-4 text-[#1b1b1b] shadow-2xl'">
      <div v-if="!embedded" class="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div>
          <div class="text-sm uppercase tracking-[0.2em] text-[#777]">{{ vm.t("rotation.triggers") }}</div>
          <div class="mt-1 text-xs text-[#555]">
            {{ vm.triggerListMode === 'internal'
              ? (vm.locale === "zh-CN" ? `当前启用 ${vm.activeInternalTriggers.length}` : `Currently active ${vm.activeInternalTriggers.length}`)
              : (vm.locale === "zh-CN" ? `当前方案 ${vm.activeCustomTriggers.length}/${vm.MAX_CUSTOM_TRIGGERS}` : `Current scheme ${vm.activeCustomTriggers.length}/${vm.MAX_CUSTOM_TRIGGERS}`) }}
          </div>
        </div>
        <button
          type="button"
          class="rounded-md border border-[#d7d7d7] bg-[#f7f7f7] px-3 py-1.5 text-sm text-[#444] transition hover:bg-[#efefef]"
          @click="emit('close')"
        >
          {{ vm.t("ui.close") }}
        </button>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(260px,0.68fr)_minmax(0,1.7fr)]">
        <div class="flex min-h-0 flex-col rounded-xl border border-[#6b6b6b] bg-[#c4c4c4] p-3">
          <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div class="text-sm font-semibold text-[#1b1b1b]">
              {{ vm.triggerListMode === 'internal'
                ? (vm.locale === 'zh-CN' ? '内部触发器' : 'Internal Triggers')
                : vm.t("rotation.savedTriggers") }}
            </div>
            <div class="flex items-center gap-2">
              <template v-if="vm.triggerListMode === 'custom'">
                <button
                  type="button"
                  class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
                  :disabled="vm.activeCustomTriggerVariables.length >= vm.MAX_CUSTOM_TRIGGER_VARIABLES"
                  @click="vm.addTriggerVariable()"
                >
                  {{ vm.locale === 'zh-CN' ? '新变量' : 'New Variable' }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
                  :disabled="vm.activeCustomTriggers.length >= vm.MAX_CUSTOM_TRIGGERS"
                  @click="vm.beginCreateTrigger()"
                >
                  {{ vm.t("rotation.newTrigger") }}
                </button>
              </template>
            </div>
          </div>

          <div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1.5">
            <div class="rounded-xl border border-[#7b7b7b] bg-[#d3d3d3] p-2.5">
              <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ vm.locale === 'zh-CN' ? '变量' : 'Variables' }}
              </div>
              <div class="space-y-2">
                <div
                  v-for="variable in (vm.triggerListMode === 'internal' ? vm.activeInternalTriggerVariables : vm.activeCustomTriggerVariables)"
                  :key="variable.id"
                  class="flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition"
                  :class="vm.triggerListMode === 'custom' && vm.selectedCustomTriggerVariable?.id === variable.id
                    ? 'border-[#7c8e2f] bg-[#dde7b4]'
                    : 'border-[#8a8a8a] bg-[#e0e0e0]'
                    + (vm.triggerListMode === 'custom' ? ' hover:bg-[#e7e7e7] cursor-pointer' : '')"
                  @click="vm.triggerListMode === 'custom' ? vm.beginEditTriggerVariable(variable) : null"
                >
                  <div class="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">
                    {{ getVariableTypeLabel(variable.type) }}
                  </div>
                  <div class="min-w-0 flex-1 truncate text-sm font-medium text-[#1b1b1b]">
                    {{ variable.name }}
                  </div>
                  <div v-if="!shouldHideVariableValue(variable)" class="shrink-0 text-xs text-[#666]">
                    {{ getVariableValueLabel(variable) }}
                  </div>
                </div>
                <div v-if="(vm.triggerListMode === 'internal' ? vm.activeInternalTriggerVariables.length : vm.activeCustomTriggerVariables.length) === 0" class="rounded-lg border border-dashed border-[#8d8d8d] bg-[#d8d8d8] px-3 py-2 text-sm text-[#666]">
                  {{ vm.triggerListMode === 'internal'
                    ? (vm.locale === 'zh-CN' ? '当前没有启用中的内部变量。' : 'No active internal variables.')
                    : (vm.locale === 'zh-CN' ? '还没有自定义变量。' : 'No custom variables yet.') }}
                </div>
              </div>
            </div>

            <button
              v-for="trigger in (vm.triggerListMode === 'internal' ? vm.activeInternalTriggers : vm.activeCustomTriggers)"
              :key="trigger.id"
              type="button"
              class="block w-full rounded-xl border border-[#7b7b7b] bg-[#d9d9d9] p-2.5 text-left transition hover:bg-[#e4e4e4]"
              @click="vm.triggerListMode === 'internal' ? vm.viewInternalTrigger(trigger) : vm.beginEditTrigger(trigger)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold text-[#1b1b1b]">
                    {{ trigger.name }}
                  </div>
                  <div class="mt-1 text-xs uppercase tracking-[0.12em] text-[#666]">
                    {{ vm.getTriggerEventLabel(trigger.event.type) }}
                  </div>
                </div>
                <span
                  class="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  :class="trigger.enabled === false ? 'bg-[#d9b3b3] text-[#7a2d2d]' : 'bg-[#d2df9d] text-[#4b5600]'"
                >
                  {{ trigger.enabled === false ? vm.t("rotation.disabled") : vm.t("rotation.enabled") }}
                </span>
              </div>
              <div v-if="vm.triggerListMode === 'custom'" class="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
                  :disabled="vm.activeCustomTriggers[0]?.id === trigger.id"
                  @click.stop="vm.moveTrigger(trigger.id, -1)"
                >
                  {{ vm.locale === 'zh-CN' ? '上移' : 'Move Up' }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
                  :disabled="vm.activeCustomTriggers[vm.activeCustomTriggers.length - 1]?.id === trigger.id"
                  @click.stop="vm.moveTrigger(trigger.id, 1)"
                >
                  {{ vm.locale === 'zh-CN' ? '下移' : 'Move Down' }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
                  @click.stop="vm.duplicateTrigger(trigger)"
                >
                  {{ vm.t("rotation.duplicate") }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[#f0d0d0] bg-[#fff5f5] px-2 py-1 text-[11px] text-[#9a3131] transition hover:bg-[#ffeaea]"
                  @click.stop="vm.removeTrigger(trigger.id)"
                >
                  {{ vm.t("ui.delete") }}
                </button>
              </div>
            </button>

            <div v-if="(vm.triggerListMode === 'internal' ? vm.activeInternalTriggers.length : vm.activeCustomTriggers.length) === 0" class="rounded-xl border border-dashed border-[#8d8d8d] bg-[#d0d0d0] p-4 text-sm text-[#666]">
              {{ vm.triggerListMode === 'internal'
                ? (vm.locale === 'zh-CN' ? '当前没有启用中的内部触发器。' : 'No active internal triggers.')
                : vm.t("rotation.noTriggersYet") }}
            </div>
          </div>
          <div class="mt-3 flex shrink-0 items-center justify-start">
            <button
              type="button"
              class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
              @click="vm.setTriggerListMode(vm.triggerListMode === 'internal' ? 'custom' : 'internal')"
            >
              {{ vm.triggerListMode === 'internal'
                ? (vm.locale === 'zh-CN' ? '查看自定义触发器' : 'View Custom Triggers')
                : (vm.locale === 'zh-CN' ? '查看内部触发器' : 'View Internal Triggers') }}
            </button>
          </div>
        </div>

        <div class="flex min-h-0 flex-col rounded-xl border border-[#6b6b6b] bg-[#c4c4c4] p-3">
          <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div class="text-sm font-semibold text-[#1b1b1b]">
              {{
                vm.triggerEditorPanel === 'variable'
                  ? (vm.locale === 'zh-CN' ? '编辑变量' : 'Edit Variable')
                  : (vm.triggerEditorState.mode === 'edit' ? vm.t("rotation.editTrigger") : vm.t("rotation.createTrigger"))
              }}
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="vm.triggerListMode === 'custom'"
                type="button"
                class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
                @click="vm.copyAllTriggersScript()"
              >
                {{ vm.locale === 'zh-CN' ? '导出全部触发器' : 'Export All Triggers' }}
              </button>
              <button
                v-if="vm.triggerListMode === 'custom'"
                type="button"
                class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
                @click="vm.openTriggerImportDialog()"
              >
                {{ vm.locale === 'zh-CN' ? '导入触发器' : 'Import Triggers' }}
              </button>
              <button
                type="button"
                class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]"
                @click="vm.copyTriggerScript()"
              >
                {{ vm.locale === 'zh-CN' ? '复制脚本' : 'Copy Script' }}
              </button>
            </div>
          </div>

          <div
            v-if="vm.triggerTransferStatus"
            class="mb-3 rounded-lg border px-3 py-2 text-xs font-semibold"
            :class="vm.triggerTransferStatus.tone === 'success'
              ? 'border-[#b8c73c] bg-[#dbe9a8] text-[#445200]'
              : 'border-[#e4b7b7] bg-[#f7dddd] text-[#8b2c2c]'"
          >
            {{ vm.triggerTransferStatus.message }}
          </div>

          <div v-if="vm.triggerEditorPanel === 'trigger'" class="mb-3 flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              class="rounded-md border px-3 py-1.5 text-xs font-semibold transition"
              :class="vm.triggerEditorTab === 'overview' ? 'border-[#7c8e2f] bg-[#dbe9a8] text-[#445200]' : 'border-[#d4d4d4] bg-white text-[#444] hover:bg-[#efefef]'"
              @click="vm.setTriggerEditorTab('overview')"
            >
              {{ vm.locale === "zh-CN" ? "概览" : "Overview" }}
            </button>
            <button
              type="button"
              class="rounded-md border px-3 py-1.5 text-xs font-semibold transition"
              :class="vm.triggerEditorTab === 'conditions' ? 'border-[#7c8e2f] bg-[#dbe9a8] text-[#445200]' : 'border-[#d4d4d4] bg-white text-[#444] hover:bg-[#efefef]'"
              @click="vm.setTriggerEditorTab('conditions')"
            >
              {{ vm.locale === "zh-CN" ? "条件" : "Conditions" }}
            </button>
            <button
              type="button"
              class="rounded-md border px-3 py-1.5 text-xs font-semibold transition"
              :class="vm.triggerEditorTab === 'actions' ? 'border-[#7c8e2f] bg-[#dbe9a8] text-[#445200]' : 'border-[#d4d4d4] bg-white text-[#444] hover:bg-[#efefef]'"
              @click="vm.setTriggerEditorTab('actions')"
            >
              {{ vm.locale === "zh-CN" ? "动作" : "Actions" }}
            </button>
            <button
              type="button"
              class="rounded-md border px-3 py-1.5 text-xs font-semibold transition"
              :class="vm.triggerEditorTab === 'script' ? 'border-[#7c8e2f] bg-[#dbe9a8] text-[#445200]' : 'border-[#d4d4d4] bg-white text-[#444] hover:bg-[#efefef]'"
              @click="vm.setTriggerEditorTab('script')"
            >
              {{ vm.locale === "zh-CN" ? "脚本" : "Script" }}
            </button>
          </div>

          <div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1.5">
            <template v-if="vm.triggerEditorPanel === 'variable' && vm.triggerListMode === 'custom' && vm.selectedCustomTriggerVariable">
              <div class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-3">
                <div class="grid gap-3 md:grid-cols-2">
                  <label class="block">
                    <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                      {{ vm.locale === 'zh-CN' ? '变量名称' : 'Variable Name' }}
                    </div>
                    <input
                      v-model="variableNameDraft"
                      type="text"
                      maxlength="80"
                      class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                      @blur="commitVariableName"
                      @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                    >
                  </label>
                  <label class="block">
                    <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                      {{ vm.locale === 'zh-CN' ? '变量类型' : 'Variable Type' }}
                    </div>
                    <select
                      :value="vm.selectedCustomTriggerVariable.type"
                      class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                      @change="vm.setTriggerVariableType(vm.selectedCustomTriggerVariable, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </label>
                </div>
                <div class="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <label class="block">
                    <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                      {{ vm.locale === 'zh-CN' ? '变量 ID' : 'Variable ID' }}
                    </div>
                    <input
                      :value="vm.selectedCustomTriggerVariable.id"
                      type="text"
                      readonly
                      class="w-full rounded-lg border border-[#b7b7b7] bg-[#efefef] px-3 py-2 text-sm text-[#666]"
                    >
                  </label>
                  <div class="self-end">
                    <button
                      type="button"
                      class="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#efefef]"
                      @click="vm.copyText(vm.selectedCustomTriggerVariable.id)"
                    >
                      {{ vm.locale === 'zh-CN' ? '复制' : 'Copy' }}
                    </button>
                  </div>
                </div>
                <label class="mt-3 block">
                  <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                    {{ vm.locale === 'zh-CN' ? '初始值' : 'Initial Value' }}
                  </div>
                  <input
                    v-if="vm.selectedCustomTriggerVariable.type === 'string'"
                    v-model="variableInitialValueDraft"
                    type="text"
                    class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                    @blur="commitVariableInitialValue"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                  >
                  <input
                    v-else-if="vm.selectedCustomTriggerVariable.type === 'number'"
                    v-model="variableInitialValueDraft"
                    type="number"
                    class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                    @blur="commitVariableInitialValue"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                  >
                  <select
                    v-else
                    v-model="variableInitialValueDraft"
                    class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                    @blur="commitVariableInitialValue"
                    @keydown.enter.prevent="($event.target as HTMLSelectElement).blur()"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>

                <div class="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#efefef]"
                    @click="vm.duplicateTriggerVariable(vm.selectedCustomTriggerVariable)"
                  >
                    {{ vm.t("rotation.duplicate") }}
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-[#f0d0d0] bg-[#fff5f5] px-3 py-2 text-sm text-[#9a3131] transition hover:bg-[#ffeaea]"
                    @click="vm.removeTriggerVariable(vm.selectedCustomTriggerVariable.id)"
                  >
                    {{ vm.t("ui.delete") }}
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-2.5 text-xs text-[#555]">
                {{ vm.locale === "zh-CN"
                  ? "变量只在当前方案的模拟中初始化并使用。删除变量后，引用它的触发器会回退到同类型默认变量。"
                  : "Variables are initialized per scheme simulation. Deleting one falls back any references to the matching default variable." }}
              </div>
            </template>

            <template v-else-if="vm.triggerEditorTab === 'overview'">
              <div v-if="vm.triggerListMode === 'internal'" class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-3 text-xs text-[#555]">
                {{ vm.locale === 'zh-CN'
                  ? '内部触发器由项目内置提供，只读显示，不占用 32 个自定义触发器名额。'
                  : 'Internal triggers are project-defined and read-only here. They do not consume the 32 custom trigger slots.' }}
              </div>
              <div :class="vm.triggerListMode === 'internal' ? 'pointer-events-none select-none opacity-60' : ''">
              <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerName") }}</div>
                <input
                  v-model="vm.triggerEditorState.draft.name"
                  type="text"
                  maxlength="80"
                  class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                  :disabled="vm.triggerListMode === 'internal'"
                >
              </label>

              <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerEvent") }}</div>
                <select
                  v-model="vm.triggerEditorState.draft.event.type"
                  class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                  :disabled="vm.triggerListMode === 'internal'"
                >
                  <option v-for="option in vm.CUSTOM_TRIGGER_EVENT_OPTIONS" :key="option.id" :value="option.id">
                    {{ vm.getCustomTriggerOptionLabel(option, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
                  </option>
                </select>
                <div class="mt-1 text-xs text-[#555]">
                  {{
                    vm.getCustomTriggerOptionDescription(
                      vm.CUSTOM_TRIGGER_EVENT_OPTIONS.find((option: any) => option.id === vm.triggerEditorState.draft.event.type) ?? vm.CUSTOM_TRIGGER_EVENT_OPTIONS[0],
                      vm.locale === 'zh-CN' ? 'zh-CN' : 'en',
                    )
                  }}
                </div>
              </label>

              <div class="grid gap-2 text-sm text-[#333]">
                <label class="flex items-center gap-2">
                  <input v-model="vm.triggerEditorState.draft.enabled" type="checkbox" :disabled="vm.triggerListMode === 'internal'">
                  <span>{{ vm.t("rotation.enabled") }}</span>
                </label>
              </div>
              </div>
            </template>

            <template v-else-if="vm.triggerEditorTab === 'conditions'">
              <div class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-2.5 text-xs text-[#555]">
                {{ vm.locale === "zh-CN"
                  ? "顶层条件默认按 AND 依次判定；若没有任何条件，则视为通过。"
                  : "Top-level conditions are evaluated with AND by default; if no conditions exist, the trigger passes." }}
              </div>
              <div class="flex flex-wrap gap-2" :class="vm.triggerListMode === 'internal' ? 'pointer-events-none select-none opacity-60' : ''">
                <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]" @click="vm.addRootComparatorTriggerCondition(vm.triggerEditorState.draft)">
                  {{ vm.locale === "zh-CN" ? "添加比较条件" : "Add Comparator" }}
                </button>
                <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]" @click="vm.addRootLogicTriggerCondition(vm.triggerEditorState.draft)">
                  {{ vm.locale === "zh-CN" ? "添加逻辑组" : "Add Logic Group" }}
                </button>
              </div>

              <div class="space-y-2" :class="vm.triggerListMode === 'internal' ? 'pointer-events-none select-none opacity-60' : ''">
                <TriggerConditionNodeEditor
                  v-for="(condition, index) in vm.triggerEditorState.draft.conditions"
                  :key="condition.id"
                  :node="condition"
                  :event-type="vm.triggerEditorState.draft.event.type"
                  :enemies="enemies"
                  :variables="vm.activeTriggerVariables"
                  :root="true"
                  @remove="vm.removeRootTriggerCondition(vm.triggerEditorState.draft, index)"
                  @duplicate="vm.duplicateRootTriggerCondition(vm.triggerEditorState.draft, index)"
                  @move-up="vm.moveRootTriggerCondition(vm.triggerEditorState.draft, index, -1)"
                  @move-down="vm.moveRootTriggerCondition(vm.triggerEditorState.draft, index, 1)"
                />
                <div v-if="vm.triggerEditorState.draft.conditions.length === 0" class="rounded-xl border border-dashed border-[#8d8d8d] bg-[#d0d0d0] p-4 text-sm text-[#666]">
                  {{ vm.locale === "zh-CN" ? "还没有条件。留空表示无条件触发。" : "No conditions yet. Leave this empty to trigger unconditionally." }}
                </div>
              </div>
            </template>

            <template v-else-if="vm.triggerEditorTab === 'actions'">
              <div :class="vm.triggerListMode === 'internal' ? 'pointer-events-none select-none opacity-60' : ''">
                <TriggerActionListEditor
                  :actions="vm.ensureTriggerActions(vm.triggerEditorState.draft)"
                  :vm="vm"
                  :enemies="enemies"
                  :variables="vm.activeTriggerVariables"
                  :event-type="vm.triggerEditorState.draft.event.type"
                />
              </div>
            </template>
            <template v-else>
              <div class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-2.5 text-xs text-[#555]">
                {{ vm.locale === "zh-CN"
                  ? "触发器脚本使用 JSON 格式，并通过当前应用的触发器解析器校验。离开脚本页或保存时会检查其可解析性。"
                  : "Trigger script uses JSON and is validated through the app's trigger parser. It is checked when you leave the script tab or save." }}
              </div>
              <textarea
                :value="vm.triggerEditorScript"
                class="min-h-[480px] w-full rounded-xl border border-[#8d8d8d] bg-[#f6f6f6] px-3 py-3 font-mono text-xs leading-5 text-[#1b1b1b] outline-none transition focus:border-[#7c8e2f]"
                spellcheck="false"
                :readonly="vm.triggerListMode === 'internal'"
                @input="vm.setTriggerEditorScript(($event.target as HTMLTextAreaElement).value)"
              />
            </template>
          </div>

          <div v-if="vm.triggerEditorPanel === 'trigger' && vm.triggerListMode === 'custom'" class="mt-3 flex shrink-0 items-center justify-end gap-2 border-t border-[#8d8d8d] pt-3">
            <button
              type="button"
              class="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#efefef]"
              @click="vm.beginCreateTrigger()"
            >
              {{ vm.t("ui.cancel") }}
            </button>
            <button
              type="button"
              class="rounded-md border border-[#b8c73c] bg-[#ece81a] px-3 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:bg-[#e1dd15]"
              :disabled="vm.activeCustomTriggers.length >= vm.MAX_CUSTOM_TRIGGERS && vm.triggerEditorState.mode !== 'edit'"
              @click="vm.saveTriggerDraft()"
            >
              {{ vm.triggerEditorState.mode === 'edit' ? vm.t("rotation.updateTrigger") : vm.t("rotation.createTrigger") }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="vm.triggerScriptPromptState.open"
        class="absolute inset-0 z-10 flex items-center justify-center bg-black/30 px-4"
      >
        <div class="w-full max-w-[520px] rounded-2xl border border-[#6b6b6b] bg-[#d7d7d7] p-4 shadow-2xl">
          <div class="text-sm font-semibold text-[#1b1b1b]">
            {{ vm.locale === "zh-CN" ? "脚本无法解析" : "Script Could Not Be Parsed" }}
          </div>
          <div class="mt-2 whitespace-pre-wrap text-sm text-[#444]">
            {{ vm.triggerScriptPromptState.error }}
          </div>
          <div class="mt-3 text-xs text-[#666]">
            {{ vm.locale === "zh-CN"
              ? "要丢弃脚本修改并继续，还是取消并留在脚本页？"
              : "Discard script changes and continue, or cancel and stay on the script tab?" }}
          </div>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#efefef]"
              @click="vm.cancelInvalidTriggerScriptPrompt()"
            >
              {{ vm.locale === "zh-CN" ? "取消" : "Cancel" }}
            </button>
            <button
              type="button"
              class="rounded-md border border-[#b8c73c] bg-[#ece81a] px-3 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:bg-[#e1dd15]"
              @click="vm.discardInvalidTriggerScriptChanges()"
            >
              {{ vm.locale === "zh-CN" ? "丢弃修改" : "Discard Changes" }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="vm.triggerImportState.open"
        class="absolute inset-0 z-10 flex items-center justify-center bg-black/30 px-4"
      >
        <div class="w-full max-w-[760px] rounded-2xl border border-[#6b6b6b] bg-[#d7d7d7] p-4 shadow-2xl">
          <div class="text-sm font-semibold text-[#1b1b1b]">
            {{ vm.locale === "zh-CN" ? "导入触发器" : "Import Triggers" }}
          </div>
          <div class="mt-2 text-xs text-[#666]">
            {{ vm.locale === "zh-CN"
              ? "支持单个触发器脚本，或包含 variables / triggers 的批量导出脚本。"
              : "Accepts either a single trigger script or a bulk export script containing variables / triggers." }}
          </div>
          <textarea
            :value="vm.triggerImportState.script"
            class="mt-3 min-h-[320px] w-full rounded-xl border border-[#8d8d8d] bg-[#f6f6f6] px-3 py-3 font-mono text-xs leading-5 text-[#1b1b1b] outline-none transition focus:border-[#7c8e2f]"
            spellcheck="false"
            @input="vm.setTriggerImportScript(($event.target as HTMLTextAreaElement).value)"
          />
          <div class="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-[#444] transition hover:bg-[#efefef]"
              @click="vm.closeTriggerImportDialog()"
            >
              {{ vm.t("ui.cancel") }}
            </button>
            <button
              type="button"
              class="rounded-md border border-[#b8c73c] bg-[#ece81a] px-3 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:bg-[#e1dd15]"
              @click="vm.importTriggerScript()"
            >
              {{ vm.locale === "zh-CN" ? "导入" : "Import" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

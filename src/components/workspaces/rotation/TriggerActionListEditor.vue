<script setup lang="ts">
import type { EnemyBase } from "@/data/enemies";
import {
  makeDefaultApplyStatusAction,
  makeDefaultExecuteHitAction,
  makeDefaultFireTriggerAction,
  makeDefaultIfThenElseAction,
  makeDefaultModifyVariableAction,
  makeDefaultModifyHpAction,
  makeDefaultBreakAction,
  makeDefaultRemoveStatusAction,
  makeDefaultRelayRotationAction,
  makeDefaultReplaceEnemyAction,
  makeDefaultStopTriggerAction,
  makeDefaultSetTargetEnemyAction,
  makeDefaultSetTriggerEnabledAction,
  makeDefaultCountdownAction,
  makeDefaultWaitAction,
  type CustomCombatTrigger,
  type TriggerAction,
  type TriggerConditionNode,
  type TriggerVariableDefinition,
} from "@/lib/combat/triggers";
import TriggerConditionNodeEditor from "@/components/workspaces/rotation/TriggerConditionNodeEditor.vue";

defineOptions({ name: "TriggerActionListEditor" });

const props = defineProps<{
  actions: TriggerAction[];
  vm: any;
  enemies: EnemyBase[];
  variables: TriggerVariableDefinition[];
  eventType: CustomCombatTrigger["event"]["type"];
  nested?: boolean;
  title?: string;
}>();

function makeDefaultActionByType(actionType: TriggerAction["type"]): TriggerAction {
  return actionType === "REMOVE_STATUS"
    ? makeDefaultRemoveStatusAction()
    : actionType === "REPLACE_ENEMY"
      ? makeDefaultReplaceEnemyAction()
      : actionType === "MODIFY_HP"
        ? makeDefaultModifyHpAction()
        : actionType === "MODIFY_VARIABLE"
          ? makeDefaultModifyVariableAction()
        : actionType === "SET_TARGET_ENEMY"
          ? makeDefaultSetTargetEnemyAction()
          : actionType === "EXECUTE_HIT"
            ? makeDefaultExecuteHitAction()
            : actionType === "WAIT"
              ? makeDefaultWaitAction()
                : actionType === "COUNTDOWN"
                  ? makeDefaultCountdownAction()
              : actionType === "RELAY_ROTATION"
                ? makeDefaultRelayRotationAction()
              : actionType === "SET_TRIGGER_ENABLED"
                ? makeDefaultSetTriggerEnabledAction()
                : actionType === "STOP_TRIGGER"
                  ? makeDefaultStopTriggerAction()
                  : actionType === "BREAK"
                    ? makeDefaultBreakAction()
                : actionType === "IF_THEN_ELSE"
                  ? makeDefaultIfThenElseAction()
                  : actionType === "FIRE_TRIGGER"
                    ? makeDefaultFireTriggerAction()
                    : makeDefaultApplyStatusAction();
}

function addAction(type: TriggerAction["type"] = "APPLY_STATUS") {
  props.actions.push(makeDefaultActionByType(type));
}

function removeAction(index: number) {
  props.actions.splice(index, 1);
}

function duplicateAction(index: number) {
  const source = props.actions[index];
  if (!source) return;
  props.actions.splice(index + 1, 0, JSON.parse(JSON.stringify(source)) as TriggerAction);
}

function moveAction(index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= props.actions.length) return;
  const [action] = props.actions.splice(index, 1);
  if (!action) return;
  props.actions.splice(nextIndex, 0, action);
}

function setActionType(index: number, type: TriggerAction["type"]) {
  const current = props.actions[index];
  if (!current || current.type === type) return;
  props.actions.splice(index, 1, makeDefaultActionByType(type));
}

function isFireTriggerAction(action: TriggerAction): action is Extract<TriggerAction, { type: "FIRE_TRIGGER" }> {
  return action.type === "FIRE_TRIGGER";
}
function isIfThenElseAction(action: TriggerAction): action is Extract<TriggerAction, { type: "IF_THEN_ELSE" }> {
  return action.type === "IF_THEN_ELSE";
}

function getFireTriggerCheckEnabled(action: TriggerAction) {
  return isFireTriggerAction(action) && action.checkEnabled.type === "boolean_literal" ? action.checkEnabled.value : true;
}
function setFireTriggerCheckEnabled(action: TriggerAction, value: boolean) {
  if (!isFireTriggerAction(action)) return;
  action.checkEnabled = { type: "boolean_literal", value };
}
function getFireTriggerCheckCondition(action: TriggerAction) {
  return isFireTriggerAction(action) && action.checkCondition.type === "boolean_literal" ? action.checkCondition.value : true;
}
function setFireTriggerCheckCondition(action: TriggerAction, value: boolean) {
  if (!isFireTriggerAction(action)) return;
  action.checkCondition = { type: "boolean_literal", value };
}
function getFireTriggerTargetMode(action: TriggerAction) {
  return isFireTriggerAction(action) && action.target.type === "trigger_in_slot" ? "trigger_in_slot" : "self";
}
function setFireTriggerTargetMode(action: TriggerAction, mode: "self" | "trigger_in_slot") {
  if (!isFireTriggerAction(action)) return;
  action.target = mode === "trigger_in_slot" ? { type: "trigger_in_slot", slotNumber: { type: "number_literal", value: 1 } } : { type: "self" };
}
function getFireTriggerTargetSlotNumber(action: TriggerAction) {
  return isFireTriggerAction(action) && action.target.type === "trigger_in_slot" && action.target.slotNumber.type === "number_literal" ? action.target.slotNumber.value : 1;
}
function setFireTriggerTargetSlotNumber(action: TriggerAction, value: number) {
  if (!isFireTriggerAction(action) || action.target.type !== "trigger_in_slot") return;
  action.target.slotNumber = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function getIfConditionNode(action: TriggerAction): TriggerConditionNode | null {
  return isIfThenElseAction(action) ? action.ifCondition : null;
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="title" class="text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ title }}</div>

    <div class="flex flex-wrap gap-2">
      <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#efefef]" @click="addAction('APPLY_STATUS')">
        {{ vm.locale === "zh-CN" ? "添加动作" : "Add Action" }}
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="(action, actionIndex) in actions"
        :key="`trigger-action-${actionIndex}`"
        class="rounded-xl border border-[#8d8d8d] bg-[#d0d0d0] p-2"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
            {{ vm.locale === "zh-CN" ? `动作 ${Number(actionIndex) + 1}` : `Action ${Number(actionIndex) + 1}` }}
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" :disabled="actionIndex === 0" @click="moveAction(actionIndex, -1)">
              {{ vm.locale === "zh-CN" ? "上移" : "Move Up" }}
            </button>
            <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" :disabled="actionIndex === actions.length - 1" @click="moveAction(actionIndex, 1)">
              {{ vm.locale === "zh-CN" ? "下移" : "Move Down" }}
            </button>
            <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" @click="duplicateAction(actionIndex)">
              {{ vm.t("rotation.duplicate") }}
            </button>
            <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" @click="removeAction(actionIndex)">
              {{ vm.t("ui.remove") }}
            </button>
          </div>
        </div>

        <div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label class="block">
            <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerAction") }}</div>
            <select
              :value="action.type"
              class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
              @change="setActionType(actionIndex, ($event.target as HTMLSelectElement).value as TriggerAction['type'])"
            >
              <option v-for="option in vm.CUSTOM_TRIGGER_ACTION_OPTIONS" :key="option.id" :value="option.id">
                {{ vm.getCustomTriggerOptionLabel(option, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
              </option>
            </select>
          </label>
          <div class="text-xs text-[#666] lg:pb-2">
            {{ vm.getTriggerActionPrimarySummary(action) }}
          </div>
        </div>

        <template v-if="isIfThenElseAction(action)">
          <div class="mt-2 space-y-2">
            <div class="rounded-lg border border-[#b7b7b7] bg-[#ececec] p-2.5">
              <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ vm.locale === "zh-CN" ? "IF 条件" : "If Condition" }}
              </div>
              <TriggerConditionNodeEditor
                v-if="getIfConditionNode(action)"
                :node="action.ifCondition"
                :event-type="eventType"
                :enemies="enemies"
                :variables="variables"
              />
            </div>

            <div class="grid gap-2 xl:grid-cols-2">
              <div class="rounded-lg border border-[#b7b7b7] bg-[#ececec] p-2.5">
                <TriggerActionListEditor
                  :actions="action.thenActions"
                  :vm="vm"
                  :enemies="enemies"
                  :variables="variables"
                  :event-type="eventType"
                  nested
                  :title="vm.locale === 'zh-CN' ? 'THEN 动作' : 'Then Actions'"
                />
              </div>
              <div class="rounded-lg border border-[#b7b7b7] bg-[#ececec] p-2.5">
                <TriggerActionListEditor
                  :actions="action.elseActions"
                  :vm="vm"
                  :enemies="enemies"
                  :variables="variables"
                  :event-type="eventType"
                  nested
                  :title="vm.locale === 'zh-CN' ? 'ELSE 动作' : 'Else Actions'"
                />
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="isFireTriggerAction(action)">
          <div class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ vm.locale === 'zh-CN' ? '目标触发器' : 'Target Trigger' }}
              </div>
              <select
                :value="getFireTriggerTargetMode(action)"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                @change="setFireTriggerTargetMode(action, ($event.target as HTMLSelectElement).value as 'self' | 'trigger_in_slot')"
              >
                <option value="self">{{ vm.locale === 'zh-CN' ? '本触发器' : 'This Trigger' }}</option>
                <option value="trigger_in_slot">{{ vm.locale === 'zh-CN' ? '触发器槽位' : 'Trigger Slot' }}</option>
              </select>
            </label>

            <label v-if="getFireTriggerTargetMode(action) === 'trigger_in_slot'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ vm.locale === 'zh-CN' ? '触发器槽位' : 'Trigger Slot' }}
              </div>
              <input
                :value="getFireTriggerTargetSlotNumber(action)"
                type="number"
                min="1"
                step="1"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                @input="setFireTriggerTargetSlotNumber(action, Number(($event.target as HTMLInputElement).value))"
              >
            </label>
          </div>
          <div class="mt-2 grid gap-2 text-sm text-[#333] md:grid-cols-2">
            <label class="flex items-center gap-2">
              <input :checked="getFireTriggerCheckEnabled(action)" type="checkbox" @change="setFireTriggerCheckEnabled(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '检查目标触发器是否启用' : 'Check Target Trigger Enabled' }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input :checked="getFireTriggerCheckCondition(action)" type="checkbox" @change="setFireTriggerCheckCondition(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '检查目标触发器条件' : 'Check Target Trigger Conditions' }}</span>
            </label>
          </div>
        </template>

        <template v-else>
          <div class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <label v-if="action.type !== 'REPLACE_ENEMY' && action.type !== 'MODIFY_HP' && action.type !== 'MODIFY_VARIABLE' && action.type !== 'SET_TARGET_ENEMY' && action.type !== 'EXECUTE_HIT' && action.type !== 'WAIT' && action.type !== 'COUNTDOWN' && action.type !== 'RELAY_ROTATION' && action.type !== 'SET_TRIGGER_ENABLED' && action.type !== 'STOP_TRIGGER' && action.type !== 'BREAK'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerStatus") }}</div>
              <select
                :value="vm.getTriggerActionStatusId(action)"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                @change="vm.setTriggerActionStatusId(action, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="status in vm.CUSTOM_TRIGGER_STATUS_OPTIONS" :key="status.id" :value="status.id">
                  {{ vm.locale === 'zh-CN' ? status.label.zh : status.label.en }}
                </option>
              </select>
            </label>

            <label v-else-if="action.type === 'REPLACE_ENEMY'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '替换为敌人' : 'Replacement Enemy' }}</div>
              <select :value="vm.getTriggerActionEnemyId(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionEnemyId(action, ($event.target as HTMLSelectElement).value)">
                <option v-for="enemy in enemies" :key="enemy.id" :value="enemy.id">
                  {{ vm.getEnemyDisplayName(enemy.id, enemy.name, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
                </option>
              </select>
            </label>

            <label v-else-if="action.type === 'MODIFY_HP'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '生命操作' : 'HP Operation' }}</div>
              <select :value="vm.getTriggerActionHpOperation(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionHpOperation(action, ($event.target as HTMLSelectElement).value)">
                <option value="damage">{{ vm.locale === 'zh-CN' ? '伤害' : 'Damage' }}</option>
                <option value="heal">{{ vm.locale === 'zh-CN' ? '治疗' : 'Heal' }}</option>
              </select>
            </label>

            <label v-else-if="action.type === 'MODIFY_VARIABLE'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '目标变量' : 'Target Variable' }}</div>
              <select :value="vm.getTriggerActionVariableId(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionVariableId(action, ($event.target as HTMLSelectElement).value)">
                <option v-for="variable in variables" :key="variable.id" :value="variable.id">{{ variable.name }}</option>
              </select>
            </label>

            <label v-else-if="action.type === 'EXECUTE_HIT'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '伤害段名称' : 'Hit Name' }}</div>
              <input :value="vm.getTriggerActionExecuteHitName(action)" type="text" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionExecuteHitName(action, ($event.target as HTMLInputElement).value)">
            </label>

            <label v-else-if="action.type === 'WAIT' || action.type === 'COUNTDOWN'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ action.type === 'COUNTDOWN' ? (vm.locale === 'zh-CN' ? '倒计时秒数' : 'Countdown Seconds') : (vm.locale === 'zh-CN' ? '等待秒数' : 'Wait Seconds') }}</div>
              <input :value="vm.getTriggerActionWaitSeconds(action)" type="number" min="0" step="0.1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionWaitSeconds(action, Number(($event.target as HTMLInputElement).value))">
            </label>

            <div v-else-if="action.type === 'RELAY_ROTATION'" class="rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#555]">
              {{ vm.locale === 'zh-CN' ? '在此时间点输出到下一轮接力点。' : 'Exports a relay point to the next rotation at this timestamp.' }}
            </div>

            <label v-else-if="action.type === 'SET_TRIGGER_ENABLED'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '触发器操作' : 'Trigger Operation' }}</div>
              <select :value="vm.getTriggerActionEnableOperation(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionEnableOperation(action, ($event.target as HTMLSelectElement).value)">
                <option value="enable">{{ vm.locale === 'zh-CN' ? '启用' : 'Enable' }}</option>
                <option value="disable">{{ vm.locale === 'zh-CN' ? '禁用' : 'Disable' }}</option>
              </select>
            </label>

            <div v-else-if="action.type === 'STOP_TRIGGER' || action.type === 'BREAK'" class="block" />

            <div v-else class="block" />

            <label v-if="action.type !== 'WAIT' && action.type !== 'COUNTDOWN' && action.type !== 'RELAY_ROTATION' && action.type !== 'SET_TRIGGER_ENABLED' && action.type !== 'STOP_TRIGGER' && action.type !== 'BREAK' && action.type !== 'MODIFY_VARIABLE'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerTarget") }}</div>
              <select
                :value="vm.getTriggerActionTargetOption(action)"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                @change="vm.setTriggerActionTargetOption(action, ($event.target as HTMLSelectElement).value)"
              >
                <option
                  v-for="option in vm.CUSTOM_TRIGGER_TARGET_OPTIONS.filter((option: any) =>
                    (((action.type === 'APPLY_STATUS' || action.type === 'REMOVE_STATUS')) || (option.id !== 'team' && option.id !== 'global'))
                    &&
                    ((action.type !== 'REPLACE_ENEMY' && action.type !== 'SET_TARGET_ENEMY' && action.type !== 'EXECUTE_HIT') || (option.id !== 'event_operator' && option.id !== 'controlled_operator'))
                    && ((option.id !== 'event_enemy_target') || vm.triggerEventSupportsAlias(eventType, 'event_enemy_target'))
                    && ((option.id !== 'event_enemy_group_member') || vm.triggerEventSupportsAlias(eventType, 'event_enemy_group')),
                  )"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ vm.getCustomTriggerOptionLabel(option, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
                </option>
              </select>
            </label>

            <label v-else-if="action.type === 'SET_TRIGGER_ENABLED' || action.type === 'STOP_TRIGGER'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '目标触发器' : 'Target Trigger' }}</div>
              <select :value="vm.getTriggerActionEnableTarget(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionEnableTarget(action, ($event.target as HTMLSelectElement).value)">
                <option value="self">{{ vm.locale === 'zh-CN' ? '本触发器' : 'This Trigger' }}</option>
                <option value="trigger_in_slot">{{ vm.locale === 'zh-CN' ? '触发器槽位' : 'Trigger Slot' }}</option>
              </select>
            </label>
          </div>

          <div
            v-if="action.type !== 'WAIT' && action.type !== 'COUNTDOWN' && action.type !== 'RELAY_ROTATION' && action.type !== 'SET_TRIGGER_ENABLED' && action.type !== 'STOP_TRIGGER' && action.type !== 'BREAK' && action.type !== 'MODIFY_VARIABLE' && (action.type !== 'EXECUTE_HIT' || vm.getTriggerActionExecuteHitTargets(action) === 'targeted_enemy') && (vm.getTriggerActionTargetOption(action) === 'enemy_in_slot' || vm.getTriggerActionTargetOption(action) === 'event_enemy_group_member')"
            class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4"
          >
            <label v-if="vm.getTriggerActionTargetOption(action) === 'enemy_in_slot'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '敌人槽位' : 'Enemy Slot' }}</div>
              <select v-if="vm.getTriggerActionTargetSlotSource(action)" :value="vm.getNumericSourceMode(vm.getTriggerActionTargetSlotSource(action)!)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceMode(vm.getTriggerActionTargetSlotSource(action)!, ($event.target as HTMLSelectElement).value)"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="vm.getTriggerActionTargetSlotSource(action) && vm.getNumericSourceMode(vm.getTriggerActionTargetSlotSource(action)!) === 'literal'" :value="vm.getTriggerActionTargetSlotNumber(action)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionTargetSlotNumber(action, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="vm.getTriggerActionTargetSlotSource(action)" :value="vm.getNumericSourceVariableId(vm.getTriggerActionTargetSlotSource(action)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceVariableId(vm.getTriggerActionTargetSlotSource(action)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in vm.getTriggerVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </label>
            <label v-if="vm.getTriggerActionTargetOption(action) === 'event_enemy_group_member'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '敌人组序号' : 'Enemy Group Index' }}</div>
              <select v-if="vm.getTriggerActionTargetGroupIndexSource(action)" :value="vm.getNumericSourceMode(vm.getTriggerActionTargetGroupIndexSource(action)!)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceMode(vm.getTriggerActionTargetGroupIndexSource(action)!, ($event.target as HTMLSelectElement).value)"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="vm.getTriggerActionTargetGroupIndexSource(action) && vm.getNumericSourceMode(vm.getTriggerActionTargetGroupIndexSource(action)!) === 'literal'" :value="vm.getTriggerActionTargetGroupIndex(action)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionTargetGroupIndex(action, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="vm.getTriggerActionTargetGroupIndexSource(action)" :value="vm.getNumericSourceVariableId(vm.getTriggerActionTargetGroupIndexSource(action)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceVariableId(vm.getTriggerActionTargetGroupIndexSource(action)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in vm.getTriggerVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </label>
          </div>

          <div v-if="(action.type === 'SET_TRIGGER_ENABLED' || action.type === 'STOP_TRIGGER') && vm.getTriggerActionEnableTarget(action) === 'trigger_in_slot'" class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '触发器槽位' : 'Trigger Slot' }}</div>
              <select v-if="vm.getTriggerActionEnableTargetSlotSource(action)" :value="vm.getNumericSourceMode(vm.getTriggerActionEnableTargetSlotSource(action)!)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceMode(vm.getTriggerActionEnableTargetSlotSource(action)!, ($event.target as HTMLSelectElement).value)"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="vm.getTriggerActionEnableTargetSlotSource(action) && vm.getNumericSourceMode(vm.getTriggerActionEnableTargetSlotSource(action)!) === 'literal'" :value="vm.getTriggerActionEnableTargetSlotNumber(action)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionEnableTargetSlotNumber(action, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="vm.getTriggerActionEnableTargetSlotSource(action)" :value="vm.getNumericSourceVariableId(vm.getTriggerActionEnableTargetSlotSource(action)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setNumericSourceVariableId(vm.getTriggerActionEnableTargetSlotSource(action)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in vm.getTriggerVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </label>
          </div>

          <div v-if="action.type === 'MODIFY_VARIABLE'" class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '变量操作' : 'Variable Operation' }}</div>
              <select :value="vm.getTriggerActionVariableOperation(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionVariableOperation(action, ($event.target as HTMLSelectElement).value)">
                <option value="set">set</option>
                <option v-if="variables.find((entry) => entry.id === vm.getTriggerActionVariableId(action))?.type === 'number'" value="add">add</option>
                <option v-if="variables.find((entry) => entry.id === vm.getTriggerActionVariableId(action))?.type === 'number'" value="subtract">subtract</option>
              </select>
            </label>
            <label v-if="variables.find((entry) => entry.id === vm.getTriggerActionVariableId(action))?.type === 'string'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">Value</div>
              <input :value="vm.getTriggerActionVariableValueString(action)" type="text" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionVariableValueString(action, ($event.target as HTMLInputElement).value)">
            </label>
            <label v-else-if="variables.find((entry) => entry.id === vm.getTriggerActionVariableId(action))?.type === 'boolean'" class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">Value</div>
              <select :value="String(vm.getTriggerActionVariableValueBoolean(action))" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionVariableValueBoolean(action, ($event.target as HTMLSelectElement).value === 'true')"><option value="true">true</option><option value="false">false</option></select>
            </label>
            <label v-else class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">Value</div>
              <input :value="vm.getTriggerActionVariableValueNumber(action)" type="number" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionVariableValueNumber(action, Number(($event.target as HTMLInputElement).value))">
            </label>
          </div>

          <div v-if="action.type === 'EXECUTE_HIT'" class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '来源干员' : 'Source Operator' }}</div>
              <select :value="vm.getTriggerActionExecuteHitSource(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionExecuteHitSource(action, ($event.target as HTMLSelectElement).value)">
                <option value="event_operator">Event Operator</option>
                <option value="controlled_operator">Controlled Operator</option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '攻击类型' : 'Attack Type' }}</div>
              <select :value="vm.getTriggerActionExecuteHitAttackType(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionExecuteHitAttackType(action, ($event.target as HTMLSelectElement).value)">
                <option value="BATTLE_SKILL">Battle Skill</option>
                <option value="COMBO_SKILL">Combo Skill</option>
                <option value="ULTIMATE">Ultimate</option>
                <option value="TALENT">Talent</option>
                <option value="REACTION">Reaction</option>
                <option value="GENERIC">Generic</option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '伤害类型' : 'Damage Type' }}</div>
              <select :value="vm.getTriggerActionExecuteHitDamageType(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionExecuteHitDamageType(action, ($event.target as HTMLSelectElement).value)">
                <option value="Physical">Physical</option>
                <option value="Heat">Heat</option>
                <option value="Cryo">Cryo</option>
                <option value="Electric">Electric</option>
                <option value="Nature">Nature</option>
                <option value="Aether">Aether</option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '目标模式' : 'Target Mode' }}</div>
              <select :value="vm.getTriggerActionExecuteHitTargets(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @change="vm.setTriggerActionExecuteHitTargets(action, ($event.target as HTMLSelectElement).value)">
                <option value="targeted_enemy">Targeted Enemy</option>
                <option value="all_enemies">All Enemies</option>
                <option value="finisher">Finisher</option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '倍率' : 'Multiplier' }}</div>
              <input :value="vm.getTriggerActionExecuteHitMultiplier(action)" type="number" step="0.1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionExecuteHitMultiplier(action, Number(($event.target as HTMLInputElement).value))">
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '固定数值' : 'Flat Amount' }}</div>
              <input :value="vm.getTriggerActionExecuteHitFlatAmount(action)" type="number" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionExecuteHitFlatAmount(action, Number(($event.target as HTMLInputElement).value))">
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '失衡值' : 'Stagger' }}</div>
              <input :value="vm.getTriggerActionExecuteHitStagger(action)" type="number" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionExecuteHitStagger(action, Number(($event.target as HTMLInputElement).value))">
            </label>
          </div>

          <div v-if="action.type === 'EXECUTE_HIT'" class="mt-2 grid gap-2 text-sm text-[#333] md:grid-cols-2">
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionExecuteHitNoCrit(action)" type="checkbox" @change="vm.setTriggerActionExecuteHitNoCrit(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '不可暴击' : 'No Crit' }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionExecuteHitIgnoreInvuln(action)" type="checkbox" @change="vm.setTriggerActionExecuteHitIgnoreInvuln(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '无视敌方无敌' : 'Ignore Enemy Invulnerability' }}</span>
            </label>
          </div>

          <div v-if="action.type === 'MODIFY_HP'" class="mt-2">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '生命值数值' : 'HP Amount' }}</div>
              <input :value="vm.getTriggerActionHpAmount(action)" type="number" min="0" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" @input="vm.setTriggerActionHpAmount(action, Number(($event.target as HTMLInputElement).value))">
            </label>
          </div>

          <div v-if="action.type === 'REPLACE_ENEMY'" class="mt-2 grid gap-2 md:grid-cols-2">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '敌人等级' : 'Enemy Level' }}</div>
              <input
                :value="vm.getTriggerActionReplaceEnemyLevel(action)"
                type="number"
                min="1"
                step="1"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                @input="vm.setTriggerActionReplaceEnemyLevel(action, Number(($event.target as HTMLInputElement).value))"
              >
            </label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]">
                <input :checked="vm.isTriggerActionResetHp(action)" type="checkbox" @change="vm.setTriggerActionResetHp(action, ($event.target as HTMLInputElement).checked)">
                <span>{{ vm.locale === 'zh-CN' ? '替换时重置生命值' : 'Reset HP On Replace' }}</span>
              </label>
              <label class="flex items-center gap-2 rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]">
                <input :checked="vm.isTriggerActionReplaceEnemyNoDeath(action)" type="checkbox" @change="vm.setTriggerActionReplaceEnemyNoDeath(action, ($event.target as HTMLInputElement).checked)">
                <span>{{ vm.locale === 'zh-CN' ? '无死亡' : 'No Death' }}</span>
              </label>
            </div>
          </div>

        <div v-if="action.type === 'APPLY_STATUS'" class="mt-2 grid gap-2 text-sm text-[#333] md:grid-cols-2">
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionUseDefault(action)" type="checkbox" @change="vm.setTriggerActionUseDefault(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '使用默认规则' : 'Use Default' }}</span>
            </label>
        </div>

        <div v-if="action.type === 'APPLY_STATUS'" class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4" :class="vm.isTriggerActionUseDefault(action) ? 'opacity-50' : ''">
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerDurationLabel") }}</div>
              <select
                :value="vm.getTriggerActionDurationMode(action)"
                class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                :disabled="vm.isTriggerActionPermanent(action) || vm.isTriggerActionUseDefault(action)"
                @change="vm.setTriggerActionDurationMode(action, ($event.target as HTMLSelectElement).value)"
              >
                <option value="literal">{{ vm.locale === 'zh-CN' ? '数字常量' : 'Number Literal' }}</option>
                <option value="variable">{{ vm.locale === 'zh-CN' ? '数字变量' : 'Number Variable' }}</option>
                <option value="event_status_duration">{{ vm.locale === 'zh-CN' ? '事件状态持续时间' : 'Event Status Duration' }}</option>
              </select>
              <input
                v-if="vm.getTriggerActionDurationMode(action) === 'literal'"
                :value="vm.getTriggerActionDurationValue(action)"
                type="number"
                min="0"
                step="0.1"
                class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                :disabled="vm.isTriggerActionPermanent(action) || vm.isTriggerActionUseDefault(action)"
                @input="vm.setTriggerActionDurationValue(action, Number(($event.target as HTMLInputElement).value))"
              >
              <select
                v-else-if="vm.getTriggerActionDurationMode(action) === 'variable'"
                :value="vm.getTriggerActionDurationVariableId(action)"
                class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
                :disabled="vm.isTriggerActionPermanent(action) || vm.isTriggerActionUseDefault(action)"
                @change="vm.setTriggerActionDurationVariableId(action, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="variable in vm.getTriggerVariablesByType('number')" :key="variable.id" :value="variable.id">
                  {{ variable.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.t("rotation.triggerStacks") }}</div>
              <input :value="vm.getTriggerActionStacksValue(action)" type="number" min="1" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @input="vm.setTriggerActionStacksValue(action, Number(($event.target as HTMLInputElement).value))">
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '叠加规则' : 'Stacking Rule' }}</div>
              <select :value="vm.getTriggerActionStackingRule(action)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionStackingRule(action, ($event.target as HTMLSelectElement).value)">
                <option v-for="option in vm.CUSTOM_TRIGGER_STATUS_STACKING_RULE_OPTIONS" :key="option.id" :value="option.id">
                  {{ vm.getCustomTriggerOptionLabel(option, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
                </option>
              </select>
            </label>
            <label class="block">
              <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '最大层数' : 'Max Stacks' }}</div>
              <input :value="vm.getTriggerActionMaxStacksValue(action)" type="number" min="1" step="1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @input="vm.setTriggerActionMaxStacksValue(action, Number(($event.target as HTMLInputElement).value))">
            </label>
          </div>

        <div v-if="action.type === 'APPLY_STATUS'" class="mt-2 grid gap-2 text-sm text-[#333] md:grid-cols-2" :class="vm.isTriggerActionUseDefault(action) ? 'opacity-50' : ''">
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionPermanent(action)" type="checkbox" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionPermanent(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.t("rotation.permanent") }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionHidden(action)" type="checkbox" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionHidden(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.t("rotation.hiddenStatus") }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionRefreshExistingStacks(action)" type="checkbox" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionRefreshExistingStacks(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '刷新已有层数持续时间' : 'Refresh Existing Stacks' }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input :checked="vm.isTriggerActionIndependentStacks(action)" type="checkbox" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionIndependentStacks(action, ($event.target as HTMLInputElement).checked)">
              <span>{{ vm.locale === 'zh-CN' ? '独立持续时间' : 'Independent Durations' }}</span>
            </label>
          </div>

        <div v-if="action.type === 'APPLY_STATUS'" class="mt-2 space-y-2" :class="vm.isTriggerActionUseDefault(action) ? 'opacity-50' : ''">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
                {{ vm.locale === 'zh-CN' ? '状态数值' : 'Status Stats' }}
              </div>
              <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" :disabled="vm.isTriggerActionUseDefault(action)" @click="vm.addTriggerActionStatEntry(action)">
                {{ vm.locale === 'zh-CN' ? '添加数值' : 'Add Stat' }}
              </button>
            </div>
            <div v-for="(entry, statIndex) in vm.getTriggerActionStatEntries(action)" :key="`status-stat-${actionIndex}-${statIndex}`" class="grid gap-2 rounded-lg border border-[#b7b7b7] bg-[#ececec] p-2 md:grid-cols-2 xl:grid-cols-5">
              <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '种类' : 'Kind' }}</div>
                <select :value="vm.getTriggerActionStatEntryKind(action, statIndex)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionStatEntryKind(action, statIndex, ($event.target as HTMLSelectElement).value)">
                  <option value="modifier">{{ vm.locale === 'zh-CN' ? '修正属性' : 'Modifier Stat' }}</option>
                  <option value="basic">{{ vm.locale === 'zh-CN' ? '基础属性' : 'Basic Stat' }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '属性' : 'Stat' }}</div>
                <select :value="vm.getTriggerActionStatEntryKey(action, statIndex)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionStatEntryKey(action, statIndex, ($event.target as HTMLSelectElement).value)">
                  <option v-if="vm.getTriggerActionStatEntryKind(action, statIndex) === 'basic'" v-for="option in vm.CUSTOM_TRIGGER_STATUS_BASIC_STAT_OPTIONS" :key="option.id" :value="option.id">
                    {{ vm.getCustomTriggerOptionLabel(option, vm.locale === 'zh-CN' ? 'zh-CN' : 'en') }}
                  </option>
                  <option v-else v-for="statKey in vm.MODIFIER_STAT_KEYS" :key="statKey" :value="statKey">{{ vm.modifierLabel(statKey) }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '数值模式' : 'Value Mode' }}</div>
                <select :value="vm.getTriggerActionStatEntryValueMode(action, statIndex)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionStatEntryValueMode(action, statIndex, ($event.target as HTMLSelectElement).value)">
                  <option value="literal">{{ vm.locale === 'zh-CN' ? '固定值' : 'Literal' }}</option>
                  <option value="variable">{{ vm.locale === 'zh-CN' ? '变量' : 'Variable' }}</option>
                </select>
              </label>
              <label v-if="vm.getTriggerActionStatEntryValueMode(action, statIndex) === 'literal'" class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '数值' : 'Value' }}</div>
                <input :value="vm.getTriggerActionStatEntryValueNumber(action, statIndex)" type="number" step="0.1" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @input="vm.setTriggerActionStatEntryValueNumber(action, statIndex, Number(($event.target as HTMLInputElement).value))">
              </label>
              <label v-else class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ vm.locale === 'zh-CN' ? '变量' : 'Variable' }}</div>
                <select :value="vm.getTriggerActionStatEntryValueVariableId(action, statIndex)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]" :disabled="vm.isTriggerActionUseDefault(action)" @change="vm.setTriggerActionStatEntryValueVariableId(action, statIndex, ($event.target as HTMLSelectElement).value)">
                  <option v-for="variable in vm.getTriggerVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option>
                </select>
              </label>
              <div class="flex items-end">
                <button type="button" class="w-full rounded-md border border-[#d4d4d4] bg-white px-2 py-2 text-[11px] text-[#444] transition hover:bg-[#efefef]" :disabled="vm.isTriggerActionUseDefault(action)" @click="vm.removeTriggerActionStatEntry(action, statIndex)">
                  {{ vm.t('ui.remove') }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

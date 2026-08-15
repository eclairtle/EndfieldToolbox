<script setup lang="ts">
import type { EnemyBase } from "@/data/enemies";
import { getEnemyDisplayName } from "@/data/enemyCustomNames";
import {
  CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS,
  CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS,
  CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS,
  CUSTOM_TRIGGER_LOGIC_OPERATOR_OPTIONS,
  CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS,
  CUSTOM_TRIGGER_STATUS_OPTIONS,
  getDefaultTriggerVariableId,
  makeDefaultComparatorTriggerCondition,
  makeDefaultLogicTriggerCondition,
  triggerEventSupportsAlias,
  type CustomTriggerEventType,
  type TriggerComparatorCondition,
  type TriggerControlReference,
  type TriggerConditionNode,
  type TriggerEnemyReferenceExpression,
  type TriggerEnemyLifecycleState,
  type TriggerLogicCondition,
  type TriggerNumericSource,
  type TriggerOperatorReferenceExpression,
  type TriggerReferenceExpression,
  type TriggerStatusTargetExpression,
  type TriggerVariableDefinition,
  type TriggerValueExpression,
} from "@/lib/combat/triggers";
import { useLocale } from "@/i18n/useLocale";

defineOptions({ name: "TriggerConditionNodeEditor" });

const props = defineProps<{
  node: TriggerConditionNode;
  eventType: CustomTriggerEventType;
  enemies: EnemyBase[];
  variables: TriggerVariableDefinition[];
  root?: boolean;
}>();

const emit = defineEmits<{
  (e: "remove"): void;
  (e: "duplicate"): void;
  (e: "moveUp"): void;
  (e: "moveDown"): void;
}>();

const { locale } = useLocale();

function replaceNode(next: TriggerConditionNode) {
  for (const key of Object.keys(props.node)) {
    delete (props.node as Record<string, unknown>)[key];
  }
  Object.assign(props.node, next);
}

function replaceExpression(target: TriggerValueExpression, next: TriggerValueExpression) {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }
  Object.assign(target, next);
}

function replaceEnemyRef(target: TriggerEnemyReferenceExpression, next: TriggerEnemyReferenceExpression) {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }
  Object.assign(target, next);
}

function replaceOperatorRef(target: TriggerOperatorReferenceExpression, next: TriggerOperatorReferenceExpression) {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }
  Object.assign(target, next);
}

function replaceTriggerControlRef(target: TriggerControlReference, next: TriggerControlReference) {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }
  Object.assign(target, next);
}

function replaceStatusTarget(target: TriggerStatusTargetExpression, next: TriggerStatusTargetExpression) {
  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }
  Object.assign(target, next);
}

function isComparatorNode(node: TriggerConditionNode): node is TriggerComparatorCondition {
  return node.kind === "comparator";
}

function isLogicNode(node: TriggerConditionNode): node is TriggerLogicCondition {
  return node.kind === "logic";
}

function setNodeKind(kind: "comparator" | "logic") {
  if (kind === props.node.kind) {
    return;
  }
  replaceNode(kind === "logic" ? makeDefaultLogicTriggerCondition() : makeDefaultComparatorTriggerCondition());
}

function addComparatorChild() {
  if (!isLogicNode(props.node)) {
    return;
  }
  props.node.conditions.push(makeDefaultComparatorTriggerCondition());
}

function addLogicChild() {
  if (!isLogicNode(props.node)) {
    return;
  }
  props.node.conditions.push(makeDefaultLogicTriggerCondition());
}

function removeChild(index: number) {
  if (!isLogicNode(props.node)) {
    return;
  }
  props.node.conditions.splice(index, 1);
}

function duplicateChild(index: number) {
  if (!isLogicNode(props.node)) {
    return;
  }
  const source = props.node.conditions[index];
  if (!source) {
    return;
  }
  props.node.conditions.splice(index + 1, 0, JSON.parse(JSON.stringify(source)) as TriggerConditionNode);
}

function moveChild(index: number, direction: -1 | 1) {
  if (!isLogicNode(props.node)) {
    return;
  }
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= props.node.conditions.length) {
    return;
  }
  const [child] = props.node.conditions.splice(index, 1);
  if (!child) {
    return;
  }
  props.node.conditions.splice(nextIndex, 0, child);
}

function getExpressionType(expression: TriggerValueExpression) {
  return expression.type;
}

function setExpressionType(expression: TriggerValueExpression, nextType: TriggerValueExpression["type"]) {
  switch (nextType) {
    case "number_literal":
      replaceExpression(expression, { type: "number_literal", value: 0 });
      return;
    case "string_literal":
      replaceExpression(expression, { type: "string_literal", value: "" });
      return;
    case "boolean_literal":
      replaceExpression(expression, { type: "boolean_literal", value: true });
      return;
    case "variable_ref":
      replaceExpression(expression, { type: "variable_ref", variableId: getDefaultTriggerVariableId("number"), variableType: "number" });
      return;
    case "status_id_literal":
      replaceExpression(expression, { type: "status_id_literal", statusId: "bladebreaking" });
      return;
    case "event_status_id":
      replaceExpression(expression, { type: "event_status_id" });
      return;
    case "event_status_duration":
      replaceExpression(expression, { type: "event_status_duration" });
      return;
    case "event_damage_type":
      replaceExpression(expression, { type: "event_damage_type" });
      return;
    case "damage_type_literal":
      replaceExpression(expression, { type: "damage_type_literal", damageType: "Physical" });
      return;
    case "enemy_id_literal":
      replaceExpression(expression, { type: "enemy_id_literal", enemyId: props.enemies[0]?.id ?? "rhodagn" });
      return;
    case "enemy_identity":
      replaceExpression(expression, { type: "enemy_identity", enemy: { type: "alias_enemy", alias: "event_enemy_target" } });
      return;
    case "enemy_rank":
      replaceExpression(expression, { type: "enemy_rank", enemy: { type: "alias_enemy", alias: "event_enemy_target" } });
      return;
    case "enemy_crowd_control_level":
      replaceExpression(expression, { type: "enemy_crowd_control_level", enemy: { type: "alias_enemy", alias: "event_enemy_target" } });
      return;
    case "enemy_rank_literal":
      replaceExpression(expression, { type: "enemy_rank_literal", rank: "common" });
      return;
    case "operator_hp_ratio":
      replaceExpression(expression, { type: "operator_hp_ratio", target: { type: "alias_operator", alias: "event_operator" } });
      return;
    case "enemy_hp_ratio":
      replaceExpression(expression, { type: "enemy_hp_ratio", target: { type: "alias_enemy", alias: "event_enemy_target" } });
      return;
    case "status_stack_count":
      replaceExpression(expression, {
        type: "status_stack_count",
        target: { type: "alias_operator", alias: "event_operator" },
        status: { type: "status_id_literal", statusId: "bladebreaking" },
      });
      return;
    case "contract_enabled":
      replaceExpression(expression, { type: "contract_enabled", variantId: CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS[0]?.id ?? "" });
      return;
    case "enemy_state_count":
      replaceExpression(expression, { type: "enemy_state_count", state: "active" });
      return;
    case "enemy_state":
      replaceExpression(expression, { type: "enemy_state", enemy: { type: "alias_enemy", alias: "event_enemy_target" }, state: "active" });
      return;
    case "trigger_enabled":
      replaceExpression(expression, { type: "trigger_enabled", trigger: { type: "self" } });
      return;
  }
}

function getEnemyReferenceMode(reference: TriggerEnemyReferenceExpression) {
  if (reference.type === "enemy_in_slot") {
    return "enemy_in_slot";
  }
  if (reference.type === "enemy_from_group") {
    return "event_enemy_group_member";
  }
  if (reference.type === "current_enemy") return "current_enemy";
  return "event_enemy_target";
}

function setEnemyReferenceMode(reference: TriggerEnemyReferenceExpression, mode: string) {
  if (mode === "enemy_in_slot") {
    replaceEnemyRef(reference, { type: "enemy_in_slot", slotNumber: { type: "number_literal", value: 1 } });
    return;
  }
  if (mode === "event_enemy_group_member") {
    replaceEnemyRef(reference, { type: "enemy_from_group", alias: "event_enemy_group", index: { type: "number_literal", value: 1 } });
    return;
  }
  if (mode === "current_enemy") { replaceEnemyRef(reference, { type: "current_enemy" }); return; }
  replaceEnemyRef(reference, { type: "alias_enemy", alias: "event_enemy_target" });
}

function getEnemyReferenceSlotNumber(reference: TriggerEnemyReferenceExpression) {
  return reference.type === "enemy_in_slot" && reference.slotNumber.type === "number_literal" ? reference.slotNumber.value : 1;
}

function setEnemyReferenceSlotNumber(reference: TriggerEnemyReferenceExpression, value: number) {
  if (reference.type !== "enemy_in_slot") {
    return;
  }
  reference.slotNumber = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function getEnemyReferenceGroupIndex(reference: TriggerEnemyReferenceExpression) {
  return reference.type === "enemy_from_group" && reference.index.type === "number_literal" ? reference.index.value : 1;
}

function setEnemyReferenceGroupIndex(reference: TriggerEnemyReferenceExpression, value: number) {
  if (reference.type !== "enemy_from_group") {
    return;
  }
  reference.index = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function getOperatorReferenceMode(reference: TriggerOperatorReferenceExpression) {
  return reference.type === "controlled_operator" ? "controlled_operator" : reference.type === "current_operator" ? "current_operator" : "event_operator";
}

function setOperatorReferenceMode(reference: TriggerOperatorReferenceExpression, mode: string) {
  if (mode === "controlled_operator") {
    replaceOperatorRef(reference, { type: "controlled_operator" });
    return;
  }
  if (mode === "current_operator") { replaceOperatorRef(reference, { type: "current_operator" }); return; }
  replaceOperatorRef(reference, { type: "alias_operator", alias: "event_operator" });
}

function getTriggerControlMode(reference: TriggerControlReference) {
  return reference.type === "trigger_in_slot" ? "trigger_in_slot" : "self";
}

function setTriggerControlMode(reference: TriggerControlReference, mode: string) {
  if (mode === "trigger_in_slot") {
    replaceTriggerControlRef(reference, { type: "trigger_in_slot", slotNumber: { type: "number_literal", value: 1 } });
    return;
  }
  replaceTriggerControlRef(reference, { type: "self" });
}

function getTriggerControlSlotNumber(reference: TriggerControlReference) {
  return reference.type === "trigger_in_slot" && reference.slotNumber.type === "number_literal" ? reference.slotNumber.value : 1;
}

function setTriggerControlSlotNumber(reference: TriggerControlReference, value: number) {
  if (reference.type !== "trigger_in_slot") {
    return;
  }
  reference.slotNumber = { type: "number_literal", value: Math.max(1, Math.round(Number.isFinite(value) ? value : 1)) };
}

function getEnemyReferenceSlotSource(reference: TriggerEnemyReferenceExpression) {
  return reference.type === "enemy_in_slot" ? reference.slotNumber : null;
}
function getEnemyReferenceIndexSource(reference: TriggerEnemyReferenceExpression) {
  return reference.type === "enemy_from_group" ? reference.index : null;
}
function getTriggerControlSlotSource(reference: TriggerControlReference) {
  return reference.type === "trigger_in_slot" ? reference.slotNumber : null;
}

function getExpressionVariableType(expression: TriggerValueExpression) {
  return expression.type === "variable_ref" ? expression.variableType : "number";
}
function setExpressionVariableType(expression: TriggerValueExpression, variableType: "string" | "number" | "boolean") {
  if (expression.type !== "variable_ref") return;
  expression.variableType = variableType;
  expression.variableId = props.variables.find((entry) => entry.type === variableType)?.id ?? getDefaultTriggerVariableId(variableType);
}
function getExpressionVariableId(expression: TriggerValueExpression) {
  return expression.type === "variable_ref" ? expression.variableId : getDefaultTriggerVariableId("number");
}
function setExpressionVariableId(expression: TriggerValueExpression, variableId: string) {
  if (expression.type !== "variable_ref") return;
  expression.variableId = variableId;
  const variable = props.variables.find((entry) => entry.id === variableId);
  if (variable) {
    expression.variableType = variable.type;
  }
}
function getVariablesByType(type: "string" | "number" | "boolean") {
  return props.variables.filter((entry) => entry.type === type);
}

function getNumericSourceMode(source: TriggerNumericSource) {
  return source.type === "variable_ref" ? "variable" : "literal";
}
function setNumericSourceMode(source: TriggerNumericSource, mode: "literal" | "variable") {
  if (mode === "variable") {
    for (const key of Object.keys(source)) delete (source as Record<string, unknown>)[key];
    Object.assign(source, { type: "variable_ref", variableId: getDefaultTriggerVariableId("number"), variableType: "number" });
    return;
  }
  for (const key of Object.keys(source)) delete (source as Record<string, unknown>)[key];
  Object.assign(source, { type: "number_literal", value: 1 });
}
function getNumericSourceLiteralValue(source: TriggerNumericSource) {
  return source.type === "number_literal" ? source.value : 1;
}
function setNumericSourceLiteralValue(source: TriggerNumericSource, value: number) {
  if (source.type !== "number_literal") return;
  source.value = Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
}
function getNumericSourceVariableId(source: TriggerNumericSource) {
  return source.type === "variable_ref" ? source.variableId : getDefaultTriggerVariableId("number");
}
function setNumericSourceVariableId(source: TriggerNumericSource, variableId: string) {
  if (source.type !== "variable_ref") return;
  source.variableId = variableId;
  source.variableType = "number";
}

function getExpressionEnemyState(expression: TriggerValueExpression): TriggerEnemyLifecycleState {
  return expression.type === "enemy_state_count" || expression.type === "enemy_state"
    ? expression.state
    : "active";
}

function setExpressionEnemyState(expression: TriggerValueExpression, state: TriggerEnemyLifecycleState) {
  if (expression.type === "enemy_state_count" || expression.type === "enemy_state") {
    expression.state = state;
  }
}

function getExpressionNumberValue(expression: TriggerValueExpression) {
  return expression.type === "number_literal" ? expression.value : 0;
}

function setExpressionNumberValue(expression: TriggerValueExpression, value: number) {
  if (expression.type !== "number_literal") {
    return;
  }
  expression.value = Number.isFinite(value) ? value : 0;
}

function getExpressionBooleanValue(expression: TriggerValueExpression) {
  return expression.type === "boolean_literal" ? expression.value : true;
}

function setExpressionBooleanValue(expression: TriggerValueExpression, value: boolean) {
  if (expression.type !== "boolean_literal") {
    return;
  }
  expression.value = value;
}

function getExpressionStatusId(expression: TriggerValueExpression) {
  return expression.type === "status_id_literal" ? expression.statusId : "bladebreaking";
}

function setExpressionStatusId(expression: TriggerValueExpression, statusId: string) {
  if (expression.type !== "status_id_literal") {
    return;
  }
  expression.statusId = (CUSTOM_TRIGGER_STATUS_OPTIONS.find((entry) => entry.id === statusId)?.id ?? "bladebreaking");
}

function getExpressionEnemyId(expression: TriggerValueExpression) {
  return expression.type === "enemy_id_literal" ? expression.enemyId : (props.enemies[0]?.id ?? "rhodagn");
}

function setExpressionEnemyId(expression: TriggerValueExpression, enemyId: string) {
  if (expression.type !== "enemy_id_literal") {
    return;
  }
  expression.enemyId = enemyId;
}

function getExpressionEnemyRank(expression: TriggerValueExpression) {
  return expression.type === "enemy_rank_literal" ? expression.rank : "common";
}

function setExpressionEnemyRank(expression: TriggerValueExpression, rank: string) {
  if (expression.type !== "enemy_rank_literal") {
    return;
  }
  expression.rank = (CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS.find((entry) => entry.id === rank)?.id ?? "common");
}

function getExpressionContractVariantId(expression: TriggerValueExpression) {
  return expression.type === "contract_enabled" ? expression.variantId : (CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS[0]?.id ?? "");
}

function setExpressionContractVariantId(expression: TriggerValueExpression, variantId: string) {
  if (expression.type !== "contract_enabled") {
    return;
  }
  expression.variantId = variantId;
}

function getExpressionDamageType(expression: TriggerValueExpression) {
  return expression.type === "damage_type_literal" ? expression.damageType : "Physical";
}

function setExpressionDamageType(expression: TriggerValueExpression, damageType: string) {
  if (expression.type !== "damage_type_literal") {
    return;
  }
  expression.damageType = (CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS.find((entry) => entry.id === damageType)?.id ?? "Physical");
}

function getReferenceTargetMode(reference: TriggerStatusTargetExpression) {
  if (reference.type === "team") {
    return "team";
  }
  if (reference.type === "global") {
    return "global";
  }
  if (reference.type === "controlled_operator") {
    return "controlled_operator";
  }
  if (reference.type === "alias_operator") {
    return "event_operator";
  }
  if (reference.type === "current_operator") return "current_operator";
  if (reference.type === "current_enemy") return "current_enemy";
  if (reference.type === "enemy_in_slot") {
    return "enemy_in_slot";
  }
  if (reference.type === "enemy_from_group") {
    return "event_enemy_group_member";
  }
  return "event_enemy_target";
}

function setReferenceTargetMode(reference: TriggerStatusTargetExpression, mode: string) {
  if (mode === "team") {
    replaceStatusTarget(reference, { type: "team" });
    return;
  }
  if (mode === "global") {
    replaceStatusTarget(reference, { type: "global" });
    return;
  }
  if (mode === "controlled_operator") {
    replaceStatusTarget(reference, { type: "controlled_operator" });
    return;
  }
  if (mode === "event_operator") {
    replaceStatusTarget(reference, { type: "alias_operator", alias: "event_operator" });
    return;
  }
  if (mode === "current_operator") { replaceStatusTarget(reference, { type: "current_operator" }); return; }
  if (mode === "current_enemy") { replaceStatusTarget(reference, { type: "current_enemy" }); return; }
  if (mode === "enemy_in_slot") {
    replaceStatusTarget(reference, { type: "enemy_in_slot", slotNumber: { type: "number_literal", value: 1 } });
    return;
  }
  if (mode === "event_enemy_group_member") {
    replaceStatusTarget(reference, { type: "enemy_from_group", alias: "event_enemy_group", index: { type: "number_literal", value: 1 } });
    return;
  }
  replaceStatusTarget(reference, { type: "alias_enemy", alias: "event_enemy_target" });
}

function getExpressionLabel(expression: TriggerValueExpression) {
  switch (expression.type) {
    case "string_literal":
      return locale.value === "zh-CN" ? "字符串常量" : "String Literal";
    case "number_literal":
      return locale.value === "zh-CN" ? "数字常量" : "Number Literal";
    case "boolean_literal":
      return locale.value === "zh-CN" ? "布尔常量" : "Boolean Literal";
    case "variable_ref":
      return locale.value === "zh-CN" ? "变量引用" : "Variable Reference";
    case "status_id_literal":
      return locale.value === "zh-CN" ? "状态常量" : "Status Literal";
    case "event_status_id":
      return locale.value === "zh-CN" ? "事件状态ID" : "Event Status Id";
    case "event_status_duration":
      return locale.value === "zh-CN" ? "事件状态持续时间" : "Event Status Duration";
    case "event_damage_type":
      return locale.value === "zh-CN" ? "事件伤害类型" : "Event Damage Type";
    case "damage_type_literal":
      return locale.value === "zh-CN" ? "伤害类型常量" : "Damage Type Literal";
    case "enemy_id_literal":
      return locale.value === "zh-CN" ? "敌人身份常量" : "Enemy Identity Literal";
    case "enemy_identity":
      return locale.value === "zh-CN" ? "敌人身份" : "Enemy Identity";
    case "enemy_rank":
      return locale.value === "zh-CN" ? "敌人位阶" : "Enemy Rank";
    case "enemy_crowd_control_level":
      return locale.value === "zh-CN" ? "敌人控制等级" : "Enemy Crowd Control Level";
    case "enemy_rank_literal":
      return locale.value === "zh-CN" ? "敌人位阶常量" : "Enemy Rank Literal";
    case "operator_hp_ratio":
      return locale.value === "zh-CN" ? "干员生命比例" : "Operator HP Ratio";
    case "enemy_hp_ratio":
      return locale.value === "zh-CN" ? "敌人生命比例" : "Enemy HP Ratio";
    case "status_stack_count":
      return locale.value === "zh-CN" ? "状态层数" : "Status Stack Count";
    case "contract_enabled":
      return locale.value === "zh-CN" ? "合约已启用" : "Contract Enabled";
    case "enemy_state_count":
      return locale.value === "zh-CN" ? "指定状态敌人数" : "Enemy State Count";
    case "enemy_state":
      return locale.value === "zh-CN" ? "敌人状态" : "Enemy State";
    case "trigger_enabled":
      return locale.value === "zh-CN" ? "触发器启用状态" : "Trigger Enabled";
    default:
      return "";
  }
}
</script>

<template>
  <div class="rounded-xl border border-[#8d8d8d] bg-[#d7d7d7] p-3">
    <div class="mb-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">
          {{ locale === "zh-CN" ? "条件节点" : "Condition Node" }}
        </div>
        <select
          :value="node.kind"
          class="rounded-md border border-[#b7b7b7] bg-white px-2 py-1 text-xs text-[#1b1b1b]"
          @change="setNodeKind(($event.target as HTMLSelectElement).value as 'comparator' | 'logic')"
        >
          <option value="comparator">{{ locale === "zh-CN" ? "比较" : "Comparator" }}</option>
          <option value="logic">{{ locale === "zh-CN" ? "逻辑组" : "Logic Group" }}</option>
        </select>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
          @click="emit('moveUp')"
        >
          {{ locale === "zh-CN" ? "上移" : "Move Up" }}
        </button>
        <button
          type="button"
          class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
          @click="emit('moveDown')"
        >
          {{ locale === "zh-CN" ? "下移" : "Move Down" }}
        </button>
        <button
          type="button"
          class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
          @click="emit('duplicate')"
        >
          {{ locale === "zh-CN" ? "复制节点" : "Duplicate Node" }}
        </button>
        <button
          type="button"
          class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]"
          @click="emit('remove')"
        >
          {{ locale === "zh-CN" ? "删除节点" : "Remove Node" }}
        </button>
      </div>
    </div>

    <div v-if="isComparatorNode(node)" class="space-y-3">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]">
        <label class="block">
          <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "左值类型" : "Left Type" }}</div>
          <select
            :value="getExpressionType(node.left)"
            class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
            @change="setExpressionType(node.left, ($event.target as HTMLSelectElement).value as TriggerValueExpression['type'])"
          >
            <option v-for="type in ['string_literal','number_literal','boolean_literal','variable_ref','status_id_literal','event_status_id','event_status_duration','event_damage_type','damage_type_literal','enemy_id_literal','enemy_identity','enemy_rank','enemy_crowd_control_level','enemy_rank_literal','operator_hp_ratio','enemy_hp_ratio','status_stack_count','contract_enabled','enemy_state_count','enemy_state','trigger_enabled']" :key="type" :value="type">
              {{ getExpressionLabel({ type } as TriggerValueExpression) }}
            </option>
          </select>
        </label>
        <div class="hidden lg:block" />
        <label class="block">
          <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "右值类型" : "Right Type" }}</div>
          <select
            :value="getExpressionType(node.right)"
            class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]"
            @change="setExpressionType(node.right, ($event.target as HTMLSelectElement).value as TriggerValueExpression['type'])"
          >
            <option v-for="type in ['string_literal','number_literal','boolean_literal','variable_ref','status_id_literal','event_status_id','event_status_duration','event_damage_type','damage_type_literal','enemy_id_literal','enemy_identity','enemy_rank','enemy_crowd_control_level','enemy_rank_literal','operator_hp_ratio','enemy_hp_ratio','status_stack_count','contract_enabled','enemy_state_count','enemy_state','trigger_enabled']" :key="type" :value="type">
              {{ getExpressionLabel({ type } as TriggerValueExpression) }}
            </option>
          </select>
        </label>
      </div>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]">
        <div class="rounded-lg border border-[#b7b7b7] bg-[#ececec] p-3">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "左值" : "Left Value" }}</div>
          <template v-if="node.left.type === 'string_literal'">
            <input v-model="node.left.value" type="text" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm">
          </template>
          <template v-else-if="node.left.type === 'number_literal'">
            <input :value="getExpressionNumberValue(node.left)" type="number" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setExpressionNumberValue(node.left, Number(($event.target as HTMLInputElement).value))">
          </template>
          <template v-else-if="node.left.type === 'boolean_literal'">
            <select :value="String(getExpressionBooleanValue(node.left))" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionBooleanValue(node.left, ($event.target as HTMLSelectElement).value === 'true')">
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'variable_ref'">
            <select :value="getExpressionVariableType(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionVariableType(node.left, ($event.target as HTMLSelectElement).value as 'string' | 'number' | 'boolean')">
              <option value="string">String Variable</option>
              <option value="number">Number Variable</option>
              <option value="boolean">Boolean Variable</option>
            </select>
            <select :value="getExpressionVariableId(node.left)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionVariableId(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="variable in getVariablesByType(getExpressionVariableType(node.left))" :key="variable.id" :value="variable.id">
                {{ variable.name }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'status_id_literal'">
            <select :value="getExpressionStatusId(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionStatusId(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="status in CUSTOM_TRIGGER_STATUS_OPTIONS" :key="status.id" :value="status.id">
                {{ locale === 'zh-CN' ? status.label.zh : status.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'damage_type_literal'">
            <select :value="getExpressionDamageType(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionDamageType(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="damageType in CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS" :key="damageType.id" :value="damageType.id">
                {{ locale === 'zh-CN' ? damageType.label.zh : damageType.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'enemy_id_literal'">
            <select :value="getExpressionEnemyId(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyId(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="enemy in enemies" :key="enemy.id" :value="enemy.id">
                {{ getEnemyDisplayName(enemy.id, enemy.name, locale as 'en' | 'zh-CN') }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'enemy_identity' || node.left.type === 'enemy_rank' || node.left.type === 'enemy_crowd_control_level' || node.left.type === 'enemy_hp_ratio'">
            <select :value="getEnemyReferenceMode(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setEnemyReferenceMode(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy, ($event.target as HTMLSelectElement).value)">
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
              <option value="current_enemy">Current Enemy Slot</option>
            </select>
            <template v-if="getEnemyReferenceMode(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy) === 'enemy_in_slot'">
              <select v-if="getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" :value="getNumericSourceMode(getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy) && getNumericSourceMode(getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!) === 'literal'" :value="getEnemyReferenceSlotNumber(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" :value="getNumericSourceVariableId(getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(getEnemyReferenceSlotSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
            <template v-if="getEnemyReferenceMode(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy) === 'event_enemy_group_member'">
              <select v-if="getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" :value="getNumericSourceMode(getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy) && getNumericSourceMode(getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!) === 'literal'" :value="getEnemyReferenceGroupIndex(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceGroupIndex(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)" :value="getNumericSourceVariableId(getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(getEnemyReferenceIndexSource(node.left.type === 'enemy_hp_ratio' ? node.left.target : node.left.enemy)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
          </template>
          <template v-else-if="node.left.type === 'enemy_rank_literal'">
            <select :value="getExpressionEnemyRank(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyRank(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="rank in CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS" :key="rank.id" :value="rank.id">
                {{ locale === 'zh-CN' ? rank.label.zh : rank.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'status_stack_count'">
            <select :value="getReferenceTargetMode(node.left.target)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setReferenceTargetMode(node.left.target, ($event.target as HTMLSelectElement).value)">
              <option value="team">{{ locale === 'zh-CN' ? '队伍' : 'Team' }}</option>
              <option value="global">{{ locale === 'zh-CN' ? '全局' : 'Global' }}</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_operator')" value="event_operator">Event Operator</option>
              <option value="controlled_operator">Controlled Operator</option>
              <option value="current_operator">Current Operator Slot</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
              <option value="current_enemy">Current Enemy Slot</option>
            </select>
            <template v-if="getReferenceTargetMode(node.left.target) === 'enemy_in_slot' && node.left.target.type === 'enemy_in_slot'">
              <select :value="getNumericSourceMode(node.left.target.slotNumber)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(node.left.target.slotNumber, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getNumericSourceMode(node.left.target.slotNumber) === 'literal'" :value="getEnemyReferenceSlotNumber(node.left.target)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.left.target, Number(($event.target as HTMLInputElement).value))">
              <select v-else :value="getNumericSourceVariableId(node.left.target.slotNumber)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(node.left.target.slotNumber, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
            <template v-if="getReferenceTargetMode(node.left.target) === 'event_enemy_group_member' && node.left.target.type === 'enemy_from_group'">
              <select :value="getNumericSourceMode(node.left.target.index)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(node.left.target.index, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getNumericSourceMode(node.left.target.index) === 'literal'" :value="getEnemyReferenceGroupIndex(node.left.target)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceGroupIndex(node.left.target, Number(($event.target as HTMLInputElement).value))">
              <select v-else :value="getNumericSourceVariableId(node.left.target.index)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(node.left.target.index, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
            <select v-if="node.left.status.type === 'status_id_literal'" :value="getExpressionStatusId(node.left.status)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionStatusId(node.left.status, ($event.target as HTMLSelectElement).value)">
              <option v-for="status in CUSTOM_TRIGGER_STATUS_OPTIONS" :key="status.id" :value="status.id">
                {{ locale === 'zh-CN' ? status.label.zh : status.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'contract_enabled'">
            <select :value="getExpressionContractVariantId(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionContractVariantId(node.left, ($event.target as HTMLSelectElement).value)">
              <option v-for="contract in CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS" :key="contract.id" :value="contract.id">
                {{ locale === 'zh-CN' ? contract.label.zh : contract.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'enemy_state_count'">
            <select :value="getExpressionEnemyState(node.left)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyState(node.left, ($event.target as HTMLSelectElement).value as TriggerEnemyLifecycleState)">
              <option v-for="option in CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS" :key="option.id" :value="option.id">
                {{ locale === 'zh-CN' ? option.label.zh : option.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'enemy_state'">
            <select :value="getEnemyReferenceMode(node.left.enemy)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setEnemyReferenceMode(node.left.enemy, ($event.target as HTMLSelectElement).value)">
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
              <option value="current_enemy">Current Enemy Slot</option>
            </select>
            <input v-if="getEnemyReferenceMode(node.left.enemy) === 'enemy_in_slot'" :value="getEnemyReferenceSlotNumber(node.left.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.left.enemy, Number(($event.target as HTMLInputElement).value))">
            <select :value="getExpressionEnemyState(node.left)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyState(node.left, ($event.target as HTMLSelectElement).value as TriggerEnemyLifecycleState)">
              <option v-for="option in CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS" :key="option.id" :value="option.id">
                {{ locale === 'zh-CN' ? option.label.zh : option.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.left.type === 'trigger_enabled'">
            <select :value="getTriggerControlMode(node.left.trigger)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setTriggerControlMode(node.left.trigger, ($event.target as HTMLSelectElement).value)">
              <option value="self">This Trigger</option>
              <option value="trigger_in_slot">Trigger In Slot</option>
            </select>
            <template v-if="getTriggerControlMode(node.left.trigger) === 'trigger_in_slot'">
              <select v-if="getTriggerControlSlotSource(node.left.trigger)" :value="getNumericSourceMode(getTriggerControlSlotSource(node.left.trigger)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(getTriggerControlSlotSource(node.left.trigger)!, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getTriggerControlSlotSource(node.left.trigger) && getNumericSourceMode(getTriggerControlSlotSource(node.left.trigger)!) === 'literal'" :value="getTriggerControlSlotNumber(node.left.trigger)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setTriggerControlSlotNumber(node.left.trigger, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="getTriggerControlSlotSource(node.left.trigger)" :value="getNumericSourceVariableId(getTriggerControlSlotSource(node.left.trigger)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(getTriggerControlSlotSource(node.left.trigger)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
          </template>
          <template v-else-if="node.left.type === 'operator_hp_ratio'">
            <select :value="getOperatorReferenceMode(node.left.target)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setOperatorReferenceMode(node.left.target, ($event.target as HTMLSelectElement).value)">
              <option value="event_operator">Event Operator</option>
              <option value="controlled_operator">Controlled Operator</option>
              <option value="current_operator">Current Operator Slot</option>
            </select>
          </template>
        </div>

        <label class="block self-start">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "比较符" : "Comparator" }}</div>
          <select v-model="node.comparator" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]">
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
            <option value="gt">gt</option>
            <option value="gte">gte</option>
            <option value="lt">lt</option>
            <option value="lte">lte</option>
          </select>
        </label>

        <div class="rounded-lg border border-[#b7b7b7] bg-[#ececec] p-3">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "右值" : "Right Value" }}</div>
          <template v-if="node.right.type === 'string_literal'">
            <input v-model="node.right.value" type="text" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm">
          </template>
          <template v-else-if="node.right.type === 'number_literal'">
            <input :value="getExpressionNumberValue(node.right)" type="number" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setExpressionNumberValue(node.right, Number(($event.target as HTMLInputElement).value))">
          </template>
          <template v-else-if="node.right.type === 'boolean_literal'">
            <select :value="String(getExpressionBooleanValue(node.right))" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionBooleanValue(node.right, ($event.target as HTMLSelectElement).value === 'true')">
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'variable_ref'">
            <select :value="getExpressionVariableType(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionVariableType(node.right, ($event.target as HTMLSelectElement).value as 'string' | 'number' | 'boolean')">
              <option value="string">String Variable</option>
              <option value="number">Number Variable</option>
              <option value="boolean">Boolean Variable</option>
            </select>
            <select :value="getExpressionVariableId(node.right)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionVariableId(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="variable in getVariablesByType(getExpressionVariableType(node.right))" :key="variable.id" :value="variable.id">
                {{ variable.name }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'status_id_literal'">
            <select :value="getExpressionStatusId(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionStatusId(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="status in CUSTOM_TRIGGER_STATUS_OPTIONS" :key="status.id" :value="status.id">
                {{ locale === 'zh-CN' ? status.label.zh : status.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'damage_type_literal'">
            <select :value="getExpressionDamageType(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionDamageType(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="damageType in CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS" :key="damageType.id" :value="damageType.id">
                {{ locale === 'zh-CN' ? damageType.label.zh : damageType.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'enemy_id_literal'">
            <select :value="getExpressionEnemyId(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyId(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="enemy in enemies" :key="enemy.id" :value="enemy.id">
                {{ getEnemyDisplayName(enemy.id, enemy.name, locale as 'en' | 'zh-CN') }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'enemy_identity' || node.right.type === 'enemy_rank' || node.right.type === 'enemy_crowd_control_level' || node.right.type === 'enemy_hp_ratio'">
            <select :value="getEnemyReferenceMode(node.right.type === 'enemy_hp_ratio' ? node.right.target : node.right.enemy)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setEnemyReferenceMode(node.right.type === 'enemy_hp_ratio' ? node.right.target : node.right.enemy, ($event.target as HTMLSelectElement).value)">
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
              <option value="current_enemy">Current Enemy Slot</option>
            </select>
            <input v-if="getEnemyReferenceMode(node.right.type === 'enemy_hp_ratio' ? node.right.target : node.right.enemy) === 'enemy_in_slot'" :value="getEnemyReferenceSlotNumber(node.right.type === 'enemy_hp_ratio' ? node.right.target : node.right.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.right.type === 'enemy_hp_ratio' ? node.right.target : node.right.enemy, Number(($event.target as HTMLInputElement).value))">
          </template>
          <template v-else-if="node.right.type === 'enemy_rank_literal'">
            <select :value="getExpressionEnemyRank(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyRank(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="rank in CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS" :key="rank.id" :value="rank.id">
                {{ locale === 'zh-CN' ? rank.label.zh : rank.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'status_stack_count'">
            <select :value="getReferenceTargetMode(node.right.target)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setReferenceTargetMode(node.right.target, ($event.target as HTMLSelectElement).value)">
              <option value="team">{{ locale === 'zh-CN' ? '队伍' : 'Team' }}</option>
              <option value="global">{{ locale === 'zh-CN' ? '全局' : 'Global' }}</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_operator')" value="event_operator">Event Operator</option>
              <option value="controlled_operator">Controlled Operator</option>
              <option value="current_operator">Current Operator Slot</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
            </select>
            <template v-if="getReferenceTargetMode(node.right.target) === 'enemy_in_slot' && node.right.target.type === 'enemy_in_slot'">
              <select :value="getNumericSourceMode(node.right.target.slotNumber)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(node.right.target.slotNumber, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getNumericSourceMode(node.right.target.slotNumber) === 'literal'" :value="getEnemyReferenceSlotNumber(node.right.target)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.right.target, Number(($event.target as HTMLInputElement).value))">
              <select v-else :value="getNumericSourceVariableId(node.right.target.slotNumber)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(node.right.target.slotNumber, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
            <template v-if="getReferenceTargetMode(node.right.target) === 'event_enemy_group_member' && node.right.target.type === 'enemy_from_group'">
              <select :value="getNumericSourceMode(node.right.target.index)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(node.right.target.index, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getNumericSourceMode(node.right.target.index) === 'literal'" :value="getEnemyReferenceGroupIndex(node.right.target)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceGroupIndex(node.right.target, Number(($event.target as HTMLInputElement).value))">
              <select v-else :value="getNumericSourceVariableId(node.right.target.index)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(node.right.target.index, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
            <select v-if="node.right.status.type === 'status_id_literal'" :value="getExpressionStatusId(node.right.status)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionStatusId(node.right.status, ($event.target as HTMLSelectElement).value)">
              <option v-for="status in CUSTOM_TRIGGER_STATUS_OPTIONS" :key="status.id" :value="status.id">
                {{ locale === 'zh-CN' ? status.label.zh : status.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'contract_enabled'">
            <select :value="getExpressionContractVariantId(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionContractVariantId(node.right, ($event.target as HTMLSelectElement).value)">
              <option v-for="contract in CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS" :key="contract.id" :value="contract.id">
                {{ locale === 'zh-CN' ? contract.label.zh : contract.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'enemy_state_count'">
            <select :value="getExpressionEnemyState(node.right)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyState(node.right, ($event.target as HTMLSelectElement).value as TriggerEnemyLifecycleState)">
              <option v-for="option in CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS" :key="option.id" :value="option.id">
                {{ locale === 'zh-CN' ? option.label.zh : option.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'enemy_state'">
            <select :value="getEnemyReferenceMode(node.right.enemy)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setEnemyReferenceMode(node.right.enemy, ($event.target as HTMLSelectElement).value)">
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_target')" value="event_enemy_target">Event Enemy Target</option>
              <option v-if="triggerEventSupportsAlias(eventType, 'event_enemy_group')" value="event_enemy_group_member">Event Enemy Group Member</option>
              <option value="enemy_in_slot">Enemy In Slot</option>
            </select>
            <input v-if="getEnemyReferenceMode(node.right.enemy) === 'enemy_in_slot'" :value="getEnemyReferenceSlotNumber(node.right.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceSlotNumber(node.right.enemy, Number(($event.target as HTMLInputElement).value))">
            <input v-if="getEnemyReferenceMode(node.right.enemy) === 'event_enemy_group_member'" :value="getEnemyReferenceGroupIndex(node.right.enemy)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setEnemyReferenceGroupIndex(node.right.enemy, Number(($event.target as HTMLInputElement).value))">
            <select :value="getExpressionEnemyState(node.right)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setExpressionEnemyState(node.right, ($event.target as HTMLSelectElement).value as TriggerEnemyLifecycleState)">
              <option v-for="option in CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS" :key="option.id" :value="option.id">
                {{ locale === 'zh-CN' ? option.label.zh : option.label.en }}
              </option>
            </select>
          </template>
          <template v-else-if="node.right.type === 'trigger_enabled'">
            <select :value="getTriggerControlMode(node.right.trigger)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setTriggerControlMode(node.right.trigger, ($event.target as HTMLSelectElement).value)">
              <option value="self">This Trigger</option>
              <option value="trigger_in_slot">Trigger In Slot</option>
            </select>
            <template v-if="getTriggerControlMode(node.right.trigger) === 'trigger_in_slot'">
              <select v-if="getTriggerControlSlotSource(node.right.trigger)" :value="getNumericSourceMode(getTriggerControlSlotSource(node.right.trigger)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceMode(getTriggerControlSlotSource(node.right.trigger)!, ($event.target as HTMLSelectElement).value as 'literal' | 'variable')"><option value="literal">Literal</option><option value="variable">Variable</option></select>
              <input v-if="getTriggerControlSlotSource(node.right.trigger) && getNumericSourceMode(getTriggerControlSlotSource(node.right.trigger)!) === 'literal'" :value="getTriggerControlSlotNumber(node.right.trigger)" type="number" min="1" step="1" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @input="setTriggerControlSlotNumber(node.right.trigger, Number(($event.target as HTMLInputElement).value))">
              <select v-else-if="getTriggerControlSlotSource(node.right.trigger)" :value="getNumericSourceVariableId(getTriggerControlSlotSource(node.right.trigger)!)" class="mt-2 w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setNumericSourceVariableId(getTriggerControlSlotSource(node.right.trigger)!, ($event.target as HTMLSelectElement).value)"><option v-for="variable in getVariablesByType('number')" :key="variable.id" :value="variable.id">{{ variable.name }}</option></select>
            </template>
          </template>
          <template v-else-if="node.right.type === 'operator_hp_ratio'">
            <select :value="getOperatorReferenceMode(node.right.target)" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm" @change="setOperatorReferenceMode(node.right.target, ($event.target as HTMLSelectElement).value)">
              <option value="event_operator">Event Operator</option>
              <option value="controlled_operator">Controlled Operator</option>
            </select>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <label class="block">
        <div class="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#666]">{{ locale === "zh-CN" ? "逻辑运算" : "Logic Operator" }}</div>
        <select v-model="node.operator" class="w-full rounded-lg border border-[#b7b7b7] bg-white px-3 py-2 text-sm text-[#1b1b1b]">
          <option v-for="option in CUSTOM_TRIGGER_LOGIC_OPERATOR_OPTIONS" :key="option.id" :value="option.id">
            {{ locale === 'zh-CN' ? option.label.zh : option.label.en }}
          </option>
        </select>
      </label>

      <div class="space-y-3">
        <TriggerConditionNodeEditor
          v-for="(child, index) in node.conditions"
          :key="child.id"
          :node="child"
          :event-type="eventType"
          :enemies="enemies"
          :variables="variables"
          @remove="removeChild(index)"
          @duplicate="duplicateChild(index)"
          @move-up="moveChild(index, -1)"
          @move-down="moveChild(index, 1)"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" @click="addComparatorChild">
          {{ locale === "zh-CN" ? "添加比较条件" : "Add Comparator" }}
        </button>
        <button type="button" class="rounded-md border border-[#d4d4d4] bg-white px-2 py-1 text-[11px] text-[#444] transition hover:bg-[#efefef]" @click="addLogicChild">
          {{ locale === "zh-CN" ? "添加逻辑组" : "Add Logic Group" }}
        </button>
      </div>
    </div>
  </div>
</template>

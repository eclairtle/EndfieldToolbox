import type { RotationCombatEvent } from "@/lib/combat/rotation";
import type { AttackType, EnemyTargeting } from "@/lib/commands";
import type { ElementType } from "@/data/characters";
import type { EnemyRank } from "@/data/enemies/ranks";
import { COMBAT_STATUS_DEFINITIONS, TRIGGER_SUPPORTED_STATUS_IDS, type SupportedCombatStatusId } from "@/lib/combat/statusRegistry";
import { MODIFIER_STAT_KEYS, type ModifierStatKey } from "@/lib/build/stats";
import { CONTINGENCY_CONTRACTS } from "@/lib/combat/contracts";

export type CustomTriggerEventType =
  | "NO_EVENT"
  | "STAGE_BEGIN"
  | "ROTATION_RELAYED"
  | "ENEMY_SPAWNED"
  | "ENEMY_REPLACED"
  | "ENEMY_TRANSFORMED"
  | "COMBAT_INITIALIZED"
  | "SKILL_CAST"
  | "ULTIMATE_CAST"
  | "BATTLE_SKILL_CAST"
  | "COMBO_SKILL_CAST"
  | "FINAL_STRIKE_HIT"
  | "FINISHER_HIT"
  | "BASIC_ATTACK_HIT"
  | "BATTLE_SKILL_HIT"
  | "COMBO_SKILL_HIT"
  | "ULTIMATE_HIT"
  | "STATUS_APPLIED"
  | "REACTION_TRIGGERED"
  | "ENEMY_DEFEATED";

export type TriggerAliasType =
  | "event_operator"
  | "event_operator_group"
  | "event_enemy_target"
  | "event_enemy_group"
  | "event_source_command"
  | "event_source_hit"
  | "event_time"
  | "event_game_time";

export type CustomTriggerActionType =
  | "APPLY_STATUS"
  | "REMOVE_STATUS"
  | "REPLACE_ENEMY"
  | "MODIFY_HP"
  | "MODIFY_VARIABLE"
  | "SET_TARGET_ENEMY"
  | "EXECUTE_HIT"
  | "WAIT"
  | "COUNTDOWN"
  | "RELAY_ROTATION"
  | "SET_TRIGGER_ENABLED"
  | "STOP_TRIGGER"
  | "BREAK"
  | "IF_THEN_ELSE"
  | "FOR_EACH_ENEMY"
  | "FOR_EACH_OPERATOR"
  | "FIRE_TRIGGER";
export type TriggerComparator = "equals" | "not_equals" | "gt" | "gte" | "lt" | "lte";
export type TriggerHpOperation = "damage" | "heal";
export type TriggerEnableOperation = "enable" | "disable";
export type TriggerEnemyLifecycleState = "not_spawned" | "active" | "dead";
export type TriggerVariableType = "string" | "number" | "boolean";
export type TriggerVariableModifyOperation = "set" | "add" | "subtract";

export type TriggerOutputType =
  | "operator_ref"
  | "enemy_ref"
  | "enemy_identity"
  | "enemy_rank"
  | "damage_type"
  | "string"
  | "number"
  | "boolean"
  | "status_id";

export type TriggerNumericSource =
  | { type: "number_literal"; value: number }
  | { type: "variable_ref"; variableId: string; variableType: TriggerVariableType };

export type TriggerVariableDefinition = {
  id: string;
  name: string;
  type: TriggerVariableType;
  initialValue:
    | { type: "string_literal"; value: string }
    | { type: "number_literal"; value: number }
    | { type: "boolean_literal"; value: boolean };
};

export type TriggerOperatorReferenceExpression =
  | { type: "alias_operator"; alias: "event_operator" }
  | { type: "controlled_operator" }
  | { type: "current_operator" };

export type TriggerEnemyReferenceExpression =
  | { type: "alias_enemy"; alias: "event_enemy_target" }
  | { type: "enemy_in_slot"; slotNumber: TriggerNumericSource }
  | { type: "enemy_from_group"; alias: "event_enemy_group"; index: TriggerNumericSource }
  | { type: "current_enemy" };

export type TriggerReferenceExpression =
  | TriggerOperatorReferenceExpression
  | TriggerEnemyReferenceExpression;

export type TriggerStatusTargetExpression =
  | TriggerReferenceExpression
  | { type: "team" }
  | { type: "global" };

export type TriggerControlReference =
  | { type: "self" }
  | { type: "trigger_in_slot"; slotNumber: TriggerNumericSource };

export type TriggerValueExpression =
  | { type: "string_literal"; value: string }
  | { type: "number_literal"; value: number }
  | { type: "boolean_literal"; value: boolean }
  | { type: "variable_ref"; variableId: string; variableType: TriggerVariableType }
  | { type: "status_id_literal"; statusId: SupportedStatusId }
  | { type: "event_status_id" }
  | { type: "event_status_duration" }
  | { type: "event_damage_type" }
  | { type: "damage_type_literal"; damageType: Exclude<ElementType, "Healing"> }
  | { type: "enemy_id_literal"; enemyId: string }
  | { type: "enemy_identity"; enemy: TriggerEnemyReferenceExpression }
  | { type: "enemy_rank"; enemy: TriggerEnemyReferenceExpression }
  | { type: "enemy_crowd_control_level"; enemy: TriggerEnemyReferenceExpression }
  | { type: "enemy_rank_literal"; rank: EnemyRank }
  | { type: "operator_hp_ratio"; target: TriggerOperatorReferenceExpression }
  | { type: "enemy_hp_ratio"; target: TriggerEnemyReferenceExpression }
  | { type: "status_stack_count"; target: TriggerStatusTargetExpression; status: TriggerValueExpression }
  | { type: "contract_enabled"; variantId: string }
  | { type: "enemy_state_count"; state: TriggerEnemyLifecycleState }
  | { type: "enemy_state"; enemy: TriggerEnemyReferenceExpression; state: TriggerEnemyLifecycleState }
  | { type: "trigger_enabled"; trigger: TriggerControlReference };

export type TriggerLogicOperator = "AND" | "OR" | "XOR";
export type TriggerStatusStackingRule = "default" | "additive" | "replace";
export type TriggerStatusBasicStatKey = "ATK" | "HP";
export type TriggerStatusStatEntry = {
  statKind: "modifier" | "basic";
  statKey: ModifierStatKey | TriggerStatusBasicStatKey;
  value: TriggerValueExpression;
};

export type TriggerComparatorCondition = {
  kind: "comparator";
  id: string;
  left: TriggerValueExpression;
  comparator: TriggerComparator;
  right: TriggerValueExpression;
};

export type TriggerLogicCondition = {
  kind: "logic";
  id: string;
  operator: TriggerLogicOperator;
  conditions: TriggerConditionNode[];
};

export type TriggerConditionNode = TriggerComparatorCondition | TriggerLogicCondition;

export type TriggerAction =
  | {
      type: "APPLY_STATUS";
      status: TriggerValueExpression;
      target: TriggerStatusTargetExpression;
      durationSeconds: TriggerValueExpression;
      stacks: TriggerValueExpression;
      useDefault?: boolean;
      maxStacks?: TriggerValueExpression;
      permanent?: boolean;
      hidden?: boolean;
      stackingRule?: TriggerStatusStackingRule;
      refreshExistingStacks?: boolean;
      independentStacks?: boolean;
      statEntries?: TriggerStatusStatEntry[];
    }
  | {
      type: "REMOVE_STATUS";
      status: TriggerValueExpression;
      target: TriggerStatusTargetExpression;
    }
  | {
      type: "REPLACE_ENEMY";
      target: TriggerEnemyReferenceExpression;
      enemyId: TriggerValueExpression;
      resetHp: TriggerValueExpression;
      level: TriggerValueExpression;
      noDeath: TriggerValueExpression;
    }
  | {
      type: "MODIFY_HP";
      target: TriggerReferenceExpression;
      operation: TriggerHpOperation;
      amount: TriggerValueExpression;
    }
  | {
      type: "MODIFY_VARIABLE";
      variableId: string;
      variableType: TriggerVariableType;
      operation: TriggerVariableModifyOperation;
      value: TriggerValueExpression;
    }
  | {
      type: "SET_TARGET_ENEMY";
      target: TriggerEnemyReferenceExpression;
    }
  | {
      type: "EXECUTE_HIT";
      source: TriggerOperatorReferenceExpression;
      target: TriggerEnemyReferenceExpression;
      attackType: AttackType;
      damageType: Exclude<ElementType, "Healing">;
      targets: EnemyTargeting;
      hitName: string;
      multiplier: TriggerValueExpression;
      flatAmount: TriggerValueExpression;
      stagger: TriggerValueExpression;
      noCrit?: boolean;
      ignoreEnemyInvulnerability?: boolean;
    }
  | {
      type: "WAIT";
      durationSeconds: TriggerValueExpression;
    }
  | {
      type: "COUNTDOWN";
      durationSeconds: TriggerValueExpression;
    }
  | {
      type: "RELAY_ROTATION";
    }
  | {
      type: "SET_TRIGGER_ENABLED";
      target: TriggerControlReference;
      operation: TriggerEnableOperation;
    }
  | {
      type: "STOP_TRIGGER";
      target: TriggerControlReference;
    }
  | {
      type: "BREAK";
    }
  | {
      type: "IF_THEN_ELSE";
      ifCondition: TriggerConditionNode;
      thenActions: TriggerAction[];
      elseActions: TriggerAction[];
    }
  | { type: "FOR_EACH_ENEMY"; state: TriggerEnemyLifecycleState | "any"; actions: TriggerAction[] }
  | { type: "FOR_EACH_OPERATOR"; actions: TriggerAction[] }
  | {
      type: "FIRE_TRIGGER";
      target: TriggerControlReference;
      checkEnabled: TriggerValueExpression;
      checkCondition: TriggerValueExpression;
    };

export type CustomCombatTrigger = {
  id: string;
  name: string;
  enabled?: boolean;
  event: {
    type: CustomTriggerEventType;
  };
  conditions: TriggerConditionNode[];
  actions: TriggerAction[];
};

export const DEFAULT_TRIGGER_VARIABLE_IDS = {
  string: "__default_trigger_var_string__",
  number: "__default_trigger_var_number__",
  boolean: "__default_trigger_var_boolean__",
} as const;

export type TriggerPresetOption<T extends string> = {
  id: T;
  label: {
    en: string;
    zh: string;
  };
  description?: {
    en: string;
    zh: string;
  };
};

export const CUSTOM_TRIGGER_STATUS_STACKING_RULE_OPTIONS: TriggerPresetOption<TriggerStatusStackingRule>[] = [
  { id: "default", label: { en: "Default", zh: "默认" } },
  { id: "additive", label: { en: "Additive", zh: "叠加" } },
  { id: "replace", label: { en: "Replace", zh: "覆盖" } },
];

export const CUSTOM_TRIGGER_STATUS_BASIC_STAT_OPTIONS: TriggerPresetOption<TriggerStatusBasicStatKey>[] = [
  { id: "ATK", label: { en: "ATK", zh: "攻击力" } },
  { id: "HP", label: { en: "HP", zh: "生命值" } },
];

export const CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS: TriggerPresetOption<EnemyRank>[] = [
  { id: "common", label: { en: "Common", zh: "普通" } },
  { id: "advanced", label: { en: "Advanced", zh: "高级" } },
  { id: "elite", label: { en: "Elite", zh: "精英" } },
  { id: "alpha", label: { en: "Alpha", zh: "Alpha" } },
  { id: "boss", label: { en: "Boss", zh: "首领" } },
];

export type TriggerEventOption = TriggerPresetOption<CustomTriggerEventType> & {
  availableAliases: TriggerAliasType[];
};

export const CUSTOM_TRIGGER_LOGIC_OPERATOR_OPTIONS: TriggerPresetOption<TriggerLogicOperator>[] = [
  { id: "AND", label: { en: "AND", zh: "且" } },
  { id: "OR", label: { en: "OR", zh: "或" } },
  { id: "XOR", label: { en: "XOR", zh: "异或" } },
];

export const CUSTOM_TRIGGER_EVENT_OPTIONS: TriggerEventOption[] = [
  {
    id: "NO_EVENT",
    label: { en: "No Event", zh: "无事件" },
    description: { en: "Does not listen to combat events and can only be run by another trigger.", zh: "不监听战斗事件，只能被其他触发器主动触发。" },
    availableAliases: [],
  },
  {
    id: "STAGE_BEGIN",
    label: { en: "Stage Begin", zh: "关卡开始" },
    description: { en: "Runs once when cumulative real time reaches 0 seconds.", zh: "在累计现实时间到达 0 秒时仅触发一次。" },
    availableAliases: ["event_time", "event_game_time"],
  },
  {
    id: "ROTATION_RELAYED",
    label: { en: "Rotation Relayed", zh: "轮次接力开始" },
    description: { en: "Runs when a relayed rotation starts from an inherited relay point.", zh: "在接力轮次从继承的接力点开始时触发。" },
    availableAliases: ["event_time", "event_game_time"],
  },
  {
    id: "ENEMY_SPAWNED",
    label: { en: "Enemy Spawned", zh: "敌人生成" },
    description: { en: "Runs when an enemy slot becomes active from a non-present state.", zh: "在敌人槽位从未登场/已死亡状态变为活动状态时触发。" },
    availableAliases: ["event_enemy_target", "event_enemy_group", "event_time", "event_game_time"],
  },
  {
    id: "ENEMY_REPLACED",
    label: { en: "Enemy Replaced", zh: "敌人替换" },
    description: { en: "Runs when an active enemy is replaced by another active enemy in the same slot.", zh: "在一个活动敌人被同槽位的另一名活动敌人替换时触发。" },
    availableAliases: ["event_enemy_target", "event_enemy_group", "event_time", "event_game_time"],
  },
  {
    id: "ENEMY_TRANSFORMED",
    label: { en: "Enemy Transformed", zh: "敌人转变" },
    description: { en: "Runs when an active enemy transforms into another identity in the same slot.", zh: "在一个活动敌人在同槽位内转变为另一身份时触发。" },
    availableAliases: ["event_enemy_target", "event_enemy_group", "event_time", "event_game_time"],
  },
  {
    id: "COMBAT_INITIALIZED",
    label: { en: "Combat Initialized", zh: "战斗初始化" },
    description: {
      en: "Runs when combat initialization effects are applied at battle start or combat reinitialization.",
      zh: "在战斗开始或战斗重初始化时，战斗初始化效果生效后触发。",
    },
    availableAliases: ["event_operator", "event_operator_group", "event_time", "event_game_time"],
  },
  {
    id: "SKILL_CAST",
    label: { en: "Skill Cast", zh: "技能释放" },
    description: { en: "Runs when an operator casts a battle skill, combo skill, or ultimate.", zh: "在干员释放战技、连携技或终结技时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_source_command", "event_time", "event_game_time"],
  },
  {
    id: "ULTIMATE_CAST",
    label: { en: "Ultimate Cast", zh: "终结技释放" },
    description: { en: "Runs when an operator casts ultimate.", zh: "在干员释放终结技时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_source_command", "event_time", "event_game_time"],
  },
  {
    id: "BATTLE_SKILL_CAST",
    label: { en: "Battle Skill Cast", zh: "战技释放" },
    description: { en: "Runs when an operator casts battle skill.", zh: "在干员释放战技时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_source_command", "event_time", "event_game_time"],
  },
  {
    id: "COMBO_SKILL_CAST",
    label: { en: "Combo Skill Cast", zh: "连携技释放" },
    description: { en: "Runs when an operator casts combo skill.", zh: "在干员释放连携技时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_source_command", "event_time", "event_game_time"],
  },
  {
    id: "FINAL_STRIKE_HIT",
    label: { en: "Final Strike Hit", zh: "重击命中" },
    description: { en: "Runs when the controlled operator's final strike resolves.", zh: "在主控干员的重击命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "FINISHER_HIT",
    label: { en: "Finisher Hit", zh: "处决命中" },
    description: { en: "Runs when a finisher hit resolves.", zh: "在处决命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "BASIC_ATTACK_HIT",
    label: { en: "Basic Attack Hit", zh: "普攻命中" },
    description: { en: "Runs when a basic attack hit resolves.", zh: "在普攻命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "BATTLE_SKILL_HIT",
    label: { en: "Battle Skill Hit", zh: "战技命中" },
    description: { en: "Runs when a battle skill hit resolves.", zh: "在战技命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "COMBO_SKILL_HIT",
    label: { en: "Combo Skill Hit", zh: "连携技命中" },
    description: { en: "Runs when a combo skill hit resolves.", zh: "在连携技命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "ULTIMATE_HIT",
    label: { en: "Ultimate Hit", zh: "终结技命中" },
    description: { en: "Runs when an ultimate hit resolves.", zh: "在终结技命中结算时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "STATUS_APPLIED",
    label: { en: "Status Applied", zh: "状态施加" },
    description: { en: "Runs when a buff, debuff, or status is applied.", zh: "在施加增益、减益或状态时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_time", "event_game_time"],
  },
  {
    id: "REACTION_TRIGGERED",
    label: { en: "Reaction Triggered", zh: "反应触发" },
    description: { en: "Runs when a reaction is triggered.", zh: "在反应触发时运行。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
  {
    id: "ENEMY_DEFEATED",
    label: { en: "Enemy Defeated", zh: "敌人被击败" },
    description: { en: "Runs when an enemy is defeated.", zh: "在敌人被击败时触发。" },
    availableAliases: ["event_operator", "event_operator_group", "event_enemy_target", "event_enemy_group", "event_source_command", "event_source_hit", "event_time", "event_game_time"],
  },
];

export const CUSTOM_TRIGGER_ACTION_OPTIONS: TriggerPresetOption<CustomTriggerActionType>[] = [
  {
    id: "APPLY_STATUS",
    label: { en: "Apply Status", zh: "施加状态" },
    description: { en: "Applies a selected status to a selected target.", zh: "将所选状态施加给所选目标。" },
  },
  {
    id: "REMOVE_STATUS",
    label: { en: "Remove Status", zh: "移除状态" },
    description: { en: "Removes a selected status from a selected target.", zh: "从所选目标上移除所选状态。" },
  },
  {
    id: "REPLACE_ENEMY",
    label: { en: "Replace Enemy", zh: "替换敌人" },
    description: { en: "Replaces one enemy slot with another enemy identity.", zh: "将一个敌人槽位替换为另一名敌人的身份。" },
  },
  {
    id: "MODIFY_HP",
    label: { en: "Modify HP", zh: "修改生命值" },
    description: { en: "Deals damage or restores HP to an operator or enemy target.", zh: "对干员或敌人目标造成伤害或恢复生命值。" },
  },
  {
    id: "MODIFY_VARIABLE",
    label: { en: "Modify Variable", zh: "修改变量" },
    description: { en: "Updates a trigger variable with a set/add/subtract style operation.", zh: "通过设定/加减等操作更新一个触发器变量。" },
  },
  {
    id: "SET_TARGET_ENEMY",
    label: { en: "Set Target Enemy", zh: "设为目标敌人" },
    description: { en: "Changes the rotation's current target enemy.", zh: "更改当前排轴的目标敌人。" },
  },
  {
    id: "EXECUTE_HIT",
    label: { en: "Execute Hit", zh: "执行伤害段" },
    description: { en: "Executes a custom hit through the normal simulator damage pipeline.", zh: "通过常规模拟器伤害流程执行一个自定义伤害段。" },
  },
  {
    id: "WAIT",
    label: { en: "Wait", zh: "等待" },
    description: { en: "Pauses the trigger and resumes later.", zh: "暂停当前触发器，并在稍后继续执行。" },
  },
  {
    id: "COUNTDOWN",
    label: { en: "Countdown", zh: "倒计时" },
    description: { en: "Pauses the trigger and resumes later while showing numbered countdown markers on the rotation timeline.", zh: "暂停当前触发器，并在排轴时间线上显示带数字的倒计时标记。" },
  },
  {
    id: "RELAY_ROTATION",
    label: { en: "Relay Rotation", zh: "接力到下一轮" },
    description: { en: "Marks the current time as a relay handoff point for the next rotation.", zh: "将当前时间标记为下一轮排轴的接力交接点。" },
  },
  {
    id: "SET_TRIGGER_ENABLED",
    label: { en: "Enable/Disable Trigger", zh: "启用/禁用触发器" },
    description: { en: "Changes whether a trigger listens to combat events from this point onward.", zh: "更改某个触发器从此时起是否继续监听战斗事件。" },
  },
  {
    id: "STOP_TRIGGER",
    label: { en: "Stop Trigger", zh: "停止触发器" },
    description: { en: "Stops all currently running instances of a trigger.", zh: "停止某个触发器当前正在运行的全部实例。" },
  },
  {
    id: "BREAK",
    label: { en: "Break", zh: "中断当前实例" },
    description: { en: "Stops only the current running trigger instance.", zh: "只停止当前正在执行的这个触发器实例。" },
  },
  {
    id: "IF_THEN_ELSE",
    label: { en: "If / Then / Else", zh: "如果 / 则 / 否则" },
    description: { en: "Checks a nested condition at runtime, then runs either the then-list or else-list.", zh: "在动作执行时检查嵌套条件，并执行 then 或 else 动作列表。" },
  },
  { id: "FOR_EACH_ENEMY", label: { en: "For Each Enemy", zh: "遍历敌人" }, description: { en: "Runs nested actions once for each enemy matching a lifecycle state.", zh: "对符合生命周期状态的每个敌人执行嵌套动作。" } },
  { id: "FOR_EACH_OPERATOR", label: { en: "For Each Operator", zh: "遍历干员" }, description: { en: "Runs nested actions once for each party operator.", zh: "对队伍中的每名干员执行嵌套动作。" } },
  {
    id: "FIRE_TRIGGER",
    label: { en: "Fire Trigger", zh: "触发指定触发器" },
    description: { en: "Runs another trigger immediately, optionally ignoring its enabled state or conditions.", zh: "立刻运行另一个触发器，并可选择忽略其启用状态或条件。" },
  },
];

export const CUSTOM_TRIGGER_ENEMY_STATE_OPTIONS: TriggerPresetOption<TriggerEnemyLifecycleState>[] = [
  { id: "not_spawned", label: { en: "Not Spawned", zh: "未出现" } },
  { id: "active", label: { en: "Active", zh: "存活中" } },
  { id: "dead", label: { en: "Dead", zh: "已死亡" } },
];

export function getDefaultTriggerVariables(): TriggerVariableDefinition[] {
  return [
    {
      id: DEFAULT_TRIGGER_VARIABLE_IDS.string,
      name: "Default String",
      type: "string",
      initialValue: { type: "string_literal", value: "" },
    },
    {
      id: DEFAULT_TRIGGER_VARIABLE_IDS.number,
      name: "Default Number",
      type: "number",
      initialValue: { type: "number_literal", value: 0 },
    },
    {
      id: DEFAULT_TRIGGER_VARIABLE_IDS.boolean,
      name: "Default Boolean",
      type: "boolean",
      initialValue: { type: "boolean_literal", value: false },
    },
  ];
}

export function getDefaultTriggerVariableId(type: TriggerVariableType): string {
  return DEFAULT_TRIGGER_VARIABLE_IDS[type];
}

export const CUSTOM_TRIGGER_TARGET_OPTIONS: TriggerPresetOption<
  "event_operator" | "controlled_operator" | "current_operator" | "event_enemy_target" | "event_enemy_group_member" | "enemy_in_slot" | "current_enemy" | "team" | "global"
>[] = [
  {
    id: "event_operator",
    label: { en: "Event Operator", zh: "事件干员" },
    description: { en: "Uses the operator from the triggering event.", zh: "使用触发事件中的干员。" },
  },
  {
    id: "controlled_operator",
    label: { en: "Controlled Operator", zh: "当前主控干员" },
    description: { en: "Uses the currently controlled operator.", zh: "使用当前主控干员。" },
  },
  { id: "current_operator", label: { en: "Current Operator Slot", zh: "当前遍历干员槽位" }, description: { en: "Uses the operator in the current operator iterator.", zh: "使用当前干员迭代器中的干员。" } },
  {
    id: "event_enemy_target",
    label: { en: "Event Enemy Target", zh: "事件敌方目标" },
    description: { en: "Uses the primary enemy from the triggering event.", zh: "使用触发事件的主要敌方目标。" },
  },
  {
    id: "event_enemy_group_member",
    label: { en: "Event Enemy Group Member", zh: "事件敌人组成员" },
    description: { en: "Uses one enemy from the triggering event's affected enemy group.", zh: "使用触发事件所影响敌人组中的一个敌人。" },
  },
  {
    id: "enemy_in_slot",
    label: { en: "Enemy In Slot", zh: "槽位敌人" },
    description: { en: "Uses the enemy in a specific enemy slot.", zh: "使用指定敌人槽位中的敌人。" },
  },
  { id: "current_enemy", label: { en: "Current Enemy Slot", zh: "当前遍历敌人槽位" }, description: { en: "Uses the enemy slot in the current enemy iterator.", zh: "使用当前敌人迭代器中的敌人槽位。" } },
  {
    id: "team",
    label: { en: "Team", zh: "队伍" },
    description: { en: "Uses the team status layer.", zh: "使用队伍状态层。" },
  },
  {
    id: "global",
    label: { en: "Global", zh: "全局" },
    description: { en: "Uses the global or field status layer.", zh: "使用全局或场地状态层。" },
  },
];

export const CUSTOM_TRIGGER_CONTRACT_VARIANT_OPTIONS = CONTINGENCY_CONTRACTS.flatMap((contract) =>
  contract.variants.map((variant) => ({
    id: variant.id,
    label: {
      en: variant.name,
      zh: variant.zhName ?? variant.name,
    },
  })),
);

export const CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS: Array<{
  id: Exclude<ElementType, "Healing">;
  label: { en: string; zh: string };
}> = [
  { id: "Physical", label: { en: "Physical", zh: "物理" } },
  { id: "Heat", label: { en: "Heat", zh: "灼热" } },
  { id: "Cryo", label: { en: "Cryo", zh: "寒冷" } },
  { id: "Electric", label: { en: "Electric", zh: "电磁" } },
  { id: "Nature", label: { en: "Nature", zh: "自然" } },
  { id: "Aether", label: { en: "Aether", zh: "以太" } },
];

export const CUSTOM_TRIGGER_STATUS_OPTIONS = TRIGGER_SUPPORTED_STATUS_IDS.map((id) => ({
  id,
  label: COMBAT_STATUS_DEFINITIONS[id].label,
})) as ReadonlyArray<{
  id: SupportedCombatStatusId;
  label: { en: string; zh: string };
}>;

export type SupportedStatusId = SupportedCombatStatusId;
export const MAX_CUSTOM_TRIGGERS = 32;

function normalizeNonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.round(value));
}

function isCustomTriggerEventType(value: unknown): value is CustomTriggerEventType {
  return CUSTOM_TRIGGER_EVENT_OPTIONS.some((option) => option.id === value);
}

function isSupportedStatusId(value: unknown): value is SupportedStatusId {
  return CUSTOM_TRIGGER_STATUS_OPTIONS.some((option) => option.id === value);
}

function isTriggerStatusStackingRule(value: unknown): value is TriggerStatusStackingRule {
  return value === "default" || value === "additive" || value === "replace";
}

function isModifierStatKey(value: unknown): value is ModifierStatKey {
  return typeof value === "string" && MODIFIER_STAT_KEYS.includes(value as ModifierStatKey);
}

function isTriggerStatusBasicStatKey(value: unknown): value is TriggerStatusBasicStatKey {
  return value === "ATK" || value === "HP";
}

function normalizeTriggerStatusStatEntry(value: unknown): TriggerStatusStatEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  const resolvedValue = normalizeTriggerValueExpression(typed.value);
  if (!resolvedValue) {
    return null;
  }
  if (typed.statKind === "basic" && isTriggerStatusBasicStatKey(typed.statKey)) {
    return {
      statKind: "basic",
      statKey: typed.statKey,
      value: resolvedValue,
    };
  }
  if (typed.statKind === "modifier" && isModifierStatKey(typed.statKey)) {
    return {
      statKind: "modifier",
      statKey: typed.statKey,
      value: resolvedValue,
    };
  }
  return null;
}

function isTriggerComparator(value: unknown): value is TriggerComparator {
  return ["equals", "not_equals", "gt", "gte", "lt", "lte"].includes(String(value));
}

function isTriggerLogicOperator(value: unknown): value is TriggerLogicOperator {
  return ["AND", "OR", "XOR"].includes(String(value));
}

function isTriggerHpOperation(value: unknown): value is TriggerHpOperation {
  return value === "damage" || value === "heal";
}

function isTriggerEnableOperation(value: unknown): value is TriggerEnableOperation {
  return value === "enable" || value === "disable";
}

function isTriggerEnemyLifecycleState(value: unknown): value is TriggerEnemyLifecycleState {
  return value === "not_spawned" || value === "active" || value === "dead";
}

function isTriggerValueExpression(value: unknown): value is TriggerValueExpression {
  if (!value || typeof value !== "object") {
    return false;
  }
  const typed = value as Record<string, unknown>;
  switch (typed.type) {
    case "string_literal":
      return typeof typed.value === "string";
    case "number_literal":
      return typeof typed.value === "number" && Number.isFinite(typed.value);
    case "boolean_literal":
      return typeof typed.value === "boolean";
    case "variable_ref":
      return typeof typed.variableId === "string" && typed.variableId.length > 0 && (typed.variableType === "string" || typed.variableType === "number" || typed.variableType === "boolean");
    case "status_id_literal":
      return isSupportedStatusId(typed.statusId);
    case "event_status_id":
    case "event_status_duration":
    case "event_damage_type":
      return true;
    case "damage_type_literal":
      return CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS.some((option) => option.id === typed.damageType);
    case "enemy_id_literal":
      return typeof typed.enemyId === "string" && typed.enemyId.length > 0;
    case "enemy_identity":
      return isTriggerEnemyReferenceExpression(typed.enemy);
    case "enemy_rank":
      return isTriggerEnemyReferenceExpression(typed.enemy);
    case "enemy_crowd_control_level":
      return isTriggerEnemyReferenceExpression(typed.enemy);
    case "enemy_rank_literal":
      return CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS.some((option) => option.id === typed.rank);
    case "operator_hp_ratio":
      return isTriggerOperatorReferenceExpression(typed.target);
    case "enemy_hp_ratio":
      return isTriggerEnemyReferenceExpression(typed.target);
    case "status_stack_count":
      return normalizeTriggerStatusTargetExpression(typed.target) != null && normalizeTriggerValueExpression(typed.status) != null;
    case "contract_enabled":
      return typeof typed.variantId === "string" && typed.variantId.length > 0;
    case "enemy_state_count":
      return isTriggerEnemyLifecycleState(typed.state);
    case "enemy_state":
      return isTriggerEnemyReferenceExpression(typed.enemy) && isTriggerEnemyLifecycleState(typed.state);
    case "trigger_enabled":
      return normalizeTriggerControlReference(typed.trigger) != null;
    default:
      return false;
  }
}

function isTriggerOperatorReferenceExpression(value: unknown): value is TriggerOperatorReferenceExpression {
  if (!value || typeof value !== "object") {
    return false;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "alias_operator") {
    return typed.alias === "event_operator";
  }
  return typed.type === "controlled_operator" || typed.type === "current_operator";
}

function isTriggerEnemyReferenceExpression(value: unknown): value is TriggerEnemyReferenceExpression {
  if (!value || typeof value !== "object") {
    return false;
  }
  const typed = value as Record<string, unknown>;
  switch (typed.type) {
    case "alias_enemy":
      return typed.alias === "event_enemy_target";
    case "enemy_in_slot":
      return normalizeTriggerNumericSource(typed.slotNumber) != null;
    case "enemy_from_group":
      return typed.alias === "event_enemy_group" && normalizeTriggerNumericSource(typed.index) != null;
    case "current_enemy":
      return true;
    default:
      return false;
  }
}

function normalizeTriggerNumericSource(value: unknown, fallback = 1): TriggerNumericSource | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { type: "number_literal", value: Math.max(1, Math.round(value)) };
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "number_literal") {
    return { type: "number_literal", value: Math.max(1, Math.round(normalizeNonNegativeNumber(typed.value, fallback))) };
  }
  if (typed.type === "variable_ref" && typeof typed.variableId === "string" && typed.variableId.length > 0) {
    return { type: "variable_ref", variableId: typed.variableId, variableType: "number" };
  }
  return null;
}

function normalizeTriggerValueExpression(value: unknown): TriggerValueExpression | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  switch (typed.type) {
    case "string_literal":
      return { type: "string_literal", value: typeof typed.value === "string" ? typed.value : "" };
    case "number_literal":
      return { type: "number_literal", value: normalizeNonNegativeNumber(typed.value, 0) };
    case "boolean_literal":
      return { type: "boolean_literal", value: typed.value === true };
    case "variable_ref":
      return typeof typed.variableId === "string" && typed.variableId.length > 0 && (typed.variableType === "string" || typed.variableType === "number" || typed.variableType === "boolean")
        ? { type: "variable_ref", variableId: typed.variableId, variableType: typed.variableType }
        : null;
    case "status_id_literal":
      return { type: "status_id_literal", statusId: isSupportedStatusId(typed.statusId) ? typed.statusId : "bladebreaking" };
    case "event_status_id":
      return { type: "event_status_id" };
    case "event_status_duration":
      return { type: "event_status_duration" };
    case "event_damage_type":
      return { type: "event_damage_type" };
    case "damage_type_literal":
      return {
        type: "damage_type_literal",
        damageType: CUSTOM_TRIGGER_DAMAGE_TYPE_OPTIONS.some((option) => option.id === typed.damageType)
          ? typed.damageType as Exclude<ElementType, "Healing">
          : "Physical",
      };
    case "enemy_id_literal":
      return { type: "enemy_id_literal", enemyId: typeof typed.enemyId === "string" ? typed.enemyId : "" };
    case "enemy_identity": {
      const enemy = normalizeTriggerEnemyReferenceExpression(typed.enemy);
      return enemy ? { type: "enemy_identity", enemy } : null;
    }
    case "enemy_rank": {
      const enemy = normalizeTriggerEnemyReferenceExpression(typed.enemy);
      return enemy ? { type: "enemy_rank", enemy } : null;
    }
    case "enemy_crowd_control_level": {
      const enemy = normalizeTriggerEnemyReferenceExpression(typed.enemy);
      return enemy ? { type: "enemy_crowd_control_level", enemy } : null;
    }
    case "enemy_rank_literal":
      return {
        type: "enemy_rank_literal",
        rank: CUSTOM_TRIGGER_ENEMY_RANK_OPTIONS.some((option) => option.id === typed.rank) ? typed.rank as EnemyRank : "common",
      };
    case "hp_ratio": {
      const target = normalizeTriggerReferenceExpression(typed.target);
      if (!target) {
        return null;
      }
      if (target.type === "alias_operator" || target.type === "controlled_operator") {
        return { type: "operator_hp_ratio", target };
      }
      if (target.type === "alias_enemy" || target.type === "enemy_in_slot" || target.type === "enemy_from_group") {
        return { type: "enemy_hp_ratio", target };
      }
      return null;
    }
    case "operator_hp_ratio": {
      const target = normalizeTriggerOperatorReferenceExpression(typed.target);
      return target ? { type: "operator_hp_ratio", target } : null;
    }
    case "enemy_hp_ratio": {
      const target = normalizeTriggerEnemyReferenceExpression(typed.target);
      return target ? { type: "enemy_hp_ratio", target } : null;
    }
    case "status_stack_count": {
      const target = normalizeTriggerStatusTargetExpression(typed.target);
      const status = normalizeTriggerValueExpression(typed.status);
      return target && status ? { type: "status_stack_count", target, status } : null;
    }
    case "contract_enabled":
      return { type: "contract_enabled", variantId: typeof typed.variantId === "string" ? typed.variantId : "" };
    case "enemy_state_count":
      return { type: "enemy_state_count", state: isTriggerEnemyLifecycleState(typed.state) ? typed.state : "active" };
    case "enemy_state": {
      const enemy = normalizeTriggerEnemyReferenceExpression(typed.enemy);
      return enemy ? { type: "enemy_state", enemy, state: isTriggerEnemyLifecycleState(typed.state) ? typed.state : "active" } : null;
    }
    case "trigger_enabled": {
      const trigger = normalizeTriggerControlReference(typed.trigger);
      return trigger ? { type: "trigger_enabled", trigger } : null;
    }
    default:
      return null;
  }
}

function normalizeTriggerOperatorReferenceExpression(value: unknown): TriggerOperatorReferenceExpression | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "alias_operator") {
    return { type: "alias_operator", alias: "event_operator" };
  }
  if (typed.type === "controlled_operator") {
    return { type: "controlled_operator" };
  }
  if (typed.type === "current_operator") return { type: "current_operator" };
  return null;
}

function normalizeTriggerEnemyReferenceExpression(value: unknown): TriggerEnemyReferenceExpression | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  switch (typed.type) {
    case "alias_enemy":
      return { type: "alias_enemy", alias: "event_enemy_target" };
    case "enemy_in_slot":
      return { type: "enemy_in_slot", slotNumber: normalizeTriggerNumericSource(typed.slotNumber, 1) ?? { type: "number_literal", value: 1 } };
    case "enemy_from_group":
      return { type: "enemy_from_group", alias: "event_enemy_group", index: normalizeTriggerNumericSource(typed.index, 1) ?? { type: "number_literal", value: 1 } };
    case "current_enemy":
      return { type: "current_enemy" };
    default:
      return null;
  }
}

function normalizeTriggerReferenceExpression(value: unknown): TriggerReferenceExpression | null {
  return normalizeTriggerOperatorReferenceExpression(value) ?? normalizeTriggerEnemyReferenceExpression(value);
}

function normalizeTriggerStatusTargetExpression(value: unknown): TriggerStatusTargetExpression | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "team") {
    return { type: "team" };
  }
  if (typed.type === "global") {
    return { type: "global" };
  }
  return normalizeTriggerReferenceExpression(value);
}

function normalizeTriggerControlReference(value: unknown): TriggerControlReference | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "self") {
    return { type: "self" };
  }
  if (typed.type === "trigger_in_slot") {
    return {
      type: "trigger_in_slot",
      slotNumber: normalizeTriggerNumericSource(typed.slotNumber, 1) ?? { type: "number_literal", value: 1 },
    };
  }
  return null;
}

function normalizeTriggerVariableType(value: unknown): TriggerVariableType {
  return value === "string" || value === "number" || value === "boolean" ? value : "number";
}

function normalizeTriggerVariableDefinition(value: unknown): TriggerVariableDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typeof typed.id !== "string" || typed.id.length <= 0) {
    return null;
  }
  const variableType = normalizeTriggerVariableType(typed.type);
  const initialValueRaw = normalizeTriggerValueExpression(typed.initialValue);
  const initialValue: TriggerVariableDefinition["initialValue"] =
    variableType === "string"
      ? initialValueRaw?.type === "string_literal"
        ? initialValueRaw
        : { type: "string_literal", value: "" }
      : variableType === "boolean"
        ? initialValueRaw?.type === "boolean_literal"
          ? initialValueRaw
          : { type: "boolean_literal", value: false }
        : initialValueRaw?.type === "number_literal"
          ? initialValueRaw
          : { type: "number_literal", value: 0 };
  return {
    id: typed.id,
    name: typeof typed.name === "string" && typed.name.trim().length > 0 ? typed.name.trim() : "Variable",
    type: variableType,
    initialValue,
  };
}

function normalizeTriggerConditionNode(value: unknown): TriggerConditionNode | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.kind === "logic") {
    const conditions = Array.isArray(typed.conditions)
      ? typed.conditions.map((entry) => normalizeTriggerConditionNode(entry)).filter((entry): entry is TriggerConditionNode => entry != null)
      : [];
    return {
      kind: "logic",
      id: typeof typed.id === "string" && typed.id.length > 0 ? typed.id : makeCustomTriggerConditionId(),
      operator: isTriggerLogicOperator(typed.operator) ? typed.operator : "AND",
      conditions,
    };
  }
  const left = normalizeTriggerValueExpression(typed.left);
  const right = normalizeTriggerValueExpression(typed.right);
  if (!left || !right || !isTriggerComparator(typed.comparator)) {
    return null;
  }
  return {
    kind: "comparator",
    id: typeof typed.id === "string" && typed.id.length > 0 ? typed.id : makeCustomTriggerConditionId(),
    left,
    comparator: typed.comparator,
    right,
  };
}

function normalizeTriggerAction(value: unknown): TriggerAction | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;
  if (typed.type === "REMOVE_STATUS") {
    const status = normalizeTriggerValueExpression(typed.status);
    const target = normalizeTriggerStatusTargetExpression(typed.target);
    if (!status || !target) {
      return null;
    }
    return {
      type: "REMOVE_STATUS",
      status,
      target,
    };
  }
    if (typed.type === "REPLACE_ENEMY") {
      const target = normalizeTriggerEnemyReferenceExpression(typed.target);
      const enemyId = normalizeTriggerValueExpression(typed.enemyId);
      const resetHp = normalizeTriggerValueExpression(typed.resetHp) ?? { type: "boolean_literal", value: true };
      const level = normalizeTriggerValueExpression(typed.level) ?? { type: "number_literal", value: 90 };
      const noDeath = normalizeTriggerValueExpression(typed.noDeath) ?? { type: "boolean_literal", value: false };
      if (!target || !enemyId) {
        return null;
      }
      return {
        type: "REPLACE_ENEMY",
        target,
        enemyId,
        resetHp,
        level,
        noDeath,
      };
    }
  if (typed.type === "MODIFY_HP") {
    const target = normalizeTriggerReferenceExpression(typed.target);
    const amount = normalizeTriggerValueExpression(typed.amount);
    if (!target || !amount) {
      return null;
    }
    return {
      type: "MODIFY_HP",
      target,
      operation: isTriggerHpOperation(typed.operation) ? typed.operation : "damage",
      amount,
    };
  }
  if (typed.type === "MODIFY_VARIABLE") {
    const valueExpr = normalizeTriggerValueExpression(typed.value);
    const variableType = normalizeTriggerVariableType(typed.variableType);
    const operation: TriggerVariableModifyOperation =
      typed.operation === "add" || typed.operation === "subtract" || typed.operation === "set"
        ? typed.operation
        : "set";
    if (typeof typed.variableId !== "string" || typed.variableId.length <= 0 || !valueExpr) {
      return null;
    }
    return {
      type: "MODIFY_VARIABLE",
      variableId: typed.variableId,
      variableType,
      operation,
      value: valueExpr,
    };
  }
  if (typed.type === "SET_TARGET_ENEMY") {
    const target = normalizeTriggerEnemyReferenceExpression(typed.target);
    if (!target) {
      return null;
    }
    return {
      type: "SET_TARGET_ENEMY",
      target,
    };
  }
  if (typed.type === "EXECUTE_HIT") {
    const source = normalizeTriggerOperatorReferenceExpression(typed.source);
    const target = normalizeTriggerEnemyReferenceExpression(typed.target);
    const multiplier = normalizeTriggerValueExpression(typed.multiplier);
    const flatAmount = normalizeTriggerValueExpression(typed.flatAmount);
    const stagger = normalizeTriggerValueExpression(typed.stagger);
    const attackType = typed.attackType;
    const damageType = typed.damageType;
    const targets = typed.targets;
    if (!source || !target || !multiplier || !flatAmount || !stagger) {
      return null;
    }
    if (!["BASIC_ATTACK", "BATTLE_SKILL", "COMBO_SKILL", "ULTIMATE", "TALENT", "REACTION", "GENERIC"].includes(String(attackType))) {
      return null;
    }
    if (!["Physical", "Heat", "Cryo", "Electric", "Nature", "Aether"].includes(String(damageType))) {
      return null;
    }
    if (!["all_enemies", "targeted_enemy", "finisher"].includes(String(targets))) {
      return null;
    }
    return {
      type: "EXECUTE_HIT",
      source,
      target,
      attackType: attackType as AttackType,
      damageType: damageType as Exclude<ElementType, "Healing">,
      targets: targets as EnemyTargeting,
      hitName: typeof typed.hitName === "string" && typed.hitName.trim().length > 0 ? typed.hitName.trim() : "Execute Hit",
      multiplier,
      flatAmount,
      stagger,
      noCrit: typed.noCrit === true,
      ignoreEnemyInvulnerability: typed.ignoreEnemyInvulnerability === true,
    };
  }
  if (typed.type === "WAIT") {
    const durationSeconds = normalizeTriggerValueExpression(typed.durationSeconds);
    if (!durationSeconds) {
      return null;
    }
    return {
      type: "WAIT",
      durationSeconds,
    };
  }
  if (typed.type === "COUNTDOWN") {
    const durationSeconds = normalizeTriggerValueExpression(typed.durationSeconds);
    if (!durationSeconds) {
      return null;
    }
    return {
      type: "COUNTDOWN",
      durationSeconds,
    };
  }
  if (typed.type === "RELAY_ROTATION") {
    return {
      type: "RELAY_ROTATION",
    };
  }
  if (typed.type === "SET_TRIGGER_ENABLED") {
    const target = normalizeTriggerControlReference(typed.target);
    if (!target) {
      return null;
    }
    return {
      type: "SET_TRIGGER_ENABLED",
      target,
      operation: isTriggerEnableOperation(typed.operation) ? typed.operation : "disable",
    };
  }
  if (typed.type === "STOP_TRIGGER") {
    const target = normalizeTriggerControlReference(typed.target);
    if (!target) {
      return null;
    }
    return {
      type: "STOP_TRIGGER",
      target,
    };
  }
  if (typed.type === "BREAK") {
    return {
      type: "BREAK",
    };
  }
  if (typed.type === "IF_THEN_ELSE") {
    const ifCondition = normalizeTriggerConditionNode(typed.ifCondition);
    const thenActions = Array.isArray(typed.thenActions)
      ? typed.thenActions.map((entry) => normalizeTriggerAction(entry)).filter((entry): entry is TriggerAction => entry != null)
      : [];
    const elseActions = Array.isArray(typed.elseActions)
      ? typed.elseActions.map((entry) => normalizeTriggerAction(entry)).filter((entry): entry is TriggerAction => entry != null)
      : [];
    if (!ifCondition) {
      return null;
    }
    return {
      type: "IF_THEN_ELSE",
      ifCondition,
      thenActions,
      elseActions,
    };
  }
  if (typed.type === "FOR_EACH_ENEMY") {
    return {
      type: "FOR_EACH_ENEMY",
      state: typed.state === "any" || isTriggerEnemyLifecycleState(typed.state) ? typed.state : "active",
      actions: Array.isArray(typed.actions) ? typed.actions.map(normalizeTriggerAction).filter((entry): entry is TriggerAction => entry != null) : [],
    };
  }
  if (typed.type === "FOR_EACH_OPERATOR") {
    return {
      type: "FOR_EACH_OPERATOR",
      actions: Array.isArray(typed.actions) ? typed.actions.map(normalizeTriggerAction).filter((entry): entry is TriggerAction => entry != null) : [],
    };
  }
  if (typed.type === "FIRE_TRIGGER") {
    const target = normalizeTriggerControlReference(typed.target);
    const checkEnabled = normalizeTriggerValueExpression(typed.checkEnabled);
    const checkCondition = normalizeTriggerValueExpression(typed.checkCondition);
    if (!target || !checkEnabled || !checkCondition) {
      return null;
    }
    return {
      type: "FIRE_TRIGGER",
      target,
      checkEnabled,
      checkCondition,
    };
  }
  if (typed.type === "APPLY_STATUS") {
    const status = normalizeTriggerValueExpression(typed.status);
    const target = normalizeTriggerStatusTargetExpression(typed.target);
    const durationSeconds = normalizeTriggerValueExpression(typed.durationSeconds);
    const stacks = normalizeTriggerValueExpression(typed.stacks);
    const maxStacks = typed.maxStacks == null ? undefined : normalizeTriggerValueExpression(typed.maxStacks);
    if (!status || !target || !durationSeconds || !stacks || typed.maxStacks === null || (typed.maxStacks != null && !maxStacks)) {
      return null;
    }
    return {
      type: "APPLY_STATUS",
      status,
      target,
      durationSeconds,
      stacks,
      useDefault: typed.useDefault === true,
      maxStacks: maxStacks ?? undefined,
      permanent: typed.permanent === true,
      hidden: typed.hidden === true,
      stackingRule: isTriggerStatusStackingRule(typed.stackingRule) ? typed.stackingRule : "default",
      refreshExistingStacks: typed.refreshExistingStacks !== false,
      independentStacks: typed.independentStacks === true,
      statEntries: Array.isArray(typed.statEntries)
        ? typed.statEntries
          .map((entry) => normalizeTriggerStatusStatEntry(entry))
          .filter((entry): entry is TriggerStatusStatEntry => entry != null)
        : [],
    };
  }
  return null;
}

export function makeCustomTriggerId(): string {
  return `trigger_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeCustomTriggerConditionId(): string {
  return `trigger_condition_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeDefaultApplyStatusAction(): TriggerAction {
  return {
    type: "APPLY_STATUS",
    status: { type: "status_id_literal", statusId: "bladebreaking" },
    target: { type: "alias_operator", alias: "event_operator" },
    durationSeconds: { type: "number_literal", value: 10 },
    stacks: { type: "number_literal", value: 1 },
    useDefault: true,
    maxStacks: { type: "number_literal", value: 1 },
    permanent: false,
    hidden: false,
    stackingRule: "default",
    refreshExistingStacks: true,
    independentStacks: false,
    statEntries: [],
  };
}

export function makeDefaultRemoveStatusAction(): TriggerAction {
  return {
    type: "REMOVE_STATUS",
    status: { type: "status_id_literal", statusId: "bladebreaking" },
    target: { type: "alias_operator", alias: "event_operator" },
  };
}

export function makeDefaultReplaceEnemyAction(): TriggerAction {
  return {
    type: "REPLACE_ENEMY",
    target: { type: "alias_enemy", alias: "event_enemy_target" },
    enemyId: { type: "enemy_id_literal", enemyId: "rhodagn" },
    resetHp: { type: "boolean_literal", value: true },
    level: { type: "number_literal", value: 90 },
    noDeath: { type: "boolean_literal", value: false },
  };
}

export function makeDefaultModifyHpAction(): TriggerAction {
  return {
    type: "MODIFY_HP",
    target: { type: "alias_operator", alias: "event_operator" },
    operation: "damage",
    amount: { type: "number_literal", value: 1000 },
  };
}

export function makeDefaultModifyVariableAction(): TriggerAction {
  return {
    type: "MODIFY_VARIABLE",
    variableId: DEFAULT_TRIGGER_VARIABLE_IDS.number,
    variableType: "number",
    operation: "set",
    value: { type: "number_literal", value: 0 },
  };
}

export function makeDefaultSetTargetEnemyAction(): TriggerAction {
  return {
    type: "SET_TARGET_ENEMY",
    target: { type: "alias_enemy", alias: "event_enemy_target" },
  };
}

export function makeDefaultExecuteHitAction(): TriggerAction {
  return {
    type: "EXECUTE_HIT",
    source: { type: "alias_operator", alias: "event_operator" },
    target: { type: "alias_enemy", alias: "event_enemy_target" },
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    targets: "targeted_enemy",
    hitName: "Execute Hit",
    multiplier: { type: "number_literal", value: 1 },
    flatAmount: { type: "number_literal", value: 0 },
    stagger: { type: "number_literal", value: 0 },
    noCrit: false,
    ignoreEnemyInvulnerability: false,
  };
}

export function makeDefaultWaitAction(): TriggerAction {
  return {
    type: "WAIT",
    durationSeconds: { type: "number_literal", value: 1 },
  };
}

export function makeDefaultCountdownAction(): TriggerAction {
  return {
    type: "COUNTDOWN",
    durationSeconds: { type: "number_literal", value: 10 },
  };
}

export function makeDefaultRelayRotationAction(): TriggerAction {
  return {
    type: "RELAY_ROTATION",
  };
}

export function makeDefaultSetTriggerEnabledAction(): TriggerAction {
  return {
    type: "SET_TRIGGER_ENABLED",
    target: { type: "self" },
    operation: "disable",
  };
}

export function makeDefaultStopTriggerAction(): TriggerAction {
  return {
    type: "STOP_TRIGGER",
    target: { type: "self" },
  };
}

export function makeDefaultBreakAction(): TriggerAction {
  return {
    type: "BREAK",
  };
}

export function makeDefaultIfThenElseAction(): TriggerAction {
  return {
    type: "IF_THEN_ELSE",
    ifCondition: makeDefaultComparatorTriggerCondition(),
    thenActions: [makeDefaultApplyStatusAction()],
    elseActions: [],
  };
}

export function makeDefaultForEachEnemyAction(): TriggerAction {
  return { type: "FOR_EACH_ENEMY", state: "active", actions: [makeDefaultApplyStatusAction()] };
}

export function makeDefaultForEachOperatorAction(): TriggerAction {
  return { type: "FOR_EACH_OPERATOR", actions: [makeDefaultApplyStatusAction()] };
}

export function makeDefaultFireTriggerAction(): TriggerAction {
  return {
    type: "FIRE_TRIGGER",
    target: { type: "self" },
    checkEnabled: { type: "boolean_literal", value: true },
    checkCondition: { type: "boolean_literal", value: true },
  };
}

export function makeDefaultComparatorTriggerCondition(): TriggerComparatorCondition {
  return {
    kind: "comparator",
    id: makeCustomTriggerConditionId(),
    left: { type: "operator_hp_ratio", target: { type: "alias_operator", alias: "event_operator" } },
    comparator: "lte",
    right: { type: "number_literal", value: 0.25 },
  };
}

export function makeDefaultLogicTriggerCondition(): TriggerLogicCondition {
  return {
    kind: "logic",
    id: makeCustomTriggerConditionId(),
    operator: "AND",
    conditions: [makeDefaultComparatorTriggerCondition()],
  };
}

export const makeDefaultTriggerCondition = makeDefaultComparatorTriggerCondition;

export function makeDefaultCustomTrigger(): CustomCombatTrigger {
  return {
    id: makeCustomTriggerId(),
    name: "New Trigger",
    enabled: true,
    event: {
      type: "NO_EVENT",
    },
    conditions: [],
    actions: [makeDefaultApplyStatusAction()],
  };
}

export function makeCustomTriggerVariableId(): string {
  return `trigger_variable_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeCustomTriggerVariables(value: unknown): TriggerVariableDefinition[] {
  const seen = new Set<string>();
  const custom = Array.isArray(value)
    ? value.map((entry) => normalizeTriggerVariableDefinition(entry)).filter((entry): entry is TriggerVariableDefinition => entry != null)
    : [];
  return custom.filter((entry) => {
    if (seen.has(entry.id) || Object.values(DEFAULT_TRIGGER_VARIABLE_IDS).includes(entry.id as never)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

export function getAllTriggerVariables(customVariables: TriggerVariableDefinition[] = []): TriggerVariableDefinition[] {
  return [...getDefaultTriggerVariables(), ...normalizeCustomTriggerVariables(customVariables)];
}

function sanitizeTriggerValueExpression(
  expression: TriggerValueExpression,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerValueExpression {
  if (expression.type === "variable_ref") {
    const variable = variablesById.get(expression.variableId);
    if (!variable || variable.type !== expression.variableType) {
      return {
        type: "variable_ref",
        variableId: getDefaultTriggerVariableId(expression.variableType),
        variableType: expression.variableType,
      };
    }
  }
  if (expression.type === "enemy_identity") {
    expression.enemy = sanitizeTriggerEnemyReferenceExpression(expression.enemy, variablesById);
  } else if (expression.type === "enemy_rank" || expression.type === "enemy_crowd_control_level") {
    expression.enemy = sanitizeTriggerEnemyReferenceExpression(expression.enemy, variablesById);
  } else if (expression.type === "operator_hp_ratio") {
    expression.target = sanitizeTriggerOperatorReferenceExpression(expression.target);
  } else if (expression.type === "enemy_hp_ratio") {
    expression.target = sanitizeTriggerEnemyReferenceExpression(expression.target, variablesById);
  } else if (expression.type === "status_stack_count") {
    expression.target = sanitizeTriggerStatusTargetExpression(expression.target, variablesById);
    expression.status = sanitizeTriggerValueExpression(expression.status, variablesById);
  } else if (expression.type === "enemy_state") {
    expression.enemy = sanitizeTriggerEnemyReferenceExpression(expression.enemy, variablesById);
  } else if (expression.type === "trigger_enabled") {
    expression.trigger = sanitizeTriggerControlReference(expression.trigger, variablesById);
  }
  return expression;
}

function sanitizeTriggerNumericSource(
  source: TriggerNumericSource,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerNumericSource {
  if (source.type === "variable_ref") {
    const variable = variablesById.get(source.variableId);
    if (!variable || variable.type !== "number") {
      return { type: "variable_ref", variableId: DEFAULT_TRIGGER_VARIABLE_IDS.number, variableType: "number" };
    }
  }
  return source;
}

function sanitizeTriggerOperatorReferenceExpression(reference: TriggerOperatorReferenceExpression): TriggerOperatorReferenceExpression {
  return reference;
}

function sanitizeTriggerEnemyReferenceExpression(
  reference: TriggerEnemyReferenceExpression,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerEnemyReferenceExpression {
  if (reference.type === "enemy_in_slot") {
    reference.slotNumber = sanitizeTriggerNumericSource(reference.slotNumber, variablesById);
  } else if (reference.type === "enemy_from_group") {
    reference.index = sanitizeTriggerNumericSource(reference.index, variablesById);
  }
  return reference;
}

function sanitizeTriggerReferenceExpression(
  reference: TriggerReferenceExpression,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerReferenceExpression {
  if (reference.type === "alias_operator" || reference.type === "controlled_operator" || reference.type === "current_operator") {
    return sanitizeTriggerOperatorReferenceExpression(reference);
  }
  return sanitizeTriggerEnemyReferenceExpression(reference, variablesById);
}

function sanitizeTriggerStatusTargetExpression(
  reference: TriggerStatusTargetExpression,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerStatusTargetExpression {
  if (reference.type === "team" || reference.type === "global") {
    return reference;
  }
  return sanitizeTriggerReferenceExpression(reference, variablesById);
}

function sanitizeTriggerControlReference(
  reference: TriggerControlReference,
  variablesById: Map<string, TriggerVariableDefinition>,
): TriggerControlReference {
  if (reference.type === "trigger_in_slot") {
    reference.slotNumber = sanitizeTriggerNumericSource(reference.slotNumber, variablesById);
  }
  return reference;
}

function sanitizeTriggerConditionNodeRecursive(
  node: TriggerConditionNode,
  variablesById: Map<string, TriggerVariableDefinition>,
) {
  if (node.kind === "logic") {
    node.conditions.forEach((child) => sanitizeTriggerConditionNodeRecursive(child, variablesById));
    return;
  }
  node.left = sanitizeTriggerValueExpression(node.left, variablesById);
  node.right = sanitizeTriggerValueExpression(node.right, variablesById);
}

function sanitizeTriggerActionRecursive(
  action: TriggerAction,
  variablesById: Map<string, TriggerVariableDefinition>,
) {
  switch (action.type) {
    case "APPLY_STATUS":
      action.status = sanitizeTriggerValueExpression(action.status, variablesById);
      action.target = sanitizeTriggerStatusTargetExpression(action.target, variablesById);
      action.durationSeconds = sanitizeTriggerValueExpression(action.durationSeconds, variablesById);
      action.stacks = sanitizeTriggerValueExpression(action.stacks, variablesById);
      action.maxStacks = action.maxStacks ? sanitizeTriggerValueExpression(action.maxStacks, variablesById) : undefined;
      action.useDefault = action.useDefault === true;
      action.stackingRule = isTriggerStatusStackingRule(action.stackingRule) ? action.stackingRule : "default";
      action.refreshExistingStacks = action.refreshExistingStacks !== false;
      action.independentStacks = action.independentStacks === true;
      action.statEntries = Array.isArray(action.statEntries)
        ? action.statEntries
          .map((entry) => normalizeTriggerStatusStatEntry(entry))
          .filter((entry): entry is TriggerStatusStatEntry => entry != null)
        : [];
      return;
    case "REMOVE_STATUS":
      action.status = sanitizeTriggerValueExpression(action.status, variablesById);
      action.target = sanitizeTriggerStatusTargetExpression(action.target, variablesById);
      return;
    case "REPLACE_ENEMY":
      action.target = sanitizeTriggerEnemyReferenceExpression(action.target, variablesById);
      action.enemyId = sanitizeTriggerValueExpression(action.enemyId, variablesById);
      action.resetHp = sanitizeTriggerValueExpression(action.resetHp, variablesById);
      action.level = sanitizeTriggerValueExpression(action.level, variablesById);
      action.noDeath = sanitizeTriggerValueExpression(action.noDeath, variablesById);
      return;
    case "MODIFY_HP":
      action.target = action.target.type === "alias_operator" || action.target.type === "controlled_operator" || action.target.type === "current_operator"
        ? sanitizeTriggerOperatorReferenceExpression(action.target)
        : sanitizeTriggerEnemyReferenceExpression(action.target, variablesById);
      action.amount = sanitizeTriggerValueExpression(action.amount, variablesById);
      return;
    case "MODIFY_VARIABLE": {
      const variable = variablesById.get(action.variableId);
      if (!variable || variable.type !== action.variableType) {
        action.variableId = getDefaultTriggerVariableId(action.variableType);
      }
      action.value = sanitizeTriggerValueExpression(action.value, variablesById);
      return;
    }
    case "SET_TARGET_ENEMY":
      action.target = sanitizeTriggerEnemyReferenceExpression(action.target, variablesById);
      return;
    case "EXECUTE_HIT":
      action.target = sanitizeTriggerEnemyReferenceExpression(action.target, variablesById);
      action.multiplier = sanitizeTriggerValueExpression(action.multiplier, variablesById);
      action.flatAmount = sanitizeTriggerValueExpression(action.flatAmount, variablesById);
      action.stagger = sanitizeTriggerValueExpression(action.stagger, variablesById);
      return;
    case "WAIT":
    case "COUNTDOWN":
      action.durationSeconds = sanitizeTriggerValueExpression(action.durationSeconds, variablesById);
      return;
    case "RELAY_ROTATION":
      return;
    case "SET_TRIGGER_ENABLED":
    case "STOP_TRIGGER":
      action.target = sanitizeTriggerControlReference(action.target, variablesById);
      return;
    case "IF_THEN_ELSE":
      sanitizeTriggerConditionNodeRecursive(action.ifCondition, variablesById);
      action.thenActions.forEach((entry) => sanitizeTriggerActionRecursive(entry, variablesById));
      action.elseActions.forEach((entry) => sanitizeTriggerActionRecursive(entry, variablesById));
      return;
    case "FOR_EACH_ENEMY":
    case "FOR_EACH_OPERATOR":
      action.actions.forEach((entry) => sanitizeTriggerActionRecursive(entry, variablesById));
      return;
    case "FIRE_TRIGGER":
      action.target = sanitizeTriggerControlReference(action.target, variablesById);
      action.checkEnabled = sanitizeTriggerValueExpression(action.checkEnabled, variablesById);
      action.checkCondition = sanitizeTriggerValueExpression(action.checkCondition, variablesById);
      return;
    case "BREAK":
      return;
  }
}

export function sanitizeTriggersAgainstVariables(
  triggers: CustomCombatTrigger[],
  customVariables: TriggerVariableDefinition[],
): CustomCombatTrigger[] {
  const variablesById = new Map(getAllTriggerVariables(customVariables).map((entry) => [entry.id, entry]));
  triggers.forEach((trigger) => {
    trigger.conditions.forEach((condition) => sanitizeTriggerConditionNodeRecursive(condition, variablesById));
    trigger.actions.forEach((action) => sanitizeTriggerActionRecursive(action, variablesById));
  });
  return triggers;
}

function upgradeLegacyTrigger(value: Record<string, unknown>): CustomCombatTrigger | null {
  const event = value.event && typeof value.event === "object" ? value.event as Record<string, unknown> : null;
  const action = value.action && typeof value.action === "object" ? value.action as Record<string, unknown> : null;
  if (!event || !action || !isCustomTriggerEventType(event.type) || action.type !== "APPLY_STATUS") {
    return null;
  }

  let target: TriggerReferenceExpression = { type: "alias_operator", alias: "event_operator" };
  if (action.target === "controlled_operator") {
    target = { type: "controlled_operator" };
  } else if (action.target === "event_enemy" || action.target === "event_enemy_target") {
    target = { type: "alias_enemy", alias: "event_enemy_target" };
  }

  return {
    id: typeof value.id === "string" && value.id.length > 0 ? value.id : makeCustomTriggerId(),
    name: typeof value.name === "string" && value.name.trim().length > 0 ? value.name.trim() : "New Trigger",
    enabled: value.enabled !== false,
    event: { type: event.type },
    conditions: [],
    actions: [
      {
        type: "APPLY_STATUS",
        status: {
          type: "status_id_literal",
          statusId: isSupportedStatusId(action.statusId) ? action.statusId : "bladebreaking",
        },
        target,
        durationSeconds: {
          type: "number_literal",
          value: normalizeNonNegativeNumber(action.durationSeconds, 10),
        },
        stacks: {
          type: "number_literal",
          value: normalizePositiveInteger(action.stacks, 1),
        },
        useDefault: false,
        maxStacks: {
          type: "number_literal",
          value: normalizePositiveInteger(action.maxStacks, 1),
        },
        permanent: action.permanent === true,
        hidden: action.hidden === true,
        stackingRule: "default",
        refreshExistingStacks: true,
        independentStacks: false,
        statEntries: [],
      },
    ],
  };
}

export function normalizeCustomCombatTrigger(value: unknown): CustomCombatTrigger | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const typed = value as Record<string, unknown>;

  if (typed.event && typed.action) {
    return upgradeLegacyTrigger(typed);
  }

  const event = typed.event && typeof typed.event === "object" ? typed.event as Record<string, unknown> : null;
  if (!event || !isCustomTriggerEventType(event.type)) {
    return null;
  }
  const actions = Array.isArray(typed.actions)
    ? typed.actions.map((entry) => normalizeTriggerAction(entry)).filter((entry): entry is TriggerAction => entry != null)
    : [];
  if (actions.length === 0) {
    actions.push(makeDefaultApplyStatusAction());
  }
  const conditions = Array.isArray(typed.conditions)
    ? typed.conditions.map((entry) => normalizeTriggerConditionNode(entry)).filter((entry): entry is TriggerConditionNode => entry != null)
    : [];

  return {
    id: typeof typed.id === "string" && typed.id.length > 0 ? typed.id : makeCustomTriggerId(),
    name: typeof typed.name === "string" && typed.name.trim().length > 0 ? typed.name.trim() : "New Trigger",
    enabled: typed.enabled !== false,
    event: { type: event.type },
    conditions,
    actions,
  };
}

export function normalizeCustomCombatTriggers(value: unknown): CustomCombatTrigger[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => normalizeCustomCombatTrigger(entry))
    .filter((entry): entry is CustomCombatTrigger => entry != null)
    .slice(0, MAX_CUSTOM_TRIGGERS);
}

export function getCustomTriggerOptionLabel(
  option: { label: { en: string; zh: string } },
  locale: "en" | "zh-CN",
): string {
  return locale === "zh-CN" ? option.label.zh : option.label.en;
}

export function getCustomTriggerOptionDescription(
  option: { description?: { en: string; zh: string } },
  locale: "en" | "zh-CN",
): string {
  if (!option.description) {
    return "";
  }
  return locale === "zh-CN" ? option.description.zh : option.description.en;
}

export function getTriggerEventAvailableAliases(eventType: CustomTriggerEventType): TriggerAliasType[] {
  return CUSTOM_TRIGGER_EVENT_OPTIONS.find((option) => option.id === eventType)?.availableAliases ?? [];
}

export function triggerEventSupportsAlias(eventType: CustomTriggerEventType, alias: TriggerAliasType): boolean {
  return getTriggerEventAvailableAliases(eventType).includes(alias);
}

export function getPrimaryTriggerAction(trigger: CustomCombatTrigger): TriggerAction {
  return trigger.actions[0] ?? makeDefaultApplyStatusAction();
}

export function getPrimaryTriggerCondition(trigger: CustomCombatTrigger): TriggerConditionNode | null {
  return trigger.conditions[0] ?? null;
}

export function matchesCustomTriggerEventType(
  triggerEventType: CustomTriggerEventType,
  event: RotationCombatEvent,
): boolean {
  switch (triggerEventType) {
    case "NO_EVENT":
      return false;
    case "STAGE_BEGIN":
      return event.type === "STAGE_BEGIN";
    case "ROTATION_RELAYED":
      return event.type === "ROTATION_RELAYED";
    case "ENEMY_SPAWNED":
    case "ENEMY_REPLACED":
    case "ENEMY_TRANSFORMED":
    case "COMBAT_INITIALIZED":
    case "SKILL_CAST":
    case "ULTIMATE_CAST":
    case "BATTLE_SKILL_CAST":
    case "COMBO_SKILL_CAST":
    case "FINISHER_HIT":
    case "BATTLE_SKILL_HIT":
    case "COMBO_SKILL_HIT":
    case "ULTIMATE_HIT":
    case "ENEMY_DEFEATED":
      return event.type === triggerEventType;
    case "FINAL_STRIKE_HIT":
      return event.type === "BASIC_ATTACK_FINAL_STRIKE_HIT";
    case "BASIC_ATTACK_HIT":
      return event.type === "BASIC_ATTACK_FINAL_STRIKE_HIT";
    case "STATUS_APPLIED":
      return event.type === "STATUS_UPDATED"
        ? ["added", "refreshed", "replaced", "updated", "stack_changed"].includes(event.statusChangeType ?? "")
        : event.type === "ACTOR_BUFF_APPLIED"
          || event.type === "WEAPON_BUFF_APPLIED"
          || event.type === "TEAM_STATUS_GAINED"
          || event.type === "ENEMY_DEBUFF_APPLIED"
          || event.type === "HEAT_INFLICTION_APPLIED"
          || event.type === "ARTS_INFLICTION_APPLIED"
          || event.type === "COMBUSTION_APPLIED"
          || event.type === "CORROSION_APPLIED"
          || event.type === "ORIGINIUM_CRYSTAL_APPLIED";
    case "REACTION_TRIGGERED":
      return event.type === "ARTS_REACTION_APPLIED"
        || event.type === "PHYSICAL_REACTION_APPLIED"
        || event.type === "COMBUSTION_APPLIED"
        || event.type === "CORROSION_APPLIED"
        || event.type === "ARTS_BURST_APPLIED";
    default:
      return false;
  }
}

import type { ActiveContingencyContract } from "@/lib/combat/contracts";
import type { CustomCombatTrigger, TriggerVariableDefinition } from "@/lib/combat/triggers";

export const INTERNAL_TRIGGER_VARIABLE_BATTLE_CHILL_COUNTER_ID = "INTERNAL_battle_chill_counter";
export const INTERNAL_TRIGGER_VARIABLE_HEAT_LOSS_COUNTER_ID = "INTERNAL_heat_loss_counter";
export const INTERNAL_TRIGGER_ID_BATTLE_CHILL = "internal_team_battle_chill";
export const INTERNAL_TRIGGER_ID_HEAT_LOSS = "internal_team_heat_loss";
export const INTERNAL_TRIGGER_ID_CONTROLLED_HEALING = "internal_edit_regeneration";
export const INTERNAL_TRIGGER_ID_ENCUMBERED_INIT = "internal_team_encumbered_init";
export const INTERNAL_TRIGGER_ID_ENCUMBERED_SUPPRESSION_FINAL_STRIKE = "internal_team_encumbered_suppression_final_strike";
export const INTERNAL_TRIGGER_ID_ENCUMBERED_SUPPRESSION_FINISHER = "internal_team_encumbered_suppression_finisher";
export const INTERNAL_TRIGGER_ID_FROZEN_DURATION_CLEANSE = "internal_ambient_frozen_duration_cleanse";
export const INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_SPAWN = "internal_powerful_decapitation_spawn";
export const INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_BREAK = "internal_powerful_decapitation_break";
export const INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_REINFORCEMENT = "internal_powerful_decapitation_reinforcement";

export type InternalCombatTriggerDefinition = {
  trigger: CustomCombatTrigger;
  variables?: TriggerVariableDefinition[];
  enabledContractVariantIds?: string[];
};

export const INTERNAL_TRIGGER_VARIABLES: TriggerVariableDefinition[] = [
  {
    id: INTERNAL_TRIGGER_VARIABLE_BATTLE_CHILL_COUNTER_ID,
    name: "INTERNAL Battle Chill Counter",
    type: "number",
    initialValue: { type: "number_literal", value: 0 },
  },
  {
    id: INTERNAL_TRIGGER_VARIABLE_HEAT_LOSS_COUNTER_ID,
    name: "INTERNAL Heat Loss Counter",
    type: "number",
    initialValue: { type: "number_literal", value: 0 },
  },
];

export const INTERNAL_COMBAT_TRIGGER_DEFINITIONS: InternalCombatTriggerDefinition[] = [
  {
    enabledContractVariantIds: ["battle_skill_cryo_1", "battle_skill_cryo_2"],
    variables: INTERNAL_TRIGGER_VARIABLES,
    trigger: {
      id: INTERNAL_TRIGGER_ID_BATTLE_CHILL,
      name: "Team: Battle Chill",
      enabled: true,
      event: {
        type: "BATTLE_SKILL_CAST",
      },
      conditions: [
        {
          kind: "comparator",
          id: "internal_battle_chill_condition_cooldown_clear",
          left: {
            type: "status_stack_count",
            target: {
              type: "controlled_operator",
            },
            status: {
              type: "status_id_literal",
              statusId: "contract_battle_chill_cooldown",
            },
          },
          comparator: "equals",
          right: {
            type: "number_literal",
            value: 0,
          },
        },
      ],
      actions: [
        {
          type: "IF_THEN_ELSE",
          ifCondition: {
            kind: "logic",
            id: "internal_battle_chill_if_trigger_now",
            operator: "OR",
            conditions: [
              {
                kind: "comparator",
                id: "internal_battle_chill_contract_ii_enabled",
                left: {
                  type: "contract_enabled",
                  variantId: "battle_skill_cryo_2",
                },
                comparator: "equals",
                right: {
                  type: "boolean_literal",
                  value: true,
                },
              },
              {
                kind: "comparator",
                id: "internal_battle_chill_counter_ready",
                left: {
                  type: "variable_ref",
                  variableId: INTERNAL_TRIGGER_VARIABLE_BATTLE_CHILL_COUNTER_ID,
                  variableType: "number",
                },
                comparator: "gt",
                right: {
                  type: "number_literal",
                  value: 0,
                },
              },
            ],
          },
          thenActions: [
            {
              type: "APPLY_STATUS",
              status: {
                type: "status_id_literal",
                statusId: "cryo_infliction",
              },
              target: {
                type: "controlled_operator",
              },
              durationSeconds: {
                type: "number_literal",
                value: 20,
              },
              stacks: {
                type: "number_literal",
                value: 1,
              },
              useDefault: true,
              maxStacks: {
                type: "number_literal",
                value: 1,
              },
              permanent: false,
              hidden: false,
              stackingRule: "default",
              refreshExistingStacks: true,
              independentStacks: false,
              statEntries: [],
            },
            {
              type: "MODIFY_VARIABLE",
              variableId: INTERNAL_TRIGGER_VARIABLE_BATTLE_CHILL_COUNTER_ID,
              variableType: "number",
              operation: "set",
              value: {
                type: "number_literal",
                value: 0,
              },
            },
            {
              type: "APPLY_STATUS",
              status: { type: "status_id_literal", statusId: "contract_battle_chill_cooldown" },
              target: { type: "controlled_operator" },
              durationSeconds: { type: "number_literal", value: 3 },
              stacks: { type: "number_literal", value: 1 },
              useDefault: true,
              maxStacks: { type: "number_literal", value: 1 },
              permanent: false,
              hidden: false,
              stackingRule: "default",
              refreshExistingStacks: true,
              independentStacks: false,
              statEntries: [],
            },
          ],
          elseActions: [
            {
              type: "MODIFY_VARIABLE",
              variableId: INTERNAL_TRIGGER_VARIABLE_BATTLE_CHILL_COUNTER_ID,
              variableType: "number",
              operation: "set",
              value: {
                type: "number_literal",
                value: 1,
              },
            },
          ],
        },
      ],
    },
  },
  {
    enabledContractVariantIds: ["combo_skill_cryo_1", "combo_skill_cryo_2"],
    variables: INTERNAL_TRIGGER_VARIABLES,
    trigger: {
      id: INTERNAL_TRIGGER_ID_HEAT_LOSS,
      name: "Team: Heat Loss",
      enabled: true,
      event: { type: "COMBO_SKILL_CAST" },
      conditions: [{
        kind: "comparator",
        id: "internal_heat_loss_condition_cooldown_clear",
        left: {
          type: "status_stack_count",
          target: { type: "controlled_operator" },
          status: { type: "status_id_literal", statusId: "contract_battle_chill_cooldown" },
        },
        comparator: "equals",
        right: { type: "number_literal", value: 0 },
      }],
      actions: [{
        type: "IF_THEN_ELSE",
        ifCondition: {
          kind: "logic",
          id: "internal_heat_loss_if_trigger_now",
          operator: "OR",
          conditions: [
            {
              kind: "comparator",
              id: "internal_heat_loss_contract_ii_enabled",
              left: { type: "contract_enabled", variantId: "combo_skill_cryo_2" },
              comparator: "equals",
              right: { type: "boolean_literal", value: true },
            },
            {
              kind: "comparator",
              id: "internal_heat_loss_counter_ready",
              left: {
                type: "variable_ref",
                variableId: INTERNAL_TRIGGER_VARIABLE_HEAT_LOSS_COUNTER_ID,
                variableType: "number",
              },
              comparator: "gt",
              right: { type: "number_literal", value: 0 },
            },
          ],
        },
        thenActions: [
          {
            type: "APPLY_STATUS",
            status: { type: "status_id_literal", statusId: "cryo_infliction" },
            target: { type: "controlled_operator" },
            durationSeconds: { type: "number_literal", value: 20 },
            stacks: { type: "number_literal", value: 1 },
            useDefault: true,
            maxStacks: { type: "number_literal", value: 1 },
            permanent: false,
            hidden: false,
            stackingRule: "default",
            refreshExistingStacks: true,
            independentStacks: false,
            statEntries: [],
          },
          {
            type: "MODIFY_VARIABLE",
            variableId: INTERNAL_TRIGGER_VARIABLE_HEAT_LOSS_COUNTER_ID,
            variableType: "number",
            operation: "set",
            value: { type: "number_literal", value: 0 },
          },
          {
            type: "APPLY_STATUS",
            status: { type: "status_id_literal", statusId: "contract_battle_chill_cooldown" },
            target: { type: "controlled_operator" },
            durationSeconds: { type: "number_literal", value: 3 },
            stacks: { type: "number_literal", value: 1 },
            useDefault: true,
            maxStacks: { type: "number_literal", value: 1 },
            permanent: false,
            hidden: false,
            stackingRule: "default",
            refreshExistingStacks: true,
            independentStacks: false,
            statEntries: [],
          },
        ],
        elseActions: [{
          type: "MODIFY_VARIABLE",
          variableId: INTERNAL_TRIGGER_VARIABLE_HEAT_LOSS_COUNTER_ID,
          variableType: "number",
          operation: "set",
          value: { type: "number_literal", value: 1 },
        }],
      }],
    },
  },
  {
    enabledContractVariantIds: [
      "frozen_duration_heat",
      "frozen_duration_nature",
      "frozen_duration_electric",
      "frozen_duration_physical",
    ],
    trigger: {
      id: INTERNAL_TRIGGER_ID_FROZEN_DURATION_CLEANSE,
      name: "Ambient: Solidification Cleanse",
      enabled: true,
      event: {
        type: "SKILL_CAST",
      },
      conditions: [
        {
          kind: "logic",
          id: "internal_frozen_duration_element_match",
          operator: "OR",
          conditions: [
            {
              kind: "logic",
              id: "internal_frozen_duration_heat_logic",
              operator: "AND",
              conditions: [
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_heat_contract_enabled",
                  left: { type: "contract_enabled", variantId: "frozen_duration_heat" },
                  comparator: "equals",
                  right: { type: "boolean_literal", value: true },
                },
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_heat_match",
                  left: { type: "event_damage_type" },
                  comparator: "equals",
                  right: { type: "damage_type_literal", damageType: "Heat" },
                },
              ],
            },
            {
              kind: "logic",
              id: "internal_frozen_duration_nature_logic",
              operator: "AND",
              conditions: [
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_nature_contract_enabled",
                  left: { type: "contract_enabled", variantId: "frozen_duration_nature" },
                  comparator: "equals",
                  right: { type: "boolean_literal", value: true },
                },
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_nature_match",
                  left: { type: "event_damage_type" },
                  comparator: "equals",
                  right: { type: "damage_type_literal", damageType: "Nature" },
                },
              ],
            },
            {
              kind: "logic",
              id: "internal_frozen_duration_electric_logic",
              operator: "AND",
              conditions: [
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_electric_contract_enabled",
                  left: { type: "contract_enabled", variantId: "frozen_duration_electric" },
                  comparator: "equals",
                  right: { type: "boolean_literal", value: true },
                },
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_electric_match",
                  left: { type: "event_damage_type" },
                  comparator: "equals",
                  right: { type: "damage_type_literal", damageType: "Electric" },
                },
              ],
            },
            {
              kind: "logic",
              id: "internal_frozen_duration_physical_logic",
              operator: "AND",
              conditions: [
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_physical_contract_enabled",
                  left: { type: "contract_enabled", variantId: "frozen_duration_physical" },
                  comparator: "equals",
                  right: { type: "boolean_literal", value: true },
                },
                {
                  kind: "comparator",
                  id: "internal_frozen_duration_physical_match",
                  left: { type: "event_damage_type" },
                  comparator: "equals",
                  right: { type: "damage_type_literal", damageType: "Physical" },
                },
              ],
            },
          ],
        },
      ],
      actions: [
        {
          type: "REMOVE_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "solidification",
          },
          target: {
            type: "controlled_operator",
          },
        },
      ],
    },
  },
  {
    enabledContractVariantIds: ["encumbered_1"],
    trigger: {
      id: INTERNAL_TRIGGER_ID_ENCUMBERED_INIT,
      name: "Team: Encumbered Init",
      enabled: true,
      event: {
        type: "STAGE_BEGIN",
      },
      conditions: [],
      actions: [
        {
          type: "SET_TRIGGER_ENABLED",
          target: {
            type: "self",
          },
          operation: "disable",
        },
        {
          type: "APPLY_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "team_encumbered",
          },
          target: {
            type: "team",
          },
          durationSeconds: {
            type: "number_literal",
            value: 1,
          },
          stacks: {
            type: "number_literal",
            value: 1,
          },
          useDefault: false,
          maxStacks: {
            type: "number_literal",
            value: 1,
          },
          permanent: true,
          hidden: false,
          stackingRule: "replace",
          refreshExistingStacks: true,
          independentStacks: false,
          statEntries: [],
        },
        {
          type: "APPLY_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "team_encumbered_suppression",
          },
          target: {
            type: "team",
          },
          durationSeconds: {
            type: "number_literal",
            value: 12,
          },
          stacks: {
            type: "number_literal",
            value: 1,
          },
          useDefault: true,
          maxStacks: {
            type: "number_literal",
            value: 1,
          },
          permanent: false,
          hidden: true,
          stackingRule: "replace",
          refreshExistingStacks: true,
          independentStacks: false,
          statEntries: [],
        },
      ],
    },
  },
  {
    enabledContractVariantIds: ["encumbered_1"],
    trigger: {
      id: INTERNAL_TRIGGER_ID_ENCUMBERED_SUPPRESSION_FINAL_STRIKE,
      name: "Team: Encumbered Suppression (Final Strike)",
      enabled: true,
      event: {
        type: "FINAL_STRIKE_HIT",
      },
      conditions: [],
      actions: [
        {
          type: "APPLY_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "team_encumbered_suppression",
          },
          target: {
            type: "team",
          },
          durationSeconds: {
            type: "number_literal",
            value: 12,
          },
          stacks: {
            type: "number_literal",
            value: 1,
          },
          useDefault: true,
          maxStacks: {
            type: "number_literal",
            value: 1,
          },
          permanent: false,
          hidden: true,
          stackingRule: "replace",
          refreshExistingStacks: true,
          independentStacks: false,
          statEntries: [],
        },
      ],
    },
  },
  {
    enabledContractVariantIds: ["encumbered_1"],
    trigger: {
      id: INTERNAL_TRIGGER_ID_ENCUMBERED_SUPPRESSION_FINISHER,
      name: "Team: Encumbered Suppression (Finisher)",
      enabled: true,
      event: {
        type: "FINISHER_HIT",
      },
      conditions: [],
      actions: [
        {
          type: "APPLY_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "team_encumbered_suppression",
          },
          target: {
            type: "team",
          },
          durationSeconds: {
            type: "number_literal",
            value: 12,
          },
          stacks: {
            type: "number_literal",
            value: 1,
          },
          useDefault: true,
          maxStacks: {
            type: "number_literal",
            value: 1,
          },
          permanent: false,
          hidden: true,
          stackingRule: "replace",
          refreshExistingStacks: true,
          independentStacks: false,
          statEntries: [],
        },
      ],
    },
  },
  {
    enabledContractVariantIds: ["controlled_healing_1", "controlled_healing_2"],
    trigger: {
      id: INTERNAL_TRIGGER_ID_CONTROLLED_HEALING,
      name: "Edit: Regeneration",
      enabled: true,
      event: {
        type: "STATUS_APPLIED",
      },
      conditions: [
        {
          kind: "logic",
          id: "internal_controlled_healing_status_match",
          operator: "OR",
          conditions: [
            {
              kind: "comparator",
              id: "internal_controlled_healing_olden_stare",
              left: { type: "event_status_id" },
              comparator: "equals",
              right: { type: "status_id_literal", statusId: "tangtang_olden_stare_crowd_control" },
            },
            {
              kind: "logic",
              id: "internal_controlled_healing_common_or_advanced_control",
              operator: "AND",
              conditions: [
                {
                  kind: "logic",
                  id: "internal_controlled_healing_rank_match",
                  operator: "OR",
                  conditions: [
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_rank_common",
                      left: { type: "enemy_rank", enemy: { type: "alias_enemy", alias: "event_enemy_target" } },
                      comparator: "equals",
                      right: { type: "enemy_rank_literal", rank: "common" },
                    },
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_rank_advanced",
                      left: { type: "enemy_rank", enemy: { type: "alias_enemy", alias: "event_enemy_target" } },
                      comparator: "equals",
                      right: { type: "enemy_rank_literal", rank: "advanced" },
                    },
                  ],
                },
                {
                  kind: "logic",
                  id: "internal_controlled_healing_control_status_match",
                  operator: "OR",
                  conditions: [
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_lift",
                      left: { type: "event_status_id" },
                      comparator: "equals",
                      right: { type: "status_id_literal", statusId: "lift" },
                    },
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_knockdown",
                      left: { type: "event_status_id" },
                      comparator: "equals",
                      right: { type: "status_id_literal", statusId: "knockdown" },
                    },
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_solidification",
                      left: { type: "event_status_id" },
                      comparator: "equals",
                      right: { type: "status_id_literal", statusId: "solidification" },
                    },
                    {
                      kind: "comparator",
                      id: "internal_controlled_healing_originium_crystal",
                      left: { type: "event_status_id" },
                      comparator: "equals",
                      right: { type: "status_id_literal", statusId: "endministrator_originium_crystal" },
                    },
                  ],
                },
                {
                  kind: "comparator",
                  id: "internal_controlled_healing_crowd_control_level",
                  left: {
                    type: "enemy_crowd_control_level",
                    enemy: { type: "alias_enemy", alias: "event_enemy_target" },
                  },
                  comparator: "lte",
                  right: { type: "number_literal", value: 1 },
                },
              ],
            },
          ],
        },
      ],
      actions: [
        {
          type: "APPLY_STATUS",
          status: {
            type: "status_id_literal",
            statusId: "contract_regeneration",
          },
          target: {
            type: "alias_enemy",
            alias: "event_enemy_target",
          },
          durationSeconds: {
            type: "event_status_duration",
          },
          stacks: {
            type: "number_literal",
            value: 1,
          },
          useDefault: false,
          maxStacks: {
            type: "number_literal",
            value: 1,
          },
          permanent: false,
          hidden: false,
          stackingRule: "default",
          refreshExistingStacks: true,
          independentStacks: false,
          statEntries: [],
        },
      ],
    },
  },
];

export const INTERNAL_COMBAT_TRIGGERS: CustomCombatTrigger[] = INTERNAL_COMBAT_TRIGGER_DEFINITIONS.map((entry) => entry.trigger);

export const POWERFUL_DECAPITATION_INTERNAL_TRIGGER_DEFINITIONS: InternalCombatTriggerDefinition[] = [
  {
    trigger: {
      id: INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_SPAWN,
      name: "Powerful Decapitation: Enemy Spawn",
      enabled: true,
      event: { type: "ENEMY_SPAWNED" },
      conditions: [],
      actions: [{
        type: "APPLY_STATUS",
        status: { type: "status_id_literal", statusId: "powerful_decapitation" },
        target: { type: "alias_enemy", alias: "event_enemy_target" },
        durationSeconds: { type: "number_literal", value: 0 },
        stacks: { type: "number_literal", value: 1 },
        useDefault: true,
      }],
    },
  },
  {
    trigger: {
      id: INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_BREAK,
      name: "Powerful Decapitation: Break Preparation",
      enabled: true,
      event: { type: "STAGGER_POINTS_INFLICTED" },
      conditions: [{
        kind: "logic",
        id: "internal_powerful_decapitation_break_conditions",
        operator: "AND",
        conditions: [
          {
            kind: "comparator",
            id: "internal_powerful_decapitation_barrier_active",
            left: {
              type: "status_stack_count",
              target: { type: "alias_enemy", alias: "event_enemy_target" },
              status: { type: "status_id_literal", statusId: "battle_skill_barrier" },
            },
            comparator: "gt",
            right: { type: "number_literal", value: 0 },
          },
          {
            kind: "comparator",
            id: "internal_powerful_decapitation_non_battle_skill",
            left: { type: "event_attack_type" },
            comparator: "not_equals",
            right: { type: "attack_type_literal", attackType: "BATTLE_SKILL" },
          },
        ],
      }],
      actions: [
        {
          type: "REMOVE_STATUS",
          status: { type: "status_id_literal", statusId: "battle_skill_barrier" },
          target: { type: "alias_enemy", alias: "event_enemy_target" },
        },
        {
          type: "MODIFY_ENEMY",
          target: { type: "alias_enemy", alias: "event_enemy_target" },
          hp: { operation: "add", mode: "flat", value: { type: "number_literal", value: 0 } },
          stagger: { operation: "add", mode: "flat", value: { type: "number_literal", value: 50 } },
        },
      ],
    },
  },
  {
    trigger: {
      id: INTERNAL_TRIGGER_ID_POWERFUL_DECAPITATION_REINFORCEMENT,
      name: "Powerful Decapitation: Hill Smasher Reinforcement",
      enabled: true,
      event: { type: "ENEMY_DEFEATED" },
      conditions: [{
        kind: "comparator",
        id: "internal_powerful_decapitation_bonekrusher_defeated",
        left: {
          type: "enemy_identity",
          enemy: { type: "alias_enemy", alias: "event_enemy_target" },
        },
        comparator: "equals",
        right: { type: "enemy_id_literal", enemyId: "bonekrusher_executioner" },
      }],
      actions: [
        {
          type: "SET_TRIGGER_ENABLED",
          target: { type: "self" },
          operation: "disable",
        },
        {
          type: "WAIT",
          durationSeconds: { type: "number_literal", value: 3 },
        },
        {
          type: "REPLACE_ENEMY",
          target: { type: "enemy_in_slot", slotNumber: { type: "number_literal", value: 1 } },
          enemyId: { type: "enemy_id_literal", enemyId: "hill_smasher" },
          resetHp: { type: "boolean_literal", value: true },
          // A non-positive level preserves the configured level of the enemy slot.
          level: { type: "number_literal", value: 0 },
          noDeath: { type: "boolean_literal", value: false },
        },
      ],
    },
  },
];

export function getActiveInternalCombatTriggerDefinitions(
  definitions: InternalCombatTriggerDefinition[] = [],
  activeContracts: ActiveContingencyContract[] = [],
) {
  const activeVariantIds = new Set(activeContracts.map((entry) => entry.variantId));
  return definitions.filter((entry) =>
    !entry.enabledContractVariantIds
    || entry.enabledContractVariantIds.some((variantId) => activeVariantIds.has(variantId)),
  );
}

export function getActiveInternalCombatTriggers(
  definitions: InternalCombatTriggerDefinition[] = [],
  activeContracts: ActiveContingencyContract[] = [],
) {
  return getActiveInternalCombatTriggerDefinitions(definitions, activeContracts).map((entry) => entry.trigger);
}

export function getActiveInternalTriggerVariables(
  definitions: InternalCombatTriggerDefinition[] = [],
  activeContracts: ActiveContingencyContract[] = [],
) {
  const seen = new Set<string>();
  return getActiveInternalCombatTriggerDefinitions(definitions, activeContracts)
    .flatMap((entry) => entry.variables ?? [])
    .filter((variable) => {
      if (seen.has(variable.id)) {
        return false;
      }
      seen.add(variable.id);
      return true;
    });
}

export function getInternalTriggerEnabledByContracts(
  triggerId: string,
  definitions: InternalCombatTriggerDefinition[] = [],
  activeContracts: ActiveContingencyContract[] = [],
) {
  const definition = definitions.find((entry) => entry.trigger.id === triggerId);
  if (!definition) {
    return null;
  }
  if (!definition.enabledContractVariantIds || definition.enabledContractVariantIds.length === 0) {
    return definition.trigger.enabled !== false;
  }
  const activeVariantIds = new Set(activeContracts.map((entry) => entry.variantId));
  return definition.enabledContractVariantIds.some((variantId) => activeVariantIds.has(variantId));
}

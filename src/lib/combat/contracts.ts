import type { GenericActionType, TimeScale } from "@/lib/commands";
import type { ModifierStatKey } from "@/lib/build/stats";
import type { RotationCombatEvent } from "@/lib/combat/rotation";

export type ContingencyContractEffect =
  | {
      type: "APPLY_OPERATOR_MODIFIER";
      stat: ModifierStatKey;
      value: number;
    }
  | {
      type: "APPLY_ENEMY_MODIFIER";
      stat: ModifierStatKey;
      value: number;
    }
  | {
      type: "SET_BATTLE_TIME_LIMIT";
      seconds: number;
      timeScale?: TimeScale;
    }
  | {
      type: "DISABLE_COMMAND";
      genericActionType: GenericActionType;
    }
  | {
      type: "SUPPRESSION_ON_INFLICTION_APPLIED";
      value: number;
      timeScale?: TimeScale;
      durationSeconds?: number;
    };

export type ContingencyContractDefinition = {
  id: string;
  levels: number[];
  names: string[];
  descriptions: string[];
  effectsByLevel: ContingencyContractEffect[][];
};

export type ActiveContingencyContract = {
  id: string;
  level: number;
};

export type ResolvedContingencyContracts = {
  operatorModifierEffects: Partial<Record<ModifierStatKey, number>>;
  enemyModifierEffects: Partial<Record<ModifierStatKey, number>>;
  disabledGenericActions: Set<GenericActionType>;
  suppressionOnInflictionValues: number[];
  battleTimeLimitSeconds?: number;
  decapitationDamageTakenPct?: number;
  bladebreakingUltimateDmgPct?: number;
  barrierInflictionIntervalSeconds?: number;
};

const MAIN_ATTR_DOWN: ContingencyContractDefinition = {
  id: "main_attr_down",
  levels: [1, 2, 3],
  names: ["Main Attri Down I", "Main Attri Down II", "Main Attri Down III"],
  descriptions: [
    "All operators' main attribute -10%",
    "All operators' main attribute -20%",
    "All operators' main attribute -40%",
  ],
  effectsByLevel: [
    [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.1 }],
    [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.2 }],
    [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.4 }],
  ],
};

const VITALITY: ContingencyContractDefinition = {
  id: "vitality",
  levels: [1, 2, 3],
  names: ["Vitality I", "Vitality II", "Vitality III"],
  descriptions: ["Enemy HP +50%", "Enemy HP +100%", "Enemy HP +200%"],
  effectsByLevel: [
    [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 0.5 }],
    [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 1.0 }],
    [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 2.0 }],
  ],
};

const STIMULATION: ContingencyContractDefinition = {
  id: "stimulation",
  levels: [1, 2],
  names: ["Stimulation I", "Stimulation II"],
  descriptions: ["Enemy DMG Dealt +30%", "Enemy DMG Dealt +80%"],
  effectsByLevel: [
    [{ type: "APPLY_ENEMY_MODIFIER", stat: "ALL_DMG_PCT", value: 0.3 }],
    [{ type: "APPLY_ENEMY_MODIFIER", stat: "ALL_DMG_PCT", value: 0.8 }],
  ],
};

const TIME_LIMIT: ContingencyContractDefinition = {
  id: "time_limit",
  levels: [1, 2, 3],
  names: ["Time Limit I", "Time Limit II", "Time Limit III"],
  descriptions: ["Battle time limit 500s", "Battle time limit 400s", "Battle time limit 300s"],
  effectsByLevel: [
    [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 500, timeScale: "game" }],
    [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 400, timeScale: "game" }],
    [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 300, timeScale: "game" }],
  ],
};

const SUPPRESSION: ContingencyContractDefinition = {
  id: "suppression",
  levels: [1, 2],
  names: ["Suppression I", "Suppression II"],
  descriptions: [
    "Applying Vulnerability/Arts Infliction gives corresponding element DMG Dealt -45%",
    "Applying Vulnerability/Arts Infliction gives corresponding element DMG Dealt -90%",
  ],
  effectsByLevel: [
    [{ type: "SUPPRESSION_ON_INFLICTION_APPLIED", value: -0.45 }],
    [{ type: "SUPPRESSION_ON_INFLICTION_APPLIED", value: -0.9 }],
  ],
};

const IMPRISONMENT: ContingencyContractDefinition = {
  id: "imprisonment",
  levels: [3],
  names: ["Imprisonment III"],
  descriptions: ["Cannot Dodge"],
  effectsByLevel: [[{ type: "DISABLE_COMMAND", genericActionType: "dodge" }]],
};

const DECAPITATION: ContingencyContractDefinition = {
  id: "decapitation",
  levels: [1, 2],
  names: ["Decapitation I", "Decapitation II"],
  descriptions: ["Controlled operator DMG Taken +50%", "Controlled operator DMG Taken +100%"],
  effectsByLevel: [
    [],
    [],
  ],
};

const BLADEBREAKING: ContingencyContractDefinition = {
  id: "bladebreaking",
  levels: [1, 2],
  names: ["Bladebreaking I", "Bladebreaking II"],
  descriptions: ["Next ultimate Ultimate DMG -50%", "Next ultimate Ultimate DMG -100%"],
  effectsByLevel: [
    [],
    [],
  ],
};

const BARRIER: ContingencyContractDefinition = {
  id: "barrier",
  levels: [1],
  names: ["Barrier I"],
  descriptions: ["Same vulnerability/infliction can only be gained once every 5s"],
  effectsByLevel: [[]],
};

export const CONTINGENCY_CONTRACTS: ContingencyContractDefinition[] = [
  MAIN_ATTR_DOWN,
  VITALITY,
  STIMULATION,
  TIME_LIMIT,
  SUPPRESSION,
  IMPRISONMENT,
  DECAPITATION,
  BLADEBREAKING,
  BARRIER,
];

export const CONTINGENCY_CONTRACT_BY_ID: Record<string, ContingencyContractDefinition> =
  Object.fromEntries(CONTINGENCY_CONTRACTS.map((contract) => [contract.id, contract]));

export function resolveContingencyContracts(
  activeContracts: ActiveContingencyContract[] | null | undefined,
): ResolvedContingencyContracts {
  const resolved: ResolvedContingencyContracts = {
    operatorModifierEffects: {},
    enemyModifierEffects: {},
    disabledGenericActions: new Set<GenericActionType>(),
    suppressionOnInflictionValues: [],
  };

  for (const active of activeContracts ?? []) {
    const contract = CONTINGENCY_CONTRACT_BY_ID[active.id];
    if (!contract) {
      continue;
    }
    const levelIndex = contract.levels.indexOf(active.level);
    if (levelIndex < 0) {
      continue;
    }
    const effects = contract.effectsByLevel[levelIndex] ?? [];
    for (const effect of effects) {
      if (effect.type === "APPLY_OPERATOR_MODIFIER") {
        resolved.operatorModifierEffects[effect.stat] = (resolved.operatorModifierEffects[effect.stat] ?? 0) + effect.value;
        continue;
      }
      if (effect.type === "APPLY_ENEMY_MODIFIER") {
        resolved.enemyModifierEffects[effect.stat] = (resolved.enemyModifierEffects[effect.stat] ?? 0) + effect.value;
        continue;
      }
      if (effect.type === "DISABLE_COMMAND") {
        resolved.disabledGenericActions.add(effect.genericActionType);
        continue;
      }
      if (effect.type === "SUPPRESSION_ON_INFLICTION_APPLIED") {
        resolved.suppressionOnInflictionValues.push(effect.value);
        continue;
      }
      if (effect.type === "SET_BATTLE_TIME_LIMIT") {
        const seconds = Math.max(0, effect.seconds);
        if (resolved.battleTimeLimitSeconds == null) {
          resolved.battleTimeLimitSeconds = seconds;
        } else {
          resolved.battleTimeLimitSeconds = Math.min(resolved.battleTimeLimitSeconds, seconds);
        }
      }
    }

    if (active.id === "decapitation") {
      resolved.decapitationDamageTakenPct = Math.max(resolved.decapitationDamageTakenPct ?? 0, active.level === 2 ? 1 : 0.5);
    }
    if (active.id === "bladebreaking") {
      resolved.bladebreakingUltimateDmgPct = Math.min(resolved.bladebreakingUltimateDmgPct ?? 0, active.level === 2 ? -1 : -0.5);
    }
    if (active.id === "barrier") {
      resolved.barrierInflictionIntervalSeconds = Math.max(resolved.barrierInflictionIntervalSeconds ?? 0, 5);
    }
  }

  return resolved;
}

export function getSuppressionDebuffStatFromEvent(
  event: RotationCombatEvent,
): ModifierStatKey | null {
  if (event.type === "ENEMY_DEBUFF_APPLIED" && event.label === "Vulnerability Applied") {
    return "PHYSICAL_DMG_PCT";
  }
  if (event.type !== "ARTS_INFLICTION_APPLIED") {
    return null;
  }
  switch (event.consumedElement) {
    case "Heat":
      return "HEAT_DMG_PCT";
    case "Cryo":
      return "CRYO_DMG_PCT";
    case "Electric":
      return "ELECTRIC_DMG_PCT";
    case "Nature":
      return "NATURE_DMG_PCT";
    default:
      return null;
  }
}

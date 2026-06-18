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

export type ContingencyContractVariant = {
  id: string;
  level: number;
  name: string;
  description: string;
  zhName?: string;
  zhDescription?: string;
  effects: ContingencyContractEffect[];
};

export type ContingencyContractDefinition = {
  id: string;
  variants: ContingencyContractVariant[];
};

export type ActiveContingencyContract = {
  id: string;
  variantId: string;
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

function makeVariant(
  id: string,
  level: number,
  name: string,
  description: string,
  zhDescription: string,
  effects: ContingencyContractEffect[] = [],
  zhName?: string,
): ContingencyContractVariant {
  return {
    id,
    level,
    name,
    description,
    zhName,
    zhDescription,
    effects,
  };
}

const MAIN_ATTR_DOWN: ContingencyContractDefinition = {
  id: "main_attr_down",
  variants: [
    makeVariant(
      "main_attr_down_1",
      1,
      "Main Attri Down I",
      "All operators' main attribute -10%",
      "干员主能力值-10%",
      [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.1 }],
    ),
    makeVariant(
      "main_attr_down_2",
      2,
      "Main Attri Down II",
      "All operators' main attribute -20%",
      "干员主能力值-20%",
      [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.2 }],
    ),
    makeVariant(
      "main_attr_down_3",
      3,
      "Main Attri Down III",
      "All operators' main attribute -40%",
      "干员主能力值-40%",
      [{ type: "APPLY_OPERATOR_MODIFIER", stat: "MAIN_ATTR_PCT", value: -0.4 }],
    ),
  ],
};

const STIMULATION: ContingencyContractDefinition = {
  id: "stimulation",
  variants: [
    makeVariant(
      "stimulation_1",
      1,
      "Stimulation I",
      "Enemy DMG Dealt +30%",
      "敌人造成伤害+30%",
      [{ type: "APPLY_ENEMY_MODIFIER", stat: "ALL_DMG_PCT", value: 0.3 }],
    ),
    makeVariant(
      "stimulation_2",
      2,
      "Stimulation II",
      "Enemy DMG Dealt +80%",
      "敌人造成伤害+80%",
      [{ type: "APPLY_ENEMY_MODIFIER", stat: "ALL_DMG_PCT", value: 0.8 }],
    ),
  ],
};

const TIME_LIMIT: ContingencyContractDefinition = {
  id: "time_limit",
  variants: [
    makeVariant(
      "time_limit_1",
      1,
      "Time Limit I",
      "Battle time limit 500s",
      "关卡限时-100s",
      [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 500, timeScale: "game" }],
    ),
    makeVariant(
      "time_limit_2",
      2,
      "Time Limit II",
      "Battle time limit 400s",
      "关卡限时-200s",
      [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 400, timeScale: "game" }],
    ),
    makeVariant(
      "time_limit_3",
      3,
      "Time Limit III",
      "Battle time limit 300s",
      "关卡限时-300s",
      [{ type: "SET_BATTLE_TIME_LIMIT", seconds: 300, timeScale: "game" }],
    ),
  ],
};

const VITALITY: ContingencyContractDefinition = {
  id: "vitality",
  variants: [
    makeVariant(
      "vitality_1",
      1,
      "Vitality I",
      "Enemy HP +50%",
      "敌人生命值+50%",
      [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 0.5 }],
    ),
    makeVariant(
      "vitality_2",
      2,
      "Vitality II",
      "Enemy HP +100%",
      "敌人生命值+100%",
      [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 1.0 }],
    ),
    makeVariant(
      "vitality_3",
      3,
      "Vitality III",
      "Enemy HP +200%",
      "敌人生命值+200%",
      [{ type: "APPLY_ENEMY_MODIFIER", stat: "HP_PCT", value: 2.0 }],
    ),
  ],
};

const DECAPITATION: ContingencyContractDefinition = {
  id: "decapitation",
  variants: [
    makeVariant(
      "decapitation_1",
      1,
      "Decapitation I",
      "Controlled operator DMG Taken +50%",
      "主控干员受到伤害+50%",
    ),
    makeVariant(
      "decapitation_2",
      2,
      "Decapitation II",
      "Controlled operator DMG Taken +100%",
      "主控干员受到伤害+100%",
    ),
  ],
};

const IMPRISONMENT: ContingencyContractDefinition = {
  id: "imprisonment",
  variants: [
    makeVariant(
      "imprisonment_1",
      1,
      "Imprisonment I",
      "Stamina recovery speed -50%",
      "体力恢复速度-50%",
    ),
    makeVariant(
      "imprisonment_2",
      3,
      "Imprisonment III",
      "Cannot Dodge",
      "禁止闪避",
      [{ type: "DISABLE_COMMAND", genericActionType: "dodge" }],
    ),
  ],
};

const HEALING_CLUSTER: ContingencyContractDefinition = {
  id: "healing_cluster",
  variants: [
    makeVariant(
      "healing_cluster_1",
      1,
      "Healing Cluster I",
      "Only 1 healing cluster spawns between waves",
      "波次间隔只产生1个治愈团块",
    ),
    makeVariant(
      "healing_cluster_2",
      2,
      "Healing Cluster II",
      "No healing clusters spawn between waves",
      "波次间隔不产生治愈团块",
    ),
  ],
};

const BLADEBREAKING: ContingencyContractDefinition = {
  id: "bladebreaking",
  variants: [
    makeVariant(
      "bladebreaking_1",
      1,
      "Bladebreaking I",
      "After an operator casts an ultimate, that operator's later ultimate DMG -50%",
      "干员施放终结技后，该干员之后的终结技伤害-50%",
    ),
    makeVariant(
      "bladebreaking_2",
      2,
      "Bladebreaking II",
      "After an operator casts an ultimate, that operator's later ultimate DMG -100%",
      "干员施放终结技后，该干员之后的终结技伤害-100%",
    ),
  ],
};

const BARRIER: ContingencyContractDefinition = {
  id: "barrier",
  variants: [
    makeVariant(
      "barrier_1",
      1,
      "Barrier I",
      "Each enemy can only gain Vulnerability or a same-type Arts Infliction once every 5s",
      "每个敌人每5秒 只能被施加一次破防或同类型的法术附着",
    ),
  ],
};

const SWIFTEND: ContingencyContractDefinition = {
  id: "swiftend",
  variants: [
    makeVariant(
      "swiftend_1",
      2,
      "Swiftend II",
      "Enemy Movement SPD +100%; DMG taken within 0.1s cannot exceed 25% Max HP",
      "敌方移动速度+100%，0.1秒内受到的伤害不会超过最大生命值的25%",
    ),
  ],
};

const REBOUNDING_VITALITY: ContingencyContractDefinition = {
  id: "rebounding_vitality",
  variants: [
    makeVariant(
      "rebounding_vitality_1",
      2,
      "Rebounding Vitality II",
      "Whenever the controlled operator restores 10% Max HP or gains a shield equal to 20% Max HP, the enemy restores 8% Max HP",
      "主控干员每恢复最大生命值10%的血量或获得最大生命值20%的护盾，敌人恢复8%最大生命值",
    ),
  ],
};

const BASIC_ATTACK_BREAKDOWN: ContingencyContractDefinition = {
  id: "basic_attack_breakdown",
  variants: [
    makeVariant(
      "basic_attack_breakdown_1",
      3,
      "Basic Attack Breakdown III",
      "Operators' Basic Attack DMG -70%",
      "干员的普通攻击伤害-70%",
    ),
  ],
};

const LIFE_CAP_WOUND: ContingencyContractDefinition = {
  id: "life_cap_wound",
  variants: [
    makeVariant(
      "life_cap_wound_1",
      3,
      "Life Cap Wound III",
      "30% of DMG taken by melee operators and 50% of DMG taken by ranged operators instead reduces Max HP",
      "近战干员受到伤害的30%会转为减少生命值上限，远程干员受到伤害的50%会转为减少生命值上限",
    ),
  ],
};

const AUXILIARY_REBALANCE: ContingencyContractDefinition = {
  id: "auxiliary_rebalance",
  variants: [
    makeVariant(
      "auxiliary_rebalance_misc",
      3,
      "Auxiliary Rebalance III",
      "DMG other than Basic Attack, Battle Skill, Combo Skill, and Ultimate +100%; Battle Skill DMG -60%",
      "干员除普通攻击、战技、连携技和终结技以外的伤害+100%，战技伤害-60%",
    ),
    makeVariant(
      "auxiliary_rebalance_combo",
      3,
      "Auxiliary Rebalance III (Combo)",
      "Combo Skill cooldown -60%; Battle Skill DMG -60%",
      "连携技冷却时间-60%，战技伤害-60%",
    ),
  ],
};

const SUPPRESSION: ContingencyContractDefinition = {
  id: "suppression",
  variants: [
    makeVariant(
      "suppression_1",
      1,
      "Suppression I",
      "For each layer of Vulnerability or Arts Infliction on the enemy, corresponding DMG taken -10%",
      "敌人每有一层破防或法术附着，其受到的对应种类伤害-10%。",
      [{ type: "SUPPRESSION_ON_INFLICTION_APPLIED", value: -0.45 }],
    ),
  ],
};

const LOCKED_CONTROL: ContingencyContractDefinition = {
  id: "locked_control",
  variants: [
    makeVariant(
      "locked_control_1",
      2,
      "Locked Control II",
      "Cannot switch the controlled operator after battle starts",
      "战斗开始后，禁止切换主控干员",
    ),
  ],
};

const TOXIC_REMAINS: ContingencyContractDefinition = {
  id: "toxic_remains",
  variants: [
    makeVariant(
      "toxic_remains_1",
      1,
      "Toxic Remains I",
      "Defeated enemies leave toxic matter that deals 2% Max HP DMG per second to operators standing in it",
      "敌人被击败后会留下有毒物质，干员处于其中时每秒受到2%最大生命值伤害",
    ),
    makeVariant(
      "toxic_remains_2",
      2,
      "Toxic Remains II",
      "Defeated enemies leave toxic matter that deals 5% Max HP DMG per second to operators standing in it",
      "敌人被击败后会留下有毒物质，干员处于其中时每秒受到5%最大生命值伤害",
    ),
  ],
};

const BATTLE_SKILL_CRYO: ContingencyContractDefinition = {
  id: "battle_skill_cryo",
  variants: [
    makeVariant(
      "battle_skill_cryo_1",
      1,
      "Battle Skill Cryo I",
      "Every 2 Battle Skill casts give the controlled operator 1 stack of Cryo Infliction. Triggers at most once every 3s",
      "每两次干员释放战技时，主控干员获得一层寒冷附着。该效果每3s最多触发一次",
    ),
    makeVariant(
      "battle_skill_cryo_2",
      2,
      "Battle Skill Cryo II",
      "Every Battle Skill cast gives the controlled operator 1 stack of Cryo Infliction. Triggers at most once every 3s",
      "每次干员释放战技时，主控干员获得一层寒冷附着。该效果每3s最多触发一次",
    ),
  ],
};

const COMBO_SKILL_CRYO: ContingencyContractDefinition = {
  id: "combo_skill_cryo",
  variants: [
    makeVariant(
      "combo_skill_cryo_1",
      1,
      "Combo Skill Cryo I",
      "Every 2 Combo Skill casts give the controlled operator 1 stack of Cryo Infliction. Triggers at most once every 3s",
      "每两次干员释放连携技时，主控干员获得一层寒冷附着。该效果每3s最多触发一次",
    ),
    makeVariant(
      "combo_skill_cryo_2",
      2,
      "Combo Skill Cryo II",
      "Every Combo Skill cast gives the controlled operator 1 stack of Cryo Infliction. Triggers at most once every 3s",
      "每次干员释放连携技时，主控干员获得一层寒冷附着。该效果每3s最多触发一次",
    ),
  ],
};

const FROZEN_DURATION: ContingencyContractDefinition = {
  id: "frozen_duration",
  variants: [
    makeVariant(
      "frozen_duration_heat",
      1,
      "Frozen Duration I (Heat)",
      "Frozen duration becomes 15s; casting a Heat skill removes Frozen",
      "干员被冻结的持续时间改为15s，释放灼热系技能可以解除冻结",
    ),
    makeVariant(
      "frozen_duration_nature",
      1,
      "Frozen Duration I (Nature)",
      "Frozen duration becomes 15s; casting a Nature skill removes Frozen",
      "干员被冻结的持续时间改为15s，释放自然系技能可以解除冻结",
    ),
    makeVariant(
      "frozen_duration_electric",
      1,
      "Frozen Duration I (Electric)",
      "Frozen duration becomes 15s; casting an Electric skill removes Frozen",
      "干员被冻结的持续时间改为15s，释放电磁系技能可以解除冻结",
    ),
    makeVariant(
      "frozen_duration_physical",
      1,
      "Frozen Duration I (Physical)",
      "Frozen duration becomes 15s; casting a Physical skill removes Frozen",
      "干员被冻结的持续时间改为15s，释放物理系技能可以解除冻结",
    ),
  ],
};

const DIRECT_FREEZE: ContingencyContractDefinition = {
  id: "direct_freeze",
  variants: [
    makeVariant(
      "direct_freeze_1",
      3,
      "Direct Freeze III",
      "When enemies would apply Cryo Infliction to the controlled operator, they directly inflict Frozen instead",
      "敌人对主控干员施加寒冷附着时改为直接冻结",
    ),
  ],
};

const CONTROLLED_HEALING: ContingencyContractDefinition = {
  id: "controlled_healing",
  variants: [
    makeVariant(
      "controlled_healing_1",
      1,
      "Controlled Healing I",
      "While affected by control effects, the enemy restores 5% Max HP per second",
      "敌人受到控制效果影响时，每秒恢复5%最大生命值",
    ),
    makeVariant(
      "controlled_healing_2",
      2,
      "Controlled Healing II",
      "While affected by control effects, the enemy restores 15% Max HP per second",
      "敌人受到控制效果影响时，每秒恢复15%最大生命值",
    ),
  ],
};

const FINAL_WAVE_REPLACEMENT: ContingencyContractDefinition = {
  id: "final_wave_replacement",
  variants: [
    makeVariant(
      "final_wave_replacement_1",
      1,
      "Final Wave Replacement I",
      "In the final wave, Horned Angel and Heavy Stinger Angel are replaced by Horned Angel α and Heavy Stinger Angel α",
      "最终波次的冈角天使和重刺天使替换为冈角天使 α 和重刺天使 α",
    ),
  ],
};

export const CONTINGENCY_CONTRACTS: ContingencyContractDefinition[] = [
  MAIN_ATTR_DOWN,
  STIMULATION,
  TIME_LIMIT,
  VITALITY,
  DECAPITATION,
  IMPRISONMENT,
  HEALING_CLUSTER,
  BLADEBREAKING,
  BARRIER,
  SWIFTEND,
  REBOUNDING_VITALITY,
  BASIC_ATTACK_BREAKDOWN,
  LIFE_CAP_WOUND,
  AUXILIARY_REBALANCE,
  SUPPRESSION,
  LOCKED_CONTROL,
  TOXIC_REMAINS,
  BATTLE_SKILL_CRYO,
  COMBO_SKILL_CRYO,
  FROZEN_DURATION,
  DIRECT_FREEZE,
  CONTROLLED_HEALING,
  FINAL_WAVE_REPLACEMENT,
];

export const CONTINGENCY_CONTRACT_BY_ID: Record<string, ContingencyContractDefinition> =
  Object.fromEntries(CONTINGENCY_CONTRACTS.map((contract) => [contract.id, contract]));

export function getContingencyContractVariant(
  contractId: string,
  variantId: string | null | undefined,
): ContingencyContractVariant | null {
  const contract = CONTINGENCY_CONTRACT_BY_ID[contractId];
  if (!contract) {
    return null;
  }
  return contract.variants.find((variant) => variant.id === variantId) ?? null;
}

export function getLocalizedContingencyContractVariantName(
  variant: ContingencyContractVariant,
  locale: "en" | "zh-CN",
): string {
  return locale === "zh-CN"
    ? (variant.zhName ?? variant.name)
    : variant.name;
}

export function getLocalizedContingencyContractVariantDescription(
  variant: ContingencyContractVariant,
  locale: "en" | "zh-CN",
): string {
  return locale === "zh-CN"
    ? (variant.zhDescription ?? variant.description)
    : variant.description;
}

export function normalizeActiveContingencyContracts(value: unknown): ActiveContingencyContract[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const typed = entry as { id?: unknown; variantId?: unknown; level?: unknown };
      const contractId = typeof typed.id === "string" ? typed.id : "";
      if (!contractId) {
        return null;
      }
      const contract = CONTINGENCY_CONTRACT_BY_ID[contractId];
      if (!contract) {
        return null;
      }
      if (typeof typed.variantId === "string") {
        const variant = contract.variants.find((candidate) => candidate.id === typed.variantId);
        if (variant) {
          return { id: contractId, variantId: variant.id };
        }
      }
      const level = Number.isFinite(typed.level) ? Math.max(1, Math.floor(Number(typed.level))) : 0;
      if (level <= 0) {
        return null;
      }
      const variant = contract.variants.find((candidate) => candidate.level === level)
        ?? contract.variants[0]
        ?? null;
      if (!variant) {
        return null;
      }
      return { id: contractId, variantId: variant.id };
    })
    .filter((entry): entry is ActiveContingencyContract => entry != null);
}

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
    const variant = contract?.variants.find((entry) => entry.id === active.variantId) ?? null;
    if (!contract || !variant) {
      continue;
    }

    for (const effect of variant.effects) {
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
      resolved.decapitationDamageTakenPct = Math.max(
        resolved.decapitationDamageTakenPct ?? 0,
        variant.level === 2 ? 1 : 0.5,
      );
    }
    if (active.id === "bladebreaking") {
      resolved.bladebreakingUltimateDmgPct = Math.min(
        resolved.bladebreakingUltimateDmgPct ?? 0,
        variant.level === 2 ? -1 : -0.5,
      );
    }
    if (active.id === "barrier") {
      resolved.barrierInflictionIntervalSeconds = Math.max(
        resolved.barrierInflictionIntervalSeconds ?? 0,
        5,
      );
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

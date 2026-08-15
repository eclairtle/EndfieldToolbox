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
  iconId?: string;
  hidden?: boolean;
  effects: ContingencyContractEffect[];
};

export type ContingencyContractDefinition = {
  id: string;
  groupAlias?: string;
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
  encasementActive: boolean;
  swiftendActive: boolean;
  suppressionOnInflictionEffects: Array<{
    value: number;
    durationSeconds: number;
    timeScale: TimeScale;
  }>;
  basicAttackDamagePctValues: number[];
  battleSkillDamagePctValues: number[];
  nonCommandDamagePctValues: number[];
  battleTimeLimitSeconds?: number;
  decapitationDamageTakenPct?: number;
  bladebreakingUltimateDmgPct?: number;
  barrierInflictionIntervalSeconds?: number;
  comboCooldownFinalMultiplier?: number;
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

type ContingencyContractVariantText = {
  name: string;
  description: string;
  zhName: string;
  zhDescription: string;
};

type ContingencyContractUiMetadata = {
  groupAlias?: string;
  variantIconIds?: Partial<Record<string, string>>;
};

const HIDDEN_CONTRACT_VARIANT_IDS = new Set<string>([]);

const CONTRACT_VARIANT_TEXTS: Partial<Record<string, ContingencyContractVariantText>> = {
  main_attr_down_1: {
    name: "Team: WeakenⅠ",
    description: "Operator Attributes -10%.",
    zhName: "队列：萎缩Ⅰ",
    zhDescription: "干员主能力值-10%",
  },
  main_attr_down_2: {
    name: "Team: WeakenⅡ",
    description: "Operator Attributes -20%.",
    zhName: "队列：萎缩Ⅱ",
    zhDescription: "干员主能力值-20%",
  },
  main_attr_down_3: {
    name: "Team: WeakenⅢ",
    description: "Operator Attributes -40%.",
    zhName: "队列：萎缩Ⅲ",
    zhDescription: "干员主能力值-40%",
  },
  stimulation_1: {
    name: "Edit: ThrillⅠ",
    description: "DMG Dealt by enemies +30%.",
    zhName: "改写：刺激Ⅰ",
    zhDescription: "敌人造成伤害+30%",
  },
  stimulation_2: {
    name: "Edit: ThrillⅡ",
    description: "DMG Dealt by enemies +80%.",
    zhName: "改写：刺激Ⅱ",
    zhDescription: "敌人造成伤害+80%",
  },
  time_limit_1: {
    name: "Ambient: Time LimitⅠ",
    description: "Timer -100s.",
    zhName: "环境：时限Ⅰ",
    zhDescription: "倒计时-100秒",
  },
  time_limit_2: {
    name: "Ambient: Time LimitⅡ",
    description: "Timer -200s.",
    zhName: "环境：时限Ⅱ",
    zhDescription: "倒计时-200秒",
  },
  time_limit_3: {
    name: "Ambient: Time LimitⅢ",
    description: "Timer -300s.",
    zhName: "环境：时限Ⅲ",
    zhDescription: "倒计时-300秒",
  },
  vitality_1: {
    name: "Edit: VitalityⅠ",
    description: "Enemy HP +50%.",
    zhName: "改写：活性Ⅰ",
    zhDescription: "敌人生命值+50%",
  },
  vitality_2: {
    name: "Edit: VitalityⅡ",
    description: "Enemy HP +100%.",
    zhName: "改写：活性Ⅱ",
    zhDescription: "敌人生命值+100%",
  },
  vitality_3: {
    name: "Edit: VitalityⅢ",
    description: "Enemy HP +200%.",
    zhName: "改写：活性Ⅲ",
    zhDescription: "敌人生命值+200%",
  },
  decapitation_1: {
    name: "Team: DecapitateⅠ",
    description: "DMG Taken by the controlled operator +50%.",
    zhName: "队列：斩首Ⅰ",
    zhDescription: "主控干员受到伤害+50%",
  },
  decapitation_2: {
    name: "Team: DecapitateⅡ",
    description: "DMG Taken by the controlled operator +100%.",
    zhName: "队列：斩首Ⅱ",
    zhDescription: "主控干员受到伤害+100%",
  },
  imprisonment_1: {
    name: "Ambient: Hypoxia",
    description: "Stamina Regen Rate -50%.",
    zhName: "环境：厌氧",
    zhDescription: "体力恢复速度-50%",
  },
  imprisonment_2: {
    name: "Ambient: Mire",
    description: "Dodge cannot be performed.",
    zhName: "环境：禁锢",
    zhDescription: "禁止闪避",
  },
  healing_cluster_1: {
    name: "Ambient: WitheringⅠ",
    description: "Only 1 Healing Mass is generated between waves.",
    zhName: "环境：枯萎Ⅰ",
    zhDescription: "波次间隔只产生1个治愈团块",
  },
  healing_cluster_2: {
    name: "Ambient: WitheringⅡ",
    description: "No Healing Masses are generated between waves.",
    zhName: "环境：枯萎Ⅱ",
    zhDescription: "波次间隔不产生治愈团块",
  },
  bladebreaking_1: {
    name: "Team: Bent EdgesⅠ",
    description: "Whenever an operator casts an ultimate, Ultimate DMG Dealt by the said operator's subsequent ultimates -50%.",
    zhName: "队列：折刃Ⅰ",
    zhDescription: "干员每施放一次终结技，该干员之后的终结技伤害-50%",
  },
  bladebreaking_2: {
    name: "Team: Bent EdgesⅡ",
    description: "Whenever an operator casts an ultimate, Ultimate DMG Dealt by the said operator's subsequent ultimates -100%.",
    zhName: "队列：折刃Ⅱ",
    zhDescription: "干员每施放一次终结技，该干员之后的终结技伤害-100%",
  },
  barrier_1: {
    name: "Edit: Effect Barrier",
    description: "Vulnerability or Arts Infliction of the same element can only be applied to the same enemy once every 5s.",
    zhName: "改写：屏障",
    zhDescription: "每个敌人每5秒只能被施加一次破防或同类型的法术附着",
  },
  swiftend_1: {
    name: "Edit: Rush",
    description: "Enemy movement speed +100%. Enemies also do not suffer more than 25% Max HP of DMG within 0.1s.",
    zhName: "改写：奔腾",
    zhDescription: "敌人移动速度+100%，0.1秒内受到的伤害不会超过最大生命值的25%",
  },
  rebounding_vitality_1: {
    name: "Ambient: Synced Growth",
    description: "Whenever the controlled operator is restored for 10% Max HP or acquires a shield with 20% Max HP, every enemy in the battlefield is also restored for 8% Max HP.",
    zhName: "环境：同步生长",
    zhDescription: "主控干员每实际回复10%最大生命值或获得20%最大生命值的护盾时，场上敌人回复8%最大生命值",
  },
  encumbered_1: {
    name: "Team: EncumberedⅠ",
    description: "Natural SP Recovery is temporarily paused when the controlled operator has not dealt a Final Strike to the enemy for 12 seconds.",
    zhName: "队列：重负Ⅰ",
    zhDescription: "主控干员12秒内未对敌人造成重击时，暂停技力自然恢复",
  },
  basic_attack_breakdown_1: {
    name: "Team: Poor Basics",
    description: "Operator's Basic Attack DMG Dealt -70%.",
    zhName: "队列：脱力",
    zhDescription: "干员普通攻击伤害-70%",
  },
  life_cap_wound_1: {
    name: "Team: Whittle Down",
    description: "When operators take DMG, part of that DMG will be converted to Max HP Reduction. Conversion rates: 30% (for melee operators) / 50% (for ranged operators)",
    zhName: "队列：衰竭",
    zhDescription: "近战干员受到伤害的30%会转为减少生命值上限，远程干员转化率为50%",
  },
  auxiliary_rebalance_misc: {
    name: "Ambient: Tremor",
    description: "Operators' DMG Dealt +100% for any DMG not dealt by Basic Attack, Battle Skill, Combo Skill, or Ultimate. Battle Skill DMG Dealt -60%.",
    zhName: "环境：震荡",
    zhDescription: "干员除普通攻击、战技、连携技和终结技以外的伤害+100%，战技伤害-60%",
  },
  auxiliary_rebalance_combo: {
    name: "Ambient: Overclock",
    description: "Length of Operator Combo Skill Cooldown -60%; Battle Skill DMG Dealt -60%.",
    zhName: "环境：过速",
    zhDescription: "干员连携技冷却时间-60%，战技伤害-60%",
  },
  suppression_1: {
    name: "Team: RestraintⅠ",
    description: "When an operator applies Vulnerability or Arts Infliction stacks, DMG Dealt (of the corresponding type) by the said operator -45% for 10s.",
    zhName: "队列：扼制Ⅰ",
    zhDescription: "干员使敌人的破防或法术附着层数增加后，该干员造成的对应类型伤害-45%，持续10秒",
  },
  suppression_2: {
    name: "Team: RestraintⅡ",
    description: "When an operator applies Vulnerability or Arts Infliction stacks, DMG Dealt (of the corresponding type) by the said operator -90% for 10s.",
    zhName: "队列：扼制Ⅱ",
    zhDescription: "干员使敌人的破防或法术附着层数增加后，该干员造成的对应类型伤害-90%，持续10秒",
  },
  locked_control_1: {
    name: "Ambient: Partition",
    description: "Cannot switch controlled operator once battle begins.",
    zhName: "环境：分隔",
    zhDescription: "战斗开始后，禁止切换主控干员",
  },
  encasement_1: {
    name: "Edit: Encasement",
    description: "For each stack of Vulnerability or Arts Infliction on an enemy, DMG Dealt of the corresponding type to them -10%. This effect disappears 0.1s after those stacks expire.",
    zhName: "改写：裹附",
    zhDescription: "每个敌人每有一层破防或法术附着，受到的对应类型伤害-10%。该效果会在破防或法术附着结束后延迟0.1秒消失",
  },
  toxic_remains_1: {
    name: "Edit: Toxic ResidueⅠ",
    description: "A defeated enemy will leave a patch of toxins on the battlefield. Operators caught within the patch take 2% Max HP of DMG per second.",
    zhName: "改写：遗毒Ⅰ",
    zhDescription: "敌人被击败后会留下有毒物质，干员处于其中时每秒受到2%最大生命值伤害",
  },
  toxic_remains_2: {
    name: "Edit: Toxic ResidueⅡ",
    description: "A defeated enemy will leave a patch of toxins on the battlefield. Operators caught within the patch take 5% Max HP of DMG per second.",
    zhName: "改写：遗毒Ⅱ",
    zhDescription: "敌人被击败后会留下有毒物质，干员处于其中时每秒受到5%最大生命值伤害",
  },
  battle_skill_cryo_1: {
    name: "Team: Battle ChillⅠ",
    description: "Whenever operators cast battle skill 2 time(s), apply 1 stack of Cryo Infliction to the controlled operator. Effect trigger cooldown for each operator: 3s.",
    zhName: "队列：失温Ⅰ",
    zhDescription: "干员每施放2次战技，主控干员获得一层寒冷附着。每名干员3秒冷却时间",
  },
  battle_skill_cryo_2: {
    name: "Team: Battle ChillⅡ",
    description: "Whenever operators cast battle skill 1 time(s), apply 1 stack of Cryo Infliction to the controlled operator. Effect trigger cooldown for each operator: 3s.",
    zhName: "队列：失温Ⅱ",
    zhDescription: "干员每施放1次战技，主控干员获得一层寒冷附着。每名干员3秒冷却时间",
  },
  combo_skill_cryo_1: {
    name: "Team: Heat LossⅠ",
    description: "Whenever operators cast combo skill 2 time(s), apply 1 stack of Cryo Infliction to the controlled operator. Effect trigger cooldown for each operator: 3s.",
    zhName: "队列：热流失Ⅰ",
    zhDescription: "干员每施放2次连携技，主控干员获得一层寒冷附着。每名干员3秒冷却时间",
  },
  combo_skill_cryo_2: {
    name: "Team: Heat LossⅡ",
    description: "Whenever operators cast combo skill 1 time(s), apply 1 stack of Cryo Infliction to the controlled operator. Effect trigger cooldown for each operator: 3s.",
    zhName: "队列：热流失Ⅱ",
    zhDescription: "干员每施放1次连携技，主控干员获得一层寒冷附着。每名干员3秒冷却时间",
  },
  frozen_duration_heat: {
    name: "Ambient: Thermolysis",
    description: "Duration of Solidification applied to the controlled operator is extended to 15s. Casting Heat-type skills can dispel the Solidification.",
    zhName: "环境：融化",
    zhDescription: "主控干员受到的冻结时间增加至15秒，施放灼热类型技能可以解除冻结",
  },
  frozen_duration_nature: {
    name: "Ambient: Biolysis",
    description: "Duration of Solidification applied to the controlled operator is extended to 15s. Casting Nature-type skills can dispel the Solidification.",
    zhName: "环境：升华",
    zhDescription: "主控干员受到的冻结时间增加至15秒，施放自然类型技能可以解除冻结",
  },
  frozen_duration_electric: {
    name: "Ambient: Electrolysis",
    description: "Duration of Solidification applied to the controlled operator is extended to 15s. Casting Electric-type skills can dispel the Solidification.",
    zhName: "环境：电解",
    zhDescription: "主控干员受到的冻结时间增加至15秒，施放电磁类型技能可以解除冻结",
  },
  frozen_duration_physical: {
    name: "Ambient: Physicolysis",
    description: "Duration of Solidification applied to the controlled operator is extended to 15s. Casting Physical-type skills can dispel the Solidification.",
    zhName: "环境：切削",
    zhDescription: "主控干员受到的冻结时间增加至15秒，施放物理类型技能可以解除冻结",
  },
  direct_freeze_1: {
    name: "Edit: FlashfreezeⅡ",
    description: "If an enemy applies Cryo Infliction to the controlled operator, directly convert the effect to Solidification instead.",
    zhName: "改写：热量汲取Ⅱ",
    zhDescription: "敌人对主控干员施加寒冷附着时，转为直接施加冻结",
  },
  controlled_healing_1: {
    name: "Edit: RegenerationⅠ",
    description: "An enemy under crowd control effects regenerates 5% Max HP per second.",
    zhName: "改写：愈合Ⅰ",
    zhDescription: "敌人受到控制效果影响时，每秒回复5%最大生命值",
  },
  controlled_healing_2: {
    name: "Edit: RegenerationⅡ",
    description: "An enemy under crowd control effects regenerates 15% Max HP per second.",
    zhName: "改写：愈合Ⅱ",
    zhDescription: "敌人受到控制效果影响时，每秒回复15%最大生命值",
  },
  final_wave_replacement_1: {
    name: "Ambient: RE-ConstructⅠ",
    description: "Heavy Ram and Heavy Sting enemies in the final wave are replaced by Heavy Ram α and Heavy Sting α.",
    zhName: "环境：再构成Ⅰ",
    zhDescription: "最终波次的“刚角天使”与“重刺天使”变为“刚角天使α”与“重刺天使α”",
  },
  final_wave_replacement_2: {
    name: "Ambient: RE-ConstructⅡ",
    description: "Heavy Ram and Heavy Sting enemies in the third and fourth waves are replaced by Heavy Ram α and Heavy Sting α.",
    zhName: "环境：再构成Ⅱ",
    zhDescription: "第三、四波次的“刚角天使”与“重刺天使”变为“刚角天使α”与“重刺天使α”",
  },
};

const CONTRACT_UI_METADATA: Partial<Record<string, ContingencyContractUiMetadata>> = {
  main_attr_down: {
    variantIconIds: {
      main_attr_down_1: "302",
      main_attr_down_2: "303",
      main_attr_down_3: "304",
    },
  },
  stimulation: {
    variantIconIds: {
      stimulation_1: "101",
      stimulation_2: "102",
    },
  },
  time_limit: {
    variantIconIds: {
      time_limit_1: "111",
      time_limit_2: "112",
      time_limit_3: "301",
    },
  },
  vitality: {
    variantIconIds: {
      vitality_1: "114",
      vitality_2: "115",
      vitality_3: "116",
    },
  },
  decapitation: {
    variantIconIds: {
      decapitation_1: "117",
      decapitation_2: "118",
    },
  },
  imprisonment: {
    variantIconIds: {
      imprisonment_1: "103",
      imprisonment_2: "104",
    },
  },
  healing_cluster: {
    variantIconIds: {
      healing_cluster_1: "107",
      healing_cluster_2: "108",
    },
  },
  bladebreaking: {
    variantIconIds: {
      bladebreaking_1: "207",
      bladebreaking_2: "208",
    },
  },
  barrier: {
    groupAlias: "barrier_swiftend_breakdown",
    variantIconIds: {
      barrier_1: "124",
    },
  },
  swiftend: {
    groupAlias: "barrier_swiftend_breakdown",
    variantIconIds: {
      swiftend_1: "136",
    },
  },
  rebounding_vitality: {
    groupAlias: "encumbered_rebounding_vitality_life_cap_wound",
    variantIconIds: {
      rebounding_vitality_1: "307",
    },
  },
  encumbered: {
    groupAlias: "encumbered_rebounding_vitality_life_cap_wound",
    variantIconIds: {
      encumbered_1: "312",
    },
  },
  basic_attack_breakdown: {
    groupAlias: "barrier_swiftend_breakdown",
    variantIconIds: {
      basic_attack_breakdown_1: "209",
    },
  },
  life_cap_wound: {
    groupAlias: "encumbered_rebounding_vitality_life_cap_wound",
    variantIconIds: {
      life_cap_wound_1: "127",
    },
  },
  auxiliary_rebalance: {
    variantIconIds: {
      auxiliary_rebalance_misc: "306",
      auxiliary_rebalance_combo: "201",
    },
  },
  suppression: {
    variantIconIds: {
      suppression_1: "122",
      suppression_2: "123",
    },
  },
  locked_control: {
    groupAlias: "encasement_locked_control",
    variantIconIds: {
      locked_control_1: "125",
    },
  },
  encasement: {
    groupAlias: "encasement_locked_control",
    variantIconIds: {
      encasement_1: "308",
    },
  },
  toxic_remains: {
    variantIconIds: {
      toxic_remains_1: "129",
      toxic_remains_2: "130",
    },
  },
  battle_skill_cryo: {
    variantIconIds: {
      battle_skill_cryo_1: "203",
      battle_skill_cryo_2: "204",
    },
  },
  combo_skill_cryo: {
    variantIconIds: {
      combo_skill_cryo_1: "205",
      combo_skill_cryo_2: "206",
    },
  },
  frozen_duration: {
    variantIconIds: {
      frozen_duration_heat: "132",
      frozen_duration_nature: "133",
      frozen_duration_electric: "134",
      frozen_duration_physical: "210",
    },
  },
  direct_freeze: {
    variantIconIds: {
      direct_freeze_1: "135",
    },
  },
  controlled_healing: {
    variantIconIds: {
      controlled_healing_1: "119",
      controlled_healing_2: "120",
    },
  },
  final_wave_replacement: {
    variantIconIds: {
      final_wave_replacement_1: "310",
      final_wave_replacement_2: "311",
    },
  },
};

function applyContractVariantTexts(
  contract: ContingencyContractDefinition,
): ContingencyContractDefinition {
  return {
    ...contract,
    variants: contract.variants.map((variant) => {
      const text = CONTRACT_VARIANT_TEXTS[variant.id];
      if (!text) {
        return {
          ...variant,
          hidden: HIDDEN_CONTRACT_VARIANT_IDS.has(variant.id),
        };
      }
      return {
        ...variant,
        name: text.name,
        description: text.description,
        zhName: text.zhName,
        zhDescription: text.zhDescription,
        hidden: HIDDEN_CONTRACT_VARIANT_IDS.has(variant.id),
      };
    }),
  };
}

function applyContractUiMetadata(
  contract: ContingencyContractDefinition,
): ContingencyContractDefinition {
  const metadata = CONTRACT_UI_METADATA[contract.id];
  if (!metadata) {
    return contract;
  }
  return {
    ...contract,
    groupAlias: metadata.groupAlias ?? contract.groupAlias,
    variants: contract.variants.map((variant) => ({
      ...variant,
      iconId: metadata.variantIconIds?.[variant.id] ?? variant.iconId,
    })),
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

const ENCUMBERED: ContingencyContractDefinition = {
  id: "encumbered",
  variants: [
    makeVariant(
      "encumbered_1",
      1,
      "Encumbered I",
      "Natural SP Recovery is temporarily paused when the controlled operator has not dealt a Final Strike to the enemy for 12 seconds.",
      "主控干员12秒内未对敌人造成重击时，暂停技力自然恢复",
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
      [],
    ),
    makeVariant(
      "auxiliary_rebalance_combo",
      3,
      "Auxiliary Rebalance III (Combo)",
      "Combo Skill cooldown -60%; Battle Skill DMG -60%",
      "连携技冷却时间-60%，战技伤害-60%",
      [],
    ),
  ],
};

const SUPPRESSION: ContingencyContractDefinition = {
  id: "suppression",
  variants: [
    makeVariant(
      "suppression_1",
      1,
      "Team: Restraint I",
      "When an operator applies Vulnerability or Arts Infliction stacks, DMG Dealt (of the corresponding type) by the said operator -45% for 10s.",
      "干员使敌人的破防或法术附着层数增加后，该干员造成的对应类型伤害-45%，持续10秒",
      [{ type: "SUPPRESSION_ON_INFLICTION_APPLIED", value: -0.45, durationSeconds: 10, timeScale: "game" }],
    ),
    makeVariant(
      "suppression_2",
      2,
      "Team: Restraint II",
      "When an operator applies Vulnerability or Arts Infliction stacks, DMG Dealt (of the corresponding type) by the said operator -90% for 10s.",
      "干员使敌人的破防或法术附着层数增加后，该干员造成的对应类型伤害-90%，持续10秒",
      [{ type: "SUPPRESSION_ON_INFLICTION_APPLIED", value: -0.9, durationSeconds: 10, timeScale: "game" }],
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

const ENCASEMENT: ContingencyContractDefinition = {
  id: "encasement",
  variants: [
    makeVariant(
      "encasement_1",
      1,
      "Encasement I",
      "For each stack of Vulnerability or Arts Infliction on an enemy, DMG Dealt of the corresponding type to them -10%",
      "每个敌人每有一层破防或法术附着，受到的对应类型伤害-10%",
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
      "RE-Construct I",
      "Heavy Ram and Heavy Sting enemies in the final wave are replaced by Heavy Ram α and Heavy Sting α",
      "最终波次的“刚角天使”与“重刺天使”变为“刚角天使α”与“重刺天使α”",
    ),
    makeVariant(
      "final_wave_replacement_2",
      2,
      "RE-Construct II",
      "Heavy Ram and Heavy Sting enemies in the third and fourth waves are replaced by Heavy Ram α and Heavy Sting α",
      "第三、四波次的“刚角天使”与“重刺天使”变为“刚角天使α”与“重刺天使α”",
    ),
  ],
};

export const CONTINGENCY_CONTRACTS: ContingencyContractDefinition[] = [
  MAIN_ATTR_DOWN,
  STIMULATION,
  TIME_LIMIT,
  VITALITY,
  SUPPRESSION,
  DECAPITATION,
  IMPRISONMENT,
  HEALING_CLUSTER,
  BLADEBREAKING,
  BARRIER,
  SWIFTEND,
  REBOUNDING_VITALITY,
  ENCUMBERED,
  BASIC_ATTACK_BREAKDOWN,
  LIFE_CAP_WOUND,
  AUXILIARY_REBALANCE,
  LOCKED_CONTROL,
  ENCASEMENT,
  TOXIC_REMAINS,
  BATTLE_SKILL_CRYO,
  COMBO_SKILL_CRYO,
  FROZEN_DURATION,
  DIRECT_FREEZE,
  CONTROLLED_HEALING,
  FINAL_WAVE_REPLACEMENT,
].map(applyContractVariantTexts).map(applyContractUiMetadata);

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

export function getContingencyContractVariantIconAssetPath(
  variant: ContingencyContractVariant,
): string | null {
  return variant.iconId
    ? `/item-icons/contracts/icon_activity_contract_tag_${variant.iconId}.webp`
    : null;
}

export function isContingencyContractVariantVisible(variant: ContingencyContractVariant): boolean {
  return variant.hidden !== true;
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
    encasementActive: false,
    swiftendActive: false,
    suppressionOnInflictionEffects: [],
    basicAttackDamagePctValues: [],
    battleSkillDamagePctValues: [],
    nonCommandDamagePctValues: [],
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
        resolved.suppressionOnInflictionEffects.push({
          value: effect.value,
          durationSeconds: effect.durationSeconds ?? 10,
          timeScale: effect.timeScale ?? "game",
        });
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
    if (active.id === "basic_attack_breakdown") {
      resolved.basicAttackDamagePctValues.push(-0.7);
    }
    if (active.id === "auxiliary_rebalance") {
      if (active.variantId === "auxiliary_rebalance_misc") {
        resolved.nonCommandDamagePctValues.push(1.0);
        resolved.battleSkillDamagePctValues.push(-0.6);
      } else if (active.variantId === "auxiliary_rebalance_combo") {
        resolved.battleSkillDamagePctValues.push(-0.6);
        resolved.comboCooldownFinalMultiplier = Math.min(
          resolved.comboCooldownFinalMultiplier ?? 1,
          0.4,
        );
      }
    }
    if (active.id === "encasement") {
      resolved.encasementActive = true;
    }
    if (active.id === "swiftend") {
      resolved.swiftendActive = true;
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

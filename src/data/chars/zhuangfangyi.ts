import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import {
  flat12,
  pct,
  type CommandDefinition,
  type CommandHitEffectDefinition,
  type ExecuteHitDefinition,
} from "@/lib/commands";

const ZHUANGFANGYI_TALENT_1_1 = "zhuangfangyi_force_of_nature_1";
const ZHUANGFANGYI_TALENT_1_2 = "zhuangfangyi_force_of_nature_2";
const ZHUANGFANGYI_TALENT_2_1 = "zhuangfangyi_ordained_by_heaven_1";
const ZHUANGFANGYI_TALENT_2_2 = "zhuangfangyi_ordained_by_heaven_2";

const ZHUANGFANGYI_ULTIMATE_BUFF = "zhuangfangyi_empyrean_of_truth";
const ZHUANGFANGYI_ULTIMATE_PAUSE_STATUS = "zhuangfangyi_empyrean_of_truth_pause";
const ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF = "zhuangfangyi_empyrean_free_battle_skill";
const ZHUANGFANGYI_ULTIMATE_COMBO_COOLDOWN_RATE_BUFF = "zhuangfangyi_empyrean_combo_cooldown_rate";
const ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_CAST_BUFF = "zhuangfangyi_empyrean_free_battle_skill_cast";
const ZHUANGFANGYI_SUNDERBLADE_STATUS = "zhuangfangyi_sunderblade";
const ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF = "zhuangfangyi_sunderblade_counter";
const ZHUANGFANGYI_CONSUMED_ELECTRIFICATION_COUNTER_BUFF = "zhuangfangyi_consumed_electrification_counter";
const ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BUFF = "zhuangfangyi_force_of_nature_amp";
const ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BONUS_BUFF = "zhuangfangyi_force_of_nature_amp_bonus";
const ZHUANGFANGYI_FORCE_OF_NATURE_CONTROLLER_STATUS = "zhuangfangyi_force_of_nature_controller";
const ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX = "zhuangfangyi_battle_skill_thunderstrike";
const ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX = "zhuangfangyi_ultimate_battle_skill_thunderstrike";
const ZHUANGFANGYI_COMBO_TRIGGER_ID = "zhuangfangyi_combo";
const ZHUANGFANGYI_THUNDERSTRIKE_START_DELAY_FRAMES = 12;
const ZHUANGFANGYI_THUNDERSTRIKE_REPEAT_INTERVAL_FRAMES = 18;
const ZHUANGFANGYI_SUNDERBLADE_MAX_STACKS = 9;
const ZHUANGFANGYI_SUNDERBLADE_FREE_CREATE_LIMIT = 3;
const ZHUANGFANGYI_SUNDERBLADE_CREATE_PER_CAST_LIMIT = 3;
const ZHUANGFANGYI_SUNDERBLADE_DURATION_SECONDS = 36;
const ZHUANGFANGYI_SUNDERBLADE_COUNTER_DURATION_SECONDS = 8;
const ZHUANGFANGYI_ULTIMATE_DURATION_SECONDS = 25;

const ZHUANGFANGYI_COMBO_COMMAND_IDS = new Set([
  "zhuangfangyi_combo_skill",
  "zhuangfangyi_ultimate_combo_skill",
]);
const ZHUANGFANGYI_BATTLE_SKILL_COMMAND_IDS = new Set([
  "zhuangfangyi_battle_skill",
  "zhuangfangyi_ultimate_battle_skill",
]);

function getForceOfNatureConfig(isTalent11Enabled: boolean, isTalent12Enabled: boolean) {
  if (isTalent12Enabled) {
    return { baseAmp: 0.18, bonusAmp: 0.02, durationSeconds: 5 };
  }
  if (isTalent11Enabled) {
    return { baseAmp: 0.09, bonusAmp: 0.01, durationSeconds: 5 };
  }
  return null;
}

function makeThunderStrikeHitId(prefix: string, consumedStacks: number, isFinalHit: boolean) {
  return `${prefix}_${consumedStacks}_${isFinalHit ? "final" : "repeat"}`;
}

function makeThunderStrikeCritRigOption(args: {
  id: string;
  label: string;
  prefix: string;
  isFinalHit: boolean;
}) {
  return {
    id: args.id,
    label: args.label,
    hitNames: [args.label],
    hitRefIds: Array.from({ length: 5 }, (_, consumedStacks) =>
      makeThunderStrikeHitId(args.prefix, consumedStacks, args.isFinalHit),
    ),
  };
}

function makeHiddenCounterBuff(args: {
  buffId: string;
  label: string;
  stacks: number;
  maxStacks: number;
}): CommandHitEffectDefinition {
  return {
    type: "APPLY_BUFF",
    target: "self",
    buffId: args.buffId,
    label: args.label,
    hidden: true,
    stacks: args.stacks,
    stackGroup: args.buffId,
    maxStacks: args.maxStacks,
    durationSeconds: ZHUANGFANGYI_SUNDERBLADE_COUNTER_DURATION_SECONDS,
    timeScale: "game",
  };
}

function buildBattleSkillSetupEffects(args: {
  activeSunderbladesAfterCast: number;
  consumedElectrification: number;
  createdSunderblades: number;
  sunderbladeDurationSeconds: number;
}): CommandHitEffectDefinition[] {
  const effects: CommandHitEffectDefinition[] = [
    { type: "REMOVE_BUFF", target: "self", buffId: ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF, stacks: 99 },
    { type: "REMOVE_BUFF", target: "self", buffId: ZHUANGFANGYI_CONSUMED_ELECTRIFICATION_COUNTER_BUFF, stacks: 99 },
    makeHiddenCounterBuff({
      buffId: ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF,
      label: "Active Sunderblades",
      stacks: args.activeSunderbladesAfterCast,
      maxStacks: ZHUANGFANGYI_SUNDERBLADE_MAX_STACKS,
    }),
  ];

  if (args.consumedElectrification > 0) {
    effects.push(
      makeHiddenCounterBuff({
        buffId: ZHUANGFANGYI_CONSUMED_ELECTRIFICATION_COUNTER_BUFF,
        label: "Consumed Electrification",
        stacks: args.consumedElectrification,
        maxStacks: 4,
      }),
    );
  }

  if (args.createdSunderblades > 0) {
    effects.push({
      type: "APPLY_STATUS",
      target: "self",
      statusId: ZHUANGFANGYI_SUNDERBLADE_STATUS,
      label: "Sunderblade",
      durationSeconds: args.sunderbladeDurationSeconds,
      timeScale: "game",
      fieldStatus: true,
      stacks: args.createdSunderblades,
      maxStacks: ZHUANGFANGYI_SUNDERBLADE_MAX_STACKS,
      refreshExistingStacks: false,
      independentStacks: true,
    });
  }

  return effects;
}

function buildThunderStrikeExecuteEffects(args: {
  activeSunderblades: number;
  consumedElectrification: number;
  hitPrefix: string;
}): CommandHitEffectDefinition[] {
  const repeatedStrikeCount = Math.max(0, args.activeSunderblades - 1);
  const effects: CommandHitEffectDefinition[] = [];

  if (repeatedStrikeCount > 0) {
    effects.push({
      type: "EXECUTE_HIT",
      hitRefId: makeThunderStrikeHitId(args.hitPrefix, args.consumedElectrification, false),
      commandName: "Mantra of Sundering",
      hitName: "Thunder Strike",
      times: repeatedStrikeCount,
      executeDelayFrames: ZHUANGFANGYI_THUNDERSTRIKE_START_DELAY_FRAMES,
      repeatIntervalFrames: ZHUANGFANGYI_THUNDERSTRIKE_REPEAT_INTERVAL_FRAMES,
      registerAtInitialTime: true,
    });
  }

  effects.push({
    type: "EXECUTE_HIT",
    hitRefId: makeThunderStrikeHitId(args.hitPrefix, args.consumedElectrification, true),
    commandName: "Mantra of Sundering",
    hitName: "Final Thunder Strike",
    executeDelayFrames:
      ZHUANGFANGYI_THUNDERSTRIKE_START_DELAY_FRAMES
      + repeatedStrikeCount * ZHUANGFANGYI_THUNDERSTRIKE_REPEAT_INTERVAL_FRAMES,
    registerAtInitialTime: true,
  });

  return effects;
}

function makeThunderStrikeExecuteHits(args: {
  prefix: string;
  commandId: string;
  baseScaling: number[];
  bonusScaling: number[];
  applyElectricInflictionOnFinal?: boolean;
}): ExecuteHitDefinition[] {
  const hits: ExecuteHitDefinition[] = [];
  for (let consumedStacks = 0; consumedStacks <= 4; consumedStacks += 1) {
    const totalScaling = args.baseScaling.map((value, index) => value + (args.bonusScaling[index] ?? 0) * consumedStacks);
    hits.push({
      id: makeThunderStrikeHitId(args.prefix, consumedStacks, false),
      commandId: args.commandId,
      commandName: "Mantra of Sundering",
      name: `Thunder Strike (${consumedStacks})`,
      skill: "battleSkill",
      attackType: "BATTLE_SKILL",
      damageType: "Electric",
      multiplier: pct(totalScaling),
      energyReturn: flat12(6),
      offsetFrames: flat12(0),
      postEffects: [
        { type: "REMOVE_BUFF", target: "self", buffId: ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF, stacks: 1 },
      ],
    });
    hits.push({
      id: makeThunderStrikeHitId(args.prefix, consumedStacks, true),
      commandId: args.commandId,
      commandName: "Mantra of Sundering",
      name: `Final Thunder Strike (${consumedStacks})`,
      skill: "battleSkill",
      attackType: "BATTLE_SKILL",
      damageType: "Electric",
      multiplier: pct(totalScaling.map((value) => value * 6)),
      stagger: flat12(15),
      energyReturn: flat12(6),
      offsetFrames: flat12(0),
      postEffects: [
        { type: "REMOVE_BUFF", target: "self", buffId: ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF, stacks: 1 },
        { type: "REMOVE_BUFF", target: "self", buffId: ZHUANGFANGYI_CONSUMED_ELECTRIFICATION_COUNTER_BUFF, stacks: 99 },
      ],
      effects: args.applyElectricInflictionOnFinal
        ? [{ type: "APPLY_ARTS_INFLICTION", element: "Electric", stacks: 1 }]
        : undefined,
    });
  }
  return hits;
}

const ZHUANGFANGYI_EXECUTE_HITS: ExecuteHitDefinition[] = [
  ...makeThunderStrikeExecuteHits({
    prefix: ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX,
    commandId: "zhuangfangyi_battle_skill",
    baseScaling: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45],
    bonusScaling: [3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 9],
  }),
  ...makeThunderStrikeExecuteHits({
    prefix: ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX,
    commandId: "zhuangfangyi_ultimate_battle_skill",
    baseScaling: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
    bonusScaling: [8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18],
    applyElectricInflictionOnFinal: true,
  }),
];

const ZHUANGFANGYI_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (
      ctx.event.type === "BATTLE_SKILL_HIT"
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.event.commandId
      && ZHUANGFANGYI_BATTLE_SKILL_COMMAND_IDS.has(ctx.event.commandId)
      && ctx.event.dealsDamage === true
    ) {
      const forceOfNature = getForceOfNatureConfig(
        ctx.state.isSelfUniqueTalentEnabled(ZHUANGFANGYI_TALENT_1_1),
        ctx.state.isSelfUniqueTalentEnabled(ZHUANGFANGYI_TALENT_1_2),
      );
      if (!forceOfNature || !ctx.state.hasSelfBuff(ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BUFF)) {
        return;
      }

      ctx.state.applyEffects({
        stepId: `${ctx.event.stepId ?? "event"}:zhuangfangyi_force_of_nature_hit`,
        effectTree: ctx.event.effectTree,
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BONUS_BUFF,
            label: "Force of Nature",
            durationSeconds: forceOfNature.durationSeconds,
            timeScale: "game",
            stackGroup: ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BONUS_BUFF,
            maxStacks: ZHUANGFANGYI_SUNDERBLADE_MAX_STACKS,
            refreshExistingStacks: false,
            effects: {
              ELECTRIC_DMG_AMP_PCT: forceOfNature.bonusAmp,
            },
          },
        ],
      });
      return;
    }

    if (
      ctx.event.type !== "BATTLE_SKILL_CAST"
      || ctx.event.sourceSlot !== ctx.self.slot
      || !ctx.event.commandId
      || !ZHUANGFANGYI_BATTLE_SKILL_COMMAND_IDS.has(ctx.event.commandId)
    ) {
      return;
    }

    if (ctx.state.hasSelfBuff(ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_CAST_BUFF)) {
      ctx.state.applyEffects({
        stepId: `${ctx.event.stepId ?? "event"}:zhuangfangyi_consume_free_battle_skill_cast`,
        effects: [
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_CAST_BUFF,
            stacks: 99,
          },
        ],
      });
    }

    const forceOfNature = getForceOfNatureConfig(
      ctx.state.isSelfUniqueTalentEnabled(ZHUANGFANGYI_TALENT_1_1),
      ctx.state.isSelfUniqueTalentEnabled(ZHUANGFANGYI_TALENT_1_2),
    );
    if (!forceOfNature) {
      return;
    }

    ctx.state.applyEffects({
      stepId: `${ctx.event.stepId ?? "event"}:zhuangfangyi_force_of_nature_cast`,
      effectTree: ctx.event.effectTree,
      effects: [
        {
          type: "APPLY_BUFF",
          target: "self",
          buffId: ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BUFF,
          label: "Force of Nature",
          durationSeconds: forceOfNature.durationSeconds,
          timeScale: "game",
          effects: {
            ELECTRIC_DMG_AMP_PCT: forceOfNature.baseAmp,
          },
        },
        {
          type: "APPLY_STATUS",
          target: "self",
          statusId: ZHUANGFANGYI_FORCE_OF_NATURE_CONTROLLER_STATUS,
          label: "Force of Nature",
          durationSeconds: forceOfNature.durationSeconds,
          timeScale: "game",
          hidden: true,
          expireEffects: [
            {
              type: "REMOVE_BUFF",
              target: "self",
              buffId: ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BONUS_BUFF,
              stacks: 99,
            },
          ],
          removeEffects: [
            {
              type: "REMOVE_BUFF",
              target: "self",
              buffId: ZHUANGFANGYI_FORCE_OF_NATURE_AMP_BONUS_BUFF,
              stacks: 99,
            },
          ],
        },
      ],
    });
  },
  onResolvedHit: (ctx) => {
    const electricInfliction = ctx.state.getEnemyArtsInfliction();
    if (
      (ctx.flags.isFinalStrikeOfBasicSequence || ctx.flags.isFinisherHit)
      && ctx.source.isControlledOperatorHit
      && electricInfliction?.element === "Electric"
      && electricInfliction.stacks > 0
    ) {
      ctx.state.triggerSelfCombo({
        sourceEventType: ctx.flags.isFinisherHit ? "FINISHER_HIT" : "BASIC_ATTACK_FINAL_STRIKE_HIT",
        label: "Zhuang Fangyi Combo Triggered",
        comboCommandId: ctx.state.hasSelfBuff(ZHUANGFANGYI_ULTIMATE_BUFF)
          ? "zhuangfangyi_ultimate_combo_skill"
          : "zhuangfangyi_combo_skill",
      });
    }

    const isSelfHit = ctx.source.slot === ctx.self.slot;
    if (!isSelfHit) {
      return;
    }

    if (!ZHUANGFANGYI_COMBO_COMMAND_IDS.has(ctx.source.commandId)) {
      if (!ZHUANGFANGYI_BATTLE_SKILL_COMMAND_IDS.has(ctx.source.commandId)) {
        return;
      }

      if (ctx.source.hitName === "Create Sunderblades") {
        const currentSunderblades = ctx.state.getStatusStackCount({
          statusId: ZHUANGFANGYI_SUNDERBLADE_STATUS,
          target: "self",
        });
        const isFreeUltimateBattleSkill = ctx.state.hasSelfBuff(
          ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_CAST_BUFF,
        );
        const currentElectrification = ctx.state.getStatusStackCount({
          statusId: "electrification",
          target: "enemy",
        });
        const consumedElectrification = isFreeUltimateBattleSkill
          ? 0
          : currentElectrification;
        if (consumedElectrification > 0) {
          ctx.state.applyEffects({
            stepId: `${ctx.stepId}:zhuangfangyi_battle_skill_consume_electrification`,
            effects: [
              { type: "REMOVE_BUFF", target: "enemy", buffId: "electrification" },
            ],
          });
        }
        const baseCreatedSunderblades = isFreeUltimateBattleSkill
          ? 3
          : consumedElectrification > 0
            ? Math.min(ZHUANGFANGYI_SUNDERBLADE_CREATE_PER_CAST_LIMIT, consumedElectrification + 1)
            : currentSunderblades < ZHUANGFANGYI_SUNDERBLADE_FREE_CREATE_LIMIT
              ? 1
              : 0;
        const firstCastBonusSunderblade =
          ctx.state.isSelfPotentialActive(1) && ctx.state.markTriggerOnce("zhuangfangyi_potential_1_first_battle_skill")
            ? 1
            : 0;
        const createdSunderblades = Math.min(
          Math.max(0, ZHUANGFANGYI_SUNDERBLADE_MAX_STACKS - currentSunderblades),
          baseCreatedSunderblades + firstCastBonusSunderblade,
        );
        const sunderbladeDurationSeconds =
          ZHUANGFANGYI_SUNDERBLADE_DURATION_SECONDS + (ctx.state.isSelfPotentialActive(3) ? 10 : 0);
        const activeSunderbladesAfterCast = currentSunderblades + createdSunderblades;
        ctx.state.applyEffects({
          stepId: `${ctx.stepId}:zhuangfangyi_battle_skill_setup`,
          effects: buildBattleSkillSetupEffects({
            activeSunderbladesAfterCast,
            consumedElectrification,
            createdSunderblades,
            sunderbladeDurationSeconds,
          }),
        });
        if (consumedElectrification > 0 && ctx.state.isSelfPotentialActive(3)) {
          ctx.state.grantReturnedSp(10, "Mantra of Sundering SP Return");
        }
        return;
      }

      if (ctx.source.hitName !== "Invoke Thunder Strikes") {
        return;
      }

      const activeSunderblades = ctx.state.getSelfBuffStackCount(ZHUANGFANGYI_SUNDERBLADE_COUNTER_BUFF);
      if (activeSunderblades <= 0) {
        return;
      }
      const consumedElectrification = Math.max(
        0,
        Math.min(4, ctx.state.getSelfBuffStackCount(ZHUANGFANGYI_CONSUMED_ELECTRIFICATION_COUNTER_BUFF)),
      );
      const hitPrefix =
        ctx.source.commandId === "zhuangfangyi_ultimate_battle_skill"
          ? ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX
          : ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX;
      ctx.state.applyEffects({
        stepId: `${ctx.stepId}:zhuangfangyi_battle_skill_strikes`,
        effects: buildThunderStrikeExecuteEffects({
          activeSunderblades,
          consumedElectrification,
          hitPrefix,
        }),
      });
      return;
    }

    if (electricInfliction?.element !== "Electric" || electricInfliction.stacks <= 0) {
      return;
    }

    const consumedStacks = Math.max(1, Math.min(4, electricInfliction.stacks));
    const nextElectrificationLevel = Math.min(
      4,
      consumedStacks + (ctx.state.hasEnemyStatus("electrification") ? 1 : 0),
    );

    ctx.state.emitEvent({
      type: "ARTS_INFLICTION_CONSUMED",
      label: "Electric Infliction Consumed",
      target: "enemy",
      stackDelta: consumedStacks,
    });
    ctx.state.setEnemyArtsInfliction(null);
    ctx.state.applyEffects({
      stepId: `${ctx.stepId}:zhuangfangyi_combo_consume`,
      effects: [
        {
          type: "APPLY_REACTION",
          reaction: "Electrification",
          level: nextElectrificationLevel,
          reactionDamage: true,
        },
      ],
    });
  },
};

const ZHUANGFANGYI_COMMANDS: CommandDefinition[] = [
  {
    id: "zhuangfangyi_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    durationFrames: flat12(228),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    transforms: [
      {
        toCommandId: "zhuangfangyi_ultimate_basic_sequence",
        requiresBuffId: ZHUANGFANGYI_ULTIMATE_BUFF,
      },
    ],
    expandsToCommandIds: [
      "zhuangfangyi_basic_sequence_1",
      "zhuangfangyi_basic_sequence_2",
      "zhuangfangyi_basic_sequence_3",
      "zhuangfangyi_basic_sequence_4",
      "zhuangfangyi_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "zhuangfangyi_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(30),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36]), offsetFrames: flat12(16) },
    ],
  },
  {
    id: "zhuangfangyi_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(42),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54]), offsetFrames: flat12(20) },
    ],
  },
  {
    id: "zhuangfangyi_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(48),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([32, 35, 39, 42, 45, 48, 52, 55, 58, 62, 67, 72]), offsetFrames: flat12(24) },
    ],
  },
  {
    id: "zhuangfangyi_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(54),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), offsetFrames: flat12(28) },
    ],
  },
  {
    id: "zhuangfangyi_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(54),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        multiplier: pct([48, 53, 58, 62, 67, 72, 77, 82, 86, 92, 100, 108]),
        stagger: flat12(18),
        spGenerated: flat12(18),
        requiresControlledOperator: true,
        offsetFrames: flat12(32),
      },
    ],
  },
  {
    id: "zhuangfangyi_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    basicAttackVariant: "finisher",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "zhuangfangyi_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    basicAttackVariant: "dive_attack",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "zhuangfangyi_battle_skill",
    name: "Mantra of Sundering",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(96),
    spCost: flat12(100),
    energyGain: flat12(0),
    transforms: [
      {
        toCommandId: "zhuangfangyi_ultimate_battle_skill",
        requiresBuffIdsAll: [ZHUANGFANGYI_ULTIMATE_BUFF, ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF],
        overrideSpCost: 0,
      },
      {
        toCommandId: "zhuangfangyi_ultimate_battle_skill",
        requiresBuffId: ZHUANGFANGYI_ULTIMATE_BUFF,
      },
    ],
    executeHitCritRigOptions: [
      makeThunderStrikeCritRigOption({
        id: "thunder_strike",
        label: "Thunder Strike",
        prefix: ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX,
        isFinalHit: false,
      }),
      makeThunderStrikeCritRigOption({
        id: "final_thunder_strike",
        label: "Final Thunder Strike",
        prefix: ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX,
        isFinalHit: true,
      }),
    ],
    hits: [
      {
        name: "Create Sunderblades",
        multiplier: flat12(0),
        ignoreEnemyInvulnerability: true,
        offsetFrames: flat12(30),
      },
      {
        name: "Invoke Thunder Strikes",
        multiplier: flat12(0),
        offsetFrames: flat12(46),
      },
    ],
  },
  {
    id: "zhuangfangyi_combo_skill",
    name: "Breath of Transformation",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(102),
    comboCooldownSeconds: flat12(18),
    comboCooldownTimeScale: "real",
    comboTriggerId: ZHUANGFANGYI_COMBO_TRIGGER_ID,
    spCost: flat12(0),
    energyGain: flat12(10),
    timeFreezeSeconds: flat12(32 / 60),
    transforms: [
      {
        toCommandId: "zhuangfangyi_ultimate_combo_skill",
        requiresBuffId: ZHUANGFANGYI_ULTIMATE_BUFF,
      },
    ],
    hits: [
      { multiplier: pct([160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360]), stagger: flat12(10), offsetFrames: flat12(62) },
    ],
  },
  {
    id: "zhuangfangyi_ultimate_basic_sequence",
    name: "Empyrean Basic Sequence",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    variant: "enhanced_basic_attack",
    enhanced: true,
    basicAttackVariant: "sequence",
    noFinisherTransform: true,
    durationFrames: flat12(156),
    spCost: flat12(0),
    expandsToCommandIds: [
      "zhuangfangyi_ultimate_basic_sequence_1",
      "zhuangfangyi_ultimate_basic_sequence_2",
      "zhuangfangyi_ultimate_basic_sequence_3",
    ],
    hits: [],
  },
  {
    id: "zhuangfangyi_ultimate_basic_sequence_1",
    name: "Empyrean Basic Attack I",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    variant: "enhanced_basic_attack",
    enhanced: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(42),
    spCost: flat12(0),
    hits: [
      { multiplier: pct([67, 73, 80, 86, 93, 100, 106, 113, 120, 128, 138, 150]), offsetFrames: flat12(22) },
    ],
  },
  {
    id: "zhuangfangyi_ultimate_basic_sequence_2",
    name: "Empyrean Basic Attack II",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    variant: "enhanced_basic_attack",
    enhanced: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(48),
    spCost: flat12(0),
    hits: [
      { multiplier: pct([94, 103, 112, 122, 131, 140, 150, 159, 168, 180, 194, 210]), offsetFrames: flat12(24) },
    ],
  },
  {
    id: "zhuangfangyi_ultimate_basic_sequence_3",
    name: "Empyrean Final Strike",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    variant: "enhanced_basic_attack",
    enhanced: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(66),
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([134, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300]),
        stagger: flat12(18),
        spGenerated: flat12(20),
        requiresControlledOperator: true,
        offsetFrames: flat12(38),
      },
    ],
  },
  {
    id: "zhuangfangyi_ultimate_battle_skill",
    name: "Mantra of Sundering",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    hiddenInLibrary: true,
    variant: "enhanced_battle_skill",
    enhanced: true,
    mode: "single",
    durationFrames: flat12(96),
    spCost: flat12(100),
    transforms: [
      {
        toCommandId: "zhuangfangyi_ultimate_battle_skill",
        requiresBuffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
        overrideSpCost: 0,
      },
    ],
    executeHitCritRigOptions: [
      makeThunderStrikeCritRigOption({
        id: "thunder_strike",
        label: "Thunder Strike",
        prefix: ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX,
        isFinalHit: false,
      }),
      makeThunderStrikeCritRigOption({
        id: "final_thunder_strike",
        label: "Final Thunder Strike",
        prefix: ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX,
        isFinalHit: true,
      }),
    ],
    energyGain: flat12(0),
    initialEffects: [
      {
        type: "APPLY_STATUS",
        target: "self",
        statusId: ZHUANGFANGYI_ULTIMATE_PAUSE_STATUS,
        label: "Empyrean of Truth Pause",
        durationSeconds: 96 / 60,
        timeScale: "game",
        pauseStatusIds: [
          ZHUANGFANGYI_ULTIMATE_BUFF,
          "no_energy_gain",
          ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
          ZHUANGFANGYI_ULTIMATE_COMBO_COOLDOWN_RATE_BUFF,
        ],
      },
      {
        type: "APPLY_BUFF",
        target: "self",
        buffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_CAST_BUFF,
        label: "Empyrean Free Battle Skill Cast",
        durationSeconds: 96 / 60,
        timeScale: "game",
        hidden: true,
        requiresSelfBuffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
      },
      {
        type: "REMOVE_BUFF",
        target: "self",
        buffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
        stacks: 99,
      },
    ],
    hits: [
      {
        name: "Create Sunderblades",
        multiplier: flat12(0),
        ignoreEnemyInvulnerability: true,
        offsetFrames: flat12(30),
      },
      {
        name: "Invoke Thunder Strikes",
        multiplier: flat12(0),
        offsetFrames: flat12(46),
      },
    ],
  },
  {
    id: "zhuangfangyi_ultimate_combo_skill",
    name: "Breath of Transformation",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    hiddenInLibrary: true,
    enhanced: true,
    mode: "single",
    durationFrames: flat12(102),
    comboCooldownSeconds: flat12(18),
    comboCooldownTimeScale: "real",
    comboTriggerId: ZHUANGFANGYI_COMBO_TRIGGER_ID,
    spCost: flat12(0),
    energyGain: flat12(10),
    timeFreezeSeconds: flat12(32 / 60),
    initialEffects: [
      {
        type: "APPLY_STATUS",
        target: "self",
        statusId: ZHUANGFANGYI_ULTIMATE_PAUSE_STATUS,
        label: "Empyrean of Truth Pause",
        durationSeconds: 102 / 60,
        timeScale: "game",
        pauseStatusIds: [
          ZHUANGFANGYI_ULTIMATE_BUFF,
          "no_energy_gain",
          ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
          ZHUANGFANGYI_ULTIMATE_COMBO_COOLDOWN_RATE_BUFF,
        ],
      },
    ],
    hits: [
      { multiplier: pct([240, 264, 288, 312, 336, 360, 384, 408, 432, 462, 498, 540]), stagger: flat12(10), offsetFrames: flat12(62) },
    ],
  },
  {
    id: "zhuangfangyi_ultimate",
    name: "Smiting Tempest",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(120),
    spCost: flat12(0),
    energyCost: flat12(240),
    cutscene: true,
    timeFreezeSeconds: flat12(96 / 60),
    hits: [
      {
        multiplier: flat12(0),
        offsetFrames: flat12(90),
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: ZHUANGFANGYI_ULTIMATE_BUFF,
            label: "Empyrean of Truth",
            durationSeconds: ZHUANGFANGYI_ULTIMATE_DURATION_SECONDS,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: ZHUANGFANGYI_ULTIMATE_FREE_BATTLE_SKILL_BUFF,
            label: "Empyrean Free Battle Skill",
            hidden: true,
            durationSeconds: ZHUANGFANGYI_ULTIMATE_DURATION_SECONDS,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "no_energy_gain",
            label: "No Energy Gain",
            hidden: true,
            durationSeconds: ZHUANGFANGYI_ULTIMATE_DURATION_SECONDS,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: ZHUANGFANGYI_ULTIMATE_COMBO_COOLDOWN_RATE_BUFF,
            label: "Empyrean Combo Cooldown Rate",
            hidden: true,
            durationSeconds: ZHUANGFANGYI_ULTIMATE_DURATION_SECONDS,
            timeScale: "game",
            effects: {
              COMBO_COOLDOWN_RATE: 3,
            },
          },
        ],
      },
    ],
  },
];

export const ZHUANGFANGYI: CharacterBase = {
  id: "zhuangfangyi",
  name: "Zhuang Fangyi",
  skillIconPaths: {
    battleSkill: "/avatars/ZHUANGFANGYI/icon_skill_zhuangfy_01.webp",
    comboSkill: "/avatars/ZHUANGFANGYI/icon_combo_skill_zhuangfy_01.webp",
    ultimate: "/avatars/ZHUANGFANGYI/icon_ultimate_skill_zhuangfy_01.webp",
  },
  rarity: 6,
  class: "Caster",
  element: "Electric",
  scaling: { WIL: 0.005, INT: 0.002 },
  mainAttr: "WIL",
  secondaryAttr: "INT",
  weaponType: "ARTS_UNIT",
  uniqueTalentDefs: {
    [ZHUANGFANGYI_TALENT_1_1]: {
      name: "Force of Nature I",
      condition: { minEliteStage: 1 },
    },
    [ZHUANGFANGYI_TALENT_1_2]: {
      name: "Force of Nature II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [ZHUANGFANGYI_TALENT_1_1],
      },
    },
    [ZHUANGFANGYI_TALENT_2_1]: {
      name: "Ordained by Heaven I",
      condition: { minEliteStage: 2 },
    },
    [ZHUANGFANGYI_TALENT_2_2]: {
      name: "Ordained by Heaven II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [ZHUANGFANGYI_TALENT_2_1],
      },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: { WIL: 20 },
        modsDelta: { BATTLE_SKILL_DMG_PCT: 0.15 },
      }),
    },
  },
  mutateResolvedExecuteHits: (executeHits, ctx) => {
    if ((ctx.buildState.potentialLevel ?? 0) < 1) {
      return executeHits;
    }

    return Object.fromEntries(
      Object.entries(executeHits).map(([id, executeHit]) => {
        if (
          !id.startsWith(ZHUANGFANGYI_NORMAL_THUNDERSTRIKE_HIT_PREFIX)
          && !id.startsWith(ZHUANGFANGYI_ULTIMATE_THUNDERSTRIKE_HIT_PREFIX)
        ) {
          return [id, executeHit];
        }

        return [
          id,
          {
            ...executeHit,
            hit: {
              ...executeHit.hit,
              multiplier: executeHit.hit.multiplier * 1.15,
            },
          },
        ];
      }),
    );
  },
  mutateResolvedCommands: (commands, ctx) => commands.map((command) => {
    if ((ctx.buildState.potentialLevel ?? 0) >= 4 && command.id === "zhuangfangyi_ultimate") {
      const potential5Active = (ctx.buildState.potentialLevel ?? 0) >= 5;
      return {
        ...command,
        energyCost: command.energyCost * 0.85,
        hits: potential5Active
          ? command.hits.map((hit) => ({
              ...hit,
              effects: hit.effects?.map((effect) => {
                if (
                  effect.type !== "APPLY_BUFF"
                  || effect.target !== "self"
                  || effect.buffId !== ZHUANGFANGYI_ULTIMATE_BUFF
                ) {
                  return effect;
                }
                return {
                  ...effect,
                  effects: {
                    ...(effect.effects ?? {}),
                    ELECTRIC_RESIST_IGNORE_PCT: (effect.effects?.ELECTRIC_RESIST_IGNORE_PCT ?? 0) + 0.15,
                  },
                };
              }) ?? hit.effects,
            }))
          : command.hits,
      };
    }

    return command;
  }),
  commands: ZHUANGFANGYI_COMMANDS,
  executeHits: ZHUANGFANGYI_EXECUTE_HITS,
  combatHooks: ZHUANGFANGYI_HOOKS,
  levels: {
    STR: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
    AGI: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
    INT: [17, 18, 19, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 87, 88, 89, 90, 91, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 109, 111, 112, 113, 114, 116, 117, 118, 119, 120, 122, 123, 124],
    WIL: [25, 27, 28, 30, 32, 34, 35, 37, 39, 41, 43, 44, 46, 48, 50, 52, 53, 55, 57, 59, 61, 62, 64, 66, 68, 70, 71, 73, 75, 77, 79, 80, 82, 84, 86, 87, 89, 91, 93, 95, 96, 98, 100, 102, 104, 105, 107, 109, 111, 113, 114, 116, 118, 120, 122, 123, 125, 127, 129, 131, 132, 134, 136, 138, 139, 141, 143, 145, 147, 148, 150, 152, 154, 156, 157, 159, 161, 163, 165, 166, 168, 170, 172, 174, 175, 177, 179, 181, 182, 184],
    ATK: [30, 33, 37, 40, 43, 47, 50, 53, 57, 60, 63, 67, 70, 73, 77, 80, 83, 87, 90, 93, 97, 100, 103, 107, 110, 113, 117, 120, 123, 127, 130, 133, 137, 140, 143, 147, 150, 153, 157, 160, 163, 167, 170, 173, 177, 180, 183, 187, 190, 193, 197, 200, 203, 207, 210, 213, 217, 220, 223, 227, 230, 233, 236, 240, 243, 246, 250, 253, 256, 260, 263, 266, 270, 273, 276, 280, 283, 286, 290, 293, 296, 300, 303, 306, 310, 313, 316, 320, 323, 326],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

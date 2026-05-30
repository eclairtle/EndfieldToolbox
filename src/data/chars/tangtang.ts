import type { CharacterBase } from "@/data/characters";
import {
  flat12,
  pct,
  type CommandDefinition,
  type ExecuteHitDefinition,
  type CommandHitEffectDefinition,
} from "@/lib/commands";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";

const TANGTANG_WHIRLPOOL_BUFF_ID = "tangtang_whirlpool";
const TANGTANG_ULTIMATE_STATUS_ID = "tangtang_olden_stare";
const TANGTANG_ULTIMATE_VULNERABLE_STATUS_ID = "tangtang_olden_stare_vulnerable";
const TANGTANG_ULTIMATE_TICK_HIT_ID = "tangtang_ultimate_olden_stare_tick";
const TANGTANG_ULTIMATE_DELAYED_HIT_ID = "tangtang_ultimate_rogue_wave_delayed";
const TANGTANG_ULTIMATE_EARLY_HIT_ID = "tangtang_ultimate_rogue_wave_early";
const TANGTANG_BATTLE_SKILL_WATERSPOUT_REPEAT_HIT_ID = "tangtang_battle_skill_waterspout_repeat";
const TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID = "tangtang_ultimate_talent_waterspout_repeat";
const TANGTANG_TALENT_RIOT_BRINGER_1 = "tangtang_riot_bringer_1";
const TANGTANG_TALENT_RIOT_BRINGER_2 = "tangtang_riot_bringer_2";
const TANGTANG_ULTIMATE_APPLY_FRAME = 151.8;
const TANGTANG_ULTIMATE_END_FRAME = 418.2;
const TANGTANG_ULTIMATE_STATUS_DURATION_SECONDS = (TANGTANG_ULTIMATE_END_FRAME - TANGTANG_ULTIMATE_APPLY_FRAME) / 60;
const TANGTANG_ULTIMATE_VULNERABLE_DURATION_SECONDS = TANGTANG_ULTIMATE_STATUS_DURATION_SECONDS + 1.2;
const TANGTANG_ULTIMATE_STATUS_PERIODS = 8;
const TANGTANG_ULTIMATE_STATUS_MAX_PERIODS = 7;

const TANGTANG_COMBAT_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type === "DIVE_ATTACK_HIT" && ctx.event.slot === ctx.self.slot) {
      if (!ctx.state.hasStatus({ statusId: TANGTANG_ULTIMATE_STATUS_ID, target: "global" })) {
        return;
      }

      const hasRiotBringer2 = ctx.state.isSelfUniqueTalentEnabled(TANGTANG_TALENT_RIOT_BRINGER_2);
      const hasRiotBringer1 = hasRiotBringer2 || ctx.state.isSelfUniqueTalentEnabled(TANGTANG_TALENT_RIOT_BRINGER_1);
      const waterspoutBonus = ctx.state.isSelfPotentialActive(5)
        ? 0.8
        : hasRiotBringer2
          ? 0.6
          : hasRiotBringer1
            ? 0.4
            : 0;
      const shouldCreateAdditionalWaterspouts = hasRiotBringer1 && ctx.state.hasSelfBuff(TANGTANG_WHIRLPOOL_BUFF_ID);

      const effects: CommandHitEffectDefinition[] = [
        {
          type: "REMOVE_STATUS" as const,
          target: "global" as const,
          statusId: TANGTANG_ULTIMATE_STATUS_ID,
        },
        {
          type: "EXECUTE_HIT" as const,
          hitRefId: TANGTANG_ULTIMATE_EARLY_HIT_ID,
          commandName: "DA CHIEF SEES YOU!",
          hitName: "Rogue Wave (Early)",
        },
      ];

      if (hasRiotBringer1) {
        effects.push({
          type: "EXECUTE_HIT",
          hitRefId: TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID,
          commandName: "DA CHIEF SEES YOU!",
          hitName: "Waterspout (Riot Bringer)",
          times: 12,
          repeatIntervalFrames: 15,
          registerAtInitialTime: true,
        });
      }

      if (shouldCreateAdditionalWaterspouts) {
        effects.push(
          {
            type: "EXECUTE_HIT",
            hitRefId: TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID,
            commandName: "DA CHIEF SEES YOU!",
            hitName: "Additional Waterspout (Riot Bringer)",
            times: 12,
            repeatIntervalFrames: 15,
            registerAtInitialTime: true,
          },
          {
            type: "EXECUTE_HIT",
            hitRefId: TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID,
            commandName: "DA CHIEF SEES YOU!",
            hitName: "Additional Waterspout (Riot Bringer)",
            times: 12,
            repeatIntervalFrames: 15,
            registerAtInitialTime: true,
          },
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: TANGTANG_WHIRLPOOL_BUFF_ID,
            stacks: 1,
          },
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: TANGTANG_WHIRLPOOL_BUFF_ID,
            stacks: 1,
          },
        );
      }

      ctx.state.applyEffects({
        effects,
        stepId: ctx.event.stepId,
      });
      return;
    }

    if (ctx.event.type === "ARTS_INFLICTION_APPLIED" && ctx.event.consumedElement === "Cryo") {
      ctx.state.triggerSelfCombo({
        sourceEventType: "ARTS_INFLICTION_APPLIED",
        label: "Tangtang Combo Triggered",
      });
      return;
    }

    if (ctx.event.type === "ARTS_BURST_HIT") {
      ctx.state.triggerSelfCombo({
        sourceEventType: "ARTS_BURST_HIT",
        label: "Tangtang Combo Triggered",
      });
    }
  },
};

const TANGTANG_COMMANDS: CommandDefinition[] = [
  // Animation frame data is sourced from public/gamedata.json.
  {
    id: "tangtang_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    basicAttackVariant: "sequence",
    durationFrames: flat12(231.6),
    spCost: flat12(0),
    expandsToCommandIds: [
      "tangtang_basic_sequence_1",
      "tangtang_basic_sequence_2",
      "tangtang_basic_sequence_3",
      "tangtang_basic_sequence_4",
      "tangtang_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "tangtang_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(16.2),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([23, 25, 27, 29, 32, 34, 36, 39, 41, 44, 47, 51]), offsetFrames: flat12(6) }],
  },
  {
    id: "tangtang_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(37.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(12) },
      { name: "Hit 2", multiplier: pct([15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 34]), offsetFrames: flat12(19.8) },
    ],
  },
  {
    id: "tangtang_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(54),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11]), offsetFrames: flat12(10.2) },
      {
        name: "Hit 2 x4",
        multiplier: pct([3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6]),
        times: 4,
        repeatIntervalFrames: flat12(3.6),
        offsetFrames: flat12(13.8),
      },
      {
        name: "Hit 3 x2",
        multiplier: pct([5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11]),
        times: 2,
        repeatIntervalFrames: flat12(0),
        offsetFrames: flat12(34.2),
      },
      {
        name: "Hit 4 x2",
        multiplier: pct([5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11]),
        times: 2,
        repeatIntervalFrames: flat12(0),
        offsetFrames: flat12(36),
      },
    ],
  },
  {
    id: "tangtang_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(49.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([8, 9, 10, 10, 11, 12, 13, 14, 14, 15, 17, 18]), offsetFrames: flat12(12) },
      { name: "Hit 2", multiplier: pct([21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46]), offsetFrames: flat12(19.8) },
      { name: "Hit 3", multiplier: pct([21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46]), offsetFrames: flat12(46.2) },
    ],
  },
  {
    id: "tangtang_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(73.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113]),
        stagger: flat12(18),
        spGenerated: flat12(18),
        requiresControlledOperator: true,
        offsetFrames: flat12(60),
      },
    ],
  },
  {
    id: "tangtang_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    basicAttackVariant: "finisher",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "tangtang_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    basicAttackVariant: "dive_attack",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "tangtang_battle_skill",
    name: "IMA WAVERIDAAH!",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(80.2),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Shot x5",
        multiplier: pct([16, 17.6, 19.2, 20.8, 22.4, 24, 25.6, 27.2, 28.8, 30.8, 33.2, 36]),
        times: 5,
        repeatIntervalFrames: flat12(10),
        repeatRegisterOffsetWithInterval: false,
        offsetFrames: flat12(36.2),
      },
      {
        name: "Create Waterspout",
        multiplier: flat12(0),
        offsetFrames: flat12(44),
        effects: [
          {
            type: "EXECUTE_HIT",
            hitRefId: TANGTANG_BATTLE_SKILL_WATERSPOUT_REPEAT_HIT_ID,
            commandName: "IMA WAVERIDAAH!",
            hitName: "Waterspout",
            times: 12,
            repeatIntervalFrames: 15,
            registerAtInitialTime: true,
          },
        ],
        postEffects: [
          { type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 },
          {
            type: "APPLY_BUFF",
            target: "enemy",
            buffId: "tangtang_spellvulnerable",
            label: "Arts Susceptibility",
            durationSeconds: 15,
            timeScale: "game",
            requiresSelfBuffId: TANGTANG_WHIRLPOOL_BUFF_ID,
            requiresSelfBuffStacksExact: 1,
            effectScalings: {
              ARTS_SUS_PCT: [0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05],
            },
          },
          {
            type: "APPLY_BUFF",
            target: "enemy",
            buffId: "tangtang_spellvulnerable",
            label: "Arts Susceptibility",
            durationSeconds: 15,
            timeScale: "game",
            requiresSelfBuffId: TANGTANG_WHIRLPOOL_BUFF_ID,
            requiresSelfBuffStacksExact: 2,
            effectScalings: {
              ARTS_SUS_PCT: [0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1],
            },
          },
        ],
      },
      {
        name: "Additional Waterspout x2",
        multiplier: flat12(0),
        spReturned: flat12(20),
        times: 2,
        repeatIntervalFrames: flat12(1),
        repeatRegisterOffsetWithInterval: false,
        offsetFrames: flat12(45),
        executeCondition: {
          requiresSelfBuffId: TANGTANG_WHIRLPOOL_BUFF_ID,
          requiresStacksAtLeast: 1,
        },
        effects: [
          {
            type: "EXECUTE_HIT",
            hitRefId: TANGTANG_BATTLE_SKILL_WATERSPOUT_REPEAT_HIT_ID,
            commandName: "IMA WAVERIDAAH!",
            hitName: "Waterspout",
            times: 12,
            repeatIntervalFrames: 15,
            registerAtInitialTime: true,
          },
        ],
        postEffects: [
          { type: "REMOVE_BUFF", target: "self", buffId: TANGTANG_WHIRLPOOL_BUFF_ID, stacks: 1 },
        ],
      },
    ],
  },
  {
    id: "tangtang_combo_skill",
    name: "RIVER, TO ME!",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(61.8),
    timeFreezeSeconds: flat12(40 / 60),
    comboCooldownSeconds: [14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12],
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [{
      multiplier: pct([106.7, 117.3, 128, 138.7, 149.4, 160, 170.7, 181.4, 192, 205.4, 221.4, 240]),
      stagger: flat12(10),
      offsetFrames: flat12(52.2),
      postEffects: [
        {
          type: "APPLY_BUFF",
          target: "self",
          buffId: TANGTANG_WHIRLPOOL_BUFF_ID,
          label: "Whirlpool",
          durationSeconds: 30,
          timeScale: "game",
          stacks: 1,
          stackGroup: TANGTANG_WHIRLPOOL_BUFF_ID,
          maxStacks: 2,
        },
      ],
    }],
  },
  {
    id: "tangtang_ultimate",
    name: "DA CHIEF SEES YOU!",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(168),
    delayedEnd: true,
    timeFreezeSeconds: flat12(151.8 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(90),
    hits: [
      {
        name: "Apply OLDEN STARE",
        multiplier: flat12(0),
        offsetFrames: flat12(151.8),
        effects: [
          {
            type: "APPLY_STATUS",
            target: "global",
            statusId: TANGTANG_ULTIMATE_VULNERABLE_STATUS_ID,
            label: "OLDEN STARE (Vulnerable)",
            durationSeconds: TANGTANG_ULTIMATE_VULNERABLE_DURATION_SECONDS,
            timeScale: "game",
          },
          {
            type: "APPLY_STATUS",
            target: "global",
            statusId: TANGTANG_ULTIMATE_STATUS_ID,
            label: "OLDEN STARE",
            durationSeconds: TANGTANG_ULTIMATE_STATUS_DURATION_SECONDS,
            timeScale: "game",
            periods: TANGTANG_ULTIMATE_STATUS_PERIODS,
            maxPeriods: TANGTANG_ULTIMATE_STATUS_MAX_PERIODS,
            initialEffects: [
              {
                type: "EXECUTE_HIT",
                hitRefId: TANGTANG_ULTIMATE_TICK_HIT_ID,
                commandName: "DA CHIEF SEES YOU!",
                hitName: "OLDEN STARE Tick",
              },
            ],
            periodicEffects: [
              {
                type: "EXECUTE_HIT",
                hitRefId: TANGTANG_ULTIMATE_TICK_HIT_ID,
                commandName: "DA CHIEF SEES YOU!",
                hitName: "OLDEN STARE Tick",
              },
            ],
            removeEffects: [
              {
                type: "EMIT_EVENT",
                eventType: "ULTIMATE_END",
                label: "Tangtang Ultimate End",
                commandAttackType: "ULTIMATE",
              },
            ],
            expireEffects: [
              {
                type: "EMIT_EVENT",
                eventType: "ULTIMATE_END",
                label: "Tangtang Ultimate End",
                commandAttackType: "ULTIMATE",
              },
              {
                type: "EXECUTE_HIT",
                hitRefId: TANGTANG_ULTIMATE_DELAYED_HIT_ID,
                commandName: "DA CHIEF SEES YOU!",
                hitName: "Rogue Wave (Delayed)",
              },
            ],
          },
        ],
      },
    ],
  },
];

const TANGTANG_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: TANGTANG_ULTIMATE_TICK_HIT_ID,
    name: "OLDEN STARE Tick",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    commandId: "tangtang_ultimate",
    commandName: "DA CHIEF SEES YOU!",
    multiplier: pct([17.8, 19.6, 21.3, 23.1, 24.9, 26.7, 28.4, 30.2, 32, 34.2, 36.9, 40]),
    offsetFrames: flat12(0),
  },
  {
    id: TANGTANG_ULTIMATE_DELAYED_HIT_ID,
    name: "Rogue Wave (Delayed)",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    commandId: "tangtang_ultimate",
    commandName: "DA CHIEF SEES YOU!",
    multiplier: pct([177.8, 195.6, 213.4, 231.1, 248.9, 266.7, 284.5, 302.3, 320, 342.3, 368.9, 400]),
    stagger: flat12(15),
    offsetFrames: flat12(0),
  },
  {
    id: TANGTANG_ULTIMATE_EARLY_HIT_ID,
    name: "Rogue Wave (Early)",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    commandId: "tangtang_ultimate",
    commandName: "DA CHIEF SEES YOU!",
    multiplier: pct([311.1, 342.2, 373.4, 404.5, 435.6, 466.7, 497.8, 528.9, 560, 598.9, 645.6, 700]),
    stagger: flat12(20),
    offsetFrames: flat12(0),
  },
  {
    id: TANGTANG_BATTLE_SKILL_WATERSPOUT_REPEAT_HIT_ID,
    name: "Waterspout",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    commandId: "tangtang_battle_skill",
    commandName: "IMA WAVERIDAAH!",
    multiplier: pct([11.0833333333, 12.25, 13.3333333333, 14.5, 15.5833333333, 16.6666666667, 17.8333333333, 18.9166666667, 20, 21.4166666667, 23.0833333333, 25]),
    offsetFrames: flat12(0),
  },
  {
    id: TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID,
    name: "Waterspout (Riot Bringer)",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    commandId: "tangtang_ultimate",
    commandName: "DA CHIEF SEES YOU!",
    multiplier: pct([11.0833333333, 12.25, 13.3333333333, 14.5, 15.5833333333, 16.6666666667, 17.8333333333, 18.9166666667, 20, 21.4166666667, 23.0833333333, 25]),
    offsetFrames: flat12(0),
  },
];

export const TANGTANG: CharacterBase = {
  id: "tangtang",
  name: "Tangtang",
  skillIconPaths: {
    battleSkill: "/avatars/TANGTANG/icon_skill_tangtang_01.webp",
    comboSkill: "/avatars/TANGTANG/icon_combo_skill_tangtang_01.webp",
    ultimate: "/avatars/TANGTANG/icon_ultimate_skill_tangtang_01.webp",
  },
  rarity: 6,
  class: "Caster",
  element: "Cryo",
  scaling: {
    AGI: 0.005,
    STR: 0.002,
  },
  mainAttr: "AGI",
  secondaryAttr: "STR",
  combatHooks: TANGTANG_COMBAT_HOOKS,
  uniqueTalentDefs: {
    tangtang_fam_of_honor_1: {
      name: "Fam of Honor I",
      condition: {
        minEliteStage: 1,
      },
    },
    tangtang_fam_of_honor_2: {
      name: "Fam of Honor II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: ["tangtang_fam_of_honor_1"],
      },
    },
    tangtang_riot_bringer_1: {
      name: "Riot Bringer I",
      condition: {
        minEliteStage: 2,
      },
    },
    tangtang_riot_bringer_2: {
      name: "Riot Bringer II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: ["tangtang_riot_bringer_1"],
      },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: {
          AGI: 20,
        },
        modsDelta: {
          CRYO_DMG_PCT: 0.1,
        },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    if (potentialLevel <= 0) {
      return commands;
    }

    return commands.map((command) => {
      if (command.id === "tangtang_combo_skill" && potentialLevel >= 1) {
        return {
          ...command,
          comboCooldownSeconds: Math.max(0, command.comboCooldownSeconds - 2),
          hits: command.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * 1.2,
          })),
        };
      }

      if (command.id === "tangtang_battle_skill" && potentialLevel >= 1) {
        return {
          ...command,
          hits: command.hits.map((hit) => {
            let nextHit = hit;

            if (hit.name === "Additional Waterspout x2") {
              nextHit = {
                ...nextHit,
                spReturned: nextHit.spReturned + 5,
              };
            }

            if (potentialLevel >= 3) {
              nextHit = {
                ...nextHit,
                multiplier: nextHit.multiplier * 1.1,
                effects: (nextHit.effects ?? []).map((effect) => {
                  if (effect.type !== "APPLY_BUFF" || effect.target !== "enemy") {
                    return effect;
                  }
                  return {
                    ...effect,
                    effects: {
                      ...(effect.effects ?? {}),
                      ARTS_SUS_PCT: (effect.effects?.ARTS_SUS_PCT ?? 0) + 0.05,
                    },
                  };
                }),
                postEffects: (nextHit.postEffects ?? []).map((effect) => {
                  if (effect.type !== "APPLY_BUFF" || effect.target !== "enemy") {
                    return effect;
                  }
                  return {
                    ...effect,
                    effects: {
                      ...(effect.effects ?? {}),
                      ARTS_SUS_PCT: (effect.effects?.ARTS_SUS_PCT ?? 0) + 0.05,
                    },
                  };
                }),
              };
            }

            return nextHit;
          }),
        };
      }

      if (command.id === "tangtang_ultimate" && potentialLevel >= 4) {
        return {
          ...command,
          energyCost: Math.max(0, command.energyCost * 0.85),
        };
      }

      if (command.id === "tangtang_ultimate" && potentialLevel >= 5) {
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * 1.15,
          })),
        };
      }

      return command;
    });
  },
  mutateResolvedExecuteHits: (executeHits, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    const hasRiotBringer2 = Boolean(ctx.buildState.uniqueTalentToggles?.[TANGTANG_TALENT_RIOT_BRINGER_2]);
    const hasRiotBringer1 = hasRiotBringer2 || Boolean(ctx.buildState.uniqueTalentToggles?.[TANGTANG_TALENT_RIOT_BRINGER_1]);
    const waterspoutBonus = potentialLevel >= 5
      ? 0.8
      : hasRiotBringer2
        ? 0.6
        : hasRiotBringer1
          ? 0.4
          : 0;

    return Object.fromEntries(
      Object.entries(executeHits).map(([hitId, executeHit]) => {
        if (hitId === TANGTANG_ULTIMATE_TALENT_WATERSPOUT_REPEAT_HIT_ID) {
          return [
            hitId,
            {
              ...executeHit,
              hit: {
                ...executeHit.hit,
                multiplier: executeHit.hit.multiplier * (potentialLevel >= 3 ? 1.1 : 1) * (1 + waterspoutBonus),
              },
            },
          ];
        }

        if (hitId === TANGTANG_BATTLE_SKILL_WATERSPOUT_REPEAT_HIT_ID && potentialLevel >= 3) {
          return [
            hitId,
            {
              ...executeHit,
              hit: {
                ...executeHit.hit,
                multiplier: executeHit.hit.multiplier * 1.1,
              },
            },
          ];
        }

        if (potentialLevel < 5) {
          return [hitId, executeHit];
        }

        if (
          hitId === TANGTANG_ULTIMATE_TICK_HIT_ID
          || hitId === TANGTANG_ULTIMATE_DELAYED_HIT_ID
          || hitId === TANGTANG_ULTIMATE_EARLY_HIT_ID
        ) {
          return [
            hitId,
            {
              ...executeHit,
              hit: {
                ...executeHit.hit,
                multiplier: executeHit.hit.multiplier * 1.15,
              },
            },
          ];
        }
        return [hitId, executeHit];
      }),
    );
  },
  levels: {
    STR: [
        13, 14, 16, 17, 18, 19, 21, 22, 23, 24,
        25, 27, 28, 29, 30, 32, 33, 34, 35, 37,
        38, 39, 40, 42, 43, 44, 45, 46, 48, 49,
        50, 51, 53, 54, 55, 56, 58, 59, 60, 61,
        63, 64, 65, 66, 67, 69, 70, 71, 72, 74,
        75, 76, 77, 79, 80, 81, 82, 84, 85, 86,
        87, 88, 90, 91, 92, 93, 95, 96, 97, 98,
        100, 101, 102, 103, 105, 106, 107, 108, 110, 111,
        112, 113, 114, 116, 117, 118, 119, 121, 122, 123
      ],
    AGI: [
        23, 25, 27, 28, 30, 32, 34, 35, 37, 39,
        41, 42, 44, 46, 48, 49, 51, 53, 55, 56,
        58, 60, 62, 63, 65, 67, 69, 70, 72, 74,
        76, 77, 79, 81, 83, 84, 86, 88, 90, 91,
        93, 95, 97, 98, 100, 102, 104, 105, 107, 109,
        111, 112, 114, 116, 118, 119, 121, 123, 125, 126,
        128, 130, 132, 134, 135, 137, 139, 141, 142, 144,
        146, 148, 149, 151, 153, 155, 156, 158, 160, 162,
        163, 165, 167, 169, 170, 172, 174, 176, 177, 179
      ],
    INT: [
        8, 9, 10, 11, 12, 13, 14, 14, 15, 16,
        17, 18, 19, 20, 20, 21, 22, 23, 24, 25,
        26, 27, 27, 28, 29, 30, 31, 32, 33, 33,
        34, 35, 36, 37, 38, 39, 39, 40, 41, 42,
        43, 44, 45, 46, 46, 47, 48, 49, 50, 51,
        52, 52, 53, 54, 55, 56, 57, 58, 58, 59,
        60, 61, 62, 63, 64, 65, 65, 66, 67, 68,
        69, 70, 71, 71, 72, 73, 74, 75, 76, 77,
        77, 78, 79, 80, 81, 82, 83, 84, 84, 85
      ],
    WIL: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
        51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 67, 68, 69, 70, 71,
        72, 73, 74, 75, 76, 77, 78, 79, 80, 81,
        82, 83, 84, 85, 86, 87, 88, 89, 90, 91,
        92, 93, 94, 95, 96, 97, 98, 100, 101, 102
      ],
    ATK: [
        30, 33, 37, 40, 43, 46, 50, 53, 56, 59,
        63, 66, 69, 72, 76, 79, 82, 85, 89, 92,
        95, 99, 102, 105, 108, 112, 115, 118, 121, 125,
        128, 131, 134, 138, 141, 144, 148, 151, 154, 157,
        161, 164, 167, 170, 174, 177, 180, 183, 187, 190,
        193, 196, 200, 203, 206, 210, 213, 216, 219, 223,
        226, 229, 232, 236, 239, 242, 245, 249, 252, 255,
        259, 262, 265, 268, 272, 275, 278, 281, 285, 288,
        291, 294, 298, 301, 304, 307, 311, 314, 317, 321
      ],
    HP: [
        500, 556, 612, 668, 724, 781, 837, 893, 949, 1005,
        1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566,
        1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128,
        2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689,
        2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250,
        3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811,
        3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372,
        4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934,
        4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495
      ],
  },
  weaponType: "HANDCANNON",
  commands: TANGTANG_COMMANDS,
  executeHits: TANGTANG_EXECUTE_HITS,
};

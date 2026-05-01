import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const YVONNE_COMBAT_HOOKS: CharacterCombatHooks = {
  onResolvedHit: (ctx) => {
    if (!ctx.flags.isFinalStrikeOfBasicSequence || !ctx.source.isControlledOperatorHit) {
      return;
    }

    if (!ctx.state.hasEnemyStatus("solidification")) {
      return;
    }

    ctx.state.triggerSelfCombo({
      sourceEventType: "BASIC_ATTACK_FINAL_STRIKE_HIT",
      label: "Yvonne Combo Triggered",
    });
  },
};

const YVONNE_COMMANDS: CommandDefinition[] = [
  // Animation frame data is sourced from public/gamedata.json.
  {
    id: "yvonne_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    basicAttackVariant: "sequence",
    durationFrames: flat12(215.64),
    spCost: flat12(0),
    transforms: [
      {
        toCommandId: "yvonne_ultimate_basic_sequence_3",
        requiresBuffId: "yvonne_ultimate_final_strike_window",
      },
      {
        toCommandId: "yvonne_ultimate_basic_sequence_recursive_2",
        requiresBuffIdsAll: ["yvonne_ultimate_enhancement", "yvonne_ultimate_crit_stack"],
      },
      {
        toCommandId: "yvonne_ultimate_basic_sequence_recursive_1",
        requiresBuffId: "yvonne_ultimate_enhancement",
      },
      {
        toCommandId: "yvonne_basic_sequence_5",
        requiresBuffId: "yvonne_barrage_of_technology",
      },
    ],
    expandsToCommandIds: [
      "yvonne_basic_sequence_1",
      "yvonne_basic_sequence_2",
      "yvonne_basic_sequence_3",
      "yvonne_basic_sequence_4",
      "yvonne_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "yvonne_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([24, 26, 28, 31, 33, 35, 38, 40, 42, 45, 49, 53]), offsetFrames: flat12(22.02) },
    ],
  },
  {
    id: "yvonne_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(30),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(16.02) },
      { name: "Hit 2", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(28) },
    ],
  },
  {
    id: "yvonne_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(31.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([32, 35, 38, 41, 44, 47, 50, 54, 57, 61, 65, 71]), registerOffsetFrames: flat12(12), offsetFrames: flat12(14) },
      { name: "Hit 2", multiplier: pct([32, 35, 38, 41, 44, 47, 50, 54, 57, 61, 65, 71]), registerOffsetFrames: flat12(12), offsetFrames: flat12(20) },
      { name: "Hit 3", multiplier: pct([32, 35, 38, 41, 44, 47, 50, 54, 57, 61, 65, 71]), registerOffsetFrames: flat12(12), offsetFrames: flat12(26) },
    ],
  },
  {
    id: "yvonne_basic_sequence_4",
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
      { name: "Hit 1", multiplier: pct([41, 45, 49, 53, 58, 62, 66, 70, 74, 79, 85, 92]), offsetFrames: flat12(22.02) },
    ],
  },
  {
    id: "yvonne_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(70.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([56, 62, 67, 73, 79, 84, 90, 96, 101, 108, 117, 126]),
        stagger: flat12(17),
        spGenerated: flat12(18),
        requiresControlledOperator: true,
        offsetFrames: flat12(42),
        postEffects: [
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: "yvonne_barrage_of_technology",
          },
        ],
      },
    ],
  },
  {
    id: "yvonne_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    mode: "single",
    basicAttackVariant: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]),
        offsetFrames: flat12(30),
      },
    ],
  },
  {
    id: "yvonne_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    mode: "single",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "yvonne_ultimate_basic_sequence_recursive_1",
    name: "Cryoblasting Basic Sequence (I)",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence",
    noFinisherTransform: true,
    durationFrames: flat12(0),
    spCost: flat12(0),
    expandsToCommandIds: [
      "yvonne_ultimate_basic_sequence_1",
      "yvonne_basic_sequence",
    ],
    hits: [],
  },
  {
    id: "yvonne_ultimate_basic_sequence_recursive_2",
    name: "Cryoblasting Basic Sequence (II)",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence",
    noFinisherTransform: true,
    durationFrames: flat12(0),
    spCost: flat12(0),
    expandsToCommandIds: [
      "yvonne_ultimate_basic_sequence_2",
      "yvonne_basic_sequence",
    ],
    hits: [],
  },
  {
    id: "yvonne_ultimate_basic_sequence_1",
    name: "Enhanced Basic Attack I",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(100),
    spCost: flat12(0),
    splitMultiplier: false,
    hits: [
      {
        name: "Hit x11",
        multiplier: pct([8.9, 9.8, 10.7, 11.6, 12.5, 13.4, 14.3, 15.1, 16, 17.2, 18.5, 20]),
        offsetFrames: flat12(12),
        repeatIntervalFrames: flat12(6),
        times: 11,
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "yvonne_ultimate_crit_stack",
            label: "Cryoblasting Pistolier-Crit Stack",
            effects: {
              CRIT_RATE_PCT: 0.03,
            },
            stackGroup: "yvonne_ultimate_crit_stack",
            stacks: 1,
            maxStacks: 10,
            refreshExistingStacks: true,
            durationSeconds: 1.5,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "yvonne_ultimate_crit_dmg",
            label: "Cryoblasting Pistolier-Crit DMG",
            effects: {
              CRIT_DMG_PCT: 0.6,
            },
            requiresSelfBuffId: "yvonne_ultimate_crit_stack",
            requiresSelfBuffStacksAtLeast: 10,
            durationSeconds: 1.5,
            timeScale: "game",
          },
        ],
      },
    ],
  },
  {
    id: "yvonne_ultimate_basic_sequence_2",
    name: "Enhanced Basic Attack II",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(82),
    spCost: flat12(0),
    splitMultiplier: false,
    hits: [
      {
        name: "Hit x16",
        multiplier: pct([8.9, 9.8, 10.7, 11.6, 12.5, 13.4, 14.3, 15.1, 16, 17.2, 18.5, 20]),
        offsetFrames: flat12(5),
        repeatIntervalFrames: flat12(5),
        times: 16,
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "yvonne_ultimate_crit_stack",
            label: "Cryoblasting Pistolier-Crit Stack",
            effects: {
              CRIT_RATE_PCT: 0.03,
            },
            stackGroup: "yvonne_ultimate_crit_stack",
            stacks: 1,
            maxStacks: 10,
            refreshExistingStacks: true,
            durationSeconds: 1.5,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "yvonne_ultimate_crit_dmg",
            label: "Cryoblasting Pistolier-Crit DMG",
            effects: {
              CRIT_DMG_PCT: 0.6,
            },
            requiresSelfBuffId: "yvonne_ultimate_crit_stack",
            requiresSelfBuffStacksAtLeast: 10,
            durationSeconds: 1.5,
            timeScale: "game",
          },
        ],
      },
    ],
  },
  {
    id: "yvonne_ultimate_basic_sequence_3",
    name: "Enhanced Final Strike",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 3,
    durationFrames: flat12(60),
    spCost: flat12(0),
    splitMultiplier: false,
    hits: [
      { name: "Enhanced Final Strike", multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]), requiresControlledOperator: true, offsetFrames: flat12(55.8) },
      {
        name: "Additional ATK DMG",
        multiplier: pct([267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600]),
        offsetFrames: flat12(55.8),
        executeCondition: {
          requiresEnemyStatusId: "solidification",
        },
      },
    ],
  },
  {
    id: "yvonne_battle_skill",
    name: "Brr-Brr-Bomb β",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(67.8),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Base Hit",
        multiplier: pct([111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250]),
        offsetFrames: flat12(40.2),
        effects: [
          {
            type: "APPLY_CUSTOM_REACTION",
            reactionId: "YVONNE_BATTLE_SKILL_FREEZE",
            baseMultiplierScaling: pct([67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150]),
            bonusMultiplierPerConsumedStackScaling: pct([89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200]),
            baseEnergyReturnScaling: flat12(10),
            bonusEnergyReturnPerConsumedStackScaling: flat12(30),
            staggerScaling: flat12(10),
          },
        ],
      },
    ],
  },
  {
    id: "yvonne_combo_skill",
    name: "Flashfreezer υ37",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(40),
    timeFreezeSeconds: flat12(37 / 60),
    comboCooldownSeconds: [20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18],
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [
      {
        name: "Energy Release x4",
        multiplier: pct([45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100]),
        registerOffsetFrames: flat12(37),
        repeatRegisterOffsetWithInterval: false,
        offsetFrames: flat12(37),
        times: 4,
        repeatIntervalFrames: flat12(45),
      },
      {
        name: "Explosion",
        multiplier: pct([89, 98, 107, 116, 125, 134, 142, 151, 160, 171, 185, 200]),
        stagger: flat12(10),
        registerOffsetFrames: flat12(37),
        offsetFrames: flat12(197),
        effects: [
          {
            type: "APPLY_REACTION",
            reaction: "Solidification",
            level: 1,
            durationSeconds: 8,
            forceApply: true,
            reactionDamage: false,
          },
        ],
      },
    ],
  },
  {
    id: "yvonne_ultimate",
    name: "Cryoblasting Pistolier",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(127.8),
    timeFreezeSeconds: flat12(121.8 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(220),
    hits: [
      { name: "Enhanced Final Strike", multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]), stagger: flat12(20), offsetFrames: flat12(121.8) },
      {
        name: "Additional Attack",
        multiplier: pct([267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600]),
        offsetFrames: flat12(127.2),
        postEffects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "yvonne_ultimate_enhancement",
            label: "Cryoblasting Pistolier",
            durationSeconds: 7,
            timeScale: "game",
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "no_energy_gain",
            label: "No Energy Gain",
            hidden: true,
            durationSeconds: 7,
            timeScale: "game",
          },
          {
            type: "APPLY_STATUS",
            target: "self",
            statusId: "yvonne_ultimate_enhancement_tracker",
            label: "Cryoblasting Pistolier",
            durationSeconds: 7,
            timeScale: "game",
            expireEffects: [
              {
                type: "APPLY_BUFF",
                target: "self",
                buffId: "yvonne_ultimate_final_strike_window",
                label: "Cryoblasting Pistolier-Final Strike",
                durationSeconds: 1.5,
                timeScale: "game",
              },
              {
                type: "APPLY_BUFF",
                target: "self",
                buffId: "no_energy_gain",
                label: "No Energy Gain",
                hidden: true,
                durationSeconds: 1.5,
                timeScale: "game",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const YVONNE: CharacterBase = {
  id: "yvonne",
  name: "Yvonne",
  skillIconPaths: {
    battleSkill: "/avatars/YVONNE/icon_skill_yvonne_01.webp",
    comboSkill: "/avatars/YVONNE/icon_combo_skill_yvonne_01.webp",
    ultimate: "/avatars/YVONNE/icon_ultimate_skill_yvonne_01.webp",
  },
  rarity: 6,
  class: "Striker",
  element: "Cryo",
  scaling: {
    INT: 0.005,
    AGI: 0.002,
  },
  mainAttr: "INT",
  secondaryAttr: "AGI",
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: {
          INT: 20,
        },
        modsDelta: {
          CRIT_RATE_PCT: 0.07,
        },
      }),
    },
  },
  uniqueTalentDefs: {
    yvonne_barrage_of_technology_1: {
      name: "Barrage of Technology I",
      condition: {
        minEliteStage: 1,
      },
    },
    yvonne_barrage_of_technology_2: {
      name: "Barrage of Technology II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: ["yvonne_barrage_of_technology_1"],
      },
    },
    yvonne_freezing_point_1: {
      name: "Freezing Point I",
      condition: {
        minEliteStage: 2,
      },
    },
    yvonne_freezing_point_2: {
      name: "Freezing Point II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: ["yvonne_freezing_point_1"],
      },
    },
  },
  conditionalModifiers: [
    {
      id: "yvonne_freezing_point_infliction",
      label: "Freezing Point (Cryo Infliction)",
      condition: {
        requiresUniqueTalentsEnabled: ["yvonne_freezing_point_1"],
        enemyInflictionElementsAny: ["Cryo"],
        enemyStatusIdsNone: ["solidification"],
      },
      effects: {
        CRIT_DMG_PCT: 0.2,
      },
    },
    {
      id: "yvonne_freezing_point_solidification",
      label: "Freezing Point (Solidification)",
      condition: {
        requiresUniqueTalentsEnabled: ["yvonne_freezing_point_1"],
        enemyStatusIdsAny: ["solidification"],
      },
      effects: {
        CRIT_DMG_PCT: 0.4,
      },
    },
  ],
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    if (potentialLevel <= 0) {
      return commands;
    }

    return commands.map((command) => {
      if (command.id === "yvonne_combo_skill" && potentialLevel >= 1) {
        return {
          ...command,
          hits: command.hits.map((hit) => {
            if (hit.name?.startsWith("Energy Release")) {
              return {
                ...hit,
                times: hit.times + 2,
              };
            }
            if (hit.name === "Explosion") {
              return {
                ...hit,
                energyReturn: hit.energyReturn + 15,
              };
            }
            return hit;
          }),
        };
      }

      if (command.id === "yvonne_battle_skill" && potentialLevel >= 4) {
        return {
          ...command,
          hits: command.hits.map((hit) => {
            if (hit.name !== "Base Hit") {
              return hit;
            }
            return {
              ...hit,
              effects: hit.effects.map((effect) => {
                if (effect.type !== "APPLY_CUSTOM_REACTION" || effect.reactionId !== "YVONNE_BATTLE_SKILL_FREEZE") {
                  return effect;
                }
                return {
                  ...effect,
                  baseEnergyReturn: (effect.baseEnergyReturn ?? 0) + 10,
                };
              }),
            };
          }),
        };
      }

      if (command.id === "yvonne_ultimate" && potentialLevel >= 5) {
        return {
          ...command,
          hits: command.hits.map((hit, index) => {
            if (index !== 0) {
              return hit;
            }
            return {
              ...hit,
              effects: [
                ...hit.effects,
                {
                  type: "APPLY_BUFF",
                  target: "self",
                  buffId: "yvonne_potential_5",
                  label: "Yvonne Potential 5",
                  durationSeconds: 7,
                  timeScale: "game",
                  effects: {
                    ATK_PCT: 0.1,
                    CRIT_DMG_PCT: 0.3,
                  },
                },
              ],
            };
          }),
        };
      }

      return command;
    });
  },
  levels: {
    STR: [
        8, 9, 10, 10, 11, 12, 13, 14, 15, 15,
        16, 17, 18, 19, 20, 20, 21, 22, 23, 24,
        25, 25, 26, 27, 28, 29, 30, 30, 31, 32,
        33, 34, 35, 35, 36, 37, 38, 39, 40, 40,
        41, 42, 43, 44, 45, 45, 46, 47, 48, 49,
        50, 50, 51, 52, 53, 54, 55, 55, 56, 57,
        58, 59, 60, 60, 61, 62, 63, 64, 65, 65,
        66, 67, 68, 69, 70, 70, 71, 72, 73, 74,
        75, 75, 76, 77, 78, 79, 80, 81, 81, 82,
      ],
    AGI: [
        14, 16, 17, 18, 19, 21, 22, 23, 24, 26,
        27, 28, 30, 31, 32, 33, 35, 36, 37, 38,
        40, 41, 42, 44, 45, 46, 47, 49, 50, 51,
        52, 54, 55, 56, 58, 59, 60, 61, 63, 64,
        65, 66, 68, 69, 70, 72, 73, 74, 75, 77,
        78, 79, 81, 82, 83, 84, 86, 87, 88, 89,
        91, 92, 93, 95, 96, 97, 98, 100, 101, 102,
        103, 105, 106, 107, 109, 110, 111, 112, 114, 115,
        116, 117, 119, 120, 121, 123, 124, 125, 126, 128,
      ],
    INT: [
        24, 26, 28, 29, 31, 33, 34, 36, 38, 39,
        41, 43, 45, 46, 48, 50, 51, 53, 55, 57,
        58, 60, 62, 63, 65, 67, 69, 70, 72, 74,
        75, 77, 79, 80, 82, 84, 86, 87, 89, 91,
        92, 94, 96, 98, 99, 101, 103, 104, 106, 108,
        110, 111, 113, 115, 116, 118, 120, 121, 123, 125,
        127, 128, 130, 132, 133, 135, 137, 139, 140, 142,
        144, 145, 147, 149, 151, 152, 154, 156, 157, 159,
        161, 163, 164, 166, 168, 169, 171, 173, 174, 176,
      ],
    WIL: [
        10, 11, 12, 13, 14, 15, 16, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32, 33, 35, 36, 37, 38, 39, 40, 41,
        42, 43, 44, 45, 46, 47, 48, 49, 50, 52,
        53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
        63, 64, 65, 66, 67, 69, 70, 71, 72, 73,
        74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
        84, 86, 87, 88, 89, 90, 91, 92, 93, 94,
        95, 96, 97, 98, 99, 100, 101, 103, 104, 105,
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
        291, 294, 298, 301, 304, 307, 311, 314, 317, 321,
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
        4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495,
      ],
  },
  weaponType: "HANDCANNON",
  commands: YVONNE_COMMANDS,
  combatHooks: YVONNE_COMBAT_HOOKS,
};

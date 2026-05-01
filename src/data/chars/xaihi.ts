import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const XAIHI_AUXILIARY_CRYSTAL_TEAM_STATUS_ID = "xaihi_auxiliary_crystal";
const XAIHI_AUXILIARY_CRYSTAL_DURATION_SECONDS = 25;
const XAIHI_AUXILIARY_CRYSTAL_MAX_STACKS = 2;
const XAIHI_BATTLE_SKILL_AMP_DURATION_SECONDS = 25;
const XAIHI_AUXILIARY_CRYSTAL_HEAL_HIT_ID = "xaihi_auxiliary_crystal_heal";

const XAIHI_COMBAT_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type !== "BASIC_ATTACK_FINAL_STRIKE_HIT") {
      return;
    }

    const beforeCount = ctx.state.getTeamStatusStackCount(XAIHI_AUXILIARY_CRYSTAL_TEAM_STATUS_ID);
    if (beforeCount <= 0) {
      return;
    }

    ctx.state.applyEffects({
      effects: [
        {
          type: "CONSUME_TEAM_STATUS",
          statusId: XAIHI_AUXILIARY_CRYSTAL_TEAM_STATUS_ID,
          stacks: 1,
          label: "Auxiliary Crystal",
        },
      ],
    });

    const remaining = ctx.state.getTeamStatusStackCount(XAIHI_AUXILIARY_CRYSTAL_TEAM_STATUS_ID);
    if (remaining >= beforeCount) {
      return;
    }

    ctx.state.applyEffects({
      effects: [{
        type: "EXECUTE_HIT",
        hitRefId: XAIHI_AUXILIARY_CRYSTAL_HEAL_HIT_ID,
        commandName: "Auxiliary Crystal Treatment",
      }],
    });

    if (remaining <= 0) {
      ctx.state.triggerSelfCombo({
        sourceEventType: "BASIC_ATTACK_FINAL_STRIKE_HIT",
        label: "Xaihi Combo Triggered",
      });
    }
  },
};

const XAIHI_COMMANDS: CommandDefinition[] = [
  // Animation frame data is sourced from public/gamedata.json.
  {
    id: "xaihi_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    basicAttackVariant: "sequence",
    durationFrames: flat12(205.62),
    spCost: flat12(0),
    expandsToCommandIds: [
      "xaihi_basic_sequence_1",
      "xaihi_basic_sequence_2",
      "xaihi_basic_sequence_3",
      "xaihi_basic_sequence_4",
      "xaihi_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "xaihi_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(28.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 34]), offsetFrames: flat12(19.8) }],
  },
  {
    id: "xaihi_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(36),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36]), offsetFrames: flat12(13.8) }],
  },
  {
    id: "xaihi_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(30),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([21, 23, 25, 27, 29, 32, 34, 36, 38, 40, 44, 47]), offsetFrames: flat12(16.02) }],
  },
  {
    id: "xaihi_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(43.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37]), offsetFrames: flat12(13.8) },
      { name: "Hit 2", multiplier: pct([17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37]), offsetFrames: flat12(24) },
    ],
  },
  {
    id: "xaihi_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(67.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124]),
        stagger: flat12(15),
        spGenerated: flat12(15),
        requiresControlledOperator: true,
        offsetFrames: flat12(37.8),
      },
    ],
  },
  {
    id: "xaihi_basic_finisher",
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
    id: "xaihi_basic_dive",
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
    id: "xaihi_battle_skill",
    name: "Auxiliary Crystal",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Auxiliary Crystal Deploy",
        multiplier: flat12(0),
        offsetFrames: flat12(32),
        effects: [
          {
            type: "APPLY_TEAM_STATUS",
            statusId: XAIHI_AUXILIARY_CRYSTAL_TEAM_STATUS_ID,
            label: "Auxiliary Crystal",
            stacks: 2,
            maxStacks: XAIHI_AUXILIARY_CRYSTAL_MAX_STACKS,
            durationSeconds: XAIHI_AUXILIARY_CRYSTAL_DURATION_SECONDS,
            timeScale: "game",
          },
        ],
      },
    ],
  },
  {
    id: "xaihi_combo_skill",
    name: "Stress Testing",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(49.8),
    timeFreezeSeconds: flat12(38 / 60),
    comboCooldownSeconds: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7],
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [
      { multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]), 
        stagger: flat12(10), offsetFrames: flat12(48), 
      effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 }],
      }
    ],
  },
  {
    id: "xaihi_ultimate",
    name: "Stack Overflow",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(133.8),
    timeFreezeSeconds: flat12(64 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(80),
    hits: [
      {
        name: "Amp",
        multiplier: flat12(0),
        offsetFrames: flat12(88.02),
        effects: [
          {
            type: "APPLY_BUFF",
            target: "team",
            buffId: "xaihi_stack_overflow_amp",
            label: "Stack Overflow",
            durationSeconds: 12,
            timeScale: "game",
            effectScalings: {
              CRYO_DMG_AMP_PCT: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
              NATURE_DMG_AMP_PCT: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
            },
            effectAttributeScalings: {
              CRYO_DMG_AMP_PCT: { attribute: "INT", ratio: 0.00014, max: 0.3 },
              NATURE_DMG_AMP_PCT: { attribute: "INT", ratio: 0.00014, max: 0.3 },
            },
          },
        ],
      },
    ],
  },
];

const XAIHI_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: XAIHI_AUXILIARY_CRYSTAL_HEAL_HIT_ID,
    name: "Healing",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Healing",
    commandName: "Auxiliary Crystal Treatment",
    multiplier: [0.336, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
    flatAmount: [144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324],
    scalingStat: "WIL",
    offsetFrames: flat12(0),
    effects: [
      {
        type: "APPLY_BUFF",
        target: "team",
        buffId: "xaihi_battle_skill_amp",
        label: "Xaihi Battle Skill Amp",
        durationSeconds: XAIHI_BATTLE_SKILL_AMP_DURATION_SECONDS,
        timeScale: "game",
        requiresControlledOperatorFullHp: true,
        effectScalings: {
          CRYO_DMG_AMP_PCT: [0.09, 0.09, 0.09, 0.09, 0.09, 0.11, 0.11, 0.11, 0.13, 0.13, 0.13, 0.15],
          NATURE_DMG_AMP_PCT: [0.09, 0.09, 0.09, 0.09, 0.09, 0.11, 0.11, 0.11, 0.13, 0.13, 0.13, 0.15],
        },
      },
      {
        type: "APPLY_BUFF",
        target: "team",
        buffId: "xaihi_battle_skill_amp_potential",
        label: "Xaihi Battle Skill Amp",
        hidden: true,
        durationSeconds: XAIHI_BATTLE_SKILL_AMP_DURATION_SECONDS,
        timeScale: "game",
        requiresControlledOperatorFullHp: true,
        requiresSelfPotentialAtLeast: 1,
        effects: {
          CRYO_DMG_AMP_PCT: 0.05,
          NATURE_DMG_AMP_PCT: 0.05,
        },
      },
    ],
  },
];

export const XAIHI: CharacterBase = {
  id: "xaihi",
  name: "Xaihi",
  skillIconPaths: {
    battleSkill: "/avatars/XAIHI/icon_skill_seraph_01.webp",
    comboSkill: "/avatars/XAIHI/icon_combo_skill_seraph_01.webp",
    ultimate: "/avatars/XAIHI/icon_ultimate_skill_seraph_01.webp",
  },
  rarity: 5,
  class: "Supporter",
  element: "Cryo",
  scaling: {
    WIL: 0.005,
    INT: 0.002,
  },
  mainAttr: "WIL",
  secondaryAttr: "INT",
  uniqueTalentDefs: {
    xaihi_execute_process_1: {
      name: "Execute Process I",
      condition: {
        minEliteStage: 1,
      },
    },
    xaihi_execute_process_2: {
      name: "Execute Process II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: ["xaihi_execute_process_1"],
      },
    },
    xaihi_freeze_protocol: {
      name: "Freeze Protocol",
      condition: {
        minEliteStage: 3,
      },
    },
  },
  potentialEffects: {
    4: {
      apply: () => ({
        attrsDelta: {
          INT: 15,
        },
        modsDelta: {
          HEALING_PCT: 0.1,
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
      if (command.id === "xaihi_ultimate" && potentialLevel >= 2) {
        return {
          ...command,
          energyCost: Math.max(0, command.energyCost * 0.9),
        };
      }

      if (command.id === "xaihi_ultimate" && potentialLevel >= 5) {
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...hit,
            effects: hit.effects.map((effect) => {
              if (effect.type !== "APPLY_BUFF" || effect.target !== "team") {
                return effect;
              }
              return {
                ...effect,
                effects: {
                  ...effect.effects,
                  CRYO_DMG_AMP_PCT: (effect.effects?.CRYO_DMG_AMP_PCT ?? 0) * 1.1,
                  NATURE_DMG_AMP_PCT: (effect.effects?.NATURE_DMG_AMP_PCT ?? 0) * 1.1,
                },
              };
            }),
          })),
        };
      }

      return command;
    });
  },
  levels: {
    STR: [
        9, 10, 11, 12, 12, 13, 14, 15, 16, 17,
        18, 19, 20, 21, 21, 22, 23, 24, 25, 26,
        27, 28, 29, 30, 31, 31, 32, 33, 34, 35,
        36, 37, 38, 39, 40, 40, 41, 42, 43, 44,
        45, 46, 47, 48, 49, 50, 50, 51, 52, 53,
        54, 55, 56, 57, 58, 59, 59, 60, 61, 62,
        63, 64, 65, 66, 67, 68, 69, 69, 70, 71,
        72, 73, 74, 75, 76, 77, 78, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 88, 89
      ],
    AGI: [
        9, 10, 11, 12, 13, 14, 14, 15, 16, 17,
        18, 19, 20, 21, 22, 23, 24, 25, 26, 26,
        27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
        37, 38, 39, 39, 40, 41, 42, 43, 44, 45,
        46, 47, 48, 49, 50, 51, 52, 52, 53, 54,
        55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
        64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
        74, 75, 76, 77, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 90, 91
      ],
    INT: [
        15, 17, 18, 19, 20, 22, 23, 24, 25, 27,
        28, 29, 30, 32, 33, 34, 35, 37, 38, 39,
        40, 42, 43, 44, 45, 47, 48, 49, 50, 52,
        53, 54, 55, 57, 58, 59, 60, 62, 63, 64,
        65, 67, 68, 69, 70, 72, 73, 74, 75, 77,
        78, 79, 80, 82, 83, 84, 85, 87, 88, 89,
        90, 92, 93, 94, 95, 97, 98, 99, 100, 102,
        103, 104, 105, 107, 108, 109, 110, 112, 113, 114,
        115, 117, 118, 119, 120, 122, 123, 124, 125, 127
      ],
    WIL: [
        15, 16, 18, 19, 21, 22, 24, 25, 27, 28,
        30, 31, 33, 34, 36, 37, 39, 40, 42, 43,
        45, 46, 48, 50, 51, 53, 54, 56, 57, 59,
        60, 62, 63, 65, 66, 68, 69, 71, 72, 74,
        75, 77, 78, 80, 81, 83, 84, 86, 87, 89,
        90, 92, 93, 95, 96, 98, 100, 101, 103, 104,
        106, 107, 109, 110, 112, 113, 115, 116, 118, 119,
        121, 122, 124, 125, 127, 128, 130, 131, 133, 134,
        136, 137, 139, 140, 142, 143, 145, 147, 148, 150
      ],
    ATK: [
        30, 33, 36, 39, 42, 45, 48, 51, 53, 56,
        59, 62, 65, 68, 71, 74, 77, 80, 83, 86,
        89, 92, 95, 97, 100, 103, 106, 109, 112, 115,
        118, 121, 124, 127, 130, 133, 136, 139, 141, 144,
        147, 150, 153, 156, 159, 162, 165, 168, 171, 174,
        177, 180, 183, 185, 188, 191, 194, 197, 200, 203,
        206, 209, 212, 215, 218, 221, 224, 227, 230, 232,
        235, 238, 241, 244, 247, 250, 253, 256, 259, 262,
        265, 268, 271, 274, 276, 279, 282, 285, 288, 291
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
  weaponType: "ARTS_UNIT",
  commands: XAIHI_COMMANDS,
  executeHits: XAIHI_EXECUTE_HITS,
  combatHooks: XAIHI_COMBAT_HOOKS,
};

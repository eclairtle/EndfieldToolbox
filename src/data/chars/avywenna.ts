import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const AVYWENNA_THUNDERLANCE_BUFF_ID = "avywenna_thunderlance";
const AVYWENNA_THUNDERLANCE_EX_BUFF_ID = "avywenna_thunderlance_ex";
const AVYWENNA_THUNDERLANCE_DURATION_SECONDS = 30;
const AVYWENNA_THUNDERLANCE_EX_DURATION_SECONDS = 30;
const AVYWENNA_POTENTIAL_2_DURATION_BONUS_SECONDS = 20;

const AVYWENNA_COMMANDS: CommandDefinition[] = [
  {
    id: "avywenna_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    basicAttackVariant: "sequence",
    durationFrames: flat12(204),
    spCost: flat12(0),
    expandsToCommandIds: [
      "avywenna_basic_sequence_1",
      "avywenna_basic_sequence_2",
      "avywenna_basic_sequence_3",
      "avywenna_basic_sequence_4",
      "avywenna_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "avywenna_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(28.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37]), offsetFrames: flat12(18) }],
  },
  {
    id: "avywenna_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([22, 24, 26, 28, 30, 32, 34, 37, 39, 41, 45, 48]), offsetFrames: flat12(22.02) }],
  },
  {
    id: "avywenna_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46]), offsetFrames: flat12(22.02) }],
  },
  {
    id: "avywenna_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(40.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(24) }],
  },
  {
    id: "avywenna_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
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
        multiplier: pct([50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113]),
        stagger: flat12(15),
        spGenerated: flat12(15),
        requiresControlledOperator: true,
        offsetFrames: flat12(37.8),
      },
    ],
  },
  {
    id: "avywenna_basic_finisher",
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
    id: "avywenna_basic_dive",
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
    id: "avywenna_battle_skill",
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(66),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      { name: "Strike", multiplier: pct([67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150]), stagger: flat12(5), offsetFrames: flat12(40) },
      {
        name: "Thunderlance Recall",
        multiplier: pct([75, 82, 90, 97, 104, 112, 119, 127, 134, 144, 155, 168]),
        stagger: flat12(5),
        offsetFrames: flat12(50),
        times: 3,
        repeatIntervalFrames: flat12(1),
        executeCondition: {
          requiresSelfBuffId: AVYWENNA_THUNDERLANCE_BUFF_ID,
          requiresStacksAtLeast: 1,
        },
        postEffects: [
          { type: "REMOVE_BUFF", target: "self", buffId: AVYWENNA_THUNDERLANCE_BUFF_ID, stacks: 1 },
        ],
      },
      {
        name: "Thunderlance EX Recall",
        multiplier: pct([192, 211, 230, 249, 268, 287, 306, 325, 344, 368, 396, 428]),
        stagger: flat12(10),
        offsetFrames: flat12(52),
        times: 3,
        repeatIntervalFrames: flat12(1),
        executeCondition: {
          requiresSelfBuffId: AVYWENNA_THUNDERLANCE_EX_BUFF_ID,
          requiresStacksAtLeast: 1,
        },
        postEffects: [
          { type: "REMOVE_BUFF", target: "self", buffId: AVYWENNA_THUNDERLANCE_EX_BUFF_ID, stacks: 1 },
        ],
      },
    ],
  },
  {
    id: "avywenna_combo_skill",
    name: "Combo Skill",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(54),
    timeFreezeSeconds: flat12(36 / 60),
    comboCooldownSeconds: flat12(13),
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [{
      multiplier: pct([169, 186, 203, 219, 236, 253, 270, 287, 304, 325, 350, 380]),
      stagger: flat12(10),
      offsetFrames: flat12(48),
      postEffects: [
        {
          type: "APPLY_BUFF",
          target: "self",
          buffId: AVYWENNA_THUNDERLANCE_BUFF_ID,
          label: "Thunderlance",
          durationSeconds: AVYWENNA_THUNDERLANCE_DURATION_SECONDS,
          timeScale: "game",
          stacks: 1,
          stackGroup: AVYWENNA_THUNDERLANCE_BUFF_ID,
          maxStacks: 30,
        },
      ],
    }],
  },
  {
    id: "avywenna_ultimate",
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(138),
    timeFreezeSeconds: flat12(66 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(100),
    hits: [{
      multiplier: pct([422, 464, 507, 549, 591, 633, 675, 718, 760, 813, 876, 950]),
      stagger: flat12(15),
      offsetFrames: flat12(120),
      postEffects: [
        {
          type: "APPLY_BUFF",
          target: "self",
          buffId: AVYWENNA_THUNDERLANCE_EX_BUFF_ID,
          label: "Thunderlance EX",
          durationSeconds: AVYWENNA_THUNDERLANCE_EX_DURATION_SECONDS,
          timeScale: "game",
          stacks: 1,
          stackGroup: AVYWENNA_THUNDERLANCE_EX_BUFF_ID,
          maxStacks: 10,
        },
      ],
    }],
  },
];

export const AVYWENNA: CharacterBase = {
  id: "avywenna",
  name: "Avywenna",
  skillIconPaths: {
    battleSkill: "/avatars/AVYWENNA/icon_skill_avywen_01.webp",
    comboSkill: "/avatars/AVYWENNA/icon_combo_skill_avywen_01.webp",
    ultimate: "/avatars/AVYWENNA/icon_ultimate_skill_avywen_01.webp",
  },
  rarity: 5,
  class: "Striker",
  element: "Electric",
  scaling: {
    WIL: 0.005,
    AGI: 0.002,
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    if (potentialLevel < 2) {
      return commands;
    }

    return commands.map((command) => {
      if (command.id !== "avywenna_combo_skill" && command.id !== "avywenna_ultimate") {
        return command;
      }

      return {
        ...command,
        hits: command.hits.map((hit) => ({
          ...hit,
          postEffects: hit.postEffects.map((effect) => {
            if (
              effect.type !== "APPLY_BUFF"
              || effect.target !== "self"
              || (effect.buffId !== AVYWENNA_THUNDERLANCE_BUFF_ID && effect.buffId !== AVYWENNA_THUNDERLANCE_EX_BUFF_ID)
            ) {
              return effect;
            }

            return {
              ...effect,
              durationSeconds: (effect.durationSeconds ?? 0) + AVYWENNA_POTENTIAL_2_DURATION_BONUS_SECONDS,
            };
          }),
        })),
      };
    });
  },
  mainAttr: "WIL",
  secondaryAttr: "AGI",
  levels: {
    STR: [
        12, 13, 15, 16, 17, 18, 19, 20, 21, 22,
        23, 24, 25, 26, 27, 28, 29, 30, 31, 33,
        34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
        44, 45, 46, 47, 48, 50, 51, 52, 53, 54,
        55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
        65, 67, 68, 69, 70, 71, 72, 73, 74, 75,
        76, 77, 78, 79, 80, 81, 82, 84, 85, 86,
        87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
        97, 98, 99, 100, 102, 103, 104, 105, 106, 107
      ],
    AGI: [
        10, 11, 12, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39, 40, 42,
        43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
        53, 54, 56, 57, 58, 59, 60, 61, 62, 63,
        64, 65, 66, 67, 68, 70, 71, 72, 73, 74,
        75, 76, 77, 78, 79, 80, 81, 82, 84, 85,
        86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
        96, 98, 99, 100, 101, 102, 103, 104, 105, 106
      ],
    INT: [
        14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        24, 26, 27, 28, 29, 30, 31, 32, 33, 34,
        35, 36, 37, 39, 40, 41, 42, 43, 44, 45,
        46, 47, 48, 49, 50, 52, 53, 54, 55, 56,
        57, 58, 59, 60, 61, 62, 63, 65, 66, 67,
        68, 69, 70, 71, 72, 73, 74, 75, 76, 78,
        79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
        89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
        100, 101, 102, 104, 105, 106, 107, 108, 109, 110
      ],
    WIL: [
        15, 16, 18, 19, 21, 22, 24, 25, 27, 28,
        30, 31, 33, 34, 36, 37, 39, 40, 42, 43,
        45, 46, 48, 49, 51, 52, 54, 55, 57, 58,
        60, 61, 63, 64, 66, 67, 69, 70, 72, 73,
        75, 76, 78, 79, 81, 82, 84, 85, 87, 88,
        90, 91, 93, 94, 96, 97, 99, 100, 102, 103,
        105, 106, 108, 109, 111, 112, 114, 115, 117, 118,
        120, 121, 123, 124, 126, 127, 129, 130, 132, 133,
        135, 136, 138, 139, 141, 142, 144, 145, 147, 148
      ],
    ATK: [
        30, 33, 36, 39, 43, 46, 49, 52, 55, 58,
        62, 65, 68, 71, 74, 77, 81, 84, 87, 90,
        93, 96, 100, 103, 106, 109, 112, 115, 119, 122,
        125, 128, 131, 134, 138, 141, 144, 147, 150, 153,
        157, 160, 163, 166, 169, 172, 176, 179, 182, 185,
        188, 191, 195, 198, 201, 204, 207, 210, 214, 217,
        220, 223, 226, 229, 233, 236, 239, 242, 245, 248,
        252, 255, 258, 261, 264, 267, 271, 274, 277, 280,
        283, 286, 290, 293, 296, 299, 302, 305, 309, 312
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
  weaponType: "POLEARM",
  commands: AVYWENNA_COMMANDS,
};

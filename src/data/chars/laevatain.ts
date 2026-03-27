import {
  benchmarkCommandDamage,
  type CharacterBase,
  type CharacterBenchmark,
} from "@/data/characters";
import { pct, flat12, type CommandDefinition, type CommandHitDefinition } from "@/lib/commands";

const LAEVATAIN_UBS_HIT_1: CommandHitDefinition = {
  name: "UBS Hit 1",
  multiplier: pct([147, 161, 176, 191, 205, 220, 235, 249, 264, 282, 304, 330]),
  stagger: flat12(10),
  frameData: flat12(30),
}
const LAEVATAIN_UBS_HIT_2: CommandHitDefinition = {
  name: "UBS Hit 2",
  multiplier: pct([164, 181, 197, 214, 230, 247, 263, 279, 296, 316, 341, 370]),
  stagger: flat12(10),
  frameData: flat12(30),
}
const LAEVATAIN_BS_INITIAL_HIT: CommandHitDefinition = {
  name: "Initial Explosion",
  multiplier: pct([62, 68, 75, 81, 87, 93, 99, 106, 112, 120, 129, 140]),
  stagger: flat12(10),
  frameData: flat12(30),
}

const LAEVATAIN_BS_CONTINUOUS_HIT: CommandHitDefinition = {
  name: "Continuous Hit ×10",
  multiplier: pct([6, 7, 8, 8, 9, 9, 10, 11, 11, 12, 13, 14]),
  frameData: flat12(30),
  times: 10,
}

const LAEVATAIN_COMMANDS: CommandDefinition[] = [
  {
    id: "laevatain_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    mode: "cycling",
    spCost: flat12(0),
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36]),
        frameData: flat12(30),
      },
      {
        name: "Hit 2",
        multiplier: pct([24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54]),
        frameData: flat12(30),
      },
      {
        name: "Hit 3",
        multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]),
        frameData: flat12(30),
      },
      {
        name: "Hit 4",
        multiplier: pct([39, 43, 47, 51, 55, 59, 62, 66, 70, 75, 81, 88]),
        frameData: flat12(30),
      },
      {
        name: "Hit 5",
        multiplier: pct([53, 58, 64, 69, 74, 80, 85, 90, 95, 102, 110, 119]),
        stagger: flat12(18),
        frameData: flat12(30),
      },
    ],
  },
  {
    id: "laevatain_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]),
        frameData: flat12(30),
      },
    ],
  },
  {
    id: "laevatain_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]),
        frameData: flat12(30),
      },
    ],
  },

  // Battle Skill
  {
    id: "laevatain_battle_skill",
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(100),
    hits: [
      LAEVATAIN_BS_INITIAL_HIT,
      LAEVATAIN_BS_CONTINUOUS_HIT,
    ],
  },

  // Enhanced Battle Skill
  {
    id: "laevatain_enhanced_battle_skill",
    name: "Enhanced Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(100),
    hits: [
      LAEVATAIN_BS_INITIAL_HIT,
      LAEVATAIN_BS_CONTINUOUS_HIT,
      {
        name: "Additional Hit",
        multiplier: pct([342, 376, 410, 445, 479, 513, 547, 581, 616, 658, 710, 770]),
        stagger: flat12(10),
        energyReturn: flat12(100),
        frameData: flat12(30),
      },
    ],
  },

  // Ultimate cast itself: 0-hit command for now
  {
    id: "laevatain_ultimate_cast",
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(0),
    energyCost: flat12(300),
    hits: [],
  },

  // Ultimate Battle Skill
  {
    id: "laevatain_ultimate_battle_skill",
    name: "Ultimate Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(100),
    hits: [
      LAEVATAIN_UBS_HIT_1,
      LAEVATAIN_UBS_HIT_2,
    ],
  },

  // Enhanced Ultimate Battle Skill
  {
    id: "laevatain_enhanced_ultimate_battle_skill",
    name: "Enhanced Ultimate Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(100),
    hits: [
      LAEVATAIN_UBS_HIT_1,
      LAEVATAIN_UBS_HIT_2,
      {
        name: "Additional Hit",
        multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]),
        stagger: flat12(10),
        frameData: flat12(30),
      },
    ],
  },

  // Ultimate Basic Attack Sequence
  {
    id: "laevatain_ultimate_basic_sequence",
    name: "Ultimate Basic Attack Sequence",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    mode: "cycling",
    spCost: flat12(0),
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([65, 71, 78, 84, 91, 97, 104, 110, 117, 125, 134, 146]),
        frameData: flat12(30),
      },
      {
        name: "Enhanced Hit 2",
        multiplier: pct([81, 89, 97, 105, 113, 122, 130, 138, 146, 156, 168, 182]),
        frameData: flat12(30),
      },
      {
        name: "Enhanced Hit 3",
        multiplier: pct([115, 127, 139, 150, 162, 173, 185, 196, 208, 222, 240, 260]),
        frameData: flat12(30),
      },
      {
        name: "Enhanced Hit 4",
        multiplier: pct([203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456]),
        frameData: flat12(30),
      },
    ],
  },
];

const LAEVATAIN_BENCHMARKS: CharacterBenchmark[] = [
  benchmarkCommandDamage({
    id: "laevatain_benchmark_enhanced_skill",
    name: "Enhanced Skill",
    commandId: "laevatain_enhanced_battle_skill",
  }),
  benchmarkCommandDamage({
    id: "laevatain_benchmark_ultimate_enhanced_skill",
    name: "Ultimate Enhanced Battle Skill",
    commandId: "laevatain_enhanced_ultimate_battle_skill",
  }),
  benchmarkCommandDamage({
    id: "laevatain_benchmark_ultimate_basic_sequence",
    name: "Ultimate Basic Attack Sequence",
    commandId: "laevatain_ultimate_basic_sequence",
  }),
];

const LAEVATAIN_PROMOTIONS = [
  {
    stage: 1 as const,
    levelCap: 40 as const,
    costs: [
      { resource: "Protodisk", amount: 8 },
      { resource: "Pink Bolete", amount: 3 },
      { resource: "T-Creds", amount: 1600 },
    ],
  },
  {
    stage: 2 as const,
    levelCap: 60 as const,
    costs: [
      { resource: "Protodisk", amount: 25 },
      { resource: "Red Bolete", amount: 5 },
      { resource: "T-Creds", amount: 6500 },
    ],
  },
  {
    stage: 3 as const,
    levelCap: 80 as const,
    costs: [
      { resource: "Protoset", amount: 24 },
      { resource: "Ruby Bolete", amount: 5 },
      { resource: "T-Creds", amount: 18000 },
    ],
  },
  {
    stage: 4 as const,
    levelCap: 90 as const,
    costs: [
      { resource: "Protoset", amount: 36 },
      { resource: "D96 Steel Sample 4", amount: 20 },
      { resource: "Bloodcap", amount: 8 },
      { resource: "T-Creds", amount: 100000 },
    ],
  },
];

export const LAEVATAIN: CharacterBase = {
  id: "laevatain",
  name: "Laevatain",
  rarity: 6,
  class: "Striker",
  element: "Heat",
  scaling: {
    INT: 0.005,
    STR: 0.002,
  },
  mainAttr: "INT",
  secondaryAttr: "STR",
  levels: {
    STR: [
        13, 14, 16, 17, 18, 19, 20, 22, 23, 24,
        25, 26, 28, 29, 30, 31, 32, 34, 35, 36,
        37, 39, 40, 41, 42, 43, 45, 46, 47, 48,
        49, 51, 52, 53, 54, 55, 57, 58, 59, 60,
        62, 63, 64, 65, 66, 68, 69, 70, 71, 72,
        74, 75, 76, 77, 78, 80, 81, 82, 83, 85,
        86, 87, 88, 89, 91, 92, 93, 94, 95, 97,
        98, 99, 100, 102, 103, 104, 105, 106, 108, 109,
        110, 111, 112, 114, 115, 116, 117, 118, 120, 121,
      ],
    AGI: [
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
        70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
        80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
        90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
      ],
    INT: [
        22, 24, 25, 27, 29, 31, 32, 34, 36, 38,
        39, 41, 43, 45, 46, 48, 50, 52, 53, 55,
        57, 59, 60, 62, 64, 66, 67, 69, 71, 73,
        74, 76, 78, 80, 81, 83, 85, 87, 88, 90,
        92, 94, 95, 97, 99, 101, 102, 104, 106, 108,
        109, 111, 113, 114, 116, 118, 120, 121, 123, 125,
        127, 128, 130, 132, 134, 135, 137, 139, 141, 142,
        144, 146, 148, 149, 151, 153, 155, 156, 158, 160,
        162, 163, 165, 167, 169, 170, 172, 174, 176, 177,
      ],
    WIL: [
        9, 9, 10, 11, 12, 13, 14, 15, 16, 17,
        18, 19, 19, 20, 21, 22, 23, 24, 25, 26,
        27, 28, 29, 29, 30, 31, 32, 33, 34, 35,
        36, 37, 38, 39, 39, 40, 41, 42, 43, 44,
        45, 46, 47, 48, 48, 49, 50, 51, 52, 53,
        54, 55, 56, 57, 58, 58, 59, 60, 61, 62,
        63, 64, 65, 66, 67, 68, 68, 69, 70, 71,
        72, 73, 74, 75, 76, 77, 78, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 88, 89,
      ],
    ATK: [
        30, 33, 36, 40, 43, 46, 49, 53, 56, 59,
        62, 66, 69, 72, 75, 78, 82, 85, 88, 91,
        95, 98, 101, 104, 108, 111, 114, 117, 120, 124,
        127, 130, 133, 137, 140, 143, 146, 150, 153, 156,
        159, 162, 166, 169, 172, 175, 179, 182, 185, 188,
        192, 195, 198, 201, 204, 208, 211, 214, 217, 221,
        224, 227, 230, 234, 237, 240, 243, 247, 250, 253,
        256, 259, 263, 266, 269, 272, 276, 279, 282, 285,
        289, 292, 295, 298, 301, 305, 308, 311, 314, 318,
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
  weaponType: "SWORD",
  commands: LAEVATAIN_COMMANDS,
  benchmarks: LAEVATAIN_BENCHMARKS,
  promotions: LAEVATAIN_PROMOTIONS,
};

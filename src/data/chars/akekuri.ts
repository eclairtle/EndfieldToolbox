import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const AKEKURI_COMMANDS: CommandDefinition[] = [
  {
    id: "akekuri_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45]), frameData: flat12(30) },
      { name: "Hit 2", multiplier: pct([28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62]), frameData: flat12(30) },
      { name: "Hit 3", multiplier: pct([33, 36, 39, 42, 46, 49, 52, 55, 59, 63, 67, 73]), frameData: flat12(30) },
      { name: "Hit 4", multiplier: pct([50, 54, 59, 64, 69, 74, 79, 84, 89, 95, 103, 111]), stagger: flat12(17), frameData: flat12(30) },
    ],
  },
  {
    id: "akekuri_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), frameData: flat12(30) }],
  },
  {
    id: "akekuri_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), frameData: flat12(30) }],
  },
  {
    id: "akekuri_battle_skill",
    name: "Burst of Passion",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    spCost: flat12(100),
    hits: [{ multiplier: pct([142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320]), stagger: flat12(10), frameData: flat12(30) }],
  },
  {
    id: "akekuri_combo_skill",
    name: "Flash and Dash",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    spCost: flat12(0),
    hits: [{ name: "Dash Sequence x2", multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), stagger: flat12(5), frameData: flat12(30), times: 2 }],
  },
  {
    id: "akekuri_ultimate",
    name: "SQUAD! ON ME!",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    spCost: flat12(0),
    energyCost: flat12(120),
    hits: [],
  },
];

export const AKEKURI: CharacterBase = {
  id: "akekuri",
  name: "Akekuri",
  rarity: 4,

  class: "Vanguard",
  element: "Heat",

  scaling: {
    AGI: 0.005,
    INT: 0.002
  },

  mainAttr: "AGI",
  secondaryAttr: "INT",

  weaponType: "SWORD",
  commands: AKEKURI_COMMANDS,

  levels: {
  STR: [
    13, 14, 15, 16, 17, 18, 19, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 33, 34,
    35, 36, 37, 38, 39, 40, 41, 42, 43, 45,
    46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
    57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
    67, 69, 70, 71, 72, 73, 74, 75, 76, 77,
    78, 79, 80, 82, 83, 84, 85, 86, 87, 88,
    89, 90, 91, 92, 94, 95, 96, 97, 98, 99,
    100, 101, 102, 103, 104, 106, 107, 108, 109, 110
  ],
  AGI: [
    15, 16, 17, 19, 20, 22, 23, 25, 26, 27,
    29, 30, 32, 33, 34, 36, 37, 39, 40, 42,
    43, 44, 46, 47, 49, 50, 51, 53, 54, 56,
    57, 58, 60, 61, 63, 64, 66, 67, 68, 70,
    71, 73, 74, 75, 77, 78, 80, 81, 82, 84,
    85, 87, 88, 90, 91, 92, 94, 95, 97, 98,
    99, 101, 102, 104, 105, 107, 108, 109, 111, 112,
    114, 115, 116, 118, 119, 121, 122, 123, 125, 126,
    128, 129, 131, 132, 133, 135, 136, 138, 139, 140
  ],
  INT: [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 22,
    23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 40, 41, 42, 43,
    44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
    54, 55, 56, 58, 59, 60, 61, 62, 63, 64,
    65, 66, 67, 68, 69, 70, 71, 72, 73, 75,
    76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
    86, 87, 88, 89, 90, 91, 93, 94, 95, 96,
    97, 98, 99, 100, 101, 102, 103, 104, 105, 106
  ],
  WIL: [
    9, 10, 11, 12, 13, 14, 15, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 37, 38, 39, 40, 41,
    42, 43, 44, 45, 47, 48, 49, 50, 51, 52,
    53, 54, 55, 56, 58, 59, 60, 61, 62, 63,
    64, 65, 66, 68, 69, 70, 71, 72, 73, 74,
    75, 76, 78, 79, 80, 81, 82, 83, 84, 85,
    86, 88, 89, 90, 91, 92, 93, 94, 95, 96,
    98, 99, 100, 101, 102, 103, 104, 105, 106, 108
  ],
  ATK: [
    30, 33, 36, 40, 43, 46, 49, 53, 56, 59,
    62, 66, 69, 72, 75, 79, 82, 85, 88, 92,
    95, 98, 101, 105, 108, 111, 114, 118, 121, 124,
    127, 131, 134, 137, 140, 144, 147, 150, 153, 157,
    160, 163, 166, 170, 173, 176, 179, 183, 186, 189,
    192, 196, 199, 202, 205, 209, 212, 215, 218, 222,
    225, 228, 231, 235, 238, 241, 244, 248, 251, 254,
    257, 261, 264, 267, 270, 274, 277, 280, 283, 287,
    290, 293, 296, 300, 303, 306, 309, 313, 316, 319
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
  ]
}
};

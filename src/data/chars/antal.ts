import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const ANTAL_COMMANDS: CommandDefinition[] = [
  {
    id: "antal_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    mode: "cycling",
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([23, 25, 28, 30, 32, 35, 37, 39, 41, 44, 48, 52]), frameData: flat12(30) },
      { name: "Hit 2", multiplier: pct([28, 31, 34, 36, 39, 42, 45, 48, 50, 54, 58, 63]), frameData: flat12(30) },
      { name: "Hit 3", multiplier: pct([34, 37, 41, 44, 48, 51, 54, 58, 61, 65, 71, 77]), frameData: flat12(30) },
      { name: "Hit 4", multiplier: pct([51, 56, 61, 66, 71, 77, 82, 87, 92, 98, 106, 115]), stagger: flat12(15), frameData: flat12(30) },
    ],
  },
  {
    id: "antal_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), frameData: flat12(30) }],
  },
  {
    id: "antal_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), frameData: flat12(30) }],
  },
  {
    id: "antal_battle_skill",
    name: "Specified Research Subject",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    mode: "single",
    spCost: flat12(100),
    hits: [{ multiplier: pct([89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200]), frameData: flat12(30) }],
  },
  {
    id: "antal_combo_skill",
    name: "EMP Test Site",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([151, 166, 181, 196, 211, 227, 242, 257, 272, 291, 313, 340]), stagger: flat12(10), frameData: flat12(30) }],
  },
  {
    id: "antal_ultimate",
    name: "Overclocked Moment",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    spCost: flat12(0),
    energyCost: flat12(100),
    hits: [],
  },
];

export const ANTAL: CharacterBase = {
  id: "antal",
  name: "Antal",
  rarity: 4,

  class: "Supporter",
  element: "Electric",

  scaling: {
    INT: 0.005,
    STR: 0.002
  },

  mainAttr: "INT",
  secondaryAttr: "STR",

  weaponType: "ARTS_UNIT",
  commands: ANTAL_COMMANDS,

  levels: {
    STR: [
      15, 17, 18, 19, 20, 22, 23, 24, 26, 27,
      28, 29, 31, 32, 33, 35, 36, 37, 38, 40,
      41, 42, 43, 45, 46, 47, 49, 50, 51, 52,
      54, 55, 56, 57, 59, 60, 61, 63, 64, 65,
      66, 68, 69, 70, 71, 73, 74, 75, 77, 78,
      79, 80, 82, 83, 84, 86, 87, 88, 89, 91,
      92, 93, 94, 96, 97, 98, 100, 101, 102, 103,
      105, 106, 107, 108, 110, 111, 112, 114, 115, 116,
      117, 119, 120, 121, 122, 124, 125, 126, 128, 129
    ],
    AGI: [
      9, 10, 11, 12, 12, 13, 14, 15, 16, 17,
      18, 19, 19, 20, 21, 22, 23, 24, 25, 25,
      26, 27, 28, 29, 30, 31, 32, 32, 33, 34,
      35, 36, 37, 38, 39, 39, 40, 41, 42, 43,
      44, 45, 45, 46, 47, 48, 49, 50, 51, 52,
      52, 53, 54, 55, 56, 57, 58, 59, 59, 60,
      61, 62, 63, 64, 65, 65, 66, 67, 68, 69,
      70, 71, 72, 72, 73, 74, 75, 76, 77, 78,
      78, 79, 80, 81, 82, 83, 84, 85, 85, 86
    ],
    INT: [
      15, 17, 18, 20, 22, 23, 25, 27, 28, 30,
      32, 33, 35, 37, 39, 40, 42, 44, 45, 47,
      49, 50, 52, 54, 55, 57, 59, 60, 62, 64,
      65, 67, 69, 70, 72, 74, 76, 77, 79, 81,
      82, 84, 86, 87, 89, 91, 92, 94, 96, 98,
      99, 101, 103, 104, 106, 108, 109, 111, 113, 114,
      116, 118, 119, 121, 123, 125, 126, 128, 130, 131,
      133, 135, 136, 138, 140, 141, 143, 145, 146, 148,
      150, 152, 153, 155, 157, 158, 160, 162, 163, 165
    ],
    WIL: [
      9, 10, 11, 12, 13, 13, 14, 15, 16, 17,
      17, 18, 19, 20, 21, 22, 22, 23, 24, 25,
      26, 27, 27, 28, 29, 30, 31, 31, 32, 33,
      34, 35, 36, 36, 37, 38, 39, 40, 40, 41,
      42, 43, 44, 45, 45, 46, 47, 48, 49, 50,
      50, 51, 52, 53, 54, 54, 55, 56, 57, 58,
      59, 59, 60, 61, 62, 63, 64, 64, 65, 66,
      67, 68, 68, 69, 70, 71, 72, 73, 73, 74,
      75, 76, 77, 77, 78, 79, 80, 81, 81, 82
    ],
    ATK: [
      30, 33, 36, 39, 42, 45, 48, 51, 54, 57,
      60, 63, 66, 69, 72, 75, 78, 81, 84, 87,
      90, 93, 96, 99, 102, 105, 108, 111, 114, 117,
      120, 123, 126, 129, 132, 135, 138, 141, 144, 147,
      150, 153, 156, 159, 162, 165, 168, 171, 174, 177,
      180, 183, 186, 189, 192, 195, 198, 201, 204, 207,
      210, 213, 216, 219, 222, 225, 228, 231, 234, 237,
      240, 243, 246, 249, 252, 255, 258, 261, 264, 267,
      270, 273, 276, 279, 282, 285, 288, 291, 294, 297
    ],
    HP: [
      500, 556, 612, 668, 724, 781, 837, 893, 949, 1005,
      1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566,
      1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128,
      2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689,
      2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250,
      3306, 3362, 3418, 3474, 3530, 3587, 3643, 3699, 3755, 3811,
      3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372,
      4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934,
      4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495
    ]
  }
};

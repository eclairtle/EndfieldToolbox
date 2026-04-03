import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const PERLICA_COMMANDS: CommandDefinition[] = [
  {
    id: "perlica_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    mode: "cycling",
    durationFrames: flat12(212),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([25, 28, 31, 33, 36, 38, 41, 43, 46, 49, 53, 57]), offsetFrames: flat12(16) },
      { name: "Hit 2", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(50) },
      { name: "Hit 3", multiplier: pct([37, 41, 45, 48, 52, 56, 59, 63, 67, 71, 77, 84]), offsetFrames: flat12(101) },
      { name: "Hit 4", multiplier: pct([57, 62, 68, 73, 79, 85, 90, 96, 102, 109, 117, 127]), offsetFrames: flat12(178) },
    ],
  },
  { id: "perlica_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Electric", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "perlica_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Electric", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "perlica_battle_skill",
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(56),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{ multiplier: pct([178, 196, 213, 231, 249, 267, 285, 302, 320, 342, 369, 400]), stagger: flat12(10), offsetFrames: flat12(26) }],
  },
  {
    id: "perlica_combo_skill",
    name: "Combo Skill",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(50),
    spCost: flat12(0),
    hits: [
      { multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), stagger: flat12(10), offsetFrames: flat12(48) },
    ],
  },
  {
    id: "perlica_ultimate",
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(126),
    spCost: flat12(0),
    energyCost: flat12(80),
    hits: [
      { multiplier: pct([445, 489, 534, 578, 622, 667, 711, 756, 800, 856, 923, 1000]), offsetFrames: flat12(116) },
    ],
  },
];

export const PERLICA: CharacterBase = {
  id: "perlica",
  name: "Perlica",
  rarity: 5,
  class: "Caster",
  element: "Electric",
  scaling: { INT: 0.005, WIL: 0.002 },
  mainAttr: "INT",
  secondaryAttr: "WIL",
  weaponType: "ARTS_UNIT",
  commands: PERLICA_COMMANDS,
  levels: {
    STR: [9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 90, 91],
    AGI: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 92, 93],
    INT: [21, 23, 24, 26, 27, 29, 31, 32, 34, 35, 37, 38, 40, 42, 43, 45, 46, 48, 49, 51, 53, 54, 56, 57, 59, 60, 62, 64, 65, 67, 68, 70, 72, 73, 75, 76, 78, 79, 81, 83, 84, 86, 87, 89, 90, 92, 94, 95, 97, 98, 100, 101, 103, 105, 106, 108, 109, 111, 112, 114, 116, 117, 119, 120, 122, 123, 125, 127, 128, 130, 131, 133, 134, 136, 138, 139, 141, 142, 144, 145, 147, 149, 150, 152, 153, 155, 156, 158, 160, 161],
    WIL: [13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 72, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 105, 106, 107, 109, 110, 111, 112, 113],
    ATK: [30, 33, 36, 39, 42, 45, 48, 51, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 101, 104, 107, 110, 113, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 147, 150, 153, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 186, 189, 193, 196, 199, 202, 205, 208, 211, 214, 217, 220, 223, 226, 229, 232, 235, 238, 242, 245, 248, 251, 254, 257, 260, 263, 266, 269, 272, 275, 278, 281, 284, 288, 291, 294, 297, 300, 303],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

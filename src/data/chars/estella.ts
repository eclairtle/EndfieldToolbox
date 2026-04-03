import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const ESTELLA_COMMANDS: CommandDefinition[] = [
  {
    id: "estella_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(214),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(12) },
      { name: "Hit 2", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(40) },
      { name: "Hit 3", multiplier: pct([35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79]), offsetFrames: flat12(76) },
      { name: "Hit 4", multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]), offsetFrames: flat12(162) },
    ],
  },
  { id: "estella_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "estella_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "estella_battle_skill",
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(90),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{ multiplier: pct([156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350]), stagger: flat12(10), offsetFrames: flat12(42) }],
  },
  {
    id: "estella_combo_skill",
    name: "Combo Skill",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(40),
    spCost: flat12(0),
    hits: [
      { name: "vs Non-Solidified", multiplier: pct([160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360]), stagger: flat12(10), offsetFrames: flat12(38) },
      { name: "vs Solidified", multiplier: pct([280, 308, 336, 364, 392, 420, 448, 476, 504, 539, 581, 630]), stagger: flat12(10), offsetFrames: flat12(38) },
    ],
  },
  {
    id: "estella_ultimate",
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(120),
    spCost: flat12(0),
    energyCost: flat12(70),
    hits: [
      { multiplier: pct([489, 538, 586, 635, 684, 733, 782, 831, 880, 941, 1014, 1100]), offsetFrames: flat12(108) },
    ],
  },
];

export const ESTELLA: CharacterBase = {
  id: "estella",
  name: "Estella",
  rarity: 4,
  class: "Guard",
  element: "Cryo",
  scaling: { WIL: 0.005, STR: 0.002 },
  mainAttr: "WIL",
  secondaryAttr: "STR",
  weaponType: "POLEARM",
  commands: ESTELLA_COMMANDS,
  levels: {
    STR: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104],
    AGI: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    INT: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110],
    WIL: [15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50, 51, 53, 54, 56, 57, 59, 61, 62, 64, 65, 67, 68, 70, 71, 73, 74, 76, 77, 79, 80, 82, 84, 85, 87, 88, 90, 91, 93, 94, 96, 97, 99, 100, 102, 103, 105, 107, 108, 110, 111, 113, 114, 116, 117, 119, 120, 122, 123, 125, 126, 128, 130, 131, 133, 134, 136, 137, 139, 140, 142, 143, 145, 146, 148, 149, 151],
    ATK: [30, 33, 36, 39, 43, 46, 49, 52, 55, 58, 62, 65, 68, 71, 74, 77, 81, 84, 87, 90, 93, 96, 100, 103, 106, 109, 112, 115, 119, 122, 125, 128, 131, 134, 138, 141, 144, 147, 150, 153, 157, 160, 163, 166, 169, 172, 176, 179, 182, 185, 188, 191, 195, 198, 201, 204, 207, 210, 214, 217, 220, 223, 226, 229, 233, 236, 239, 242, 245, 248, 252, 255, 258, 261, 264, 267, 271, 274, 277, 280, 283, 286, 290, 293, 296, 299, 302, 305, 309, 312],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

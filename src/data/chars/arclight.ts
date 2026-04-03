import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";
import { buildLevelTable } from "./levelTable";

const ARCLIGHT_COMMANDS: CommandDefinition[] = [
  {
    id: "arclight_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(200),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(10) },
      { name: "Hit 2", multiplier: pct([13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 26, 28]), offsetFrames: flat12(30) },
      { name: "Hit 3-1", multiplier: pct([26, 29, 31, 34, 36, 39, 42, 44, 47, 50, 54, 59]), offsetFrames: flat12(56) },
      { name: "Hit 3-2", multiplier: pct([36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81]), offsetFrames: flat12(68) },
      { name: "Hit 4", multiplier: pct([48, 52, 57, 62, 67, 71, 76, 81, 86, 91, 99, 107]), stagger: flat12(16), offsetFrames: flat12(164) },
    ],
  },
  { id: "arclight_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "arclight_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "arclight_battle_skill",
    name: "Tempestuous Arc",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(72),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      { name: "Seq 1", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), offsetFrames: flat12(38) },
      { name: "Seq 2", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), stagger: flat12(5), offsetFrames: flat12(48) },
      { name: "Bonus", multiplier: pct([180, 198, 216, 234, 252, 270, 288, 306, 324, 347, 374, 405]), stagger: flat12(5), offsetFrames: flat12(48) },
    ],
  },
  {
    id: "arclight_combo_skill",
    name: "Peal of Thunder",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(54),
    spCost: flat12(0),
    hits: [{ multiplier: pct([155, 171, 186, 202, 218, 233, 249, 264, 280, 299, 322, 350]), stagger: flat12(5), offsetFrames: flat12(50) }],
  },
  {
    id: "arclight_ultimate",
    name: "Exploding Blitz",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(154),
    spCost: flat12(0),
    energyCost: flat12(90),
    hits: [
      { name: "Seq 1", multiplier: pct([156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350]), stagger: flat12(7), offsetFrames: flat12(122) },
      { name: "Seq 2", multiplier: pct([244, 269, 293, 318, 342, 367, 391, 415, 440, 470, 507, 550]), stagger: flat12(7), offsetFrames: flat12(234) },
    ],
  },
];

export const ARCLIGHT: CharacterBase = {
  id: "arclight",
  name: "Arclight",
  rarity: 5,
  class: "Vanguard",
  element: "Electric",
  scaling: { AGI: 0.005, INT: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "INT",
  weaponType: "SWORD",
  commands: ARCLIGHT_COMMANDS,
  levels: buildLevelTable({
    STR: { lv1: 14, lv20: 33, lv40: 54, lv60: 75, lv80: 96, lv90: 107 },
    AGI: { lv1: 14, lv20: 42, lv40: 71, lv60: 101, lv80: 130, lv90: 145 },
    INT: { lv1: 12, lv20: 36, lv40: 61, lv60: 86, lv80: 111, lv90: 123 },
    WIL: { lv1: 10, lv20: 29, lv40: 49, lv60: 69, lv80: 89, lv90: 100 },
    ATK: { lv1: 30, lv20: 89, lv40: 151, lv60: 213, lv80: 275, lv90: 306 },
    HP: { lv1: 500, lv20: 1566, lv40: 2689, lv60: 3811, lv80: 4934, lv90: 5495 },
  }),
};

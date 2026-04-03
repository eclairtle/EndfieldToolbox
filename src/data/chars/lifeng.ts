import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";
import { buildLevelTable } from "./levelTable";

const LIFENG_COMMANDS: CommandDefinition[] = [
  {
    id: "lifeng_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(190),
    spCost: flat12(0),
    hits: [
      { multiplier: pct([24, 27, 29, 32, 34, 36, 39, 41, 44, 47, 50, 55]), offsetFrames: flat12(18) },
      { multiplier: pct([29, 32, 35, 38, 41, 44, 47, 49, 52, 56, 60, 65]), offsetFrames: flat12(58) },
      { multiplier: pct([35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79]), offsetFrames: flat12(110) },
      { multiplier: pct([68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152]), stagger: flat12(19), offsetFrames: flat12(166) },
    ],
  },
  { id: "lifeng_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "lifeng_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "lifeng_battle_skill",
    name: "Turbid Avatar",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(134),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      { multiplier: pct([38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86]), offsetFrames: flat12(14) },
      { multiplier: pct([38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86]), offsetFrames: flat12(40) },
      { multiplier: pct([119, 131, 143, 155, 167, 178, 190, 202, 214, 229, 247, 268]), stagger: flat12(10), offsetFrames: flat12(108) },
    ],
  },
  {
    id: "lifeng_combo_skill",
    name: "Aspect of Wrath",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(100),
    spCost: flat12(0),
    hits: [
      { name: "Seq 1", multiplier: pct([47, 51, 56, 61, 65, 70, 75, 79, 84, 90, 97, 105]), offsetFrames: flat12(38) },
      { name: "Seq 2", multiplier: pct([167, 183, 200, 217, 233, 250, 267, 283, 300, 321, 346, 375]), stagger: flat12(10), offsetFrames: flat12(96) },
    ],
  },
  {
    id: "lifeng_ultimate",
    name: "Heart of the Unmoving",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(0),
    energyCost: flat12(90),
    hits: [
      { name: "Seq 1", multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]), stagger: flat12(5), offsetFrames: flat12(128) },
      { name: "Seq 2", multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]), stagger: flat12(5), offsetFrames: flat12(248) },
      { name: "Additional", multiplier: pct([267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600]), stagger: flat12(5), offsetFrames: flat12(248) },
    ],
  },
];

export const LIFENG: CharacterBase = {
  id: "lifeng",
  name: "Lifeng",
  rarity: 6,
  class: "Guard",
  element: "Physical",
  scaling: { AGI: 0.005, STR: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "STR",
  weaponType: "POLEARM",
  commands: LIFENG_COMMANDS,
  levels: buildLevelTable({
    STR: { lv1: 14, lv20: 38, lv40: 62, lv60: 86, lv80: 111, lv90: 123 },
    AGI: { lv1: 20, lv20: 44, lv40: 69, lv60: 94, lv80: 119, lv90: 132 },
    INT: { lv1: 13, lv20: 35, lv40: 58, lv60: 81, lv80: 104, lv90: 115 },
    WIL: { lv1: 12, lv20: 35, lv40: 58, lv60: 82, lv80: 105, lv90: 117 },
    ATK: { lv1: 30, lv20: 90, lv40: 153, lv60: 217, lv80: 280, lv90: 312 },
    HP: { lv1: 500, lv20: 1566, lv40: 2689, lv60: 3811, lv80: 4934, lv90: 5495 },
  }),
};

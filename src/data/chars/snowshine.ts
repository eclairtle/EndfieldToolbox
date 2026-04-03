import type { CharacterBase } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";
import { buildLevelTable } from "./levelTable";

const SNOWSHINE_COMMANDS: CommandDefinition[] = [
  {
    id: "snowshine_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(248),
    spCost: flat12(0),
    hits: [
      { multiplier: pct([55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124]), offsetFrames: flat12(38) },
      { multiplier: pct([59, 64, 70, 76, 82, 88, 94, 99, 105, 113, 121, 132]), offsetFrames: flat12(104) },
      { multiplier: pct([100, 110, 120, 130, 140, 150, 160, 170, 180, 193, 208, 225]), stagger: flat12(23), offsetFrames: flat12(202) },
    ],
  },
  { id: "snowshine_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "snowshine_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "snowshine_battle_skill",
    name: "Saturated Defense",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(270),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{ multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]), stagger: flat12(20), energyReturn: flat12(30), offsetFrames: flat12(214) }],
  },
  {
    id: "snowshine_combo_skill",
    name: "Polar Rescue",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Healing",
    mode: "single",
    durationFrames: flat12(30),
    spCost: flat12(0),
    hits: [],
  },
  {
    id: "snowshine_ultimate",
    name: "Frigid Snowfield",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(142),
    spCost: flat12(0),
    energyCost: flat12(80),
    hits: [
      { name: "Explosion", multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]), stagger: flat12(15), offsetFrames: flat12(124) },
      { name: "DoT x10", multiplier: pct([29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65]), offsetFrames: flat12(154), times: 10, repeatIntervalFrames: flat12(30) },
    ],
  },
];

export const SNOWSHINE: CharacterBase = {
  id: "snowshine",
  name: "Snowshine",
  rarity: 5,
  class: "Defender",
  element: "Cryo",
  scaling: { STR: 0.005, WIL: 0.002 },
  mainAttr: "STR",
  secondaryAttr: "WIL",
  weaponType: "GREATSWORD",
  commands: SNOWSHINE_COMMANDS,
  levels: buildLevelTable({
    STR: { lv1: 18, lv20: 47, lv40: 78, lv60: 108, lv80: 139, lv90: 154 },
    AGI: { lv1: 12, lv20: 32, lv40: 52, lv60: 73, lv80: 94, lv90: 104 },
    INT: { lv1: 9, lv20: 27, lv40: 46, lv60: 65, lv80: 84, lv90: 93 },
    WIL: { lv1: 11, lv20: 31, lv40: 53, lv60: 75, lv80: 97, lv90: 108 },
    ATK: { lv1: 30, lv20: 87, lv40: 147, lv60: 207, lv80: 267, lv90: 297 },
    HP: { lv1: 500, lv20: 1566, lv40: 2689, lv60: 3811, lv80: 4934, lv90: 5495 },
  }),
};

import { benchmarkHealing, type CharacterBase, type CharacterBenchmark } from "@/data/characters";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const ARDELIA_COMMANDS: CommandDefinition[] = [
  {
    id: "ardelia_friendly_presence",
    name: "Friendly Presence",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Healing",
    mode: "single",
    spCost: flat12(0),
    hits: [
      {
        name: "E0",
        multiplier: flat12(0.38),
        flatAmount: flat12(45),
        scalingStat: "WIL",
        frameData: flat12(0),
      },
      {
        name: "E1",
        multiplier: flat12(0.53),
        flatAmount: flat12(63),
        scalingStat: "WIL",
        frameData: flat12(0),
      },
      {
        name: "E2",
        multiplier: flat12(0.75),
        flatAmount: flat12(90),
        scalingStat: "WIL",
        frameData: flat12(0),
      },
    ],
  },
  {
    id: "ardelia_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Nature",
    mode: "cycling",
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), frameData: flat12(30) },
      { name: "Hit 2", multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]), frameData: flat12(30) },
      { name: "Hit 3", multiplier: pct([53, 58, 63, 68, 74, 79, 84, 89, 95, 101, 109, 118]), frameData: flat12(30) },
      { name: "Hit 4", multiplier: pct([55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124]), stagger: flat12(18), frameData: flat12(30) },
    ],
  },
  {
    id: "ardelia_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Nature",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), frameData: flat12(30) }],
  },
  {
    id: "ardelia_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Nature",
    mode: "single",
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), frameData: flat12(30) }],
  },
  {
    id: "ardelia_battle_skill",
    name: "Dolly Rush",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Nature",
    mode: "single",
    spCost: flat12(100),
    hits: [{
      multiplier: pct([142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320]),
      stagger: flat12(10),
      frameData: flat12(30),
      targetDebuffs: [
        {
          stat: "PHYSICAL_SUS_PCT",
          value: pct([12, 12, 12, 13, 13, 13, 14, 14, 16, 17, 18, 20]),
          durationSeconds: 30,
        },
        {
          stat: "ARTS_SUS_PCT",
          value: pct([12, 12, 12, 13, 13, 13, 14, 14, 16, 17, 18, 20]),
          durationSeconds: 30,
        },
      ],
    }],
  },
  {
    id: "ardelia_combo_skill",
    name: "Eruption Column",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Nature",
    mode: "single",
    spCost: flat12(0),
    hits: [
      { name: "Volcanic Cloud", multiplier: pct([45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100]), frameData: flat12(30) },
      { name: "Explosion", multiplier: pct([111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250]), stagger: flat12(10), frameData: flat12(30) },
    ],
  },
  {
    id: "ardelia_ultimate",
    name: "Wooly Party",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Nature",
    mode: "single",
    spCost: flat12(0),
    energyCost: flat12(90),
    hits: [{ multiplier: pct([73, 81, 88, 95, 103, 110, 117, 125, 132, 141, 152, 165]), frameData: flat12(30) }],
  },
];

const ARDELIA_BENCHMARKS: CharacterBenchmark[] = [
  benchmarkHealing({
    id: "ardelia_benchmark_talent_healing",
    name: "Talent Healing",
    commandId: "ardelia_friendly_presence",
    label: "Talent Healing",
    computeBaseAmount: (ctx, command) => {
      const hitIndex = Math.min(Math.max(ctx.slot?.characterAscension ?? 0, 0), 2);
      const hit = command.hits[hitIndex];
      if (!hit) return 0;

      return hit.flatAmount + ctx.finalStats.statsCard.WIL * hit.multiplier;
    },
    extraHealingMultiplier: (ctx) => (
      ctx.slot?.uniqueTalentToggles?.game_rewards ? 1.5 : 1
    ),
  }),
  {
    id: "ardelia_benchmark_battle_skill_susceptibility",
    name: "Battle Skill Susceptibility",
    compute: (ctx) => {
      const command = ctx.resolvedCommands.find((c) => c.id === "ardelia_battle_skill");
      const susceptibility =
        command?.hits[0]?.targetDebuffs.find((debuff) => debuff.stat === "PHYSICAL_SUS_PCT")?.value ?? 0;

      return {
        label: "Battle Skill Susceptibility",
        value: susceptibility * 100,
        suffix: "%",
      };
    },
  },
];

export const ARDELIA: CharacterBase = {
  id: "ardelia",
  name: "Ardelia",
  rarity: 6,

  class: "Supporter",
  element: "Nature",

  scaling: {
    INT: 0.006,
    WIL: 0.003
  },

  mainAttr: "INT",
  secondaryAttr: "WIL",

  weaponType: "ARTS_UNIT",
  commands: ARDELIA_COMMANDS,
  benchmarks: ARDELIA_BENCHMARKS,
  uniqueTalentDefs: {
    game_rewards: {
      name: "Game Rewards",
    },
  },

  // Ardelis
  levels: {
    STR: [
        9, 10, 12, 13, 14, 15, 16, 17, 18, 20,
        21, 22, 23, 24, 25, 27, 28, 29, 30, 31,
        32, 33, 35, 36, 37, 38, 39, 40, 41, 43,
        44, 45, 46, 47, 48, 50, 51, 52, 53, 54,
        55, 56, 58, 59, 60, 61, 62, 63, 64, 66,
        67, 68, 69, 70, 71, 73, 74, 75, 76, 77,
        78, 79, 81, 82, 83, 84, 85, 86, 87, 89,
        90, 91, 92, 93, 94, 96, 97, 98, 99, 100,
        101, 102, 104, 105, 106, 107, 108, 109, 110, 112
    ],
    AGI: [
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32, 33, 34, 35, 36, 36,
        37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
        47, 48, 49, 50, 51, 52, 53, 54, 55, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
        66, 67, 68, 69, 70, 71, 72, 73, 73, 74,
        75, 76, 77, 78, 79, 80, 81, 82, 83, 84,
        85, 86, 87, 88, 89, 90, 91, 92, 92, 93
    ],
    INT: [
        20, 21, 22, 24, 25, 27, 28, 30, 31, 32,
        34, 35, 37, 38, 39, 41, 42, 44, 45, 46,
        48, 49, 51, 52, 54, 55, 56, 58, 59, 61,
        62, 63, 65, 66, 68, 69, 71, 72, 73, 75,
        76, 78, 79, 80, 82, 83, 85, 86, 87, 89,
        90, 92, 93, 95, 96, 97, 99, 100, 102, 103,
        104, 106, 107, 109, 110, 112, 113, 114, 116, 117,
        119, 120, 121, 123, 124, 126, 127, 128, 130, 131,
        133, 134, 136, 137, 138, 140, 141, 143, 144, 145
    ],
    WIL: [
        15, 17, 18, 19, 20, 21, 22, 23, 25, 26,
        27, 28, 29, 30, 31, 33, 34, 35, 36, 37,
        38, 40, 41, 42, 43, 44, 45, 46, 48, 49,
        50, 51, 52, 53, 54, 56, 57, 58, 59, 60,
        61, 63, 64, 65, 66, 67, 68, 69, 71, 72,
        73, 74, 75, 76, 77, 79, 80, 81, 82, 83,
        84, 86, 87, 88, 89, 90, 91, 92, 94, 95,
        96, 97, 98, 99, 100, 102, 103, 104, 105, 106,
        107, 109, 110, 111, 112, 113, 114, 115, 117, 118
    ],
    ATK: [
        30, 33, 37, 40, 43, 46, 50, 53, 56, 60,
        63, 66, 70, 73, 76, 79, 83, 86, 89, 93,
        96, 99, 103, 106, 109, 112, 116, 119, 122, 126,
        129, 132, 136, 139, 142, 145, 149, 152, 155, 159,
        162, 165, 169, 172, 175, 178, 182, 185, 188, 192,
        195, 198, 201, 205, 208, 211, 215, 218, 221, 225,
        228, 231, 234, 238, 241, 244, 248, 251, 254, 258,
        261, 264, 267, 271, 274, 277, 281, 284, 287, 291,
        294, 297, 300, 304, 307, 310, 314, 317, 320, 323
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

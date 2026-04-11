import {
  benchmarkCommandDamage,
  type CharacterBase,
  type CharacterBenchmark,
} from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { pct, flat12, type CommandDefinition, type CommandHitDefinition } from "@/lib/commands";

const LAEVATAIN_UBS_HIT_1: CommandHitDefinition = {
  name: "UBS Hit 1",
  multiplier: pct([147, 161, 176, 191, 205, 220, 235, 249, 264, 282, 304, 330]),
  stagger: flat12(10),
  offsetFrames: flat12(44),
}
const LAEVATAIN_UBS_HIT_2: CommandHitDefinition = {
  name: "UBS Hit 2",
  multiplier: pct([164, 181, 197, 214, 230, 247, 263, 279, 296, 316, 341, 370]),
  stagger: flat12(10),
  offsetFrames: flat12(58),
}
const LAEVATAIN_BS_INITIAL_HIT: CommandHitDefinition = {
  name: "Initial Explosion",
  multiplier: pct([62, 68, 75, 81, 87, 93, 99, 106, 112, 120, 129, 140]),
  stagger: flat12(10),
  offsetFrames: flat12(44),
}

const LAEVATAIN_BS_CONTINUOUS_HIT: CommandHitDefinition = {
  name: "Continuous Hit ×10",
  multiplier: pct([6, 7, 8, 8, 9, 9, 10, 11, 11, 12, 13, 14]),
  offsetFrames: flat12(58),
  times: 10,
  repeatIntervalFrames: flat12(8),
}

function getScorchingHeartResistanceIgnore(ctx: {
  isSelfUniqueTalentEnabled: (key: string) => boolean;
}) {
  if (ctx.isSelfUniqueTalentEnabled("laevatain_scorching_heart_3")) {
    return 0.2;
  }
  if (ctx.isSelfUniqueTalentEnabled("laevatain_scorching_heart_2")) {
    return 0.15;
  }
  return 0.1;
}

const LAEVATAIN_COMBAT_HOOKS: CharacterCombatHooks = {
  onResolvedHit: (ctx) => {
    if (!ctx.source.isControlledOperatorHit) {
      return;
    }

    if (!ctx.flags.isFinalStrikeOfBasicSequence && !ctx.flags.isFinisherHit) {
      return;
    }

    const enemyInfliction = ctx.state.getEnemyArtsInfliction();
    if (!enemyInfliction || enemyInfliction.element !== "Heat" || enemyInfliction.stacks <= 0) {
      return;
    }

    const currentStacks = ctx.state.getSelfMeltingFlameStacks();
    const absorbLimit = Math.max(0, 4 - currentStacks);
    if (absorbLimit <= 0) {
      return;
    }

    const absorbedStacks = Math.min(absorbLimit, enemyInfliction.stacks);
    if (absorbedStacks <= 0) {
      return;
    }

    const remainingStacks = enemyInfliction.stacks - absorbedStacks;
    ctx.state.setEnemyArtsInfliction(
      remainingStacks > 0
        ? {
            ...enemyInfliction,
            stacks: remainingStacks,
          }
        : null,
    );

    ctx.state.gainSelfMeltingFlameStacks(absorbedStacks, `Laevatain: Melting Flame +${absorbedStacks}`);
  },
  onEvent: (ctx) => {
    if (ctx.event.type === "MELTING_FLAME_FULL" && ctx.event.slot === ctx.self.slot) {
      ctx.state.applySelfBuff({
        buffId: `laevatain_melting_flame_full:${ctx.self.slot}`,
        label: "Scorching Heart",
        durationSeconds: 20,
        timeScale: "game",
        effects: {
          HEAT_RESIST_IGNORE_PCT: getScorchingHeartResistanceIgnore(ctx.state),
        },
      });
      return;
    }

    if (ctx.event.type === "COMBUSTION_APPLIED" || ctx.event.type === "CORROSION_APPLIED") {
      ctx.state.triggerSelfCombo({
        sourceEventType: ctx.event.type,
        label: "Laevatain Combo Triggered",
      });
    }
  },
};

const LAEVATAIN_COMMANDS: CommandDefinition[] = [
  {
    id: "laevatain_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence",
    durationFrames: flat12(197),
    spCost: flat12(0),
    transforms: [
      {
        toCommandId: "laevatain_ultimate_basic_sequence",
        requiresBuffId: "laevatain_twilight",
      },
    ],
    expandsToCommandIds: [
      "laevatain_basic_sequence_1",
      "laevatain_basic_sequence_2",
      "laevatain_basic_sequence_3",
      "laevatain_basic_sequence_4",
      "laevatain_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "laevatain_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(22.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36]),
        offsetFrames: flat12(12),
      },
    ],
  },
  {
    id: "laevatain_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54]),
        offsetFrames: flat12(12),
      },
      {
        name: "Hit 2",
        multiplier: pct([24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54]),
        offsetFrames: flat12(25.8),
      },
    ],
  },
  {
    id: "laevatain_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(25.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]),
        offsetFrames: flat12(18),
      },
    ],
  },
  {
    id: "laevatain_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(45.6),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([39, 43, 47, 51, 55, 59, 62, 66, 70, 75, 81, 88]),
        offsetFrames: flat12(12),
      },
      {
        name: "Hit 2",
        multiplier: pct([39, 43, 47, 51, 55, 59, 62, 66, 70, 75, 81, 88]),
        offsetFrames: flat12(24),
      },
      {
        name: "Hit 3",
        multiplier: pct([39, 43, 47, 51, 55, 59, 62, 66, 70, 75, 81, 88]),
        offsetFrames: flat12(37.8),
      },
    ],
  },
  {
    id: "laevatain_basic_sequence_5",
    name: "Basic Attack Sequence V",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(70.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([53, 58, 64, 69, 74, 80, 85, 90, 95, 102, 110, 119]),
        offsetFrames: flat12(46.2),
      },
      {
        name: "Hit 2",
        multiplier: pct([53, 58, 64, 69, 74, 80, 85, 90, 95, 102, 110, 119]),
        stagger: flat12(18),
        spGenerated: flat12(20),
        requiresControlledOperator: true,
        offsetFrames: flat12(52.2),
      },
    ],
  },
  {
    id: "laevatain_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "final_strike",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]),
        offsetFrames: flat12(30),
      },
    ],
  },
  {
    id: "laevatain_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "dive_attack",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]),
        offsetFrames: flat12(30),
      },
    ],
  },

  // Battle Skill
  {
    id: "laevatain_battle_skill",
    name: "Smouldering Fire",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(100),
    energyGain: flat12(0),
    transforms: [
      {
        toCommandId: "laevatain_enhanced_ultimate_battle_skill",
        requiresBuffId: "laevatain_twilight",
        requiresMeltingFlameStacks: 4,
      },
      {
        toCommandId: "laevatain_ultimate_battle_skill",
        requiresBuffId: "laevatain_twilight",
      },
      {
        toCommandId: "laevatain_enhanced_battle_skill",
        requiresMeltingFlameStacks: 4,
      },
    ],
    hits: [
      LAEVATAIN_BS_INITIAL_HIT,
      LAEVATAIN_BS_CONTINUOUS_HIT,
    ],
  },

  // Enhanced Battle Skill
  {
    id: "laevatain_enhanced_battle_skill",
    name: "Smouldering Fire",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    variant: "enhanced_battle_skill",
    hiddenInLibrary: true,
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      LAEVATAIN_BS_INITIAL_HIT,
      LAEVATAIN_BS_CONTINUOUS_HIT,
      {
        name: "Additional Hit",
        multiplier: pct([342, 376, 410, 445, 479, 513, 547, 581, 616, 658, 710, 770]),
        stagger: flat12(10),
        energyReturn: flat12(100),
        effects: [
          { type: "REMOVE_BUFF", target: "self", buffId: "melting_flame", stacks: 4 },
          { type: "APPLY_REACTION", reaction: "Combustion", level: 1, durationSeconds: 5 },
        ],
        offsetFrames: flat12(124),
      },
    ],
  },

  // Ultimate cast itself: 0-hit command for now
  {
    id: "laevatain_combo_skill",
    name: "Seethe",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(80),
    timeFreezeSeconds: flat12(37 / 60),
    comboCooldownSeconds: [...flat12(10).slice(0, 11), 9],
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([240, 264, 288, 312, 336, 360, 384, 408, 432, 462, 498, 540]),
        stagger: flat12(10),
        energyReturn: flat12(25),
        registerOffsetFrames: flat12(40),
        offsetFrames: flat12(78),
        effects: [{ type: "APPLY_BUFF", target: "self", buffId: "melting_flame", stacks: 1 }],
      },
    ],
  },

  {
    id: "laevatain_ultimate_cast",
    name: "Twilight",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(142),
    timeFreezeSeconds: flat12(2.07),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(300),
    hits: [
      {
        multiplier: flat12(0),
        offsetFrames: flat12(125),
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: "laevatain_twilight",
            label: "Twilight",
            durationSeconds: 15,
            timeScale: "game",
          },
        ],
      },
    ],
  },

  // Ultimate Battle Skill
  {
    id: "laevatain_ultimate_battle_skill",
    name: "Smouldering Fire",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    variant: "enhanced_battle_skill",
    hiddenInLibrary: true,
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      LAEVATAIN_UBS_HIT_1,
      LAEVATAIN_UBS_HIT_2,
    ],
  },

  // Enhanced Ultimate Battle Skill
  {
    id: "laevatain_enhanced_ultimate_battle_skill",
    name: "Smouldering Fire",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    variant: "enhanced_battle_skill",
    hiddenInLibrary: true,
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      LAEVATAIN_UBS_HIT_1,
      LAEVATAIN_UBS_HIT_2,
      {
        name: "Additional Hit",
        multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]),
        stagger: flat12(10),
        effects: [
          { type: "REMOVE_BUFF", target: "self", buffId: "melting_flame", stacks: 4 },
          { type: "APPLY_REACTION", reaction: "Combustion", level: 1, durationSeconds: 5 },
        ],
        offsetFrames: flat12(124),
      },
    ],
  },

  // Ultimate Basic Attack Sequence
  {
    id: "laevatain_ultimate_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    variant: "enhanced_basic_attack",
    basicAttackVariant: "sequence",
    hiddenInLibrary: true,
    mode: "cycling",
    durationFrames: flat12(197),
    spCost: flat12(0),
    expandsToCommandIds: [
      "laevatain_ultimate_basic_sequence_1",
      "laevatain_ultimate_basic_sequence_2",
      "laevatain_ultimate_basic_sequence_3",
      "laevatain_ultimate_basic_sequence_4",
    ],
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([65, 71, 78, 84, 91, 97, 104, 110, 117, 125, 134, 146]),
        offsetFrames: flat12(12),
      },
      {
        name: "Enhanced Hit 2",
        multiplier: pct([81, 89, 97, 105, 113, 122, 130, 138, 146, 156, 168, 182]),
        offsetFrames: flat12(34),
      },
      {
        name: "Enhanced Hit 3",
        multiplier: pct([115, 127, 139, 150, 162, 173, 185, 196, 208, 222, 240, 260]),
        offsetFrames: flat12(74),
        effects: [
          { type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 }
        ]
      },
      {
        name: "Enhanced Hit 4",
        multiplier: pct([203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456]),
        offsetFrames: flat12(120),
      },
    ],
  },
  {
    id: "laevatain_ultimate_basic_sequence_1",
    name: "Ultimate Basic Attack Sequence I",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    variant: "enhanced_basic_attack",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(22.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([65, 71, 78, 84, 91, 97, 104, 110, 117, 125, 134, 146]),
        offsetFrames: flat12(12),
      },
    ],
  },
  {
    id: "laevatain_ultimate_basic_sequence_2",
    name: "Ultimate Basic Attack Sequence II",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    variant: "enhanced_basic_attack",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([81, 89, 97, 105, 113, 122, 130, 138, 146, 156, 168, 182]),
        offsetFrames: flat12(12),
      },
      {
        name: "Enhanced Hit 2",
        multiplier: pct([81, 89, 97, 105, 113, 122, 130, 138, 146, 156, 168, 182]),
        offsetFrames: flat12(25.8),
      },
    ],
  },
  {
    id: "laevatain_ultimate_basic_sequence_3",
    name: "Ultimate Basic Attack Sequence III",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    variant: "enhanced_basic_attack",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(25.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([115, 127, 139, 150, 162, 173, 185, 196, 208, 222, 240, 260]),
        offsetFrames: flat12(18),
        effects: [
          { type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 },
        ],
      },
    ],
  },
  {
    id: "laevatain_ultimate_basic_sequence_4",
    name: "Ultimate Basic Attack Sequence IV",
    skill: "ultimate",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    variant: "enhanced_basic_attack",
    basicAttackVariant: "sequence_segment",
    hiddenInLibrary: true,
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(45.6),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Enhanced Hit 1",
        multiplier: pct([203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456]),
        offsetFrames: flat12(12),
      },
      {
        name: "Enhanced Hit 2",
        multiplier: pct([203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456]),
        offsetFrames: flat12(24),
      },
      {
        name: "Enhanced Hit 3",
        multiplier: pct([203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456]),
        offsetFrames: flat12(37.8),
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
  combatHooks: LAEVATAIN_COMBAT_HOOKS,
  uniqueTalentDefs: {
    laevatain_scorching_heart_1: {
      name: "Scorching Heart I",
      defaultEnabled: true,
      condition: {
        minEliteStage: 0,
      },
    },
    laevatain_scorching_heart_2: {
      name: "Scorching Heart II",
      condition: {
        minEliteStage: 1,
        requiresUniqueTalentsEnabled: ["laevatain_scorching_heart_1"],
      },
    },
    laevatain_scorching_heart_3: {
      name: "Scorching Heart III",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: ["laevatain_scorching_heart_2"],
      },
    },
  },
  benchmarks: LAEVATAIN_BENCHMARKS,
  promotions: LAEVATAIN_PROMOTIONS,
};

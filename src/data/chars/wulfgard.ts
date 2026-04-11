import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { pct, flat12, type CommandDefinition } from "@/lib/commands";

const WULFGARD_SCORCHING_FANGS_BUFF_ID = "wulfgard_scorching_fangs";

const WULFGARD_COMBAT_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (
      ctx.event.type === "COMBUSTION_APPLIED"
      && (ctx.event.slot === ctx.self.slot || ctx.event.sourceSlot === ctx.self.slot)
    ) {
      const hasScorchingFangsI = ctx.state.isSelfUniqueTalentEnabled("wulfgard_scorching_fangs_1");
      const hasScorchingFangsII = ctx.state.isSelfUniqueTalentEnabled("wulfgard_scorching_fangs_2");
      const scorchingFangsBaseHeatDmgPct = hasScorchingFangsII ? 0.3 : hasScorchingFangsI ? 0.2 : 0;

      if (
        scorchingFangsBaseHeatDmgPct > 0
        && ctx.state.markTriggerOnce(`${ctx.event.stepId ?? `${ctx.event.time}`}:wulfgard_scorching_fangs_gain`)
      ) {
        ctx.state.applySelfBuff({
          buffId: WULFGARD_SCORCHING_FANGS_BUFF_ID,
          label: "Scorching Fangs",
          durationSeconds: 10,
          timeScale: "game",
          effects: {
            HEAT_DMG_PCT: scorchingFangsBaseHeatDmgPct,
          },
        });
      }
      return;
    }

    if (
      ctx.event.type === "ULTIMATE_CAST"
      && (ctx.event.slot === ctx.self.slot || ctx.event.sourceSlot === ctx.self.slot)
      && ctx.state.isSelfPotentialActive(5)
      && ctx.state.markTriggerOnce(`${ctx.event.stepId ?? `${ctx.event.time}`}:wulfgard_potential_5`)
    ) {
      ctx.state.resetSelfComboCooldown();
    }
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.characterId !== "wulfgard") {
      return;
    }

    const hasScorchingFangsI = ctx.state.isSelfUniqueTalentEnabled("wulfgard_scorching_fangs_1");
    const hasScorchingFangsII = ctx.state.isSelfUniqueTalentEnabled("wulfgard_scorching_fangs_2");
    const scorchingFangsBaseHeatDmgPct = hasScorchingFangsII ? 0.3 : hasScorchingFangsI ? 0.2 : 0;

    const triggeredThermiteAdditionalEffects = ctx.source.commandId === "wulfgard_battle_skill_reaction";

    if (
      triggeredThermiteAdditionalEffects
      && ctx.state.markTriggerOnce(`${ctx.stepId}:wulfgard_code_of_restraint_sp`)
    ) {
      const hasCodeOfRestraintI = ctx.state.isSelfUniqueTalentEnabled("wulfgard_code_of_restraint_1");
      const hasCodeOfRestraintII = ctx.state.isSelfUniqueTalentEnabled("wulfgard_code_of_restraint_2");
      const baseSp = hasCodeOfRestraintII ? 10 : hasCodeOfRestraintI ? 5 : 0;
      const potentialBonusSp = ctx.state.isSelfPotentialActive(2) ? 10 : 0;
      const totalSp = baseSp + potentialBonusSp;

      if (totalSp > 0) {
        ctx.state.grantReturnedSp(totalSp, "Code of Restraint");
      }
    }

    if (
      triggeredThermiteAdditionalEffects
      && ctx.state.isSelfPotentialActive(3)
      && scorchingFangsBaseHeatDmgPct > 0
      && ctx.state.hasSelfBuff(WULFGARD_SCORCHING_FANGS_BUFF_ID)
      && ctx.state.markTriggerOnce(`${ctx.stepId}:wulfgard_pack_share`)
    ) {
      ctx.state.applySelfBuff({
        buffId: WULFGARD_SCORCHING_FANGS_BUFF_ID,
        label: "Scorching Fangs",
        durationSeconds: 10,
        timeScale: "game",
        effects: {
          HEAT_DMG_PCT: scorchingFangsBaseHeatDmgPct,
        },
      });

      ctx.state.applyOtherTeammatesBuff({
        buffId: "wulfgard_scorching_fangs_shared",
        label: "Scorching Fangs",
        durationSeconds: 10,
        timeScale: "game",
        effects: {
          HEAT_DMG_PCT: scorchingFangsBaseHeatDmgPct * 0.5,
        },
      });
    }
  },
};

const WULFGARD_COMMANDS: CommandDefinition[] = [
  {
    id: "wulfgard_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    durationFrames: flat12(270),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    expandsToCommandIds: [
      "wulfgard_basic_sequence_1",
      "wulfgard_basic_sequence_2",
      "wulfgard_basic_sequence_3",
      "wulfgard_basic_sequence_4",
    ],
    hits: [],
    },
    {
    id: "wulfgard_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(49.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]),
        offsetFrames: flat12(13.8),
        },
        {
        name: "Hit 2",
        multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]),
        offsetFrames: flat12(28.02),
        },
    ],
    },
    {
    id: "wulfgard_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(48),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79]),
        offsetFrames: flat12(19.8),
        },
        {
        name: "Hit 2",
        multiplier: pct([35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79]),
        offsetFrames: flat12(31.8),
        },
    ],
    },
    {
    id: "wulfgard_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(66),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125]),
        offsetFrames: flat12(24),
        },
        {
        name: "Hit 2",
        multiplier: pct([56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125]),
        offsetFrames: flat12(36),
        },
        {
        name: "Hit 3",
        multiplier: pct([56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125]),
        offsetFrames: flat12(48),
        },
    ],
    },
    {
    id: "wulfgard_basic_sequence_4",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(106.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152]),
        offsetFrames: flat12(46.02),
        },
        {
        name: "Hit 2",
        multiplier: pct([68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152]),
        stagger: flat12(18),
        spGenerated: flat12(18),
        requiresControlledOperator: true,
        offsetFrames: flat12(46.02),
        },
    ],
    },
    {
    id: "wulfgard_basic_finisher",
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
    id: "wulfgard_basic_dive",
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
    {
    id: "wulfgard_battle_skill",
    name: "Thermite Tracer",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(64.2),
    spCost: flat12(100),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([102, 112, 122, 133, 143, 153, 163, 174, 184, 196, 212, 230]),
        offsetFrames: flat12(12),
        },
        {
        name: "Hit 2",
        multiplier: pct([102, 112, 122, 133, 143, 153, 163, 174, 184, 196, 212, 230]),
        offsetFrames: flat12(31.8),
        },
        {
        name: "Hit 3",
        multiplier: pct([102, 112, 122, 133, 143, 153, 163, 174, 184, 196, 212, 230]),
        stagger: flat12(5),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 }],
        offsetFrames: flat12(46.02),
        },
    ],
    },
    {
    id: "wulfgard_battle_skill_reaction",
    name: "Thermite Tracer",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    variant: "enhanced_battle_skill",
    mode: "single",
    durationFrames: flat12(124.2),
    spCost: flat12(100),
    splitMultiplier: true,
    hits: [
        {
        name: "Hit 1",
        multiplier: pct([378, 415, 453, 491, 529, 566, 604, 642, 680, 727, 784, 850]),
        offsetFrames: flat12(12),
        },
        {
        name: "Hit 2",
        multiplier: pct([378, 415, 453, 491, 529, 566, 604, 642, 680, 727, 784, 850]),
        offsetFrames: flat12(31.8),
        },
        {
        name: "Hit 3",
        multiplier: pct([378, 415, 453, 491, 529, 566, 604, 642, 680, 727, 784, 850]),
        stagger: flat12(5),
        offsetFrames: flat12(46.02),
        },
        {
        name: "Hit 4",
        multiplier: pct([378, 415, 453, 491, 529, 566, 604, 642, 680, 727, 784, 850]),
        stagger: flat12(5),
        spReturned: flat12(10),
        effects: [{ type: "REMOVE_BUFF", target: "enemy", buffId: "combustion" }],
        offsetFrames: flat12(124.2),
        },
    ],
    },
    {
    id: "wulfgard_combo_skill",
    name: "Frag Grenade·Beta",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(60),
    timeFreezeSeconds: flat12(51 / 60),
    comboCooldownSeconds: [...flat12(20).slice(0, 11), 19],
    comboCooldownTimeScale: "real",
    spCost: flat12(0),
    hits: [
        {
        multiplier: pct([60, 66, 72, 78, 84, 90, 96, 102, 108, 116, 125, 135]),
        stagger: flat12(10),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 }],
        offsetFrames: flat12(54),
        },
    ],
    },
    {
    id: "wulfgard_ultimate",
    name: "Wolven Fury",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(150),
    timeFreezeSeconds: flat12(65 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(90),
    hits: [
        {
        name: "Rapid Barrage x5",
        multiplier: pct([32, 35, 38, 42, 45, 48, 51, 54, 58, 62, 66, 72]),
        stagger: flat12(15),
        offsetFrames: flat12(68),
        times: 5,
        repeatIntervalFrames: flat12(18),
        },
    ],
    },
];

export const WULFGARD: CharacterBase = {
  id: "wulfgard",
  name: "WulfGard",
  rarity: 5,

  class: "Caster",
  element: "Heat",

  scaling: {
    STR: 0.005,
    AGI: 0.002
  },

  mainAttr: "STR",
  secondaryAttr: "AGI",

  weaponType: "HANDCANNON",

  levels: {
    STR: [
        18, 20, 21, 23, 24, 26, 28, 29, 31, 33,
        34, 36, 37, 39, 41, 42, 44, 45, 47, 49,
        50, 52, 53, 55, 57, 58, 60, 61, 63, 65,
        66, 68, 70, 71, 73, 74, 76, 78, 79, 81,
        82, 84, 86, 87, 89, 90, 92, 94, 95, 97,
        98, 100, 102, 103, 105, 107, 108, 110, 111, 113,
        115, 116, 118, 119, 121, 123, 124, 126, 127, 129,
        131, 132, 134, 135, 137, 139, 140, 142, 144, 145,
        147, 148, 150, 152, 153, 155, 156, 158, 160, 161
    ],
    AGI: [
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 25, 26, 26, 27,
        28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
        38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
        48, 49, 50, 51, 52, 53, 53, 54, 55, 56,
        57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
        67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
        77, 78, 79, 80, 80, 81, 82, 83, 84, 85,
        86, 87, 88, 89, 90, 91, 92, 93, 94, 95
    ],
    INT: [
        9, 10, 11, 12, 13, 14, 15, 15, 16, 17,
        18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 30, 31, 32, 33, 34, 35, 36,
        37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
        47, 48, 49, 50, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
        66, 67, 68, 69, 70, 71, 71, 72, 73, 74,
        75, 75, 76, 77, 78, 79, 80, 81, 82, 83,
        84, 85, 86, 87, 88, 89, 90, 91, 91, 92
    ],
    WIL: [
        13, 14, 16, 17, 18, 19, 20, 21, 22, 23,
        24, 25, 26, 28, 29, 30, 31, 32, 33, 34,
        35, 36, 37, 39, 40, 41, 42, 43, 44, 45,
        46, 47, 48, 50, 51, 52, 53, 54, 55, 56,
        57, 58, 59, 61, 62, 63, 64, 65, 66, 67,
        68, 69, 70, 72, 73, 74, 75, 76, 77, 78,
        79, 80, 81, 83, 84, 85, 86, 87, 88, 89,
        90, 91, 92, 93, 95, 96, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 107, 108, 109, 110, 111
    ],
    ATK: [
        30, 33, 36, 39, 42, 45, 48, 51, 54, 57,
        60, 63, 66, 69, 72, 75, 77, 80, 83, 86,
        89, 92, 95, 98, 101, 104, 107, 110, 113, 116,
        119, 122, 125, 128, 131, 134, 137, 140, 143, 146,
        149, 152, 155, 158, 161, 164, 166, 169, 172, 175,
        178, 181, 184, 187, 190, 193, 196, 199, 202, 205,
        208, 211, 214, 217, 220, 223, 226, 229, 232, 235,
        238, 241, 244, 247, 250, 253, 255, 258, 261, 264,
        267, 270, 273, 276, 279, 282, 285, 288, 291, 294
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
    },
    commands: WULFGARD_COMMANDS,
    combatHooks: WULFGARD_COMBAT_HOOKS,
    uniqueTalentDefs: {
      wulfgard_scorching_fangs_1: {
        name: "Scorching Fangs I",
        condition: {
          minEliteStage: 1,
        },
      },
      wulfgard_scorching_fangs_2: {
        name: "Scorching Fangs II",
        condition: {
          minEliteStage: 2,
          requiresUniqueTalentsEnabled: ["wulfgard_scorching_fangs_1"],
        },
      },
      wulfgard_code_of_restraint_1: {
        name: "Code of Restraint I",
        condition: {
          minEliteStage: 2,
        },
      },
      wulfgard_code_of_restraint_2: {
        name: "Code of Restraint II",
        condition: {
          minEliteStage: 3,
          requiresUniqueTalentsEnabled: ["wulfgard_code_of_restraint_1"],
        },
      },
    },
    potentialEffects: {
      1: {
        apply: () => ({
          attrsDelta: {
            STR: 15,
            AGI: 15,
          },
        }),
      },
    },
    mutateResolvedCommands: (commands, ctx) => {
      if ((ctx.buildState.potentialLevel ?? 0) < 4) {
        return commands;
      }

      return commands.map((command) => {
        if (command.id !== "wulfgard_ultimate") {
          return command;
        }

        return {
          ...command,
          energyCost: Math.max(0, command.energyCost * 0.85),
        };
      });
    },
};

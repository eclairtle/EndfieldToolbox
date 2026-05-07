import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const LASTRITE_TALENT_1_1 = "lastrite_talent_cryo_sus_1";
const LASTRITE_TALENT_1_2 = "lastrite_talent_cryo_sus_2";
const LASTRITE_TALENT_2_1 = "lastrite_talent_ult_sus_scale_1";
const LASTRITE_TALENT_2_2 = "lastrite_talent_ult_sus_scale_2";
const LASTRITE_HYPOTHERMIC_STATUS = "lastrite_hypothermic_perfusion";
const LASTRITE_POT1_EXECUTE_HIT_ID = "lastrite_potential_1_followup";
const LASTRITE_BATTLE_SKILL_TRIGGER_HIT_ID = "lastrite_battle_skill_trigger_hit";

const LASTRITE_COMMANDS: CommandDefinition[] = [
  {
    id: "lastrite_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    mode: "cycling",
    basicAttackVariant: "sequence",
    durationFrames: flat12(270),
    spCost: flat12(0),
    expandsToCommandIds: [
      "lastrite_basic_sequence_1",
      "lastrite_basic_sequence_2",
      "lastrite_basic_sequence_3",
      "lastrite_basic_sequence_4",
    ],
    hits: [],
  },
  {
    id: "lastrite_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(40),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([30,33,36,39,42,45,48,51,54,58,62,68]), offsetFrames: flat12(24) },
    ],
  },
  {
    id: "lastrite_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(58),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([55,61,66,72,77,83,88,94,99,106,114,124]), offsetFrames: flat12(22) },
    ],
  },
  {
    id: "lastrite_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(98),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([68,75,82,88,95,102,109,116,122,131,141,153]), offsetFrames: flat12(58) },
    ],
  },
  {
    id: "lastrite_basic_sequence_4",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Cryo",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(74),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([90,99,108,117,126,135,144,153,162,173,187,203]), offsetFrames: flat12(68) },
    ],
  },
  { id: "lastrite_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Cryo", mode: "single", basicAttackVariant: "finisher", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400,440,480,520,560,600,640,680,720,770,830,900]), offsetFrames: flat12(30) }] },
  { id: "lastrite_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Cryo", mode: "single", basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80,88,96,104,112,120,128,136,144,154,166,180]), offsetFrames: flat12(30) }] },
  {
    id: "lastrite_battle_skill",
    name: "Esoteric Legacy of Seš'qa",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    mode: "single",
    overlapMode: "transient",
    durationFrames: flat12(48),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{
      multiplier: flat12(0),
      spReturned: flat12(30),
      offsetFrames: flat12(2),
      effects: [
        { type: "APPLY_TEAM_STATUS", statusId: LASTRITE_HYPOTHERMIC_STATUS, label: "Hypothermic Perfusion", stacks: 1, durationSeconds: 15, timeScale: "game" },
      ],
    }],
  },
  {
    id: "lastrite_combo_skill",
    name: "Winter's Devourer",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(130),
    spCost: flat12(0),
    timeFreezeSeconds: flat12(1.5),
    comboCooldownSeconds: [9,9,9,9,9,9,9,9,9,9,9,8],
    hits: [
      {
        name: "Ice Shard",
        multiplier: pct([71, 78, 85, 92, 99, 107, 114, 121, 128, 137, 147, 160]),
        offsetFrames: flat12(0),
      },
      {
        name: "Slash",
        multiplier: pct([71, 78, 85, 92, 99, 107, 114, 121, 128, 137, 147, 160]),
        stagger: flat12(15),
        energyReturn: flat12(40),
        accumulator: {
          type: "consume_enemy_status",
          statusId: "arts_infliction",
          maxConsumed: flat12(99),
          useLevelAsStacks: false,
          multiplier: pct([107, 117, 128, 139, 149, 160, 171, 181, 192, 205, 221, 240]),
          energyReturn: flat12(15),
        },
        offsetFrames: flat12(126),
      },
    ],
  },
  { id: "lastrite_ultimate", name: "Vigil Services", skill: "ultimate", attackType: "ULTIMATE", damageType: "Cryo", mode: "single", durationFrames: flat12(280), spCost: flat12(0), energyCost: flat12(240), hits: [
    { name: "Seq 1", multiplier: pct([178,196,213,231,249,267,284,302,320,342,369,400]), stagger: flat12(5), offsetFrames: flat12(172) },
    { name: "Seq 2", multiplier: pct([178,196,213,231,249,267,284,302,320,342,369,400]), stagger: flat12(5), offsetFrames: flat12(210) },
    { name: "Seq 3", multiplier: pct([356,391,427,462,498,533,569,604,640,684,738,800]), stagger: flat12(10), offsetFrames: flat12(268) },
  ] },
];

const LASTRITE_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: LASTRITE_BATTLE_SKILL_TRIGGER_HIT_ID,
    name: "Esoteric Legacy Trigger Hit",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    commandId: "lastrite_battle_skill",
    commandName: "Esoteric Legacy of Seš'qa",
    multiplier: pct([142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320]),
    energyReturn: flat12(16),
    offsetFrames: flat12(0),
    effects: [
      { type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 },
    ],
  },
  {
    id: LASTRITE_POT1_EXECUTE_HIT_ID,
    name: "Hypothermic Perfusion Follow-up",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Cryo",
    commandId: "__lastrite_potential_1",
    commandName: "Hypothermic Perfusion",
    multiplier: pct([20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]),
    stagger: flat12(5),
    offsetFrames: flat12(0),
  },
];

const LASTRITE_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type === "ARTS_INFLICTION_APPLIED") {
      const artsInfliction = ctx.state.getEnemyArtsInfliction();
      if (artsInfliction?.element === "Cryo" && artsInfliction.stacks >= 3) {
        ctx.state.triggerSelfCombo({
          label: "Last Rite Combo Triggered",
          sourceEventType: "ARTS_INFLICTION_APPLIED",
        });
      }
    }

    if (ctx.event.type === "BASIC_ATTACK_FINAL_STRIKE_HIT" && ctx.state.hasStatus({ statusId: LASTRITE_HYPOTHERMIC_STATUS })) {
      const effects: NonNullable<Parameters<typeof ctx.state.applyEffects>[0]["effects"]> = [
        { type: "EXECUTE_HIT", hitRefId: LASTRITE_BATTLE_SKILL_TRIGGER_HIT_ID, executeDelayFrames: 30 },
      ];
      if (ctx.state.isSelfPotentialActive(1)) {
        effects.push({
          type: "EXECUTE_HIT",
          hitRefId: LASTRITE_POT1_EXECUTE_HIT_ID,
          inheritSourceBonuses: false,
          executeDelayFrames: 30,
        });
      }
      effects.push({
        type: "CONSUME_TEAM_STATUS",
        statusId: LASTRITE_HYPOTHERMIC_STATUS,
        stacks: 1,
        label: "Hypothermic Perfusion",
      });
      ctx.state.applyEffects({
        effects,
        stepId: `${ctx.event.stepId ?? "event"}:lastrite_battle_skill_trigger`,
      });
    }

    if (ctx.event.type !== "ARTS_INFLICTION_CONSUMED" || ctx.event.sourceSlot !== ctx.self.slot) {
      return;
    }
    const perStack = ctx.state.isSelfUniqueTalentEnabled(LASTRITE_TALENT_1_2) ? 0.04 : 0.02;
    if (!ctx.state.isSelfUniqueTalentEnabled(LASTRITE_TALENT_1_1) && !ctx.state.isSelfUniqueTalentEnabled(LASTRITE_TALENT_1_2)) {
      return;
    }
    ctx.state.applyEffects({
      effects: [
        {
          type: "APPLY_STATUS",
          target: "enemy",
          statusId: "lastrite_hypothermia",
          label: "Hypothermia",
          durationSeconds: 15,
          timeScale: "game",
          effects: {
            CRYO_SUS_PCT: perStack * Math.max(1, ctx.event.consumedStacks ?? 1),
          },
        },
      ],
      stepId: `${ctx.event.stepId ?? "event"}:lastrite_t1`,
    });
  },
};

export const LASTRITE: CharacterBase = {
  id: "lastrite", name: "Last Rite",
  skillIconPaths: {
    battleSkill: "/avatars/LASTRITE/icon_skill_lastrite_01.webp",
    comboSkill: "/avatars/LASTRITE/icon_combo_skill_lastrite_01.webp",
    ultimate: "/avatars/LASTRITE/icon_ultimate_skill_lastrite_01.webp",
  },
  rarity: 6, class: "Striker", element: "Cryo",
  restrictEnergyGainToOwnBattleOrComboCommands: true,
  scaling: { STR: 0.005, WIL: 0.002 }, mainAttr: "STR", secondaryAttr: "WIL", weaponType: "GREATSWORD", commands: LASTRITE_COMMANDS,
  executeHits: LASTRITE_EXECUTE_HITS,
  combatHooks: LASTRITE_HOOKS,
  uniqueTalentDefs: {
    [LASTRITE_TALENT_1_1]: { name: "Hypothermia I", condition: { minEliteStage: 1 } },
    [LASTRITE_TALENT_1_2]: {
      name: "Hypothermia II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [LASTRITE_TALENT_1_1] },
    },
    [LASTRITE_TALENT_2_1]: { name: "Cryogenic Embrittlement I", condition: { minEliteStage: 2 } },
    [LASTRITE_TALENT_2_2]: {
      name: "Cryogenic Embrittlement II",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [LASTRITE_TALENT_2_1] },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: { STR: 20 },
        modsDelta: { CRYO_DMG_PCT: 0.1 },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    const hasTalent2_2 = Boolean(ctx.buildState.uniqueTalentToggles?.[LASTRITE_TALENT_2_2]);
    const hasTalent2_1 = hasTalent2_2 || Boolean(ctx.buildState.uniqueTalentToggles?.[LASTRITE_TALENT_2_1]);
    const scaleHitMultiplier = <T extends { multiplier: number; accumulator?: { multiplier: number } }>(
      hit: T,
      factor: number,
    ): T => ({
      ...hit,
      multiplier: hit.multiplier * factor,
      accumulator: hit.accumulator
        ? {
            ...hit.accumulator,
            multiplier: hit.accumulator.multiplier * factor,
          }
        : hit.accumulator,
    });
    return commands.map((command) => {
      if (command.id === "lastrite_combo_skill" && potentialLevel >= 3) {
        return {
          ...command,
          hits: command.hits.map((hit) => scaleHitMultiplier(hit, 1.15)),
        };
      }
      if (command.id === "lastrite_ultimate") {
        const cryoSusEnhance = hasTalent2_2 ? 0.5 : hasTalent2_1 ? 0.2 : 0;
        return {
          ...command,
          energyCost: potentialLevel >= 4 ? command.energyCost * 0.85 : command.energyCost,
          commandModifiers: {
            ...(command.commandModifiers ?? {}),
            CRYO_SUS_ENHANCE_PCT: (command.commandModifiers?.CRYO_SUS_ENHANCE_PCT ?? 0) + cryoSusEnhance,
          },
          hits: potentialLevel >= 3
            ? command.hits.map((hit) => scaleHitMultiplier(hit, 1.15))
            : command.hits,
        };
      }
      if (command.id === "lastrite_battle_skill" && potentialLevel >= 5) {
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...scaleHitMultiplier(hit, 1.2),
            spReturned: (hit.spReturned ?? 0) + 5,
          })),
        };
      }
      return command;
    });
  },
  mutateResolvedExecuteHits: (executeHits, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    if (potentialLevel < 5) {
      return executeHits;
    }
    const target = executeHits[LASTRITE_BATTLE_SKILL_TRIGGER_HIT_ID];
    if (!target) {
      return executeHits;
    }
    return {
      ...executeHits,
      [LASTRITE_BATTLE_SKILL_TRIGGER_HIT_ID]: {
        ...target,
        hit: {
          ...target.hit,
          multiplier: target.hit.multiplier * 1.2,
        },
      },
    };
  },
  levels: { STR: [21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50, 52, 53, 54, 56, 58, 59, 60, 62, 64, 65, 66, 68, 70, 71, 72, 74, 76, 77, 78, 80, 82, 83, 84, 86, 88, 89, 90, 92, 94, 95, 96, 98, 100, 101, 102, 104, 106, 107, 108, 110, 112, 113, 114, 116, 118, 119, 120, 122, 124, 125, 126, 128, 130, 131, 132, 134, 136, 137, 138, 140, 142, 143, 144, 146, 148, 149, 150, 152, 154, 155], AGI: [8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104], INT: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 88, 89, 90, 91, 92, 93], WIL: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109], ATK: [30, 33, 37, 40, 44, 47, 51, 54, 57, 61, 64, 68, 71, 74, 78, 81, 85, 88, 92, 95, 98, 102, 105, 108, 112, 115, 118, 122, 125, 128, 132, 135, 139, 142, 145, 149, 152, 155, 159, 162, 165, 169, 172, 176, 179, 182, 186, 189, 193, 196, 199, 203, 206, 210, 213, 216, 220, 223, 227, 230, 233, 237, 240, 244, 247, 250, 254, 257, 261, 264, 267, 271, 274, 278, 281, 284, 288, 291, 295, 298, 301, 305, 308, 312, 315, 318, 322, 325, 329, 332], HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1229, 1285, 1342, 1398, 1454, 1510, 1566, 1622, 1678, 1734, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2521, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2970, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3530, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3979, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4766, 4822, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5271, 5327, 5383, 5439, 5495] },
};

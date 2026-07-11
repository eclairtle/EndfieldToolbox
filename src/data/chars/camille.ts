import type { CharacterBase, CharacterPotentialEffect } from "@/data/characters";
import type { CharacterCombatHooks, CombatEventHookContext } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type CommandHitEffectDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const CAMILLE_TALENT_1_1 = "camille_talent_1_1";
const CAMILLE_TALENT_1_2 = "camille_talent_1_2";
const CAMILLE_TALENT_2_1 = "camille_talent_2_1";
const CAMILLE_TALENT_2_2 = "camille_talent_2_2";

const CAMILLE_BATTLE_SKILL_ID = "camille_battle_skill";
const CAMILLE_HUNTER_PURSUIT_ID = "camille_hunter_pursuit";
const CAMILLE_COMBO_SKILL_ID = "camille_combo_skill";
const CAMILLE_ULTIMATE_ID = "camille_ultimate";

const CAMILLE_HUNTER_PURSUIT_READY_BUFF_ID = "camille_hunter_pursuit_ready";
const CAMILLE_FIREFANG_STATUS_ID = "camille_firefang_vesperwings";
const CAMILLE_FIREFANG_BURST_HIT_ID = "camille_firefang_burst";

function getEnemySlotOrder(enemySlotId: string) {
  const match = /(\d+)$/.exec(enemySlotId);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function findNextAvailableEnemySlotId(args: {
  currentEnemySlotId: string;
  activeEnemySlotIds: string[];
}) {
  const currentOrder = getEnemySlotOrder(args.currentEnemySlotId);
  const sorted = [...args.activeEnemySlotIds].sort(
    (left, right) => getEnemySlotOrder(left) - getEnemySlotOrder(right),
  );
  return sorted.find((enemySlotId) => getEnemySlotOrder(enemySlotId) > currentOrder) ?? sorted[0] ?? null;
}

function extractFirefangApplyEffect(ctx: Pick<CombatEventHookContext, "state">): Extract<CommandHitEffectDefinition, { type: "APPLY_BUFF" }> | null {
  const battleSkillHit = ctx.state.getSelfCommandHit(CAMILLE_BATTLE_SKILL_ID, 0);
  const effect = battleSkillHit?.effects?.find(
    (entry): entry is Extract<CommandHitEffectDefinition, { type: "APPLY_BUFF" }> =>
      entry.type === "APPLY_BUFF" && entry.buffId === CAMILLE_FIREFANG_STATUS_ID,
  );
  return effect ? { ...effect } : null;
}

const CAMILLE_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: CAMILLE_FIREFANG_BURST_HIT_ID,
    commandId: "__camille_firefang",
    commandName: "Firefang Vesperwings",
    name: "Firefang Burst",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    multiplier: pct([45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100]),
    offsetFrames: flat12(0),
    executeCondition: {
      requiresEnemyStatusId: CAMILLE_FIREFANG_STATUS_ID,
    },
  },
];

const CAMILLE_COMMANDS: CommandDefinition[] = [
  {
    id: "camille_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "sequence",
    durationFrames: flat12(204),
    spCost: flat12(0),
    expandsToCommandIds: [
      "camille_basic_sequence_1",
      "camille_basic_sequence_2",
      "camille_basic_sequence_3",
      "camille_basic_sequence_4",
    ],
    hits: [],
  },
  {
    id: "camille_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(24),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(4.02) },
      { name: "Hit 2", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(19.98) },
    ],
  },
  {
    id: "camille_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(40.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45]), offsetFrames: flat12(25.98) },
      { name: "Hit 2", multiplier: pct([20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45]), offsetFrames: flat12(34.02) },
    ],
  },
  {
    id: "camille_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(73.98),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(19.98) },
      { name: "Hit 2", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(25.98) },
      { name: "Hit 3", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(31.98) },
      { name: "Hit 4", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(54) },
      { name: "Hit 5", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(61.98) },
    ],
  },
  {
    id: "camille_basic_sequence_4",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(66),
    spCost: flat12(0),
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113]),
        offsetFrames: flat12(34.02),
        stagger: flat12(18),
        spGenerated: flat12(20),
        requiresControlledOperator: true,
      },
    ],
  },
  {
    id: "camille_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "finisher",
    targets: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "camille_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Heat",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: CAMILLE_BATTLE_SKILL_ID,
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    durationFrames: flat12(54),
    spCost: flat12(100),
    transforms: [
      { toCommandId: CAMILLE_HUNTER_PURSUIT_ID, requiresBuffId: CAMILLE_HUNTER_PURSUIT_READY_BUFF_ID },
    ],
    hits: [
      {
        name: "Firefang Vesperwings",
        multiplier: flat12(0),
        offsetFrames: flat12(28.02),
        targets: "targeted_enemy",
        ignoreEnemyInvulnerability: true,
        noCrit: true,
        effects: [
          {
            type: "APPLY_BUFF",
            target: "enemy",
            buffId: CAMILLE_FIREFANG_STATUS_ID,
            label: "Firefang Vesperwings",
            durationSeconds: 45,
            effectScalings: {
              HEAT_SUS_PCT: pct([5, 5, 5, 6, 6, 6, 6, 6, 6, 6.5, 6.5, 7]),
              WEAKNESS_PCT: pct([5, 5, 5, 6, 6, 6, 6, 6, 6, 6.5, 6.5, 7]),
            },
          },
        ],
      },
      {
        name: "Hit 1",
        multiplier: pct([89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200]),
        offsetFrames: flat12(28.02),
        stagger: flat12(10),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 }],
      },
    ],
  },
  {
    id: CAMILLE_HUNTER_PURSUIT_ID,
    name: "Hunter Pursuit",
    skill: "battleSkill",
    attackType: "COMBO_SKILL",
    damageType: "Heat",
    hiddenInLibrary: true,
    enhanced: true,
    durationFrames: flat12(196.02),
    spCost: flat12(100),
    initialEffects: [
      {
        type: "REMOVE_BUFF",
        target: "self",
        buffId: CAMILLE_HUNTER_PURSUIT_READY_BUFF_ID,
      },
    ],
    hits: [
      { name: "Hit 1", multiplier: pct([222, 244, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500]), energyReturn: flat12(10), offsetFrames: flat12(40.02) },
      { name: "Hit 2", multiplier: pct([222, 244, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500]), offsetFrames: flat12(72) },
      { name: "Hit 3", multiplier: pct([222, 244, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500]), offsetFrames: flat12(109.98) },
      {
        name: "Hunter Pursuit",
        multiplier: pct([222, 244, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500]),
        offsetFrames: flat12(157.98),
        stagger: flat12(20),
        spGenerated: [32, 32, 32, 32, 32, 32, 36, 36, 36, 40, 40, 40],
        effects: [
          {
            type: "EXECUTE_HIT",
            hitRefId: CAMILLE_FIREFANG_BURST_HIT_ID,
            commandName: "Firefang Vesperwings",
            hitName: "Firefang Burst",
            executeDelayFrames: 24,
            registerAtInitialTime: true,
          },
        ],
      },
    ],
  },
  {
    id: CAMILLE_COMBO_SKILL_ID,
    name: "Combo Skill",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Heat",
    durationFrames: flat12(127.98),
    spCost: flat12(0),
    comboCooldownSeconds: [20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18],
    hits: [
      { name: "Hit 1", multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]), energyReturn: flat12(10), offsetFrames: flat12(40.02) },
      { name: "Hit 2", multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]), offsetFrames: flat12(67.98) },
      {
        name: "Hit 3",
        multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]),
        offsetFrames: flat12(106.02),
        stagger: flat12(10),
        spGenerated: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
        effects: [
          {
            type: "EXECUTE_HIT",
            hitRefId: CAMILLE_FIREFANG_BURST_HIT_ID,
            commandName: "Firefang Vesperwings",
            hitName: "Firefang Burst",
            executeDelayFrames: 24,
            registerAtInitialTime: true,
          },
        ],
      },
    ],
  },
  {
    id: CAMILLE_ULTIMATE_ID,
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Heat",
    durationFrames: flat12(277.98),
    spCost: flat12(0),
    energyCost: flat12(130),
    hits: [
      { name: "Hit 1", multiplier: pct([267, 293, 320, 347, 373, 400, 427, 453, 480, 513, 553, 600]), offsetFrames: flat12(151.98) },
      { name: "Hit 2", multiplier: pct([267, 293, 320, 347, 373, 400, 427, 453, 480, 513, 553, 600]), offsetFrames: flat12(208.02) },
      {
        name: "Hit 3",
        multiplier: pct([267, 293, 320, 347, 373, 400, 427, 453, 480, 513, 553, 600]),
        offsetFrames: flat12(240),
        stagger: flat12(15),
        spGenerated: [32, 32, 32, 32, 32, 32, 32, 32, 36, 36, 36, 40],
        effects: [
          { type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: CAMILLE_HUNTER_PURSUIT_READY_BUFF_ID,
            label: "Hunter Pursuit",
            durationSeconds: 15,
            hidden: true,
          },
        ],
      },
    ],
  },
];

const CAMILLE_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type !== "ENEMY_DEFEATED" || !ctx.event.enemySlotId) {
      return;
    }
    if (
      ctx.state.getStatusStackCount({
        statusId: CAMILLE_FIREFANG_STATUS_ID,
        target: "enemy",
        enemySlotId: ctx.event.enemySlotId,
      }) <= 0
    ) {
      return;
    }

    const remainingSeconds = ctx.state.getStatusRemainingSeconds({
      statusId: CAMILLE_FIREFANG_STATUS_ID,
      target: "enemy",
      enemySlotId: ctx.event.enemySlotId,
    });
    if (remainingSeconds <= 0) {
      return;
    }

    const nextEnemySlotId = findNextAvailableEnemySlotId({
      currentEnemySlotId: ctx.event.enemySlotId,
      activeEnemySlotIds: ctx.state.getActiveEnemySlotIds().filter((enemySlotId) => enemySlotId !== ctx.event.enemySlotId),
    });
    if (!nextEnemySlotId) {
      return;
    }

    const firefangEffect = extractFirefangApplyEffect(ctx);
    if (!firefangEffect) {
      return;
    }

    ctx.state.applyEffectsToEnemySlot({
      enemySlotId: nextEnemySlotId,
      stepId: `${ctx.event.stepId ?? "event"}:camille_firefang_transfer`,
      effectTree: ctx.event.effectTree,
      effects: [
        {
          ...firefangEffect,
          durationSeconds: remainingSeconds,
        },
      ],
    });
  },
};

const CAMILLE_POTENTIAL_EFFECTS: Record<number, CharacterPotentialEffect> = {
  2: {
    apply: () => ({
      attrsDelta: { AGI: 15, INT: 15 },
    }),
  },
};

export const CAMILLE: CharacterBase = {
  id: "CAMILLE",
  name: "Camille",
  rarity: 6,
  element: "Heat",
  class: "Vanguard",
  scaling: { AGI: 0.005, INT: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "INT",
  weaponType: "POLEARM",
  uniqueTalentDefs: {
    [CAMILLE_TALENT_1_1]: { name: "Hemo-Vitreography beta", condition: { minEliteStage: 1 } },
    [CAMILLE_TALENT_1_2]: {
      name: "Hemo-Vitreography gamma",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [CAMILLE_TALENT_1_1] },
    },
    [CAMILLE_TALENT_2_1]: { name: "Agas'mekanaz's Manual beta", condition: { minEliteStage: 2 } },
    [CAMILLE_TALENT_2_2]: {
      name: "Agas'mekanaz's Manual gamma",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [CAMILLE_TALENT_2_1] },
    },
  },
  levels: {
    STR: [13.4, 14.4, 15.4, 16.4, 17.4, 18.4, 19.4, 20.4, 21.4, 22.4, 23.4, 24.4, 25.39, 26.39, 27.39, 28.39, 29.39, 30.39, 31.39, 32.39, 33.39, 34.39, 35.39, 36.39, 37.39, 38.39, 39.39, 40.39, 41.38, 42.38, 43.38, 44.38, 45.38, 46.38, 47.38, 48.38, 49.38, 50.38, 51.38, 52.38, 53.38, 54.38, 55.38, 56.37, 57.37, 58.37, 59.37, 60.37, 61.37, 62.37, 63.37, 64.37, 65.37, 66.37, 67.37, 68.37, 69.37, 70.37, 71.37, 72.36, 73.36, 74.36, 75.36, 76.36, 77.36, 78.36, 79.36, 80.36, 81.36, 82.36, 83.36, 84.36, 85.36, 86.36, 87.36, 88.35, 89.35, 90.35, 91.35, 92.35, 93.35, 94.35, 95.35, 96.35, 97.35, 98.35, 99.35, 100.35, 101.35, 102.35],
    AGI: [17.78, 19.39, 21, 22.61, 24.22, 25.82, 27.43, 29.04, 30.65, 32.25, 33.86, 35.47, 37.08, 38.69, 40.29, 41.9, 43.51, 45.12, 46.73, 48.33, 49.94, 51.55, 53.16, 54.77, 56.37, 57.98, 59.59, 61.2, 62.81, 64.41, 66.02, 67.63, 69.24, 70.85, 72.45, 74.06, 75.67, 77.28, 78.88, 80.49, 82.1, 83.71, 85.32, 86.92, 88.53, 90.14, 91.75, 93.36, 94.96, 96.57, 98.18, 99.79, 101.4, 103, 104.61, 106.22, 107.83, 109.44, 111.04, 112.65, 114.26, 115.87, 117.48, 119.08, 120.69, 122.3, 123.91, 125.51, 127.12, 128.73, 130.34, 131.95, 133.55, 135.16, 136.77, 138.38, 139.99, 141.59, 143.2, 144.81, 146.42, 148.03, 149.63, 151.24, 152.85, 154.46, 156.07, 157.67, 159.28, 160.89],
    INT: [14.18, 15.47, 16.76, 18.05, 19.35, 20.64, 21.93, 23.22, 24.52, 25.81, 27.1, 28.39, 29.69, 30.98, 32.27, 33.56, 34.86, 36.15, 37.44, 38.73, 40.03, 41.32, 42.61, 43.9, 45.2, 46.49, 47.78, 49.07, 50.37, 51.66, 52.95, 54.24, 55.54, 56.83, 58.12, 59.41, 60.71, 62, 63.29, 64.58, 65.88, 67.17, 68.46, 69.75, 71.05, 72.34, 73.63, 74.93, 76.22, 77.51, 78.8, 80.1, 81.39, 82.68, 83.97, 85.27, 86.56, 87.85, 89.14, 90.44, 91.73, 93.02, 94.31, 95.61, 96.9, 98.19, 99.48, 100.78, 102.07, 103.36, 104.65, 105.95, 107.24, 108.53, 109.82, 111.12, 112.41, 113.7, 114.99, 116.29, 117.58, 118.87, 120.16, 121.46, 122.75, 124.04, 125.33, 126.63, 127.92, 129.21],
    WIL: [11.34, 12.25, 13.15, 14.06, 14.97, 15.87, 16.78, 17.69, 18.59, 19.5, 20.41, 21.31, 22.22, 23.13, 24.04, 24.94, 25.85, 26.76, 27.66, 28.57, 29.48, 30.38, 31.29, 32.2, 33.1, 34.01, 34.92, 35.82, 36.73, 37.64, 38.54, 39.45, 40.36, 41.26, 42.17, 43.08, 43.98, 44.89, 45.8, 46.71, 47.61, 48.52, 49.43, 50.33, 51.24, 52.15, 53.05, 53.96, 54.87, 55.77, 56.68, 57.59, 58.49, 59.4, 60.31, 61.21, 62.12, 63.03, 63.93, 64.84, 65.75, 66.65, 67.56, 68.47, 69.38, 70.28, 71.19, 72.1, 73, 73.91, 74.82, 75.72, 76.63, 77.54, 78.44, 79.35, 80.26, 81.16, 82.07, 82.98, 83.88, 84.79, 85.7, 86.6, 87.51, 88.42, 89.32, 90.23, 91.14, 92.05],
    ATK: [30, 33, 36, 40, 43, 46, 49, 52, 56, 59, 62, 65, 68, 72, 75, 78, 81, 84, 88, 91, 94, 97, 100, 104, 107, 110, 113, 116, 120, 123, 126, 129, 132, 136, 139, 142, 145, 148, 152, 155, 158, 161, 164, 168, 171, 174, 177, 180, 184, 187, 190, 193, 196, 200, 203, 206, 209, 212, 216, 219, 222, 225, 228, 231, 235, 238, 241, 244, 247, 251, 254, 257, 260, 263, 267, 270, 273, 276, 279, 283, 286, 289, 292, 295, 299, 302, 305, 308, 311, 315],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
  commands: CAMILLE_COMMANDS,
  executeHits: CAMILLE_EXECUTE_HITS,
  combatHooks: CAMILLE_HOOKS,
  potentialEffects: CAMILLE_POTENTIAL_EFFECTS,
  mutateResolvedCommands: (commands, ctx) =>
    commands.map((command) => {
      let nextCommand = command;

      if ((ctx.buildState.potentialLevel ?? 0) >= 1 && command.id === CAMILLE_BATTLE_SKILL_ID) {
        nextCommand = {
          ...nextCommand,
          hits: nextCommand.hits.map((hit, hitIndex) => {
            if (hitIndex !== 0) {
              return hit;
            }
            return {
              ...hit,
              effects: hit.effects?.map((effect) => {
                if (effect.type !== "APPLY_BUFF" || effect.buffId !== CAMILLE_FIREFANG_STATUS_ID) {
                  return effect;
                }
                const heatSusScaling = effect.effectScalings?.HEAT_SUS_PCT;
                const weaknessScaling = effect.effectScalings?.WEAKNESS_PCT;
                return {
                  ...effect,
                  durationSeconds: (effect.durationSeconds ?? 0) + 15,
                  effectScalings: {
                    ...effect.effectScalings,
                    HEAT_SUS_PCT: heatSusScaling?.map((value) => value + 0.05) ?? heatSusScaling,
                    WEAKNESS_PCT: weaknessScaling?.map((value) => value + 0.05) ?? weaknessScaling,
                  },
                };
              }) ?? [],
            };
          }),
        };
      }

      if ((ctx.buildState.potentialLevel ?? 0) >= 3 && command.attackType === "COMBO_SKILL") {
        nextCommand = {
          ...nextCommand,
          comboCooldownSeconds: Math.max(0, nextCommand.comboCooldownSeconds - (command.id === CAMILLE_COMBO_SKILL_ID ? 2 : 0)),
          hits: nextCommand.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * 1.3,
            spGenerated: hit.spGenerated * 1.15,
          })),
        };
      }

      if ((ctx.buildState.potentialLevel ?? 0) >= 4 && command.id === CAMILLE_ULTIMATE_ID) {
        nextCommand = {
          ...nextCommand,
          energyCost: nextCommand.energyCost * 0.85,
        };
      }

      return nextCommand;
    }),
};

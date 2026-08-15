import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import {
  flat12,
  pct,
  type CommandDefinition,
  type CommandHitEffectDefinition,
} from "@/lib/commands";

const ANTAL_FOCUS_STATUS_ID = "antal_focus";
const ANTAL_FOCUS_ENHANCED_STATUS_ID = "antal_focus_enhanced";
const ANTAL_FOCUS_DURATION_SECONDS = 60;
const ANTAL_FOCUS_POTENTIAL_DELAY_SECONDS = 20;
const ANTAL_FOCUS_POTENTIAL_BONUS = 0.04;
const ANTAL_COMBO_MARKER_DURATION_SECONDS = 10;
const ANTAL_TALENT_1_1 = "antal_talent_1_1";
const ANTAL_TALENT_1_2 = "antal_talent_1_2";
const ANTAL_TALENT_1_ICD_STATUS_ID = "antal_talent_1_icd";
const ANTAL_MARKER_STATUS_IDS = {
  breach: "antal_combo_marker_breach",
  crush: "antal_combo_marker_crush",
  lift: "antal_combo_marker_lift",
  knockdown: "antal_combo_marker_knockdown",
  heat: "antal_combo_marker_heat_infliction",
  cryo: "antal_combo_marker_cryo_infliction",
  electric: "antal_combo_marker_electric_infliction",
  nature: "antal_combo_marker_nature_infliction",
} as const;

const ANTAL_ALL_MARKER_STATUS_IDS = Object.values(ANTAL_MARKER_STATUS_IDS);
const ANTAL_AMP_STATS = [
  "DMG_AMP_PCT",
  "PHYSICAL_DMG_AMP_PCT",
  "HEAT_DMG_AMP_PCT",
  "CRYO_DMG_AMP_PCT",
  "ELECTRIC_DMG_AMP_PCT",
  "NATURE_DMG_AMP_PCT",
  "AETHER_DMG_AMP_PCT",
] as const;

function getAntalTalent1Healing(args: {
  isTalent2: boolean;
  strength: number;
}): number {
  const flat = args.isTalent2 ? 108 : 72;
  const ratio = args.isTalent2 ? 0.9 : 0.6;
  return flat + args.strength * ratio;
}

function buildAntalFocusApplyEffect(args: {
  enhancedAfterSeconds?: number;
  enhancedSusPct?: number;
}): CommandHitEffectDefinition {
  return {
    type: "APPLY_STATUS",
    target: "enemy",
    statusId: ANTAL_FOCUS_STATUS_ID,
    label: "Focus",
    durationSeconds: ANTAL_FOCUS_DURATION_SECONDS,
    timeScale: "game",
    stacks: 1,
    maxStacks: 1,
    independentStacks: true,
    refreshExistingStacks: true,
    effects: {
      ELECTRIC_SUS_PCT: 0.1,
      HEAT_SUS_PCT: 0.1,
    },
    ...(args.enhancedAfterSeconds != null && args.enhancedSusPct != null
      ? {
        periods: Math.max(1, ANTAL_FOCUS_DURATION_SECONDS / args.enhancedAfterSeconds),
        maxPeriods: 1,
        periodicEffects: [{
          type: "APPLY_STATUS",
          target: "enemy",
          statusId: ANTAL_FOCUS_ENHANCED_STATUS_ID,
          label: "Focus Enhancement",
          hidden: true,
          durationSeconds: 9999,
          timeScale: "game",
          stacks: 1,
          maxStacks: 1,
          refreshExistingStacks: true,
          effects: {
            ELECTRIC_SUS_PCT: args.enhancedSusPct,
            HEAT_SUS_PCT: args.enhancedSusPct,
          },
        }],
        removeEffects: [{ type: "REMOVE_STATUS", target: "enemy", statusId: ANTAL_FOCUS_ENHANCED_STATUS_ID }],
        expireEffects: [{ type: "REMOVE_STATUS", target: "enemy", statusId: ANTAL_FOCUS_ENHANCED_STATUS_ID }],
      }
      : {}),
  };
}

function removeAntalComboMarkers(): CommandHitEffectDefinition[] {
  return ANTAL_ALL_MARKER_STATUS_IDS.map((statusId) => ({
    type: "REMOVE_STATUS",
    target: "self",
    statusId,
  }));
}

function getAntalMarkerStatusIdFromEvent(ctx: {
  type: string;
  label: string;
  consumedElement?: "Heat" | "Cryo" | "Electric" | "Nature";
}): string | null {
  if (ctx.type === "ARTS_INFLICTION_APPLIED") {
    switch (ctx.consumedElement) {
      case "Heat":
        return ANTAL_MARKER_STATUS_IDS.heat;
      case "Cryo":
        return ANTAL_MARKER_STATUS_IDS.cryo;
      case "Electric":
        return ANTAL_MARKER_STATUS_IDS.electric;
      case "Nature":
        return ANTAL_MARKER_STATUS_IDS.nature;
      default:
        return null;
    }
  }
  if (ctx.type !== "PHYSICAL_REACTION_APPLIED") {
    return null;
  }
  if (ctx.label.startsWith("Breach")) {
    return ANTAL_MARKER_STATUS_IDS.breach;
  }
  if (ctx.label.startsWith("Crush")) {
    return ANTAL_MARKER_STATUS_IDS.crush;
  }
  if (ctx.label.startsWith("Lift")) {
    return ANTAL_MARKER_STATUS_IDS.lift;
  }
  if (ctx.label.startsWith("Knockdown")) {
    return ANTAL_MARKER_STATUS_IDS.knockdown;
  }
  return null;
}

function getAntalReplayEffectFromMarkerStatusId(statusId: string): CommandHitEffectDefinition | null {
  switch (statusId) {
    case ANTAL_MARKER_STATUS_IDS.breach:
      return { type: "APPLY_REACTION", reaction: "Breach", forceApply: true };
    case ANTAL_MARKER_STATUS_IDS.crush:
      return { type: "APPLY_REACTION", reaction: "Crush", forceApply: true };
    case ANTAL_MARKER_STATUS_IDS.lift:
      return { type: "APPLY_REACTION", reaction: "Lift", forceApply: true };
    case ANTAL_MARKER_STATUS_IDS.knockdown:
      return { type: "APPLY_REACTION", reaction: "Knockdown", forceApply: true };
    case ANTAL_MARKER_STATUS_IDS.heat:
      return { type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 };
    case ANTAL_MARKER_STATUS_IDS.cryo:
      return { type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 };
    case ANTAL_MARKER_STATUS_IDS.electric:
      return { type: "APPLY_ARTS_INFLICTION", element: "Electric", stacks: 1 };
    case ANTAL_MARKER_STATUS_IDS.nature:
      return { type: "APPLY_ARTS_INFLICTION", element: "Nature", stacks: 1 };
    default:
      return null;
  }
}

function getAntalFocusedEnemySlotId(args: {
  getActiveEnemySlotIds: () => string[];
  hasStatus: (args: {
    statusId: string;
    target?: "enemy" | "self" | "global" | "field";
    enemySlotId?: string;
  }) => boolean;
}): string | null {
  return args.getActiveEnemySlotIds().find((enemySlotId) =>
    args.hasStatus({
      statusId: ANTAL_FOCUS_STATUS_ID,
      target: "enemy",
      enemySlotId,
    })) ?? null;
}

const ANTAL_COMBAT_HOOKS: CharacterCombatHooks = {
  eventTypes: [
    "BATTLE_SKILL_HIT",
    "COMBO_SKILL_HIT",
    "ULTIMATE_HIT",
    "PHYSICAL_REACTION_APPLIED",
    "ARTS_INFLICTION_APPLIED",
  ],
  onEvent: (ctx) => {
    if (
      (ctx.event.type === "BATTLE_SKILL_HIT" || ctx.event.type === "COMBO_SKILL_HIT" || ctx.event.type === "ULTIMATE_HIT")
      && ctx.event.sourceSlot != null
      && ctx.event.dealsDamage
      && (ctx.state.isSelfUniqueTalentEnabled(ANTAL_TALENT_1_1) || ctx.state.isSelfUniqueTalentEnabled(ANTAL_TALENT_1_2))
    ) {
      const targetSlot = ctx.event.sourceSlot;
      if (ctx.state.getActorStatusStackCount({ slot: targetSlot, statusId: ANTAL_TALENT_1_ICD_STATUS_ID }) > 0) {
        return;
      }
      const hasAmp = ANTAL_AMP_STATS.some((stat) => ctx.state.getActorModifierValue({ slot: targetSlot, stat }) > 0);
      if (hasAmp) {
        const isTalent2 = ctx.state.isSelfUniqueTalentEnabled(ANTAL_TALENT_1_2);
        ctx.state.restoreHpToSlot({
          slot: targetSlot,
          baseAmount: getAntalTalent1Healing({
            isTalent2,
            strength: ctx.state.getSelfAttr("STR"),
          }),
          label: "Arts Talent",
        });
        ctx.state.applyStatusToSlot({
          slot: targetSlot,
          statusId: ANTAL_TALENT_1_ICD_STATUS_ID,
          label: "Arts Talent Cooldown",
          durationSeconds: 30,
          timeScale: "real",
          hidden: true,
          stacks: 1,
          maxStacks: 1,
          refreshExistingStacks: true,
          independentStacks: true,
        });
      }
    }

    if (
      ctx.event.type !== "PHYSICAL_REACTION_APPLIED"
      && ctx.event.type !== "ARTS_INFLICTION_APPLIED"
    ) {
      return;
    }

    const enemySlotIds = ctx.event.affectedEnemySlotIds?.length
      ? ctx.event.affectedEnemySlotIds
      : (ctx.event.enemySlotId ? [ctx.event.enemySlotId] : []);
    if (!enemySlotIds.some((enemySlotId) =>
      ctx.state.hasStatus({
        statusId: ANTAL_FOCUS_STATUS_ID,
        target: "enemy",
        enemySlotId,
      }))) {
      return;
    }

    const markerStatusId = getAntalMarkerStatusIdFromEvent({
      type: ctx.event.type,
      label: ctx.event.label,
      consumedElement: ctx.event.consumedElement,
    });
    if (markerStatusId == null) {
      return;
    }

    ctx.state.applyEffects({
      stepId: `${ctx.event.stepId ?? "event"}:antal_combo_marker`,
      effectTree: ctx.event.effectTree,
      effects: [
        ...removeAntalComboMarkers(),
        {
          type: "APPLY_STATUS",
          target: "self",
          statusId: markerStatusId,
          label: "Focused Marker",
          hidden: true,
          durationSeconds: ANTAL_COMBO_MARKER_DURATION_SECONDS,
          timeScale: "real",
          stacks: 1,
          maxStacks: 1,
          refreshExistingStacks: true,
        },
      ],
    });

    ctx.state.triggerSelfCombo({
      label: "Antal Combo Triggered",
      sourceEventType: ctx.event.type,
    });
  },
  onResolvedHit: (ctx) => {
    if (
      ctx.source.slot === ctx.self.slot
      && ctx.source.commandId === "antal_battle_skill"
      && ctx.source.hitName === "Focus"
      && ctx.enemySlotId
    ) {
      for (const enemySlotId of ctx.state.getActiveEnemySlotIds()) {
        if (enemySlotId === ctx.enemySlotId) {
          continue;
        }
        ctx.state.applyEffectsToEnemySlot({
          enemySlotId,
          stepId: `${ctx.stepId}:antal_focus_clear_others`,
          effectTree: ctx.effectTree,
          effects: [
            { type: "REMOVE_STATUS", target: "enemy", statusId: ANTAL_FOCUS_STATUS_ID },
            { type: "REMOVE_STATUS", target: "enemy", statusId: ANTAL_FOCUS_ENHANCED_STATUS_ID },
          ],
        });
      }
      return;
    }

    if (
      ctx.source.slot !== ctx.self.slot
      || ctx.source.commandId !== "antal_combo_skill"
      || !ctx.flags.dealsDamage
    ) {
      return;
    }

    const markerStatusId = ANTAL_ALL_MARKER_STATUS_IDS.find((statusId) =>
      ctx.state.hasStatus({ statusId, target: "self" }));
    if (markerStatusId == null) {
      return;
    }

    const focusedEnemySlotId = getAntalFocusedEnemySlotId({
      getActiveEnemySlotIds: ctx.state.getActiveEnemySlotIds,
      hasStatus: ctx.state.hasStatus,
    });
    const replayEffect = getAntalReplayEffectFromMarkerStatusId(markerStatusId);
    if (focusedEnemySlotId != null && replayEffect != null) {
      ctx.state.applyEffectsToEnemySlot({
        enemySlotId: focusedEnemySlotId,
        stepId: `${ctx.stepId}:antal_combo_replay`,
        effectTree: ctx.effectTree,
        effects: [replayEffect],
      });
    }

    ctx.state.applyEffects({
      stepId: `${ctx.stepId}:antal_combo_marker_consume`,
      effectTree: ctx.effectTree,
      effects: removeAntalComboMarkers(),
    });
  },
};

const ANTAL_COMMANDS: CommandDefinition[] = [
  {
    id: "antal_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    durationFrames: flat12(198),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([23, 25, 28, 30, 32, 35, 37, 39, 41, 44, 48, 52]), offsetFrames: flat12(16) },
      { name: "Hit 2", multiplier: pct([28, 31, 34, 36, 39, 42, 45, 48, 50, 54, 58, 63]), offsetFrames: flat12(56) },
      { name: "Hit 3", multiplier: pct([34, 37, 41, 44, 48, 51, 54, 58, 61, 65, 71, 77]), offsetFrames: flat12(102) },
      { name: "Hit 4", multiplier: pct([51, 56, 61, 66, 71, 77, 82, 87, 92, 98, 106, 115]), stagger: flat12(15), offsetFrames: flat12(174) },
    ],
  },
  {
    id: "antal_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    basicAttackVariant: "finisher", targets: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "antal_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Electric",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "antal_battle_skill",
    name: "Specified Research Subject",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Electric",
    durationFrames: flat12(60),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Focus",
        multiplier: pct([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        offsetFrames: flat12(40),
        ignoreEnemyInvulnerability: true,
        targets: "targeted_enemy",
        effects: [buildAntalFocusApplyEffect({})],
      },
      {
        multiplier: pct([89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200]),
        offsetFrames: flat12(40),
      },
    ],
  },
  {
    id: "antal_combo_skill",
    name: "EMP Test Site",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Electric",
    durationFrames: flat12(48),
    spCost: flat12(0),
    hits: [{ multiplier: pct([151, 166, 181, 196, 211, 227, 242, 257, 272, 291, 313, 340]), stagger: flat12(10), energyReturn: flat12(10), offsetFrames: flat12(42) }],
  },
  {
    id: "antal_ultimate",
    name: "Overclocked Moment",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    durationFrames: flat12(112),
    spCost: flat12(0),
    energyCost: flat12(100),
    hits: [],
  },
];

export const ANTAL: CharacterBase = {
  id: "antal",
  name: "Antal",
  skillIconPaths: {
    battleSkill: "/avatars/ANTAL/icon_skill_antal_01.webp",
    comboSkill: "/avatars/ANTAL/icon_combo_skill_antal_01.webp",
    ultimate: "/avatars/ANTAL/icon_ultimate_skill_antal_01.webp",
  },
  rarity: 4,

  class: "Supporter",
  element: "Electric",

  scaling: {
    INT: 0.005,
    STR: 0.002
  },

  mainAttr: "INT",
  secondaryAttr: "STR",

  weaponType: "ARTS_UNIT",
  commands: ANTAL_COMMANDS,
  combatHooks: ANTAL_COMBAT_HOOKS,
  uniqueTalentDefs: {
    [ANTAL_TALENT_1_1]: { name: "Arts Talent I", condition: { minEliteStage: 1 } },
    [ANTAL_TALENT_1_2]: {
      name: "Arts Talent II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [ANTAL_TALENT_1_1] },
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    if ((ctx.buildState.potentialLevel ?? 0) < 5) {
      return commands;
    }
    return commands.map((command) => {
      if (command.id !== "antal_battle_skill") {
        return command;
      }
      return {
        ...command,
        hits: command.hits.map((hit) => {
          if (hit.name !== "Focus") {
            return hit;
          }
          return {
            ...hit,
            effects: [buildAntalFocusApplyEffect({
              enhancedAfterSeconds: ANTAL_FOCUS_POTENTIAL_DELAY_SECONDS,
              enhancedSusPct: ANTAL_FOCUS_POTENTIAL_BONUS,
            })],
          };
        }),
      };
    });
  },

  levels: {
    STR: [
      15, 17, 18, 19, 20, 22, 23, 24, 26, 27,
      28, 29, 31, 32, 33, 35, 36, 37, 38, 40,
      41, 42, 43, 45, 46, 47, 49, 50, 51, 52,
      54, 55, 56, 57, 59, 60, 61, 63, 64, 65,
      66, 68, 69, 70, 71, 73, 74, 75, 77, 78,
      79, 80, 82, 83, 84, 86, 87, 88, 89, 91,
      92, 93, 94, 96, 97, 98, 100, 101, 102, 103,
      105, 106, 107, 108, 110, 111, 112, 114, 115, 116,
      117, 119, 120, 121, 122, 124, 125, 126, 128, 129
    ],
    AGI: [
      9, 10, 11, 12, 12, 13, 14, 15, 16, 17,
      18, 19, 19, 20, 21, 22, 23, 24, 25, 25,
      26, 27, 28, 29, 30, 31, 32, 32, 33, 34,
      35, 36, 37, 38, 39, 39, 40, 41, 42, 43,
      44, 45, 45, 46, 47, 48, 49, 50, 51, 52,
      52, 53, 54, 55, 56, 57, 58, 59, 59, 60,
      61, 62, 63, 64, 65, 65, 66, 67, 68, 69,
      70, 71, 72, 72, 73, 74, 75, 76, 77, 78,
      78, 79, 80, 81, 82, 83, 84, 85, 85, 86
    ],
    INT: [
      15, 17, 18, 20, 22, 23, 25, 27, 28, 30,
      32, 33, 35, 37, 39, 40, 42, 44, 45, 47,
      49, 50, 52, 54, 55, 57, 59, 60, 62, 64,
      65, 67, 69, 70, 72, 74, 76, 77, 79, 81,
      82, 84, 86, 87, 89, 91, 92, 94, 96, 98,
      99, 101, 103, 104, 106, 108, 109, 111, 113, 114,
      116, 118, 119, 121, 123, 125, 126, 128, 130, 131,
      133, 135, 136, 138, 140, 141, 143, 145, 146, 148,
      150, 152, 153, 155, 157, 158, 160, 162, 163, 165
    ],
    WIL: [
      9, 10, 11, 12, 13, 13, 14, 15, 16, 17,
      17, 18, 19, 20, 21, 22, 22, 23, 24, 25,
      26, 27, 27, 28, 29, 30, 31, 31, 32, 33,
      34, 35, 36, 36, 37, 38, 39, 40, 40, 41,
      42, 43, 44, 45, 45, 46, 47, 48, 49, 50,
      50, 51, 52, 53, 54, 54, 55, 56, 57, 58,
      59, 59, 60, 61, 62, 63, 64, 64, 65, 66,
      67, 68, 68, 69, 70, 71, 72, 73, 73, 74,
      75, 76, 77, 77, 78, 79, 80, 81, 81, 82
    ],
    ATK: [
      30, 33, 36, 39, 42, 45, 48, 51, 54, 57,
      60, 63, 66, 69, 72, 75, 78, 81, 84, 87,
      90, 93, 96, 99, 102, 105, 108, 111, 114, 117,
      120, 123, 126, 129, 132, 135, 138, 141, 144, 147,
      150, 153, 156, 159, 162, 165, 168, 171, 174, 177,
      180, 183, 186, 189, 192, 195, 198, 201, 204, 207,
      210, 213, 216, 219, 222, 225, 228, 231, 234, 237,
      240, 243, 246, 249, 252, 255, 258, 261, 264, 267,
      270, 273, 276, 279, 282, 285, 288, 291, 294, 297
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

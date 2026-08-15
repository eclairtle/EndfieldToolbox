import type { CharacterBase, CharacterPotentialEffect } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const MIFU_TALENT_1_1 = "mifu_talent_1_1";
const MIFU_TALENT_1_2 = "mifu_talent_1_2";
const MIFU_TALENT_2_1 = "mifu_talent_2_1";
const MIFU_TALENT_2_2 = "mifu_talent_2_2";
const MIFU_CLOUDTRAPPER_ID = "mifu_battle_skill_cloudtrapper";
const MIFU_TRAIL_AND_MANGLE_ID = "mifu_battle_skill_trail_and_mangle";
const MIFU_WORLD_SPLITTER_ID = "mifu_battle_skill_world_splitter";
const MIFU_COMBO_SKILL_ID = "mifu_combo_skill";
const MIFU_ULTIMATE_ID = "mifu_ultimate";
const MIFU_COMBO_TRIGGER_ID = "mifu_combo_fists_of_no_regrets";

const MIFU_TRAIL_AND_MANGLE_BUFF_ID = "mifu_trail_and_mangle";
const MIFU_WORLD_SPLITTER_BUFF_ID = "mifu_world_splitter";
const MIFU_COMBO_PHYSICAL_SUS_STATUS_ID = "mifu_combo_physical_susceptibility";
const MIFU_TALENT_2_SHIELD_BUFF_ID = "mifu_talent_2_shield";
const MIFU_TALENT_2_COOLDOWN_BUFF_ID = "mifu_talent_2_cooldown";
const MIFU_POTENTIAL_3_ATK_BUFF_ID = "mifu_potential_3_attack";

const MIFU_TRAIL_AND_MANGLE_DURATION_SECONDS = 10;
const MIFU_WORLD_SPLITTER_DURATION_SECONDS = 10;

const MIFU_COMMANDS: CommandDefinition[] = [
  {
    id: "mifu_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "sequence",
    durationFrames: flat12(266.04),
    spCost: flat12(0),
    expandsToCommandIds: [
      "mifu_basic_sequence_1",
      "mifu_basic_sequence_2",
      "mifu_basic_sequence_3",
      "mifu_basic_sequence_4",
    ],
    hits: [],
  },
  {
    id: "mifu_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(46.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([34, 37, 41, 44, 47, 51, 54, 57, 61, 65, 70, 76]), offsetFrames: flat12(25.98) },
    ],
  },
  {
    id: "mifu_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(49.98),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([38, 42, 46, 50, 54, 57, 61, 65, 69, 74, 79, 86]), offsetFrames: flat12(16.02) },
      { name: "Hit 2", multiplier: pct([38, 42, 46, 50, 54, 57, 61, 65, 69, 74, 79, 86]), offsetFrames: flat12(34.02) },
    ],
  },
  {
    id: "mifu_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(94.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([61, 67, 73, 79, 85, 91, 97, 103, 109, 116, 126, 136]), offsetFrames: flat12(22.02) },
      { name: "Hit 2", multiplier: pct([61, 67, 73, 79, 85, 91, 97, 103, 109, 116, 126, 136]), offsetFrames: flat12(34.02) },
      { name: "Hit 3", multiplier: pct([61, 67, 73, 79, 85, 91, 97, 103, 109, 116, 126, 136]), offsetFrames: flat12(70.02) },
    ],
  },
  {
    id: "mifu_basic_sequence_4",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    durationFrames: flat12(76.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([77, 84, 92, 99, 107, 115, 122, 130, 138, 147, 159, 172]), offsetFrames: flat12(13.98) },
      {
        name: "Hit 2",
        multiplier: pct([77, 84, 92, 99, 107, 115, 122, 130, 138, 147, 159, 172]),
        offsetFrames: flat12(64.02),
        requiresControlledOperator: true,
        spGenerated: flat12(28),
        stagger: flat12(25),
      },
    ],
  },
  {
    id: "mifu_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "finisher",
    targets: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "mifu_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: MIFU_CLOUDTRAPPER_ID,
    name: "Cloudtrapper",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    durationFrames: flat12(31.98),
    spCost: flat12(100),
    energyGain: flat12(0),
    transforms: [
      { toCommandId: MIFU_WORLD_SPLITTER_ID, requiresBuffId: MIFU_WORLD_SPLITTER_BUFF_ID },
      { toCommandId: MIFU_TRAIL_AND_MANGLE_ID, requiresBuffId: MIFU_TRAIL_AND_MANGLE_BUFF_ID },
    ],
    hits: [
      {
        name: "Cloudtrapper",
        multiplier: pct([67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150]),
        offsetFrames: flat12(16.02),
        spReturned: flat12(50),
      },
    ],
  },
  {
    id: MIFU_TRAIL_AND_MANGLE_ID,
    name: "Trail and Mangle",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    hiddenInLibrary: true,
    enhanced: true,
    durationFrames: flat12(73.98),
    spCost: flat12(50),
    energyGain: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200]), offsetFrames: flat12(6) },
      { name: "Hit 2", multiplier: pct([89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200]), offsetFrames: flat12(19.98) },
      {
        name: "Hit 3",
        multiplier: pct([89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200]),
        offsetFrames: flat12(48),
        stagger: flat12(5),
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: MIFU_WORLD_SPLITTER_BUFF_ID,
            label: "World Splitter",
            durationSeconds: MIFU_WORLD_SPLITTER_DURATION_SECONDS,
            timeScale: "game",
            maxStacks: 1,
            refreshExistingStacks: true,
            condition: {
              type: "require_vulnerability_stacks",
              min: 3,
            },
          },
          {
            type: "APPLY_REACTION",
            reaction: "Crush",
            forceApply: false,
          },
        ],
      },
    ],
  },
  {
    id: MIFU_WORLD_SPLITTER_ID,
    name: "World Splitter",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    hiddenInLibrary: true,
    enhanced: true,
    durationFrames: flat12(103.98),
    spCost: flat12(50),
    energyGain: flat12(0),
    hits: [
      {
        name: "World Splitter",
        multiplier: pct([400, 416, 432, 448, 464, 480, 496, 512, 528, 548, 572, 600]),
        offsetFrames: flat12(67.98),
        effects: [
          { type: "REMOVE_BUFF", target: "self", buffId: MIFU_WORLD_SPLITTER_BUFF_ID },
          {
            type: "APPLY_REACTION",
            reaction: "Crush",
            forceApply: true,
            reactionDamage: true,
            useSourceHitMultiplier: true,
            consumeSourceHitDamage: true,
            useSourceCommandAsReactionHit: true,
            reactionHitName: "World Splitter",
            stagger: 10,
          },
        ],
      },
    ],
  },
  {
    id: MIFU_COMBO_SKILL_ID,
    name: "Fists of No Regrets",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    durationFrames: flat12(106.02),
    spCost: flat12(0),
    comboCooldownSeconds: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
    comboTriggerId: MIFU_COMBO_TRIGGER_ID,
    hits: [
      { name: "Hit 1", multiplier: pct([111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250]), offsetFrames: flat12(16.02) },
      {
        name: "Hit 2",
        multiplier: pct([111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250]),
        offsetFrames: flat12(85.98),
        stagger: flat12(10),
        energyReturn: flat12(10),
        effects: [
          {
            type: "APPLY_STATUS",
            target: "enemy",
            statusId: MIFU_COMBO_PHYSICAL_SUS_STATUS_ID,
            label: "Physical Susceptibility",
            durationSeconds: 16,
            timeScale: "game",
            effects: {
              PHYSICAL_SUS_PCT: 0.05,
            },
          },
        ],
      },
    ],
  },
  {
    id: MIFU_ULTIMATE_ID,
    name: "Pile of No Mercy",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    durationFrames: flat12(258),
    spCost: flat12(0),
    energyCost: flat12(80),
    hits: [
      {
        name: "Lift",
        multiplier: pct([311, 342, 373, 404, 435, 466, 498, 529, 560, 599, 645, 700]),
        offsetFrames: flat12(150),
        stagger: flat12(10),
        effects: [{ type: "APPLY_REACTION", reaction: "Lift", forceApply: true }],
      },
      {
        name: "Slam",
        multiplier: pct([311, 342, 373, 404, 435, 466, 498, 529, 560, 599, 645, 700]),
        offsetFrames: flat12(222),
        stagger: flat12(10),
      },
    ],
  },
];

const MIFU_HOOKS: CharacterCombatHooks = {
  eventTypes: ["ENEMY_DEBUFF_APPLIED", "BATTLE_SKILL_CAST", "COMBO_SKILL_CAST", "ULTIMATE_CAST"],
  onEvent: (ctx) => {
    const applyTrailAndMangle = () => {
      if (ctx.state.hasSelfBuff(MIFU_WORLD_SPLITTER_BUFF_ID)) {
        return;
      }
      ctx.state.applySelfBuff({
        buffId: MIFU_TRAIL_AND_MANGLE_BUFF_ID,
        label: "Trail and Mangle",
        durationSeconds: MIFU_TRAIL_AND_MANGLE_DURATION_SECONDS,
        timeScale: "game",
        maxStacks: 1,
        refreshExistingStacks: true,
      });
    };

    if (
      ctx.event.type === "ENEMY_DEBUFF_APPLIED"
      && ctx.event.label === "Vulnerability Applied"
    ) {
      const enemySlotIds = ctx.event.affectedEnemySlotIds?.length
        ? ctx.event.affectedEnemySlotIds
        : (ctx.event.enemySlotId ? [ctx.event.enemySlotId] : []);
      if (!enemySlotIds.some((enemySlotId) => ctx.state.getEnemyVulnerabilityStacks(enemySlotId) >= 3)) {
        return;
      }
      if (ctx.state.markTriggerOnce(`${ctx.event.stepId ?? "event"}:mifu_combo_trigger`)) {
        ctx.state.triggerSelfCombo({
          label: "Mifu Combo Triggered",
          sourceEventType: "ENEMY_DEBUFF_APPLIED",
        });
      }
      return;
    }

    if (ctx.event.type === "BATTLE_SKILL_CAST") {
      if (ctx.event.sourceSlot !== ctx.self.slot) {
        return;
      }
      if (ctx.event.commandId === MIFU_CLOUDTRAPPER_ID) {
        applyTrailAndMangle();
        return;
      }
      if (ctx.event.commandId === MIFU_TRAIL_AND_MANGLE_ID) {
        ctx.state.applyEffects({
          stepId: `${ctx.event.stepId ?? "event"}:mifu_trail_consume`,
          effectTree: ctx.event.effectTree,
          effects: [{ type: "REMOVE_BUFF", target: "self", buffId: MIFU_TRAIL_AND_MANGLE_BUFF_ID }],
        });
        return;
      }
      if (ctx.event.commandId === MIFU_WORLD_SPLITTER_ID) {
        ctx.state.applyEffects({
          stepId: `${ctx.event.stepId ?? "event"}:mifu_world_consume`,
          effectTree: ctx.event.effectTree,
          effects: [
            { type: "REMOVE_BUFF", target: "self", buffId: MIFU_TRAIL_AND_MANGLE_BUFF_ID },
            { type: "REMOVE_BUFF", target: "self", buffId: MIFU_WORLD_SPLITTER_BUFF_ID },
          ],
        });
      }
      return;
    }

    if (
      ctx.event.type === "COMBO_SKILL_CAST"
      && ctx.event.commandId === MIFU_COMBO_SKILL_ID
      && ctx.event.sourceSlot === ctx.self.slot
    ) {
      const hasTalent2 =
        ctx.state.isSelfUniqueTalentEnabled(MIFU_TALENT_2_1)
        || ctx.state.isSelfUniqueTalentEnabled(MIFU_TALENT_2_2);
      const hasPotential3 = ctx.state.isSelfPotentialActive(3);
      if (!hasTalent2 && !hasPotential3) {
        applyTrailAndMangle();
        return;
      }

      const cooldownSeconds = hasPotential3 ? 45 : 60;
      if (!ctx.state.hasSelfBuff(MIFU_TALENT_2_COOLDOWN_BUFF_ID)) {
        if (hasTalent2) {
          ctx.state.applySelfBuff({
            buffId: MIFU_TALENT_2_SHIELD_BUFF_ID,
            label: "Combo Skill Shield",
            durationSeconds: hasPotential3 ? 15 : 10,
            timeScale: "game",
            stackGroup: MIFU_TALENT_2_SHIELD_BUFF_ID,
            maxStacks: 1,
            refreshExistingStacks: true,
          });
        }
        if (hasPotential3) {
          ctx.state.applySelfBuff({
            buffId: MIFU_POTENTIAL_3_ATK_BUFF_ID,
            label: "Combo Skill ATK Boost",
            durationSeconds: 20,
            timeScale: "game",
            stackGroup: MIFU_POTENTIAL_3_ATK_BUFF_ID,
            maxStacks: 1,
            refreshExistingStacks: true,
            effects: {
              ATK_PCT: 0.06,
            },
          });
        }
        ctx.state.applySelfBuff({
          buffId: MIFU_TALENT_2_COOLDOWN_BUFF_ID,
          label: "Combo Skill Shield Cooldown",
          durationSeconds: cooldownSeconds,
          timeScale: "game",
          hidden: true,
          stackGroup: MIFU_TALENT_2_COOLDOWN_BUFF_ID,
          maxStacks: 1,
          refreshExistingStacks: true,
        });
      }
    }

    if (
      ctx.event.sourceSlot === ctx.self.slot
      && (
        (ctx.event.type === "COMBO_SKILL_CAST" && ctx.event.commandId === MIFU_COMBO_SKILL_ID)
        || (ctx.event.type === "ULTIMATE_CAST" && ctx.event.commandId === MIFU_ULTIMATE_ID)
      )
    ) {
      applyTrailAndMangle();
    }
  },
};

const MIFU_POTENTIAL_EFFECTS: Record<number, CharacterPotentialEffect> = {
  2: {
    apply: () => ({
      attrsDelta: { STR: 20 },
      modsDelta: { ARTS_INTENSITY: 16 },
    }),
  },
};

export const MIFU: CharacterBase = {
  id: "MIFU",
  name: "Mi Fu",
  imagePath: "/avatars/MIFU/MIFU.webp",
  rarity: 6,
  element: "Physical",
  class: "Striker",
  uniqueTalentDefs: {
    [MIFU_TALENT_1_1]: { name: "Talent 1 I", condition: { minEliteStage: 1 } },
    [MIFU_TALENT_1_2]: {
      name: "Talent 1 II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [MIFU_TALENT_1_1] },
    },
    [MIFU_TALENT_2_1]: { name: "Talent 2 I", condition: { minEliteStage: 2 } },
    [MIFU_TALENT_2_2]: {
      name: "Talent 2 II",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [MIFU_TALENT_2_1] },
    },
  },
  scaling: { STR: 0.005, WIL: 0.002 },
  mainAttr: "STR",
  secondaryAttr: "WIL",
  weaponType: "GREATSWORD",
  levels: {
    STR: [22, 24, 25, 27, 29, 30, 32, 34, 35, 37, 39, 41, 42, 44, 46, 47, 49, 51, 52, 54, 56, 57, 59, 61, 63, 64, 66, 68, 69, 71, 73, 74, 76, 78, 80, 81, 83, 85, 86, 88, 90, 91, 93, 95, 97, 98, 100, 102, 103, 105, 107, 108, 110, 112, 114, 115, 117, 119, 120, 122, 124, 125, 127, 129, 131, 132, 134, 136, 137, 139, 141, 142, 144, 146, 148, 149, 151, 153, 154, 156, 158, 159, 161, 163, 165, 166, 168, 170, 171, 173],
    AGI: [10, 11, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 88, 89, 90, 91, 92],
    INT: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 86, 87, 88, 89, 90],
    WIL: [14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 49, 50, 51, 52, 53, 54, 55, 57, 58, 59, 60, 61, 62, 64, 65, 66, 67, 68, 70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 87, 89, 90, 91, 92, 93, 94, 96, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 111, 112, 113, 114, 115, 117, 118, 119],
    ATK: [30, 33, 36, 40, 43, 46, 49, 52, 56, 59, 62, 65, 69, 72, 75, 78, 81, 85, 88, 91, 94, 97, 101, 104, 107, 110, 113, 117, 120, 123, 126, 129, 133, 136, 139, 142, 145, 149, 152, 155, 158, 161, 165, 168, 171, 174, 177, 181, 184, 187, 190, 193, 197, 200, 203, 206, 209, 213, 216, 219, 222, 225, 229, 232, 235, 238, 241, 245, 248, 251, 254, 257, 261, 264, 267, 270, 273, 277, 280, 283, 286, 289, 293, 296, 299, 302, 305, 309, 312, 315],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1229, 1285, 1342, 1398, 1454, 1510, 1566, 1622, 1678, 1734, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2521, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2970, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3979, 4036, 4092, 4148, 4204, 4260, 4316, 4373, 4429, 4485, 4541, 4597, 4653, 4709, 4766, 4822, 4878, 4934, 4990, 5046, 5102, 5158, 5215, 5271, 5327, 5383, 5439, 5495],
  },
  commands: MIFU_COMMANDS,
  combatHooks: MIFU_HOOKS,
  potentialEffects: MIFU_POTENTIAL_EFFECTS,
  mutateResolvedCommands: (commands, ctx) =>
    commands.map((command) => {
      let nextCommand = command;

      if ((ctx.buildState.potentialLevel ?? 0) >= 1 && command.id === MIFU_COMBO_SKILL_ID) {
        nextCommand = {
          ...nextCommand,
          comboCooldownSeconds: Math.max(0, nextCommand.comboCooldownSeconds - 2),
          hits: nextCommand.hits.map((hit, hitIndex) => {
            if (hitIndex !== 1) {
              return hit;
            }
            return {
              ...hit,
              effects: (hit.effects ?? []).map((effect) => (
                effect.type === "APPLY_STATUS" && effect.statusId === MIFU_COMBO_PHYSICAL_SUS_STATUS_ID
                  ? {
                      ...effect,
                      durationSeconds: 20,
                      effects: {
                        ...(effect.effects ?? {}),
                        PHYSICAL_SUS_PCT: 0.1,
                      },
                    }
                  : effect
              )),
            };
          }),
        };
      }

      if ((ctx.buildState.potentialLevel ?? 0) >= 4 && command.id === MIFU_ULTIMATE_ID) {
        nextCommand = {
          ...nextCommand,
          energyCost: nextCommand.energyCost * 0.85,
        };
      }

      if ((ctx.buildState.potentialLevel ?? 0) >= 5) {
        if (
          command.id === MIFU_CLOUDTRAPPER_ID
          || command.id === MIFU_TRAIL_AND_MANGLE_ID
          || command.id === MIFU_WORLD_SPLITTER_ID
        ) {
          nextCommand = {
            ...nextCommand,
            hits: nextCommand.hits.map((hit) => ({
              ...hit,
              multiplier: hit.multiplier * 1.1,
            })),
          };
        } else if (command.id === MIFU_ULTIMATE_ID) {
          nextCommand = {
            ...nextCommand,
            hits: nextCommand.hits.map((hit) => ({
              ...hit,
              stagger: hit.stagger + 2.5,
            })),
          };
        }
      }

      return nextCommand;
    }),
};

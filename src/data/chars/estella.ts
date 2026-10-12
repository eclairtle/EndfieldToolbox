import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const ESTELLA_BATTLE_SKILL_ID = "estella_battle_skill";
const ESTELLA_COMBO_SKILL_ID = "estella_combo_skill";
const ESTELLA_ULTIMATE_ID = "estella_ultimate";
const ESTELLA_COMBO_TRIGGER_ID = "estella_combo_distortion";
const ESTELLA_TALENT_1_1 = "estella_commiseration_1";
const ESTELLA_TALENT_1_2 = "estella_commiseration_2";
const ESTELLA_TALENT_2_1 = "estella_laziness_pays_off_now_1";
const ESTELLA_TALENT_2_2 = "estella_laziness_pays_off_now_2";
const ESTELLA_TALENT_1_READY_BUFF = "estella_commiseration_ready";
const ESTELLA_POTENTIAL_5_ICD = "estella_potential_5_icd";
const ESTELLA_POTENTIAL_5_ENERGY_HIT_ID = "estella_potential_5_energy";
const ESTELLA_COMBO_PHYSICAL_SUS_BUFF = "estella_combo_physical_sus";
const ESTELLA_CRYO_IMMUNITY_STATUS_ID = "estella_cryo_infliction_immunity";
const ESTELLA_CRYO_REDUCTION_BUFF_ID = "estella_laziness_pays_off_now";

const ESTELLA_COMBO_PHYSICAL_SUS_VALUES = pct([10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 14, 15]);

const ESTELLA_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: ESTELLA_POTENTIAL_5_ENERGY_HIT_ID,
    name: "Survival is a Win",
    skill: "ultimate",
    attackType: "GENERIC",
    damageType: "Physical",
    commandId: "__estella_potential_5",
    commandName: "Survival is a Win",
    multiplier: flat12(0),
    energyReturn: flat12(5),
    offsetFrames: flat12(0),
  },
];

const ESTELLA_COMBAT_HOOKS: CharacterCombatHooks = {
  eventTypes: ["SNAPSHOT_INITIALIZED", "COMBAT_INITIALIZED", "ARTS_REACTION_APPLIED", "BATTLE_SKILL_CAST"],
  onResolvedHit: (ctx) => {
    if (ctx.source.slot !== ctx.self.slot) {
      return;
    }

    if (
      ctx.source.commandId === "__physical_reaction_trigger"
      && ctx.source.hitName === "Shatter Trigger"
      && (
        ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_1_1)
        || ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_1_2)
      )
      && !ctx.state.hasSelfBuff(ESTELLA_TALENT_1_READY_BUFF)
    ) {
      ctx.state.applySelfBuff({
        buffId: ESTELLA_TALENT_1_READY_BUFF,
        label: "Commiseration",
        durationSeconds: 9999,
        infiniteDuration: true,
        timeScale: "game",
        hidden: true,
      });
    }
  },
  onEvent: (ctx) => {
    if (
      (ctx.event.type === "SNAPSHOT_INITIALIZED" || ctx.event.type === "COMBAT_INITIALIZED")
      && ctx.event.sourceSlot === ctx.self.slot
      && (
        ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_2_1)
        || ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_2_2)
      )
    ) {
      const cryoDamageTakenPct = ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_2_2) ? -0.2 : -0.1;
      ctx.state.applySelfBuff({
        buffId: ESTELLA_CRYO_REDUCTION_BUFF_ID,
        label: "Laziness Pays Off Now",
        durationSeconds: 9999,
        infiniteDuration: true,
        timeScale: "game",
        hidden: true,
        stackGroup: ESTELLA_CRYO_REDUCTION_BUFF_ID,
        maxStacks: 1,
        refreshExistingStacks: true,
        effects: {
          CRYO_DMG_TAKEN_PCT: cryoDamageTakenPct,
        },
      });
      ctx.state.applyEffects({
        stepId: `${ctx.event.stepId ?? "event"}:estella_cryo_immunity`,
        effectTree: ctx.event.effectTree,
        effects: [
          {
            type: "APPLY_STATUS",
            target: "self",
            statusId: ESTELLA_CRYO_IMMUNITY_STATUS_ID,
            label: "Laziness Pays Off Now",
            durationSeconds: 9999,
            timeScale: "game",
            hidden: true,
          },
        ],
      });
    }

    if (
      ctx.event.type === "ARTS_REACTION_APPLIED"
      && ctx.event.label.startsWith("Solidification Applied")
      && ctx.state.markTriggerOnce(`${ctx.event.stepId ?? "event"}:estella_combo_trigger`)
    ) {
      ctx.state.triggerSelfCombo({
        label: "Estella Combo Triggered",
        sourceEventType: "ARTS_REACTION_APPLIED",
      });
    }

    if (
      ctx.event.type === "BATTLE_SKILL_CAST"
      && ctx.event.commandId === ESTELLA_BATTLE_SKILL_ID
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.state.hasSelfBuff(ESTELLA_TALENT_1_READY_BUFF)
    ) {
      const returnedSp = ctx.state.isSelfUniqueTalentEnabled(ESTELLA_TALENT_1_2) ? 15 : 7.5;
      ctx.state.grantReturnedSp(returnedSp, "Commiseration");
      ctx.state.applyEffects({
        stepId: `${ctx.event.stepId ?? "event"}:estella_commiseration_consume`,
        effectTree: ctx.event.effectTree,
        effects: [
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: ESTELLA_TALENT_1_READY_BUFF,
          },
        ],
      });
    }

    if (
      ctx.event.type === "ARTS_REACTION_APPLIED"
      && ctx.event.label.startsWith("Solidification Applied")
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.state.isSelfPotentialActive(5)
      && !ctx.state.hasStatus({ statusId: ESTELLA_POTENTIAL_5_ICD, target: "self" })
      && ctx.state.markTriggerOnce(`${ctx.event.stepId ?? "event"}:estella_potential_5`)
    ) {
      ctx.state.applyEffects({
        stepId: `${ctx.event.stepId ?? "event"}:estella_potential_5`,
        effectTree: ctx.event.effectTree,
        effects: [
          {
            type: "APPLY_STATUS",
            target: "self",
            statusId: ESTELLA_POTENTIAL_5_ICD,
            label: "Survival is a Win ICD",
            durationSeconds: 1,
            timeScale: "real",
            hidden: true,
          },
          {
            type: "EXECUTE_HIT",
            hitRefId: ESTELLA_POTENTIAL_5_ENERGY_HIT_ID,
            inheritSourceBonuses: false,
          },
        ],
      });
    }
  },
};

const ESTELLA_COMMANDS: CommandDefinition[] = [
  {
    id: "estella_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "sequence",
    durationFrames: flat12(214),
    spCost: flat12(0),
    expandsToCommandIds: [
      "estella_basic_sequence_1",
      "estella_basic_sequence_2",
      "estella_basic_sequence_3",
      "estella_basic_sequence_4",
      "estella_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "estella_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(36),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56]), offsetFrames: flat12(12) }],
  },
  {
    id: "estella_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(40),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68]), offsetFrames: flat12(18) }],
  },
  {
    id: "estella_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(48),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 34]), offsetFrames: flat12(20) },
      { name: "Hit 2", multiplier: pct([20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 41, 45]), offsetFrames: flat12(30) },
    ],
  },
  {
    id: "estella_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(42),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]), offsetFrames: flat12(24) }],
  },
  {
    id: "estella_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(48),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]),
        stagger: flat12(17),
        spGenerated: flat12(19),
        requiresControlledOperator: true,
        offsetFrames: flat12(24),
      },
    ],
  },
  {
    id: "estella_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "finisher", targets: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "estella_basic_dive",
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
    id: ESTELLA_BATTLE_SKILL_ID,
    name: "Onomatopoeia",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Cryo",
    durationFrames: flat12(90),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Freezing Sound Wave",
        multiplier: pct([156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350]),
        stagger: flat12(10),
        offsetFrames: flat12(42),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 }],
      },
    ],
  },
  {
    id: ESTELLA_COMBO_SKILL_ID,
    name: "Distortion",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    durationFrames: flat12(40),
    spCost: flat12(0),
    comboCooldownSeconds: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
    comboTriggerId: ESTELLA_COMBO_TRIGGER_ID,
    hits: [
      {
        name: "Lifting Blow",
        multiplier: pct([160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360]),
        stagger: flat12(10),
        energyReturn: flat12(10),
        offsetFrames: flat12(38),
        effects: [
          {
            type: "APPLY_REACTION",
            reaction: "Lift",
            forceApply: true,
            reactionDamage: false,
            singleEventPerStep: true,
          },
        ],
      },
      {
        name: "Solidification Bonus",
        multiplier: pct([280, 308, 336, 364, 392, 420, 448, 476, 504, 539, 581, 630]),
        offsetFrames: flat12(38),
        executeCondition: {
          requiresEnemyStatusId: "solidification",
        },
        effects: [
          {
            type: "APPLY_BUFF",
            target: "enemy",
            buffId: ESTELLA_COMBO_PHYSICAL_SUS_BUFF,
            label: "Physical Susceptibility",
            durationSeconds: 6,
            timeScale: "game",
            singleEventPerStep: true,
            effectScalings: {
              PHYSICAL_SUS_PCT: ESTELLA_COMBO_PHYSICAL_SUS_VALUES,
            },
          },
        ],
      },
    ],
  },
  {
    id: ESTELLA_ULTIMATE_ID,
    name: "Tremolo",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    durationFrames: flat12(120),
    spCost: flat12(0),
    energyCost: flat12(70),
    hits: [
      {
        name: "Shaft Slam",
        multiplier: pct([489, 538, 586, 635, 684, 733, 782, 831, 880, 941, 1014, 1100]),
        stagger: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
        offsetFrames: flat12(108),
      },
      {
        name: "Susceptibility Lift",
        multiplier: flat12(0),
        offsetFrames: flat12(108),
        executeCondition: {
          condition: {
            type: "require_enemy_modifier",
            stat: "PHYSICAL_SUS_PCT",
            min: 0.0001,
          },
        },
        effects: [
          {
            type: "APPLY_REACTION",
            reaction: "Lift",
            forceApply: true,
            reactionDamage: false,
            singleEventPerStep: true,
          },
        ],
      },
    ],
  },
];

export const ESTELLA: CharacterBase = {
  id: "estella",
  name: "Estella",
  skillIconPaths: {
    battleSkill: "/avatars/ESTELLA/icon_skill_whiten_01.webp",
    comboSkill: "/avatars/ESTELLA/icon_combo_skill_whiten_01.webp",
    ultimate: "/avatars/ESTELLA/icon_ultimate_skill_whiten_01.webp",
  },
  rarity: 4,
  class: "Guard",
  element: "Cryo",
  scaling: { WIL: 0.005, STR: 0.002 },
  mainAttr: "WIL",
  secondaryAttr: "STR",
  weaponType: "POLEARM",
  commands: ESTELLA_COMMANDS,
  executeHits: ESTELLA_EXECUTE_HITS,
  combatHooks: ESTELLA_COMBAT_HOOKS,
  uniqueTalentDefs: {
    [ESTELLA_TALENT_1_1]: {
      name: "Commiseration I",
      condition: {
        minEliteStage: 1,
      },
    },
    [ESTELLA_TALENT_1_2]: {
      name: "Commiseration II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [ESTELLA_TALENT_1_1],
      },
    },
    [ESTELLA_TALENT_2_1]: {
      name: "Laziness Pays Off Now I",
      condition: {
        minEliteStage: 2,
      },
    },
    [ESTELLA_TALENT_2_2]: {
      name: "Laziness Pays Off Now II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [ESTELLA_TALENT_2_1],
      },
    },
  },
  potentialEffects: {
    4: {
      apply: () => ({
        attrsDelta: { STR: 10, WIL: 10 },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    return commands.map((command) => {
      if (command.id === ESTELLA_ULTIMATE_ID && potentialLevel >= 2) {
        return {
          ...command,
          energyCost: command.energyCost * 0.9,
        };
      }

      if (command.id === ESTELLA_BATTLE_SKILL_ID && potentialLevel >= 3) {
        const firstHit = command.hits[0];
        if (!firstHit) {
          return command;
        }
        return {
          ...command,
          hits: [
            firstHit,
            {
              ...firstHit,
              name: "First Enemy Bonus",
              multiplier: firstHit.multiplier * 0.4,
              stagger: 0,
              targets: "targeted_enemy",
              effects: [],
              postEffects: [],
            },
          ],
        };
      }

      if (command.id === ESTELLA_COMBO_SKILL_ID && potentialLevel >= 1) {
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...hit,
            effects: hit.effects?.map((effect) => {
              if (effect.type !== "APPLY_BUFF" || effect.buffId !== ESTELLA_COMBO_PHYSICAL_SUS_BUFF) {
                return effect;
              }
              return {
                ...effect,
                durationSeconds: (effect.durationSeconds ?? 0) + 3,
              };
            }),
          })),
        };
      }

      return command;
    });
  },
  levels: {
    STR: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104],
    AGI: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    INT: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110],
    WIL: [15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50, 51, 53, 54, 56, 57, 59, 61, 62, 64, 65, 67, 68, 70, 71, 73, 74, 76, 77, 79, 80, 82, 84, 85, 87, 88, 90, 91, 93, 94, 96, 97, 99, 100, 102, 103, 105, 107, 108, 110, 111, 113, 114, 116, 117, 119, 120, 122, 123, 125, 126, 128, 130, 131, 133, 134, 136, 137, 139, 140, 142, 143, 145, 146, 148, 149, 151],
    ATK: [30, 33, 36, 39, 43, 46, 49, 52, 55, 58, 62, 65, 68, 71, 74, 77, 81, 84, 87, 90, 93, 96, 100, 103, 106, 109, 112, 115, 119, 122, 125, 128, 131, 134, 138, 141, 144, 147, 150, 153, 157, 160, 163, 166, 169, 172, 176, 179, 182, 185, 188, 191, 195, 198, 201, 204, 207, 210, 214, 217, 220, 223, 226, 229, 233, 236, 239, 242, 245, 248, 252, 255, 258, 261, 264, 267, 271, 274, 277, 280, 283, 286, 290, 293, 296, 299, 302, 305, 309, 312],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

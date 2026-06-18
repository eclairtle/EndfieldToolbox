import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const ALESH_TALENT_1_1 = "alesh_talent_energy_reaction_1";
const ALESH_TALENT_1_2 = "alesh_talent_energy_reaction_2";
const ALESH_TALENT_2_1 = "alesh_talent_rarefin_scaling_1";
const ALESH_TALENT_2_2 = "alesh_talent_rarefin_scaling_2";
const ALESH_POTENTIAL_3_TEAM_ATK_BUFF = "alesh_potential_3_team_attack";
const ALESH_TALENT_1_ICD_STATUS = "alesh_talent_1_icd";
const ALESH_TALENT_1_BASE_ENERGY_1_HIT_ID = "alesh_talent_1_base_energy_1";
const ALESH_TALENT_1_SELF_BONUS_1_HIT_ID = "alesh_talent_1_self_bonus_1";
const ALESH_TALENT_1_BASE_ENERGY_2_HIT_ID = "alesh_talent_1_base_energy_2";
const ALESH_TALENT_1_SELF_BONUS_2_HIT_ID = "alesh_talent_1_self_bonus_2";
const ALESH_BATTLE_SKILL_ID = "alesh_battle_skill";
const ALESH_COMBO_SKILL_ID = "alesh_combo_skill";
const ALESH_COMBO_SKILL_RARE_FIN_ID = "alesh_combo_skill_rare_fin";
const ALESH_COMBO_TRIGGER_ID = "alesh_combo_augur_angling";
const ALESH_COMBO_COOLDOWN_OWNER_ID = "alesh_combo_augur_angling";
const ALESH_COMBO_VARIANT_COMMAND_IDS = [ALESH_COMBO_SKILL_ID, ALESH_COMBO_SKILL_RARE_FIN_ID];

const ALESH_COMMANDS: CommandDefinition[] = [
  {
    id: "alesh_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    basicAttackVariant: "sequence",
    durationFrames: flat12(191.88),
    spCost: flat12(0),
    expandsToCommandIds: [
      "alesh_basic_sequence_1",
      "alesh_basic_sequence_2",
      "alesh_basic_sequence_3",
      "alesh_basic_sequence_4",
      "alesh_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "alesh_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(25.8),
    spCost: flat12(0),
    hits: [{ name: "Hit 1", multiplier: pct([18, 19, 21, 23, 25, 26, 28, 30, 32, 34, 36, 39]), offsetFrames: flat12(13.8) }],
  },
  {
    id: "alesh_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(22.02),
    spCost: flat12(0),
    hits: [{ name: "Hit 1", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(10.2) }],
  },
  {
    id: "alesh_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    hits: [{ name: "Hit 1", multiplier: pct([28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62]), offsetFrames: flat12(25.8) }],
  },
  {
    id: "alesh_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(46.02),
    spCost: flat12(0),
    hits: [{ name: "Hit 1", multiplier: pct([28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62]), offsetFrames: flat12(30) }],
  },
  {
    id: "alesh_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(64.02),
    spCost: flat12(0),
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124]),
        stagger: flat12(17),
        spGenerated: flat12(19),
        requiresControlledOperator: true,
        offsetFrames: flat12(36),
      },
    ],
  },
  {
    id: "alesh_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400,440,480,520,560,600,640,680,720,770,830,900]), offsetFrames: flat12(30) }],
  },
  {
    id: "alesh_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80,88,96,104,112,120,128,136,144,154,166,180]), offsetFrames: flat12(30) }],
  },
  {
    id: ALESH_BATTLE_SKILL_ID,
    name: "Unconventional Lure",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(100.2),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Ice Slam",
        multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]),
        stagger: flat12(10),
        offsetFrames: flat12(54),
      },
    ],
  },
  {
    id: ALESH_COMBO_SKILL_ID,
    name: "Auger Angling",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(78),
    spCost: flat12(0),
    comboCooldownSeconds: flat12(9),
    comboCooldownOwnerCommandId: ALESH_COMBO_COOLDOWN_OWNER_ID,
    comboTriggerId: ALESH_COMBO_TRIGGER_ID,
    manualVariantCommandIds: ALESH_COMBO_VARIANT_COMMAND_IDS,
    hits: [
      {
        name: "Regular Catch",
        multiplier: pct([133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300]),
        stagger: flat12(10),
        spGenerated: flat12(10),
        offsetFrames: flat12(76.2),
      },
    ],
  },
  {
    id: ALESH_COMBO_SKILL_RARE_FIN_ID,
    name: "(Rare Fin) Auger Angling",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    enhanced: true,
    durationFrames: flat12(78),
    spCost: flat12(0),
    comboCooldownSeconds: flat12(9),
    comboCooldownOwnerCommandId: ALESH_COMBO_COOLDOWN_OWNER_ID,
    comboTriggerId: ALESH_COMBO_TRIGGER_ID,
    manualVariantCommandIds: ALESH_COMBO_VARIANT_COMMAND_IDS,
    hits: [
      {
        name: "Rare Fin Catch",
        multiplier: pct([213, 235, 256, 277, 299, 320, 341, 363, 384, 411, 443, 480]),
        stagger: flat12(10),
        spGenerated: flat12(20),
        offsetFrames: flat12(76.2),
      },
    ],
  },
  {
    id: "alesh_ultimate",
    name: "One Monster Catch!",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Cryo",
    mode: "single",
    durationFrames: flat12(192),
    spCost: flat12(0),
    energyCost: flat12(85),
    hits: [
      {
        name: "Monster Catch",
        multiplier: pct([436, 479, 523, 566, 610, 653, 697, 741, 784, 839, 904, 980]),
        stagger: flat12(20),
        spGenerated: flat12(20),
        offsetFrames: flat12(180),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Cryo", stacks: 1 }],
      },
    ],
  },
];

const ALESH_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: ALESH_TALENT_1_BASE_ENERGY_1_HIT_ID,
    name: "Alesh Talent 1 Energy",
    skill: "comboSkill",
    attackType: "GENERIC",
    damageType: "Cryo",
    commandId: "__alesh_talent_1",
    commandName: "Alesh Talent 1",
    energyReturn: flat12(3),
    multiplier: flat12(0),
    offsetFrames: flat12(0),
  },
  {
    id: ALESH_TALENT_1_SELF_BONUS_1_HIT_ID,
    name: "Alesh Talent 1 Self Bonus Energy",
    skill: "comboSkill",
    attackType: "GENERIC",
    damageType: "Cryo",
    commandId: "__alesh_talent_1",
    commandName: "Alesh Talent 1",
    energyReturn: flat12(6),
    multiplier: flat12(0),
    offsetFrames: flat12(0),
  },
  {
    id: ALESH_TALENT_1_BASE_ENERGY_2_HIT_ID,
    name: "Alesh Talent 1 Energy II",
    skill: "comboSkill",
    attackType: "GENERIC",
    damageType: "Cryo",
    commandId: "__alesh_talent_1",
    commandName: "Alesh Talent 1",
    energyReturn: flat12(4),
    multiplier: flat12(0),
    offsetFrames: flat12(0),
  },
  {
    id: ALESH_TALENT_1_SELF_BONUS_2_HIT_ID,
    name: "Alesh Talent 1 Self Bonus Energy II",
    skill: "comboSkill",
    attackType: "GENERIC",
    damageType: "Cryo",
    commandId: "__alesh_talent_1",
    commandName: "Alesh Talent 1",
    energyReturn: flat12(8),
    multiplier: flat12(0),
    offsetFrames: flat12(0),
  },
];

const ALESH_HOOKS: CharacterCombatHooks = {
  onResolvedHit: (ctx) => {
    if (!ctx.flags.dealsDamage || ctx.source.slot !== ctx.self.slot) {
      return;
    }

    if (ctx.source.commandId === ALESH_BATTLE_SKILL_ID) {
      const currentInfliction = ctx.state.getEnemyArtsInfliction();
      if (currentInfliction?.element !== "Cryo") {
        return;
      }
      const consumedStacks = Math.max(1, Math.min(4, currentInfliction.stacks));
      ctx.state.setEnemyArtsInfliction(null);
      ctx.state.applyEffects({
        effects: [
          {
            type: "APPLY_REACTION",
            reaction: "Solidification",
            level: consumedStacks,
            durationSeconds: 5,
            forceApply: true,
            reactionDamage: false,
          },
        ],
        stepId: `${ctx.stepId}:alesh_battle_skill_freeze`,
        effectTree: ctx.effectTree,
      });
      ctx.state.applyEffects({
        effects: [{
          type: "GRANT_SP",
          amount: consumedStacks * 10 + (ctx.state.isSelfPotentialActive(1) ? 10 : 0),
          label: "Unconventional Lure SP Recovery",
        }],
        stepId: `${ctx.stepId}:alesh_battle_skill_sp`,
        effectTree: ctx.effectTree,
      });
      return;
    }

    if (ctx.source.commandId === ALESH_COMBO_SKILL_RARE_FIN_ID && ctx.state.isSelfPotentialActive(3)) {
      ctx.state.applySelfBuff({
        buffId: ALESH_POTENTIAL_3_TEAM_ATK_BUFF,
        label: "Rare Fin Harvest",
        durationSeconds: 10,
        timeScale: "game",
        effects: { ATK_PCT: 0.15 },
      });
      ctx.state.applyOtherTeammatesBuff({
        buffId: ALESH_POTENTIAL_3_TEAM_ATK_BUFF,
        label: "Rare Fin Harvest",
        durationSeconds: 10,
        timeScale: "game",
        effects: { ATK_PCT: 0.15 },
      });
    }
  },
  onEvent: (ctx) => {
    if (
      ctx.event.type === "ARTS_REACTION_CONSUMED"
      || (ctx.event.type === "PHYSICAL_REACTION_APPLIED" && ctx.event.enemyHadOriginiumCrystal === true)
    ) {
      ctx.state.triggerSelfCombo({
        label: "Alesh Combo Triggered",
        sourceEventType: ctx.event.type,
        comboCommandId: ALESH_COMBO_SKILL_ID,
      });
    }

    const isSolidificationApplied =
      ctx.event.type === "ARTS_REACTION_APPLIED" && ctx.event.label.startsWith("Solidification Applied");
    const isOriginiumCrystalApplied = ctx.event.type === "ORIGINIUM_CRYSTAL_APPLIED";
    if (!isSolidificationApplied && !isOriginiumCrystalApplied) {
      return;
    }
    if (!ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_1) && !ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_2)) {
      return;
    }
    if (ctx.state.hasStatus({ statusId: ALESH_TALENT_1_ICD_STATUS, target: "self" })) {
      return;
    }

    const isTier2 = ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_2);
    const baseEnergyHit = isTier2 ? ALESH_TALENT_1_BASE_ENERGY_2_HIT_ID : ALESH_TALENT_1_BASE_ENERGY_1_HIT_ID;
    const selfBonusHit = isTier2 ? ALESH_TALENT_1_SELF_BONUS_2_HIT_ID : ALESH_TALENT_1_SELF_BONUS_1_HIT_ID;

    ctx.state.applyEffects({
      effects: [
        {
          type: "APPLY_STATUS",
          target: "self",
          statusId: ALESH_TALENT_1_ICD_STATUS,
          label: "Alesh Talent 1 ICD",
          durationSeconds: 3,
          timeScale: "real",
        },
        { type: "EXECUTE_HIT", hitRefId: baseEnergyHit, inheritSourceBonuses: false },
        ...(ctx.event.sourceSlot === ctx.self.slot
          ? [{ type: "EXECUTE_HIT" as const, hitRefId: selfBonusHit, inheritSourceBonuses: false }]
          : []),
      ],
      stepId: `${ctx.event.stepId ?? "event"}:alesh_t1`,
      effectTree: ctx.event.effectTree,
    });
  },
};

export const ALESH: CharacterBase = {
  id: "alesh", name: "Alesh",
  skillIconPaths: {
    battleSkill: "/avatars/ALESH/icon_skill_deepfin_01.webp",
    comboSkill: "/avatars/ALESH/icon_combo_skill_deepfin_01.webp",
    ultimate: "/avatars/ALESH/icon_ultimate_skill_deepfin_01.webp",
  },
  rarity: 5, class: "Vanguard", element: "Cryo",
  scaling: { STR: 0.005, INT: 0.002 }, mainAttr: "STR", secondaryAttr: "INT", weaponType: "SWORD", commands: ALESH_COMMANDS,
  executeHits: ALESH_EXECUTE_HITS,
  combatHooks: ALESH_HOOKS,
  uniqueTalentDefs: {
    [ALESH_TALENT_1_1]: { name: "Rare Catch I", condition: { minEliteStage: 1 } },
    [ALESH_TALENT_1_2]: {
      name: "Rare Catch II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [ALESH_TALENT_1_1] },
    },
    [ALESH_TALENT_2_1]: { name: "Auger Angling I", condition: { minEliteStage: 2 } },
    [ALESH_TALENT_2_2]: {
      name: "Auger Angling II",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [ALESH_TALENT_2_1] },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: { STR: 15, INT: 15 },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    return commands.map((command) => {
      if (command.id === "alesh_ultimate" && potentialLevel >= 4) {
        return {
          ...command,
          energyCost: command.energyCost * 0.85,
        };
      }
      return command;
    });
  },
  levels: { STR: [20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 40, 41, 43, 44, 46, 47, 49, 51, 52, 54, 55, 57, 58, 60, 61, 63, 64, 66, 68, 69, 71, 72, 74, 75, 77, 78, 80, 82, 83, 85, 86, 88, 89, 91, 92, 94, 96, 97, 99, 100, 102, 103, 105, 106, 108, 109, 111, 113, 114, 116, 117, 119, 120, 122, 123, 125, 126, 128, 130, 131, 133, 134, 136, 137, 139, 140, 142, 144, 145, 147, 148, 150, 152, 153, 155, 156, 158], AGI: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 90, 91, 92, 93, 94, 95], INT: [13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 40, 41, 42, 43, 44, 46, 47, 48, 50, 51, 52, 53, 54, 56, 57, 58, 60, 61, 62, 63, 64, 66, 67, 68, 70, 71, 72, 73, 74, 76, 77, 78, 80, 81, 82, 83, 84, 86, 87, 88, 90, 91, 92, 94, 95, 96, 97, 99, 100, 101, 103, 104, 105, 106, 108, 109, 110, 112, 113, 114, 115, 117, 118, 119, 120, 121, 123, 124, 125], WIL: [10, 11, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 32, 33, 34, 35, 36, 37, 38, 39, 40, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50, 51, 52, 53, 54, 55, 56, 57, 58, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 68, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82, 83, 83, 84, 85, 86, 87, 87, 88, 89], ATK: [30, 33, 36, 39, 43, 46, 49, 52, 55, 58, 62, 65, 68, 71, 74, 77, 81, 84, 87, 90, 93, 96, 99, 102, 106, 109, 112, 115, 118, 121, 124, 127, 130, 133, 136, 140, 143, 146, 149, 152, 155, 158, 161, 165, 168, 171, 174, 177, 180, 184, 187, 190, 193, 196, 199, 202, 206, 209, 212, 215, 218, 221, 224, 227, 230, 234, 237, 240, 243, 246, 249, 252, 255, 258, 262, 265, 268, 271, 274, 277, 280, 283, 287, 290, 293, 296, 299, 303, 306, 309], HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1229, 1285, 1342, 1398, 1454, 1510, 1566, 1622, 1678, 1734, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2521, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2970, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3530, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3979, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4766, 4822, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5271, 5327, 5383, 5439, 5495] },
};

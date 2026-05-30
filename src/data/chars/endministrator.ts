import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const ENDMIN_TALENT_1_1 = "endministrator_essence_disintegration_1";
const ENDMIN_TALENT_1_2 = "endministrator_essence_disintegration_2";
const ENDMIN_TALENT_2_1 = "endministrator_realspace_stasis_1";
const ENDMIN_TALENT_2_2 = "endministrator_realspace_stasis_2";

const ENDMIN_CRYSTAL_STATUS = "endministrator_originium_crystal";
const ENDMIN_ESSENCE_DISINTEGRATION_BUFF = "endministrator_essence_disintegration_atk";
const ENDMIN_COMBO_CRYSTAL_SHATTER_HIT_ID = "endministrator_combo_crystal_shatter";

const ENDMINISTRATOR_COMMANDS: CommandDefinition[] = [
  {
    id: "endministrator_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(0),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    expandsToCommandIds: [
      "endministrator_basic_sequence_1",
      "endministrator_basic_sequence_2",
      "endministrator_basic_sequence_3",
      "endministrator_basic_sequence_4",
      "endministrator_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "endministrator_basic_sequence_1",
    name: "Basic Attack Sequence 1",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    hiddenInLibrary: true,
    durationFrames: flat12(30),
    spCost: flat12(0),
    hits: [{ multiplier: pct([23, 25, 27, 29, 32, 34, 36, 39, 41, 44, 47, 51]), offsetFrames: flat12(16) }],
  },
  {
    id: "endministrator_basic_sequence_2",
    name: "Basic Attack Sequence 2",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    hiddenInLibrary: true,
    durationFrames: flat12(34),
    spCost: flat12(0),
    hits: [{ multiplier: pct([27, 30, 32, 35, 38, 41, 43, 46, 49, 52, 56, 61]), offsetFrames: flat12(20) }],
  },
  {
    id: "endministrator_basic_sequence_3",
    name: "Basic Attack Sequence 3",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    hiddenInLibrary: true,
    durationFrames: flat12(38),
    spCost: flat12(0),
    hits: [{ multiplier: pct([30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 63, 68]), offsetFrames: flat12(24) }],
  },
  {
    id: "endministrator_basic_sequence_4",
    name: "Basic Attack Sequence 4",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    hiddenInLibrary: true,
    durationFrames: flat12(42),
    spCost: flat12(0),
    hits: [{ multiplier: pct([35, 38, 41, 45, 48, 52, 55, 59, 62, 67, 72, 78]), offsetFrames: flat12(26) }],
  },
  {
    id: "endministrator_basic_sequence_5",
    name: "Basic Attack Sequence 5",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    hiddenInLibrary: true,
    durationFrames: flat12(56),
    spCost: flat12(0),
    hits: [{ multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]), stagger: flat12(18), spGenerated: flat12(20), offsetFrames: flat12(32) }],
  },
  { id: "endministrator_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "finisher", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "endministrator_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "endministrator_battle_skill",
    name: "Constructive Sequence",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(80),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{
      multiplier: pct([156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350]),
      stagger: flat12(10),
      offsetFrames: flat12(46),
      effects: [{ type: "APPLY_REACTION", reaction: "Crush", forceApply: false }],
    }],
  },
  {
    id: "endministrator_combo_skill",
    name: "Sealing Sequence",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(95),
    timeFreezeSeconds: flat12(54 / 60),
    comboCooldownSeconds: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15],
    spCost: flat12(0),
    hits: [
      {
        multiplier: pct([45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100]),
        stagger: flat12(10),
        offsetFrames: flat12(57),
        effects: [
          {
            type: "APPLY_STATUS",
            target: "enemy",
            statusId: ENDMIN_CRYSTAL_STATUS,
            label: "Originium Crystal",
            durationSeconds: 4,
            timeScale: "game",
          },
        ],
      },
    ],
  },
  {
    id: "endministrator_ultimate",
    name: "Bombardment Sequence",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(124),
    cutscene: true,
    timeFreezeSeconds: flat12(115 / 60),
    spCost: flat12(0),
    energyCost: flat12(100),
    hits: [
      { multiplier: pct([356, 391, 427, 462, 498, 533, 569, 604, 640, 684, 738, 800]), stagger: flat12(25), offsetFrames: flat12(123) },
      {
        multiplier: pct([267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600]),
        offsetFrames: flat12(123),
        executeCondition: {
          requiresEnemyStatusId: ENDMIN_CRYSTAL_STATUS,
        },
      },
    ],
  },
];

const ENDMINISTRATOR_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: ENDMIN_COMBO_CRYSTAL_SHATTER_HIT_ID,
    name: "Crystal Shattering",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    commandId: "endministrator_combo_skill",
    commandName: "Sealing Sequence",
    multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]),
    stagger: flat12(10),
    offsetFrames: flat12(0),
  },
];

function getEndminSelfAtkBuffByTalent(args: {
  isSelfUniqueTalentEnabled: (key: string) => boolean;
}): number {
  if (args.isSelfUniqueTalentEnabled(ENDMIN_TALENT_1_2)) {
    return 0.3;
  }
  if (args.isSelfUniqueTalentEnabled(ENDMIN_TALENT_1_1)) {
    return 0.15;
  }
  return 0;
}

const ENDMINISTRATOR_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    const teammateSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    const isTeammateComboSkillHit =
      ctx.event.type === "COMBO_SKILL_HIT"
      && teammateSlot != null
      && teammateSlot !== ctx.self.slot;
    if (isTeammateComboSkillHit) {
      ctx.state.triggerSelfCombo({
        sourceEventType: "COMBO_SKILL_HIT",
        label: "Endministrator Combo Triggered",
      });
    }
    const shouldConsumeByEvent =
      (
        (ctx.event.type === "ENEMY_DEBUFF_APPLIED" && ctx.event.label === "Vulnerability Applied")
        || ctx.event.type === "PHYSICAL_REACTION_APPLIED"
      )
      && ctx.state.hasStatus({ statusId: ENDMIN_CRYSTAL_STATUS, target: "enemy" });
    if (!shouldConsumeByEvent) {
      return;
    }

    ctx.state.applyEffects({
      effects: [
        { type: "EXECUTE_HIT", hitRefId: ENDMIN_COMBO_CRYSTAL_SHATTER_HIT_ID },
        { type: "REMOVE_STATUS", target: "enemy", statusId: ENDMIN_CRYSTAL_STATUS },
      ],
      stepId: `${ctx.event.stepId ?? "event"}:endministrator_crystal_consume`,
    });

    if (
      ctx.state.isSelfPotentialActive(1)
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.event.commandAttackType === "BATTLE_SKILL"
    ) {
      ctx.state.grantReturnedSp(50, "Endministrator Potential 1");
    }

    const selfBuffPct = getEndminSelfAtkBuffByTalent({
      isSelfUniqueTalentEnabled: ctx.state.isSelfUniqueTalentEnabled,
    });
    if (selfBuffPct > 0) {
      ctx.state.applySelfBuff({
        buffId: ENDMIN_ESSENCE_DISINTEGRATION_BUFF,
        label: "Essence Disintegration",
        durationSeconds: 15,
        timeScale: "game",
        refreshExistingStacks: true,
        effects: {
          ATK_PCT: selfBuffPct,
        },
      });
      if (ctx.state.isSelfPotentialActive(2)) {
        ctx.state.applyOtherTeammatesBuff({
          buffId: `${ENDMIN_ESSENCE_DISINTEGRATION_BUFF}_team`,
          label: "Essence Disintegration (Team)",
          durationSeconds: 15,
          timeScale: "game",
          refreshExistingStacks: true,
          effects: {
            ATK_PCT: selfBuffPct * 0.5,
          },
        });
      }
    }
  },
  onResolvedHit: (ctx) => {
    if (
      ctx.source.slot === ctx.self.slot
      && ctx.source.commandId === "endministrator_ultimate"
      && ctx.source.hitIndex === 1
      && ctx.state.hasStatus({ statusId: ENDMIN_CRYSTAL_STATUS, target: "enemy" })
    ) {
      const crystalSourceStepId = ctx.state.getStatusSourceStepId({
        statusId: ENDMIN_CRYSTAL_STATUS,
        target: "enemy",
      });
      ctx.state.applyEffects({
        effects: [
          { type: "EXECUTE_HIT", hitRefId: ENDMIN_COMBO_CRYSTAL_SHATTER_HIT_ID },
          { type: "REMOVE_STATUS", target: "enemy", statusId: ENDMIN_CRYSTAL_STATUS },
        ],
        stepId: crystalSourceStepId ?? ctx.stepId,
      });
    }

    if (ctx.source.slot !== ctx.self.slot || ctx.source.commandId !== "endministrator_ultimate" || ctx.source.hitIndex !== 1) {
      return;
    }
    const selfBuffPct = getEndminSelfAtkBuffByTalent({
      isSelfUniqueTalentEnabled: ctx.state.isSelfUniqueTalentEnabled,
    });
    if (selfBuffPct <= 0) {
      return;
    }
    ctx.state.applySelfBuff({
      buffId: ENDMIN_ESSENCE_DISINTEGRATION_BUFF,
      label: "Essence Disintegration",
      durationSeconds: 15,
      timeScale: "game",
      refreshExistingStacks: true,
      effects: {
        ATK_PCT: selfBuffPct,
      },
    });
    if (ctx.state.isSelfPotentialActive(2)) {
      ctx.state.applyOtherTeammatesBuff({
        buffId: `${ENDMIN_ESSENCE_DISINTEGRATION_BUFF}_team`,
        label: "Essence Disintegration (Team)",
        durationSeconds: 15,
        timeScale: "game",
        refreshExistingStacks: true,
        effects: {
          ATK_PCT: selfBuffPct * 0.5,
        },
      });
    }
  },
};

export const ENDMINISTRATOR: CharacterBase = {
  id: "endministrator",
  name: "Endministrator",
  skillIconPaths: {
    battleSkill: "/avatars/ENDMINISTRATOR/icon_skill_endmin_01.webp",
    comboSkill: "/avatars/ENDMINISTRATOR/icon_combo_skill_endmin_01.webp",
    ultimate: "/avatars/ENDMINISTRATOR/icon_ultimate_skill_endmin_01.webp",
  },
  rarity: 6,
  class: "Guard",
  element: "Physical",
  scaling: { AGI: 0.005, STR: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "STR",
  weaponType: "SWORD",
  commands: ENDMINISTRATOR_COMMANDS,
  executeHits: ENDMINISTRATOR_EXECUTE_HITS,
  combatHooks: ENDMINISTRATOR_HOOKS,
  uniqueTalentDefs: {
    [ENDMIN_TALENT_1_1]: { name: "Essence Disintegration I", condition: { minEliteStage: 1 } },
    [ENDMIN_TALENT_1_2]: {
      name: "Essence Disintegration II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [ENDMIN_TALENT_1_1] },
    },
    [ENDMIN_TALENT_2_1]: { name: "Realspace Stasis I", condition: { minEliteStage: 2 } },
    [ENDMIN_TALENT_2_2]: {
      name: "Realspace Stasis II",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [ENDMIN_TALENT_2_1] },
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const hasStasis2 = Boolean(ctx.buildState.uniqueTalentToggles?.[ENDMIN_TALENT_2_2]);
    const hasStasis1 = hasStasis2 || Boolean(ctx.buildState.uniqueTalentToggles?.[ENDMIN_TALENT_2_1]);
    const crystalTakenPct = hasStasis2 ? 0.2 : hasStasis1 ? 0.1 : 0;
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;

    return commands.map((command) => {
      if (command.id === "endministrator_combo_skill") {
        return {
          ...command,
          hits: command.hits.map((hit, index) => {
            if (index !== 0) {
              return hit;
            }
            return {
              ...hit,
              effects: (hit.effects ?? []).map((effect) => {
                if (effect.type !== "APPLY_STATUS" || effect.statusId !== ENDMIN_CRYSTAL_STATUS) {
                  return effect;
                }
                return {
                  ...effect,
                  effects: {
                    ...(effect.effects ?? {}),
                    PHYSICAL_DMG_TAKEN_PCT: crystalTakenPct,
                  },
                };
              }),
            };
          }),
        };
      }

      if (command.id === "endministrator_ultimate" && potentialLevel >= 3) {
        return {
          ...command,
          hits: command.hits.map((hit, index) => {
            if (index !== 1) {
              return hit;
            }
            return {
              ...hit,
              energyReturn: (hit.energyReturn ?? 0) + 15,
              ignoreUltimateGainEfficiency: true,
            };
          }),
        };
      }

      return command;
    });
  },
  levels: {
    STR: [14,15,17,18,19,20,22,23,24,25,26,28,29,30,31,33,34,35,36,38,39,40,41,42,44,45,46,47,49,50,51,52,53,55,56,57,58,60,61,62,63,64,66,67,68,69,71,72,73,74,75,77,78,79,80,82,83,84,85,86,88,89,90,91,93,94,95,96,97,99,100,101,102,104,105,106,107,109,110,111,112,113,115,116,117,118,120,121,122,123],
    AGI: [14,15,17,18,19,21,22,24,25,27,28,29,31,32,34,35,36,38,39,41,42,44,45,46,48,49,51,52,54,55,56,58,59,61,62,64,65,66,68,69,71,72,73,75,76,78,79,81,82,83,85,86,88,89,91,92,93,95,96,98,99,101,102,103,105,106,108,109,110,112,113,115,116,118,119,120,122,123,125,126,128,129,130,132,133,135,136,138,139,140],
    INT: [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,95,96],
    WIL: [10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50,51,53,54,55,56,57,58,59,60,61,62,63,64,66,67,68,69,70,71,72,73,74,75,76,77,79,80,81,82,83,84,85,86,87,88,89,90,92,93,94,95,96,97,98,99,100,101,102,103,105,106,107],
    ATK: [30,33,36,40,43,46,49,53,56,59,62,66,69,72,75,79,82,85,88,92,95,98,101,105,108,111,114,118,121,124,127,131,134,137,140,144,147,150,153,157,160,163,166,170,173,176,179,183,186,189,192,196,199,202,205,209,212,215,218,222,225,228,231,235,238,241,244,248,251,254,257,261,264,267,270,274,277,280,283,287,290,293,296,300,303,306,309,313,316,319],
    HP: [500,556,612,668,724,781,837,893,949,1005,1061,1117,1173,1230,1286,1342,1398,1454,1510,1566,1622,1679,1735,1791,1847,1903,1959,2015,2071,2128,2184,2240,2296,2352,2408,2464,2520,2577,2633,2689,2745,2801,2857,2913,2969,3026,3082,3138,3194,3250,3306,3362,3418,3474,3531,3587,3643,3699,3755,3811,3867,3923,3980,4036,4092,4148,4204,4260,4316,4372,4429,4485,4541,4597,4653,4709,4765,4821,4878,4934,4990,5046,5102,5158,5214,5270,5327,5383,5439,5495],
  },
};

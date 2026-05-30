import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const DAPAN_TALENT_REDUCE_AND_THICKEN_1 = "dapan_reduce_and_thicken_1";
const DAPAN_TALENT_REDUCE_AND_THICKEN_2 = "dapan_reduce_and_thicken_2";
const DAPAN_TALENT_SALTY_OR_MILD_1 = "dapan_salty_or_mild_1";
const DAPAN_TALENT_SALTY_OR_MILD_2 = "dapan_salty_or_mild_2";
const DAPAN_BUFF_PREP_INGREDIENTS = "dapan_prep_ingredients";
const DAPAN_BUFF_REDUCE_AND_THICKEN = "dapan_reduce_and_thicken";
const DAPAN_CRUSH_MULTIPLIER = [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2];

const DAPAN_COMMANDS: CommandDefinition[] = [
  {
    id: "dapan_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(0),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    expandsToCommandIds: [
      "dapan_basic_sequence_1",
      "dapan_basic_sequence_2",
      "dapan_basic_sequence_3",
      "dapan_basic_sequence_4",
    ],
    hits: [],
  },
  {
    id: "dapan_basic_sequence_1",
    name: "Basic Attack Sequence 1",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(34),
    spCost: flat12(0),
    hits: [{ name: "Hit 1", multiplier: pct([28, 31, 34, 37, 39, 42, 45, 48, 51, 54, 58, 63]), offsetFrames: flat12(26) }],
  },
  {
    id: "dapan_basic_sequence_2",
    name: "Basic Attack Sequence 2",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(40),
    spCost: flat12(0),
    hits: [{ name: "Hit 2", multiplier: pct([34, 37, 40, 44, 47, 50, 54, 57, 60, 64, 70, 75]), offsetFrames: flat12(12) }],
  },
  {
    id: "dapan_basic_sequence_3",
    name: "Basic Attack Sequence 3",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(64),
    spCost: flat12(0),
    hits: [{ name: "Hit 3", multiplier: pct([50, 55, 60, 65, 70, 75, 80, 85, 90, 97, 104, 113]), offsetFrames: flat12(42) }],
  },
  {
    id: "dapan_basic_sequence_4",
    name: "Basic Attack Sequence 4",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(84),
    spCost: flat12(0),
    hits: [{ name: "Hit 4", multiplier: pct([60, 66, 72, 78, 84, 90, 96, 103, 109, 116, 125, 136]), spGenerated: flat12(21), offsetFrames: flat12(70) }],
  },
  { id: "dapan_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "finisher", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "dapan_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "dapan_battle_skill",
    name: "FLIP DA WOK!",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(130),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [{
      multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]),
      stagger: flat12(10),
      offsetFrames: flat12(86),
      effects: [{ type: "APPLY_REACTION", reaction: "Lift", forceApply: true }],
    }],
  },
  {
    id: "dapan_combo_skill",
    name: "MORE SPICE!",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(112),
    timeFreezeSeconds: flat12(58 / 60),
    spCost: flat12(0),
    comboCooldownSeconds: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
    comboCooldownTimeScale: "real",
    energyGain: flat12(10),
    hits: [
      {
        multiplier: pct([289, 318, 347, 375, 404, 433, 462, 491, 520, 556, 599, 650]),
        stagger: flat12(15),
        offsetFrames: flat12(106),
        effects: [
          {
            type: "APPLY_CUSTOM_REACTION",
            reactionId: "DAPAN_COMBO_CRUSH",
            crushMultiplierScaling: DAPAN_CRUSH_MULTIPLIER,
          },
        ],
      },
    ],
  },
  {
    id: "dapan_ultimate",
    name: "CHOP 'N DUNK!",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(172),
    spCost: flat12(0),
    cutscene: true,
    timeFreezeSeconds: flat12(80/60),
    energyCost: flat12(90),
    hits: [
      {
        name: "Aerial Flurry 1",
        multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]),
        offsetFrames: flat12(84),
        effects: [{ type: "APPLY_REACTION", reaction: "Lift", forceApply: true }],
      },
      { name: "Aerial Flurry 2", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(96) },
      { name: "Aerial Flurry 3", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(108) },
      { name: "Aerial Flurry 4", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(120) },
      { name: "Aerial Flurry 5", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(132) },
      { name: "Aerial Flurry 6", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(144) },
      {
        name: "Final Slam",
        multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]),
        offsetFrames: flat12(160),
        effects: [{ type: "APPLY_REACTION", reaction: "Knockdown", forceApply: true }],
      },
    ],
  },
];

const DAPAN_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (
      ctx.event.type === "ENEMY_DEBUFF_APPLIED"
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.state.getEnemyVulnerabilityStacks() >= 4
    ) {
      ctx.state.triggerSelfCombo({
        label: "Da Pan Combo Triggered",
        sourceEventType: "ENEMY_DEBUFF_APPLIED",
      });
    }

    if (
      ctx.event.type === "ENEMY_DEBUFF_CONSUMED"
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.event.label === "Vulnerability Consumed"
    ) {
      const hasTalent2 = ctx.state.isSelfUniqueTalentEnabled(DAPAN_TALENT_REDUCE_AND_THICKEN_2);
      const hasTalent1 = hasTalent2 || ctx.state.isSelfUniqueTalentEnabled(DAPAN_TALENT_REDUCE_AND_THICKEN_1);
      if (hasTalent1) {
        const consumedStacks = Math.max(1, Math.min(4, Math.floor(ctx.event.amount ?? 1)));
        for (let index = 0; index < consumedStacks; index += 1) {
          ctx.state.applySelfBuff({
            buffId: DAPAN_BUFF_REDUCE_AND_THICKEN,
            label: "Reduce and Thicken",
            durationSeconds: 10,
            timeScale: "game",
            effects: {
              PHYSICAL_DMG_PCT: hasTalent2 ? 0.06 : 0.04,
            },
            stackGroup: DAPAN_BUFF_REDUCE_AND_THICKEN,
            maxStacks: 4,
            refreshExistingStacks: false,
          });
        }
      }
    }
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.slot !== ctx.self.slot) {
      return;
    }

    if (ctx.source.commandId === "dapan_battle_skill" && ctx.state.isSelfPotentialActive(5)) {
      const bucket = Math.floor(ctx.gameTime / 45);
      if (ctx.state.markTriggerOnce(`dapan_p5_extra_vulnerability:${bucket}`)) {
        ctx.state.applyEffects({
          effects: [{ type: "APPLY_PHYSICAL_INFLICTION", stacks: 1 }],
          stepId: `${ctx.stepId}:dapan_p5`,
        });
      }
      return;
    }

    if (ctx.source.commandId === "dapan_ultimate" && ctx.source.hitIndex === 6) {
      const hasSalty2 = ctx.state.isSelfUniqueTalentEnabled(DAPAN_TALENT_SALTY_OR_MILD_2);
      const hasSalty1 = hasSalty2 || ctx.state.isSelfUniqueTalentEnabled(DAPAN_TALENT_SALTY_OR_MILD_1);
      if (!hasSalty1) {
        return;
      }
      const durationSeconds = 20 + (ctx.state.isSelfPotentialActive(2) ? 10 : 0);
      const maxStacks = (hasSalty2 ? 2 : 1) + (ctx.state.isSelfPotentialActive(2) ? 1 : 0);
      ctx.state.applySelfBuff({
        buffId: DAPAN_BUFF_PREP_INGREDIENTS,
        label: "Prep Ingredients",
        durationSeconds,
        timeScale: "game",
        stackGroup: DAPAN_BUFF_PREP_INGREDIENTS,
        maxStacks,
        refreshExistingStacks: false,
      });
      return;
    }

    if (ctx.source.commandId !== "dapan_combo_skill" || ctx.source.hitIndex !== 0) {
      return;
    }

    const hasPrep = ctx.state.getSelfBuffStackCount(DAPAN_BUFF_PREP_INGREDIENTS) > 0;
    if (!hasPrep) {
      return;
    }
    ctx.state.shortenSelfComboCooldownByRatio(0.4);
    ctx.state.applyEffects({
      effects: [{ type: "REMOVE_BUFF", target: "self", buffId: DAPAN_BUFF_PREP_INGREDIENTS, stacks: 1 }],
      stepId: `${ctx.stepId}:dapan_prep_consume`,
    });
  },
};

export const DAPAN: CharacterBase = {
  id: "dapan",
  name: "Da Pan",
  skillIconPaths: {
    battleSkill: "/avatars/DAPAN/icon_skill_dapan_01.webp",
    comboSkill: "/avatars/DAPAN/icon_combo_skill_dapan_01.webp",
    ultimate: "/avatars/DAPAN/icon_ultimate_skill_dapan_01.webp",
  },
  rarity: 5,
  class: "Striker",
  element: "Physical",
  scaling: { STR: 0.005, WIL: 0.002 },
  mainAttr: "STR",
  secondaryAttr: "WIL",
  uniqueTalentDefs: {
    [DAPAN_TALENT_REDUCE_AND_THICKEN_1]: { name: "Reduce and Thicken I", condition: { minEliteStage: 1 } },
    [DAPAN_TALENT_REDUCE_AND_THICKEN_2]: {
      name: "Reduce and Thicken II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [DAPAN_TALENT_REDUCE_AND_THICKEN_1],
      },
    },
    [DAPAN_TALENT_SALTY_OR_MILD_1]: { name: "Salty or Mild I", condition: { minEliteStage: 2 } },
    [DAPAN_TALENT_SALTY_OR_MILD_2]: {
      name: "Salty or Mild II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [DAPAN_TALENT_SALTY_OR_MILD_1],
      },
    },
  },
  potentialEffects: {
    3: {
      apply: () => ({
        attrsDelta: { STR: 15 },
        modsDelta: { PHYSICAL_DMG_PCT: 0.08 },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    if ((ctx.buildState.potentialLevel ?? 0) < 4) {
      return commands;
    }
    return commands.map((command) => (
      command.id === "dapan_ultimate"
        ? { ...command, energyCost: command.energyCost * 0.85 }
        : command
    ));
  },
  weaponType: "GREATSWORD",
  commands: DAPAN_COMMANDS,
  combatHooks: DAPAN_HOOKS,
  levels: {
    STR: [24, 25, 27, 29, 31, 32, 34, 36, 37, 39, 41, 42, 44, 46, 48, 49, 51, 53, 54, 56, 58, 59, 61, 63, 64, 66, 68, 70, 71, 73, 75, 76, 78, 80, 81, 83, 85, 86, 88, 90, 92, 93, 95, 97, 98, 100, 102, 103, 105, 107, 109, 110, 112, 114, 115, 117, 119, 120, 122, 124, 125, 127, 129, 131, 132, 134, 136, 137, 139, 141, 142, 144, 146, 148, 149, 151, 153, 154, 156, 158, 159, 161, 163, 164, 166, 168, 170, 171, 173, 175],
    AGI: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 95, 96],
    INT: [10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 94],
    WIL: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 97, 98, 99, 100, 101, 102],
    ATK: [30, 33, 36, 39, 42, 45, 48, 51, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 101, 104, 107, 110, 113, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 147, 150, 153, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 186, 189, 193, 196, 199, 202, 205, 208, 211, 214, 217, 220, 223, 226, 229, 232, 235, 238, 242, 245, 248, 251, 254, 257, 260, 263, 266, 269, 272, 275, 278, 281, 284, 288, 291, 294, 297, 300, 303],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

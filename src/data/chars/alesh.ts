import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const ALESH_TALENT_1_1 = "alesh_talent_energy_reaction_1";
const ALESH_TALENT_1_2 = "alesh_talent_energy_reaction_2";
const ALESH_TALENT_2_1 = "alesh_talent_rarefin_scaling_1";
const ALESH_TALENT_2_2 = "alesh_talent_rarefin_scaling_2";
const ALESH_TALENT_1_ICD_STATUS = "alesh_talent_1_icd";
const ALESH_TALENT_1_ENERGY_HIT_ID = "alesh_talent_1_energy";
const ALESH_TALENT_1_SELF_ENERGY_HIT_ID = "alesh_talent_1_self_energy";

const ALESH_COMMANDS: CommandDefinition[] = [
  { id: "alesh_basic_sequence", name: "Basic Attack Sequence", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "cycling", durationFrames: flat12(192), spCost: flat12(0), hits: [
      { name: "Hit 1", multiplier: pct([18, 19, 21, 23, 25, 26, 28, 30, 32, 34, 36, 39]), offsetFrames: flat12(14) },
      { name: "Hit 2", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(36) },
      { name: "Hit 3", multiplier: pct([28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62]), offsetFrames: flat12(74) },
      { name: "Hit 4", multiplier: pct([28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62]), offsetFrames: flat12(112) },
      { name: "Hit 5", multiplier: pct([55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124]), offsetFrames: flat12(164) },
  ] },
  { id: "alesh_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "finisher", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400,440,480,520,560,600,640,680,720,770,830,900]), offsetFrames: flat12(30) }] },
  { id: "alesh_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80,88,96,104,112,120,128,136,144,154,166,180]), offsetFrames: flat12(30) }] },
  { id: "alesh_battle_skill", name: "Battle Skill", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Cryo", mode: "single", durationFrames: flat12(100), spCost: flat12(100), energyGain: flat12(0), hits: [{ multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]), stagger: flat12(10), offsetFrames: flat12(54) }] },
  { id: "alesh_combo_skill", name: "Combo Skill", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Physical", mode: "single", durationFrames: flat12(78), spCost: flat12(0), hits: [{ multiplier: pct([133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300]), stagger: flat12(10), offsetFrames: flat12(76) }] },
  { id: "alesh_ultimate", name: "Ultimate", skill: "ultimate", attackType: "ULTIMATE", damageType: "Cryo", mode: "single", durationFrames: flat12(192), spCost: flat12(0), energyCost: flat12(85), hits: [
      { name: "Seq 1", multiplier: pct([436, 479, 523, 566, 610, 653, 697, 741, 784, 839, 904, 980]), offsetFrames: flat12(180) },
  ] },
];

const ALESH_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: ALESH_TALENT_1_ENERGY_HIT_ID,
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
    id: ALESH_TALENT_1_SELF_ENERGY_HIT_ID,
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
];

const ALESH_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type !== "ARTS_REACTION_APPLIED" || !ctx.event.label.startsWith("Solidification Applied")) {
      return;
    }
    if (!ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_1) && !ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_2)) {
      return;
    }
    if (ctx.state.hasStatus({ statusId: ALESH_TALENT_1_ICD_STATUS, target: "self" })) {
      return;
    }
    const isTier2 = ctx.state.isSelfUniqueTalentEnabled(ALESH_TALENT_1_2);
    const energyHit = isTier2 ? ALESH_TALENT_1_SELF_ENERGY_HIT_ID : ALESH_TALENT_1_ENERGY_HIT_ID;
    const selfBonusHit = isTier2 ? ALESH_TALENT_1_SELF_ENERGY_HIT_ID : ALESH_TALENT_1_ENERGY_HIT_ID;
    const isSelfApplied = ctx.event.sourceSlot === ctx.self.slot;

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
        { type: "EXECUTE_HIT", hitRefId: energyHit, inheritSourceBonuses: false },
        ...(isSelfApplied ? [{ type: "EXECUTE_HIT" as const, hitRefId: selfBonusHit, inheritSourceBonuses: false }] : []),
      ],
      stepId: `${ctx.event.stepId ?? "event"}:alesh_t1`,
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
    const hasTalent2_2 = Boolean(ctx.buildState.uniqueTalentToggles?.[ALESH_TALENT_2_2]);
    const hasTalent2_1 = hasTalent2_2 || Boolean(ctx.buildState.uniqueTalentToggles?.[ALESH_TALENT_2_1]);
    return commands.map((command) => {
      if (command.id === "alesh_combo_skill" && hasTalent2_1) {
        // Rare Fin chance scales with INT; build state does not expose live attrs here,
        // so we model a conservative expected value based on talent tier only.
        const probAddPerRate = hasTalent2_2 ? 0.005 : 0.002;
        const bonusChance = Math.min(0.3, (hasTalent2_2 ? 0.15 : 0.1));
        const expectedMultiplier = 1 + bonusChance * ((2.13 / 1.33) - 1);
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * expectedMultiplier,
          })),
        };
      }
      if (command.id === "alesh_battle_skill" && potentialLevel >= 1) {
        return {
          ...command,
          hits: command.hits.map((hit) => ({
            ...hit,
            spReturned: (hit.spReturned ?? 0) + 10,
          })),
        };
      }
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

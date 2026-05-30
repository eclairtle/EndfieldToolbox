import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const LIFENG_TURBID_AVATAR_PHYSICAL_SUS_BASE_ID = "lifeng_turbid_avatar_physical_sus_base";
const LIFENG_TURBID_AVATAR_PHYSICAL_SUS_POT2_ID = "lifeng_turbid_avatar_physical_sus_pot2";
const LIFENG_BATTLE_SKILL_SEQ3_MULTIPLIERS = [1.19, 1.31, 1.43, 1.55, 1.67, 1.78, 1.9, 2.02, 2.14, 2.29, 2.47, 2.68];
const LIFENG_BATTLE_SKILL_PHYSICAL_SUS_VALUES = [0.05, 0.05, 0.05, 0.05, 0.05, 0.07, 0.07, 0.07, 0.09, 0.1, 0.1, 0.12];
const LIFENG_ILLUMINATION_1 = "lifeng_illumination_1";
const LIFENG_ILLUMINATION_2 = "lifeng_illumination_2";
const LIFENG_SUBDUER_OF_EVIL_1 = "lifeng_subduer_of_evil_1";
const LIFENG_SUBDUER_OF_EVIL_2 = "lifeng_subduer_of_evil_2";
const LIFENG_SUBDUER_OF_EVIL_HIT_1 = "lifeng_subduer_of_evil_hit_1";
const LIFENG_SUBDUER_OF_EVIL_HIT_2 = "lifeng_subduer_of_evil_hit_2";
const LIFENG_SUBDUER_OF_EVIL_POT5_HIT = "lifeng_subduer_of_evil_pot5_hit";

const LIFENG_COMMANDS: CommandDefinition[] = [
  {
    id: "lifeng_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "cycling",
    durationFrames: flat12(0),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    expandsToCommandIds: [
      "lifeng_basic_sequence_1",
      "lifeng_basic_sequence_2",
      "lifeng_basic_sequence_3",
      "lifeng_basic_sequence_4",
    ],
    hits: [],
  },
  {
    id: "lifeng_basic_sequence_1",
    name: "Basic Attack Sequence 1",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(36),
    spCost: flat12(0),
    hits: [{ multiplier: pct([24, 27, 29, 32, 34, 36, 39, 41, 44, 47, 50, 55]), offsetFrames: flat12(18) }],
  },
  {
    id: "lifeng_basic_sequence_2",
    name: "Basic Attack Sequence 2",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(42),
    spCost: flat12(0),
    hits: [{ multiplier: pct([29, 32, 35, 38, 41, 44, 47, 49, 52, 56, 60, 65]), offsetFrames: flat12(22) }],
  },
  {
    id: "lifeng_basic_sequence_3",
    name: "Basic Attack Sequence 3",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(48),
    spCost: flat12(0),
    hits: [{ multiplier: pct([35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79]), offsetFrames: flat12(28) }],
  },
  {
    id: "lifeng_basic_sequence_4",
    name: "Basic Attack Sequence 4",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 4,
    hiddenInLibrary: true,
    durationFrames: flat12(58),
    spCost: flat12(0),
    hits: [{ multiplier: pct([68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152]), stagger: flat12(19), spGenerated: flat12(21), offsetFrames: flat12(36) }],
  },
  { id: "lifeng_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "finisher", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }] },
  { id: "lifeng_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Physical", mode: "single", basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0), hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }] },
  {
    id: "lifeng_battle_skill",
    name: "Turbid Avatar",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(134),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      { multiplier: pct([38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86]), offsetFrames: flat12(14) },
      {
        multiplier: pct([38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86]),
        offsetFrames: flat12(40),
      },
      {
        multiplier: pct([119, 131, 143, 155, 167, 178, 190, 202, 214, 229, 247, 268]),
        stagger: flat12(10),
        offsetFrames: flat12(108),
        effects: [{ type: "APPLY_REACTION", reaction: "Knockdown", forceApply: false }],
      },
    ],
  },
  {
    id: "lifeng_combo_skill",
    name: "Aspect of Wrath",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(100),
    timeFreezeSeconds: flat12(30 / 60),
    spCost: flat12(0),
    comboWindowDurationSeconds: flat12(20),
    comboCooldownSeconds: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15],
    hits: [
      { name: "Seq 1", multiplier: pct([47, 51, 56, 61, 65, 70, 75, 79, 84, 90, 97, 105]), offsetFrames: flat12(38) },
      { name: "Seq 2", multiplier: pct([167, 183, 200, 217, 233, 250, 267, 283, 300, 321, 346, 375]), stagger: flat12(10), offsetFrames: flat12(96) },
    ],
  },
  {
    id: "lifeng_ultimate",
    name: "Heart of the Unmoving",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(132),
    spCost: flat12(0),
    energyCost: flat12(90),
    timeFreezeSeconds: flat12(128 / 60),
    hits: [
      {
        name: "Seq 1",
        multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]),
        stagger: flat12(5),
        offsetFrames: flat12(128),
        effects: [{ type: "APPLY_REACTION", reaction: "Knockdown", forceApply: false }],
      },
      {
        name: "Seq 2",
        multiplier: pct([178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400]),
        stagger: flat12(5),
        registerOffsetFrames: flat12(128),
        offsetFrames: flat12(248),
        effects: [{ type: "APPLY_REACTION", reaction: "Knockdown", forceApply: false }],
      },
      {
        name: "Additional",
        multiplier: pct([267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600]),
        stagger: flat12(5),
        registerOffsetFrames: flat12(128),
        offsetFrames: flat12(248),
        executeCondition: { requiresConsumedLink: true },
      },
    ],
  },
];

const LIFENG_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: LIFENG_SUBDUER_OF_EVIL_HIT_1,
    name: "Subduer of Evil I",
    skill: "basic",
    commandId: "lifeng_talent_subduer_of_evil",
    commandName: "Talent",
    attackType: "TALENT",
    damageType: "Physical",
    multiplier: flat12(0.5),
    offsetFrames: flat12(0),
  },
  {
    id: LIFENG_SUBDUER_OF_EVIL_HIT_2,
    name: "Subduer of Evil II",
    skill: "basic",
    commandId: "lifeng_talent_subduer_of_evil",
    commandName: "Talent",
    attackType: "TALENT",
    damageType: "Physical",
    multiplier: flat12(1.0),
    offsetFrames: flat12(0),
  },
  {
    id: LIFENG_SUBDUER_OF_EVIL_POT5_HIT,
    name: "Unremitting",
    skill: "basic",
    commandId: "lifeng_talent_unremitting",
    commandName: "Talent",
    attackType: "TALENT",
    damageType: "Physical",
    multiplier: flat12(2.5),
    stagger: flat12(5),
    offsetFrames: flat12(0),
  },
];

const LIFENG_HOOKS: CharacterCombatHooks = {
  onResolvedHit: (ctx) => {
    if (ctx.source.commandId === "lifeng_combo_skill" && ctx.source.hitIndex === 1) {
      if (!ctx.state.markTriggerOnce(`${ctx.stepId}:lifeng_combo_link`)) {
        return;
      }
      ctx.state.gainTeamLinkStacks({
        stacks: 1,
        durationSeconds: 20,
        label: "Link",
      });
      return;
    }

    if (
      ctx.source.isControlledOperatorHit
      && ctx.flags.isFinalStrikeOfBasicSequence
      && (
        ctx.state.hasStatus({ statusId: LIFENG_TURBID_AVATAR_PHYSICAL_SUS_BASE_ID, target: "enemy" })
        || ctx.state.hasStatus({ statusId: LIFENG_TURBID_AVATAR_PHYSICAL_SUS_POT2_ID, target: "enemy" })
        || ctx.state.hasStatus({ statusId: "breach", target: "enemy" })
      )
    ) {
      ctx.state.triggerSelfCombo({
        label: "Lifeng Combo Triggered",
        sourceEventType: "BASIC_ATTACK_FINAL_STRIKE_HIT",
      });
    }
  },
  onEvent: (ctx) => {
    if (
      ctx.event.type !== "PHYSICAL_REACTION_APPLIED"
      || ctx.event.sourceSlot !== ctx.self.slot
      || !ctx.event.label.startsWith("Knockdown")
    ) {
      return;
    }
    const hasSubduer1 = ctx.state.isSelfUniqueTalentEnabled(LIFENG_SUBDUER_OF_EVIL_1);
    const hasSubduer2 = ctx.state.isSelfUniqueTalentEnabled(LIFENG_SUBDUER_OF_EVIL_2);
    if (!hasSubduer1 && !hasSubduer2) {
      return;
    }
    const stepId = ctx.event.stepId ?? `lifeng_subduer_of_evil:${ctx.event.time.toFixed(3)}`;
    const effects = [{
      type: "EXECUTE_HIT" as const,
      hitRefId: hasSubduer2 ? LIFENG_SUBDUER_OF_EVIL_HIT_2 : LIFENG_SUBDUER_OF_EVIL_HIT_1,
    }];
    if (ctx.state.isSelfPotentialActive(5)) {
      const bucket = Math.floor(ctx.event.gameTime / 15);
      if (ctx.state.markTriggerOnce(`lifeng_subduer_p5:${bucket}`)) {
        effects.push({ type: "EXECUTE_HIT" as const, hitRefId: LIFENG_SUBDUER_OF_EVIL_POT5_HIT });
      }
    }
    ctx.state.applyEffects({ stepId, effects });
  },
};

export const LIFENG: CharacterBase = {
  id: "lifeng",
  name: "Lifeng",
  skillIconPaths: {
    battleSkill: "/avatars/LIFENG/icon_skill_lifeng_01.webp",
    comboSkill: "/avatars/LIFENG/icon_combo_skill_lifeng_01.webp",
    ultimate: "/avatars/LIFENG/icon_ultimate_skill_lifeng_01.webp",
  },
  rarity: 6,
  class: "Guard",
  element: "Physical",
  scaling: { AGI: 0.005, STR: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "STR",
  uniqueTalentDefs: {
    [LIFENG_ILLUMINATION_1]: { name: "Illumination I", condition: { minEliteStage: 1 } },
    [LIFENG_ILLUMINATION_2]: {
      name: "Illumination II",
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [LIFENG_ILLUMINATION_1] },
    },
    [LIFENG_SUBDUER_OF_EVIL_1]: { name: "Subduer of Evil I", condition: { minEliteStage: 2 } },
    [LIFENG_SUBDUER_OF_EVIL_2]: {
      name: "Subduer of Evil II",
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [LIFENG_SUBDUER_OF_EVIL_1] },
    },
  },
  uniqueTalents: {
    [LIFENG_ILLUMINATION_1]: {
      apply: () => ({
        attributeScalingDelta: {
          INT: 0.001,
          WIL: 0.001,
        },
      }),
    },
    [LIFENG_ILLUMINATION_2]: {
      apply: () => ({
        attributeScalingDelta: {
          INT: 0.0005,
          WIL: 0.0005,
        },
      }),
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: { STR: 15, AGI: 15, INT: 15, WIL: 15 },
      }),
    },
    3: {
      apply: () => ({
        attributeScalingDelta: { INT: 0.0005, WIL: 0.0005 },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    return commands.map((command) => {
      if (command.id === "lifeng_battle_skill") {
        const thirdHit = command.hits[2];
        const seq3Multiplier = thirdHit?.multiplier ?? 0;
        const idx = LIFENG_BATTLE_SKILL_SEQ3_MULTIPLIERS.findIndex((value) => Math.abs(value - seq3Multiplier) < 0.0001);
        const baseSusceptibility = idx >= 0
          ? (LIFENG_BATTLE_SKILL_PHYSICAL_SUS_VALUES[idx] ?? LIFENG_BATTLE_SKILL_PHYSICAL_SUS_VALUES[0] ?? 0.05)
          : (LIFENG_BATTLE_SKILL_PHYSICAL_SUS_VALUES[0] ?? 0.05);
        const hasPot2 = (ctx.buildState.potentialLevel ?? 0) >= 2;
        const secondHit = command.hits[1];
        if (!secondHit) {
          return command;
        }
        const statusId = hasPot2 ? LIFENG_TURBID_AVATAR_PHYSICAL_SUS_POT2_ID : LIFENG_TURBID_AVATAR_PHYSICAL_SUS_BASE_ID;
        const label = hasPot2
          ? "Turbid Avatar Physical Susceptibility (Pot 2)"
          : "Turbid Avatar Physical Susceptibility";
        const susceptibility = baseSusceptibility + (hasPot2 ? 0.05 : 0);
        return {
          ...command,
          hits: command.hits.map((hit, hitIndex) => {
            if (hitIndex !== 2) {
              return hit;
            }
            return {
              ...hit,
              effects: [
                {
                  type: "APPLY_STATUS" as const,
                  target: "enemy" as const,
                  statusId,
                  label,
                  durationSeconds: 12,
                  timeScale: "game" as const,
                  effects: {
                    PHYSICAL_SUS_PCT: susceptibility,
                  },
                  condition: {
                    type: "require_vulnerability_stacks" as const,
                    max: hasPot2 ? 2 : 0,
                  },
                },
                ...(hit.effects ?? []),
              ],
            };
          }),
        };
      }

      if ((ctx.buildState.potentialLevel ?? 0) >= 4 && command.id === "lifeng_ultimate") {
        return { ...command, energyCost: command.energyCost * 0.85 };
      }

      return command;
    });
  },
  weaponType: "POLEARM",
  commands: LIFENG_COMMANDS,
  executeHits: LIFENG_EXECUTE_HITS,
  combatHooks: LIFENG_HOOKS,
  levels: {
    STR: [14, 15, 17, 18, 19, 20, 22, 23, 24, 25, 26, 28, 29, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 42, 44, 45, 46, 47, 49, 50, 51, 52, 53, 55, 56, 57, 58, 60, 61, 62, 63, 64, 66, 67, 68, 69, 71, 72, 73, 74, 75, 77, 78, 79, 80, 82, 83, 84, 85, 86, 88, 89, 90, 91, 93, 94, 95, 96, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 112, 113, 115, 116, 117, 118, 120, 121, 122, 123],
    AGI: [20, 21, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 35, 36, 37, 39, 40, 41, 42, 44, 45, 46, 47, 49, 50, 51, 52, 54, 55, 56, 57, 59, 60, 61, 62, 64, 65, 66, 68, 69, 70, 71, 73, 74, 75, 76, 78, 79, 80, 81, 83, 84, 85, 86, 88, 89, 90, 91, 93, 94, 95, 96, 98, 99, 100, 102, 103, 104, 105, 107, 108, 109, 110, 112, 113, 114, 115, 117, 118, 119, 120, 122, 123, 124, 125, 127, 128, 129, 131, 132],
    INT: [13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 87, 89, 90, 91, 92, 93, 94, 95, 97, 98, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110, 112, 113, 114, 115],
    WIL: [12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 66, 68, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 93, 95, 96, 97, 98, 99, 101, 102, 103, 104, 105, 106, 108, 109, 110, 111, 112, 113, 115, 116, 117],
    ATK: [30, 33, 36, 39, 43, 46, 49, 52, 55, 58, 62, 65, 68, 71, 74, 77, 81, 84, 87, 90, 93, 96, 100, 103, 106, 109, 112, 115, 119, 122, 125, 128, 131, 134, 138, 141, 144, 147, 150, 153, 157, 160, 163, 166, 169, 172, 176, 179, 182, 185, 188, 191, 195, 198, 201, 204, 207, 210, 214, 217, 220, 223, 226, 229, 233, 236, 239, 242, 245, 248, 252, 255, 258, 261, 264, 267, 271, 274, 277, 280, 283, 286, 290, 293, 296, 299, 302, 305, 309, 312],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

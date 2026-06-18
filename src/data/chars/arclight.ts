import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition } from "@/lib/commands";

const ARCLIGHT_WILDLAND_TREKKER_1 = "arclight_wildland_trekker_1";
const ARCLIGHT_WILDLAND_TREKKER_2 = "arclight_wildland_trekker_2";
const ARCLIGHT_LIGHTNING_REFLEXES_1 = "arclight_lightning_reflexes_1";
const ARCLIGHT_LIGHTNING_REFLEXES_2 = "arclight_lightning_reflexes_2";
const ARCLIGHT_WILDLAND_TREKKER_COUNTER = "arclight_wildland_trekker_counter";
const ARCLIGHT_WILDLAND_TREKKER_TEAM_BUFF = "arclight_wildland_trekker_team_buff";
const ARCLIGHT_COMBO_COOLDOWN_PAUSE_BUFF = "arclight_combo_cooldown_pause";
const ARCLIGHT_COMBO_TIME_FREEZE_SECONDS = 0.77;

function getArclightWildlandTrekkerBonusPerInt(ctx: {
  isSelfUniqueTalentEnabled: (key: string) => boolean;
  isSelfPotentialActive: (level: number) => boolean;
}) {
  const baseBonus = ctx.isSelfUniqueTalentEnabled(ARCLIGHT_WILDLAND_TREKKER_2)
    ? 0.0008
    : ctx.isSelfUniqueTalentEnabled(ARCLIGHT_WILDLAND_TREKKER_1)
      ? 0.0005
      : 0;
  return baseBonus * (ctx.isSelfPotentialActive(3) ? 1.3 : 1);
}

function getArclightWildlandTrekkerTriggerCount(ctx: {
  isSelfPotentialActive: (level: number) => boolean;
}) {
  return ctx.isSelfPotentialActive(5) ? 2 : 3;
}

const ARCLIGHT_COMBAT_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (
      ctx.event.type === "COMBO_SKILL_CAST"
      && ctx.event.slot === ctx.self.slot
      && ctx.state.markTriggerOnce(`${ctx.event.stepId ?? `${ctx.event.time}`}:arclight_combo_pause`)
    ) {
      const buffArgs = {
        buffId: ARCLIGHT_COMBO_COOLDOWN_PAUSE_BUFF,
        label: "Peal of Thunder Cooldown Pause",
        durationSeconds: ARCLIGHT_COMBO_TIME_FREEZE_SECONDS,
        timeScale: "real" as const,
        hidden: true,
      };
      ctx.state.applySelfBuff(buffArgs);
      ctx.state.applyOtherTeammatesBuff(buffArgs);
      ctx.state.pauseTeamComboCooldowns({
        durationSeconds: ARCLIGHT_COMBO_TIME_FREEZE_SECONDS,
      });
    }

    if (
      ctx.event.type === "ARTS_REACTION_APPLIED"
      && ctx.event.label.startsWith("Electrification Applied")
    ) {
      ctx.state.triggerSelfCombo({
        label: "Arclight Combo Triggered",
        sourceEventType: "ARTS_REACTION_APPLIED",
      });
      return;
    }

    if (
      ctx.event.type === "ARTS_REACTION_CONSUMED"
      && ctx.event.consumedElement === "Electric"
    ) {
      ctx.state.triggerSelfCombo({
        label: "Arclight Combo Triggered",
        sourceEventType: "ARTS_REACTION_CONSUMED",
      });
    }
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.characterId !== "arclight") {
      return;
    }

    if (
      ctx.source.commandId === "arclight_battle_skill_reaction"
      && ctx.source.hitIndex === 2
      && ctx.state.markTriggerOnce(`${ctx.stepId}:arclight_battle_skill_reaction_extra`)
    ) {
      if (ctx.state.isSelfPotentialActive(1)) {
        ctx.state.grantGeneratedSp(10, "Tempestuous Arc Potential");
      }

      const bonusPerInt = getArclightWildlandTrekkerBonusPerInt(ctx.state);
      if (bonusPerInt > 0) {
        const currentCount = ctx.state.getSelfBuffStackCount(ARCLIGHT_WILDLAND_TREKKER_COUNTER);
        const nextCount = currentCount + 1;
        ctx.state.applySelfBuff({
          buffId: ARCLIGHT_WILDLAND_TREKKER_COUNTER,
          label: "Wildland Trekker Counter",
          infiniteDuration: true,
          durationSeconds: 0,
          timeScale: "game",
          hidden: true,
          stackGroup: ARCLIGHT_WILDLAND_TREKKER_COUNTER,
          maxStacks: 99,
        });
        if (nextCount % getArclightWildlandTrekkerTriggerCount(ctx.state) === 0) {
          const electricDmgPct = Math.max(0, ctx.state.getSelfAttr("INT")) * bonusPerInt;
          const buffArgs = {
            buffId: ARCLIGHT_WILDLAND_TREKKER_TEAM_BUFF,
            label: "Wildland Trekker",
            durationSeconds: 15,
            timeScale: "game" as const,
            effects: {
              ELECTRIC_DMG_PCT: electricDmgPct,
            },
          };
          ctx.state.applySelfBuff(buffArgs);
          ctx.state.applyOtherTeammatesBuff(buffArgs);
        }
      }
      return;
    }

    if (
      ctx.source.commandId === "arclight_ultimate"
      && ctx.source.hitIndex === 1
    ) {
      const enemyInfliction = ctx.state.getEnemyArtsInfliction();
      if (enemyInfliction?.element !== "Electric" || enemyInfliction.stacks <= 0) {
        return;
      }

      ctx.state.emitEvent({
        type: "ARTS_INFLICTION_CONSUMED",
        label: "Electric Infliction Consumed",
        target: "enemy",
        stackDelta: enemyInfliction.stacks,
      });
      ctx.state.setEnemyArtsInfliction(null);
      ctx.state.applyEffects({
        stepId: `${ctx.stepId}:arclight_ultimate_electrification`,
        effects: [
          {
            type: "APPLY_REACTION",
            reaction: "Electrification",
            level: Math.max(1, Math.min(4, enemyInfliction.stacks)),
            reactionDamage: true,
            forceApply: true,
          },
        ],
      });
    }
  },
};

const ARCLIGHT_COMMANDS: CommandDefinition[] = [
  {
    id: "arclight_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "sequence",
    durationFrames: flat12(199.62),
    spCost: flat12(0),
    expandsToCommandIds: [
      "arclight_basic_sequence_1",
      "arclight_basic_sequence_2",
      "arclight_basic_sequence_3",
      "arclight_basic_sequence_4",
      "arclight_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "arclight_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(19.8),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23]), offsetFrames: flat12(10.2) },
    ],
  },
  {
    id: "arclight_basic_sequence_2",
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
    hits: [
      { name: "Hit 1", multiplier: pct([13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 26, 28]), offsetFrames: flat12(10.2) },
    ],
  },
  {
    id: "arclight_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(42),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 26, 29]), offsetFrames: flat12(13.8) },
      { name: "Hit 2", multiplier: pct([13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 26, 29]), offsetFrames: flat12(25.8) },
    ],
  },
  {
    id: "arclight_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(55.8),
    spCost: flat12(0),
    hits: [
      { name: "Hit 1", multiplier: pct([36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81]), offsetFrames: flat12(10.2) },
    ],
  },
  {
    id: "arclight_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([48, 52, 57, 62, 67, 71, 76, 81, 86, 91, 99, 107]),
        stagger: flat12(16),
        spGenerated: flat12(17),
        offsetFrames: flat12(24),
      },
    ],
  },
  {
    id: "arclight_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "finisher",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "arclight_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    mode: "single",
    basicAttackVariant: "dive_attack",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "arclight_battle_skill",
    name: "Tempestuous Arc",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(72),
    spCost: flat12(100),
    transforms: [
      {
        toCommandId: "arclight_battle_skill_reaction",
        requiresEnemyStatusId: "electrification",
      },
    ],
    hits: [
      { name: "Seq 1", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), offsetFrames: flat12(37.8) },
      { name: "Seq 2", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), stagger: flat12(5), offsetFrames: flat12(48) },
    ],
  },
  {
    id: "arclight_battle_skill_reaction",
    name: "Tempestuous Arc",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    hiddenInLibrary: true,
    enhanced: true,
    variant: "enhanced_battle_skill",
    durationFrames: flat12(96),
    spCost: flat12(100),
    hits: [
      { name: "Seq 1", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), offsetFrames: flat12(37.8) },
      { name: "Seq 2", multiplier: pct([45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101]), stagger: flat12(5), offsetFrames: flat12(48) },
      {
        name: "Additional",
        multiplier: pct([180, 198, 216, 234, 252, 270, 288, 306, 324, 347, 374, 405]),
        damageType: "Electric",
        stagger: flat12(5),
        spGenerated: [30, 30, 30, 30, 30, 35, 35, 35, 35, 35, 35, 40],
        offsetFrames: flat12(72),
        effects: [{ type: "REMOVE_STATUS", target: "enemy", statusId: "electrification" }],
      },
    ],
  },
  {
    id: "arclight_combo_skill",
    name: "Peal of Thunder",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(54),
    timeFreezeSeconds: flat12(ARCLIGHT_COMBO_TIME_FREEZE_SECONDS),
    comboCooldownSeconds: flat12(3),
    spCost: flat12(0),
    energyGain: flat12(5),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([52, 57, 62, 67, 73, 78, 83, 88, 93, 100, 107, 117]), offsetFrames: flat12(34.2) },
      { name: "Hit 2", multiplier: pct([52, 57, 62, 67, 73, 78, 83, 88, 93, 100, 107, 117]), offsetFrames: flat12(42) },
      {
        name: "Hit 3",
        multiplier: pct([52, 57, 62, 67, 73, 78, 83, 88, 93, 100, 107, 117]),
        stagger: flat12(5),
        spGenerated: [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
        offsetFrames: flat12(49.8),
      },
    ],
  },
  {
    id: "arclight_ultimate",
    name: "Exploding Blitz",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Electric",
    mode: "single",
    durationFrames: flat12(154.2),
    spCost: flat12(0),
    energyCost: flat12(90),
    cutscene: true,
    timeFreezeSeconds: flat12(1.9),
    hits: [
      {
        name: "Seq 1",
        multiplier: pct([156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350]),
        stagger: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
        offsetFrames: flat12(121.8),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Electric", stacks: 1 }],
      },
      {
        name: "Seq 2",
        multiplier: pct([244, 269, 293, 318, 342, 367, 391, 415, 440, 470, 507, 550]),
        stagger: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
        offsetFrames: flat12(234),
      },
    ],
  },
];

export const ARCLIGHT: CharacterBase = {
  id: "arclight",
  name: "Arclight",
  skillIconPaths: {
    battleSkill: "/avatars/ARCLIGHT/icon_skill_ikut_01.webp",
    comboSkill: "/avatars/ARCLIGHT/icon_combo_skill_ikut_01.webp",
    ultimate: "/avatars/ARCLIGHT/icon_ultimate_skill_ikut_01.webp",
  },
  rarity: 5,
  class: "Vanguard",
  element: "Electric",
  scaling: { AGI: 0.005, INT: 0.002 },
  mainAttr: "AGI",
  secondaryAttr: "INT",
  weaponType: "SWORD",
  commands: ARCLIGHT_COMMANDS,
  uniqueTalentDefs: {
    [ARCLIGHT_WILDLAND_TREKKER_1]: {
      name: "Wildland Trekker I",
      condition: {
        minEliteStage: 1,
      },
    },
    [ARCLIGHT_WILDLAND_TREKKER_2]: {
      name: "Wildland Trekker II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [ARCLIGHT_WILDLAND_TREKKER_1],
      },
    },
    [ARCLIGHT_LIGHTNING_REFLEXES_1]: {
      name: "Lightning Reflexes I",
      condition: {
        minEliteStage: 2,
      },
    },
    [ARCLIGHT_LIGHTNING_REFLEXES_2]: {
      name: "Lightning Reflexes II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [ARCLIGHT_LIGHTNING_REFLEXES_1],
      },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: {
          AGI: 15,
          INT: 15,
        },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => commands.map((command) => {
    if (command.id === "arclight_ultimate" && (ctx.buildState.potentialLevel ?? 0) >= 4) {
      return {
        ...command,
        energyCost: Math.max(0, command.energyCost * 0.85),
      };
    }
    return command;
  }),
  combatHooks: ARCLIGHT_COMBAT_HOOKS,
  levels: {
    STR: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107],
    AGI: [14, 16, 17, 19, 20, 22, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48, 49, 51, 52, 54, 55, 57, 58, 60, 61, 63, 64, 66, 67, 69, 70, 71, 73, 74, 76, 77, 79, 80, 82, 83, 85, 86, 88, 89, 91, 92, 94, 95, 96, 98, 99, 101, 102, 104, 105, 107, 108, 110, 111, 113, 114, 116, 117, 118, 120, 121, 123, 124, 126, 127, 129, 130, 132, 133, 135, 136, 138, 139, 141, 142, 143, 145],
    INT: [12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 59, 61, 62, 63, 64, 66, 67, 68, 69, 71, 72, 73, 74, 76, 77, 78, 79, 81, 82, 83, 84, 86, 87, 88, 89, 91, 92, 93, 94, 96, 97, 98, 99, 101, 102, 103, 104, 106, 107, 108, 109, 111, 112, 113, 114, 116, 117, 118, 119, 120, 122, 123],
    WIL: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 98, 99, 100],
    ATK: [30, 33, 36, 39, 42, 45, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 80, 83, 86, 89, 92, 95, 98, 101, 104, 107, 111, 114, 117, 120, 123, 126, 129, 132, 135, 138, 142, 145, 148, 151, 154, 157, 160, 163, 166, 169, 173, 176, 179, 182, 185, 188, 191, 194, 197, 200, 204, 207, 210, 213, 216, 219, 222, 225, 228, 231, 235, 238, 241, 244, 247, 250, 253, 256, 259, 262, 266, 269, 272, 275, 278, 281, 284, 287, 290, 293, 297, 300, 303, 306],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

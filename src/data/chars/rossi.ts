import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const ROSSI_RAZOR_CLAWMARK_1_KEY = "rossi_razor_clawmark_1";
const ROSSI_RAZOR_CLAWMARK_2_KEY = "rossi_razor_clawmark_2";
const ROSSI_SEETHING_BLOOD_1_KEY = "rossi_seething_blood_1";
const ROSSI_SEETHING_BLOOD_2_KEY = "rossi_seething_blood_2";
const ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_1_ID = "rossi_battle_skill_seq2_heat_1";
const ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_2_ID = "rossi_battle_skill_seq2_heat_2";
const ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_3_ID = "rossi_battle_skill_seq2_heat_3";
const ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_4_ID = "rossi_battle_skill_seq2_heat_4";
const ROSSI_SEETHING_BLOOD_1_HIT_ID = "rossi_seething_blood_1_hit";
const ROSSI_SEETHING_BLOOD_1_BURNING_HIT_ID = "rossi_seething_blood_1_burning_hit";
const ROSSI_SEETHING_BLOOD_2_HIT_ID = "rossi_seething_blood_2_hit";
const ROSSI_SEETHING_BLOOD_2_BURNING_HIT_ID = "rossi_seething_blood_2_burning_hit";
const ROSSI_SEETHING_BLOOD_1_P3_HIT_ID = "rossi_seething_blood_1_p3_hit";
const ROSSI_SEETHING_BLOOD_1_P3_BURNING_HIT_ID = "rossi_seething_blood_1_p3_burning_hit";
const ROSSI_SEETHING_BLOOD_2_P3_HIT_ID = "rossi_seething_blood_2_p3_hit";
const ROSSI_SEETHING_BLOOD_2_P3_BURNING_HIT_ID = "rossi_seething_blood_2_p3_burning_hit";
const ROSSI_RAZOR_CLAWMARK_DOT_1_HIT_ID = "rossi_razor_clawmark_dot_1_hit";
const ROSSI_RAZOR_CLAWMARK_DOT_2_HIT_ID = "rossi_razor_clawmark_dot_2_hit";
const ROSSI_COMBO_SEGMENT_1_ID = "rossi_combo_skill";
const ROSSI_COMBO_SEGMENT_2_ID = "rossi_combo_skill_segment_2";

const ROSSI_BATTLE_SKILL_SEQ1_BASE = [85, 94, 102, 111, 119, 128, 137, 145, 154, 164, 177, 192];
const ROSSI_BATTLE_SKILL_SEQ2_BASE = [128, 141, 153, 166, 179, 192, 204, 217, 230, 246, 265, 288];

const ROSSI_COMMANDS: CommandDefinition[] = [
  {
    id: "rossi_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "sequence",
    durationFrames: flat12(212),
    spCost: flat12(0),
    expandsToCommandIds: [
      "rossi_basic_sequence_1",
      "rossi_basic_sequence_2",
      "rossi_basic_sequence_3",
      "rossi_basic_sequence_4",
      "rossi_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "rossi_basic_sequence_1",
    name: "Basic Attack Sequence I",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(30),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [{ name: "Hit 1", multiplier: pct([22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50]), offsetFrames: flat12(19.8) }],
  },
  {
    id: "rossi_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(34.02),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([27, 29, 32, 34, 37, 40, 42, 45, 48, 51, 55, 60]), offsetFrames: flat12(1.8) },
      { name: "Hit 2", multiplier: pct([27, 29, 32, 34, 37, 40, 42, 45, 48, 51, 55, 60]), offsetFrames: flat12(13.8) },
    ],
  },
  {
    id: "rossi_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(36),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { name: "Hit 1", multiplier: pct([29, 32, 35, 38, 41, 44, 46, 49, 52, 56, 60, 65]), offsetFrames: flat12(1.8) },
      { name: "Hit 2", multiplier: pct([29, 32, 35, 38, 41, 44, 46, 49, 52, 56, 60, 65]), offsetFrames: flat12(7.8) },
    ],
  },
  {
    id: "rossi_basic_sequence_4",
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
    hits: [
      { name: "Hit 1", multiplier: pct([36, 39, 43, 46, 50, 53, 57, 60, 64, 68, 74, 80]), offsetFrames: flat12(12) },
      { name: "Hit 2", multiplier: pct([36, 39, 43, 46, 50, 53, 57, 60, 64, 68, 74, 80]), offsetFrames: flat12(13.8) },
      { name: "Hit 3", multiplier: pct([36, 39, 43, 46, 50, 53, 57, 60, 64, 68, 74, 80]), offsetFrames: flat12(16.02) },
      { name: "Hit 4", multiplier: pct([36, 39, 43, 46, 50, 53, 57, 60, 64, 68, 74, 80]), offsetFrames: flat12(25.8) },
      { name: "Hit 5", multiplier: pct([36, 39, 43, 46, 50, 53, 57, 60, 64, 68, 74, 80]), offsetFrames: flat12(28.02) },
    ],
  },
  {
    id: "rossi_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(67.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        name: "Hit 1",
        multiplier: pct([50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113]),
        stagger: flat12(18),
        spGenerated: flat12(21),
        requiresControlledOperator: true,
        offsetFrames: flat12(37.8),
      },
    ],
  },
  {
    id: "rossi_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "finisher",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "rossi_basic_dive",
    name: "Dive Attack",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "dive_attack",
    mode: "single",
    durationFrames: flat12(60),
    spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "rossi_battle_skill",
    name: "Battle Skill",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(72),
    spCost: flat12(100),
    energyGain: flat12(0),
    hits: [
      {
        name: "Seq 1 Hit 1",
        multiplier: pct(ROSSI_BATTLE_SKILL_SEQ1_BASE.map((v) => v / 3)),
        offsetFrames: flat12(31.8),
      },
      {
        name: "Seq 1 Hit 2",
        multiplier: pct(ROSSI_BATTLE_SKILL_SEQ1_BASE.map((v) => v / 3)),
        offsetFrames: flat12(43.8),
      },
      {
        name: "Seq 1 Hit 3",
        multiplier: pct(ROSSI_BATTLE_SKILL_SEQ1_BASE.map((v) => v / 3)),
        stagger: flat12(5),
        offsetFrames: flat12(70.2),
        effects: [
          { type: "EXECUTE_HIT", hitRefId: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_1_ID, executeDelayFrames: 30 },
          { type: "EXECUTE_HIT", hitRefId: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_2_ID, executeDelayFrames: 30 },
          { type: "EXECUTE_HIT", hitRefId: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_3_ID, executeDelayFrames: 30 },
          { type: "EXECUTE_HIT", hitRefId: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_4_ID, executeDelayFrames: 30 },
          { type: "APPLY_REACTION", reaction: "Lift", level: 1, forceApply: true },
        ],
      },
    ],
  },
  {
    id: ROSSI_COMBO_SEGMENT_1_ID,
    name: "Combo Skill I",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(56),
    timeFreezeSeconds: flat12(38 / 60),
    comboCooldownSeconds: flat12(15),
    comboCooldownTimeScale: "real",
    comboCooldownStartsAt: "end",
    comboCooldownOwnerCommandId: ROSSI_COMBO_SEGMENT_1_ID,
    spCost: flat12(0),
    hits: [
      { name: "Combo 1", multiplier: pct([40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90]), stagger: flat12(10), offsetFrames: flat12(30) },
      { name: "Combo 2", multiplier: pct([67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150]), stagger: flat12(10), offsetFrames: flat12(40) },
      { name: "Combo 3", multiplier: pct([133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300]), stagger: flat12(10), offsetFrames: flat12(52) },
    ],
  },
  {
    id: ROSSI_COMBO_SEGMENT_2_ID,
    name: "Combo Skill II",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    hiddenInLibrary: true,
    durationFrames: flat12(104),
    comboCooldownSeconds: flat12(0),
    comboCooldownOwnerCommandId: ROSSI_COMBO_SEGMENT_1_ID,
    comboWindowDelaySeconds: flat12(0),
    comboWindowDurationSeconds: flat12(10),
    perfectTimingDelaySeconds: flat12(0.8),
    perfectTimingDurationSeconds: flat12(1.0),
    spCost: flat12(0),
    initialEffects: [
      {
        type: "APPLY_BUFF",
        target: "self",
        buffId: "rossi_combo_segment_2_crit_bonus",
        label: "Combo Skill Crit Bonus",
        durationSeconds: 15,
        timeScale: "game",
        effects: {
          CRIT_RATE_PCT: 0.25,
          CRIT_DMG_PCT: 0.5,
        },
      },
    ],
    hits: [
      {
        name: "Combo 2",
        multiplier: pct([133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300]),
        accumulator: {
          type: "consume_enemy_status",
          statusId: "arts_infliction",
          maxConsumed: flat12(4),
          useLevelAsStacks: false,
          multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]),
        },
        stagger: flat12(5),
        offsetFrames: flat12(54),
        effects: [
          { type: "APPLY_REACTION", reaction: "Lift", level: 1, forceApply: true },
          {
            type: "APPLY_PHYSICAL_INFLICTION",
            stacks: 1,
            condition: { type: "require_perfect_timing" },
          },
        ],
      },
    ],
  },
  {
    id: "rossi_ultimate",
    name: "Ultimate",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Heat",
    mode: "single",
    durationFrames: flat12(310.2),
    timeFreezeSeconds: flat12(72 / 60),
    cutscene: true,
    spCost: flat12(0),
    energyCost: flat12(110),
    commandModifiers: {
      CRIT_DMG_PCT: 0.6,
    },
    hits: [
      {
        name: "Multi Hit x25",
        multiplier: pct([275, 300, 325, 350, 375, 400, 425, 450, 475, 525, 550, 600].map((value) => value / 25)),
        offsetFrames: flat12(126),
        times: 25,
        repeatIntervalFrames: flat12(4),
      },
      {
        name: "Seq 1",
        multiplier: pct([111, 122, 133, 144, 156, 167, 178, 189, 200, 214, 231, 250]),
        offsetFrames: flat12(244.2),
      },
      {
        name: "Seq 2",
        multiplier: pct([333, 367, 400, 433, 467, 500, 534, 567, 600, 642, 692, 750]),
        stagger: flat12(25),
        offsetFrames: flat12(262.2),
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: "Heat", stacks: 1 }],
      },
    ],
  },
];

const ROSSI_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: ROSSI_SEETHING_BLOOD_1_HIT_ID,
    name: "Seething Blood I",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_SEETHING_BLOOD_1_P3_HIT_ID,
    name: "Seething Blood I (Potential 3)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_SEETHING_BLOOD_1_BURNING_HIT_ID,
    name: "Seething Blood I (Combustion)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18]),
    offsetFrames: flat12(0),
    executeCondition: { requiresEnemyStatusId: "combustion" },
  },
  {
    id: ROSSI_SEETHING_BLOOD_1_P3_BURNING_HIT_ID,
    name: "Seething Blood I (Combustion, Potential 3)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
    offsetFrames: flat12(0),
    executeCondition: { requiresEnemyStatusId: "combustion" },
  },
  {
    id: ROSSI_SEETHING_BLOOD_2_HIT_ID,
    name: "Seething Blood II",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_SEETHING_BLOOD_2_P3_HIT_ID,
    name: "Seething Blood II (Potential 3)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_SEETHING_BLOOD_2_BURNING_HIT_ID,
    name: "Seething Blood II (Combustion)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36]),
    offsetFrames: flat12(0),
    executeCondition: { requiresEnemyStatusId: "combustion" },
  },
  {
    id: ROSSI_SEETHING_BLOOD_2_P3_BURNING_HIT_ID,
    name: "Seething Blood II (Combustion, Potential 3)",
    skill: "basic",
    attackType: "GENERIC",
    damageType: "Heat",
    commandId: "__rossi_seething_blood",
    commandName: "Seething Blood",
    multiplier: pct([48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48]),
    offsetFrames: flat12(0),
    executeCondition: { requiresEnemyStatusId: "combustion" },
  },
  {
    id: ROSSI_RAZOR_CLAWMARK_DOT_1_HIT_ID,
    name: "Razor Clawmark DoT I",
    skill: "battleSkill",
    attackType: "GENERIC",
    damageType: "Physical",
    commandId: "__rossi_razor_clawmark",
    commandName: "Razor Clawmark",
    multiplier: pct([25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_RAZOR_CLAWMARK_DOT_2_HIT_ID,
    name: "Razor Clawmark DoT II",
    skill: "battleSkill",
    attackType: "GENERIC",
    damageType: "Physical",
    commandId: "__rossi_razor_clawmark",
    commandName: "Razor Clawmark",
    multiplier: pct([30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
    offsetFrames: flat12(0),
  },
  {
    id: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_1_ID,
    name: "Battle Skill Seq 2 Hit 1",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    commandId: "rossi_battle_skill",
    commandName: "Battle Skill",
    multiplier: pct(ROSSI_BATTLE_SKILL_SEQ2_BASE.map((v) => v / 4)),
    stagger: flat12(2.5),
    offsetFrames: flat12(0),
    executeCondition: { requiresEnemyStatusId: "vulnerability" },
    effects: [
      {
        type: "APPLY_STATUS",
        target: "enemy",
        statusId: "rossi_razor_clawmark",
        label: "Razor Clawmark",
        durationSeconds: 15,
        timeScale: "game",
        effects: {
          PHYSICAL_DMG_TAKEN_PCT: 0.06,
          HEAT_DMG_TAKEN_PCT: 0.06,
        },
        periods: 15,
        periodicEffects: [
          { type: "EXECUTE_HIT", hitRefId: ROSSI_RAZOR_CLAWMARK_DOT_1_HIT_ID, inheritSourceBonuses: false },
        ],
        condition: {
          type: "and",
          conditions: [
            { type: "require_status", statusId: "vulnerability", target: "enemy" },
            { type: "require_talent", talentKey: ROSSI_RAZOR_CLAWMARK_1_KEY },
            { type: "require_talent", talentKey: ROSSI_RAZOR_CLAWMARK_2_KEY, enabled: false },
          ],
        },
      },
      {
        type: "APPLY_STATUS",
        target: "enemy",
        statusId: "rossi_razor_clawmark",
        label: "Razor Clawmark",
        durationSeconds: 25,
        timeScale: "game",
        effects: {
          PHYSICAL_DMG_TAKEN_PCT: 0.12,
          HEAT_DMG_TAKEN_PCT: 0.12,
        },
        periods: 25,
        periodicEffects: [
          { type: "EXECUTE_HIT", hitRefId: ROSSI_RAZOR_CLAWMARK_DOT_2_HIT_ID, inheritSourceBonuses: false },
        ],
        condition: {
          type: "and",
          conditions: [
            { type: "require_status", statusId: "vulnerability", target: "enemy" },
            { type: "require_talent", talentKey: ROSSI_RAZOR_CLAWMARK_2_KEY },
          ],
        },
      },
    ],
  },
  {
    id: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_2_ID,
    name: "Battle Skill Seq 2 Hit 2",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    commandId: "rossi_battle_skill",
    commandName: "Battle Skill",
    multiplier: pct(ROSSI_BATTLE_SKILL_SEQ2_BASE.map((v) => v / 4)),
    stagger: flat12(2.5),
    offsetFrames: flat12(2),
    executeCondition: { requiresEnemyStatusId: "vulnerability" },
  },
  {
    id: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_3_ID,
    name: "Battle Skill Seq 2 Hit 3",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    commandId: "rossi_battle_skill",
    commandName: "Battle Skill",
    multiplier: pct(ROSSI_BATTLE_SKILL_SEQ2_BASE.map((v) => v / 4)),
    stagger: flat12(2.5),
    offsetFrames: flat12(4),
    executeCondition: { requiresEnemyStatusId: "vulnerability" },
  },
  {
    id: ROSSI_BATTLE_SKILL_SEQ2_HEAT_HIT_4_ID,
    name: "Battle Skill Seq 2 Hit 4",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Heat",
    commandId: "rossi_battle_skill",
    commandName: "Battle Skill",
    multiplier: pct(ROSSI_BATTLE_SKILL_SEQ2_BASE.map((v) => v / 4)),
    stagger: flat12(2.5),
    offsetFrames: flat12(12),
    executeCondition: { requiresEnemyStatusId: "vulnerability" },
  },
];

const ROSSI_COMBAT_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type === "CRIT_THRESHOLD_REACHED") {
      const hasSeethingBlood2 = ctx.state.isSelfUniqueTalentEnabled(ROSSI_SEETHING_BLOOD_2_KEY);
      const hasSeethingBlood1 = hasSeethingBlood2 || ctx.state.isSelfUniqueTalentEnabled(ROSSI_SEETHING_BLOOD_1_KEY);
      const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
      if (
        !hasSeethingBlood1
        || sourceSlot !== ctx.self.slot
      ) {
        return;
      }
      if (!ctx.state.hasStatus({ statusId: "rossi_razor_clawmark", target: "enemy" })) {
        return;
      }
      const triggerIntervalSeconds = 1 / 120;
      const triggerBucket = Math.floor(ctx.event.time / triggerIntervalSeconds);
      if (!ctx.state.markTriggerOnce(`rossi_talent_2_icd:${triggerIntervalSeconds}:${triggerBucket}`)) {
        return;
      }
      const hasCombustion = ctx.state.hasStatus({ statusId: "combustion", target: "enemy" });
      const hasPotential3 = ctx.state.isSelfPotentialActive(3);
      const hitRefId = hasSeethingBlood2
        ? hasPotential3
          ? (hasCombustion ? ROSSI_SEETHING_BLOOD_2_P3_BURNING_HIT_ID : ROSSI_SEETHING_BLOOD_2_P3_HIT_ID)
          : (hasCombustion ? ROSSI_SEETHING_BLOOD_2_BURNING_HIT_ID : ROSSI_SEETHING_BLOOD_2_HIT_ID)
        : hasPotential3
          ? (hasCombustion ? ROSSI_SEETHING_BLOOD_1_P3_BURNING_HIT_ID : ROSSI_SEETHING_BLOOD_1_P3_HIT_ID)
          : (hasCombustion ? ROSSI_SEETHING_BLOOD_1_BURNING_HIT_ID : ROSSI_SEETHING_BLOOD_1_HIT_ID);
      const eventStepId = ctx.event.stepId ?? `rossi_talent_2_event:${ctx.event.time.toFixed(3)}`;
      ctx.state.applyEffects({
        stepId: eventStepId,
        effects: [
          { type: "EXECUTE_HIT", hitRefId, inheritSourceBonuses: false },
        ],
      });
      return;
    }

    if (ctx.event.type !== "ARTS_INFLICTION_APPLIED" && ctx.event.type !== "ENEMY_DEBUFF_APPLIED") {
      return;
    }
    if (ctx.event.type === "ENEMY_DEBUFF_APPLIED" && ctx.event.label !== "Vulnerability Applied") {
      return;
    }

    const hasVulnerability = ctx.state.hasStatus({ statusId: "vulnerability", target: "enemy" });
    const hasArtsInfliction = ctx.state.hasStatus({ statusId: "arts_infliction", target: "enemy" });
    if (!hasVulnerability || !hasArtsInfliction) {
      return;
    }
    if (!ctx.state.markTriggerOnce(`${ctx.event.stepId ?? `${ctx.event.time}`}:rossi_combo_gate`)) {
      return;
    }

    ctx.state.emitEvent({
      type: "ROSSI_VULNERABILITY_AND_ARTS_INFLICTION",
      label: "Vulnerability and Arts Infliction",
      target: "enemy",
    });
      ctx.state.triggerSelfCombo({
        sourceEventType: "ROSSI_VULNERABILITY_AND_ARTS_INFLICTION",
        label: "Rossi Combo Triggered",
        comboCommandId: ROSSI_COMBO_SEGMENT_1_ID,
      });
    },
  onResolvedHit: (ctx) => {
    if (
      ctx.source.commandId === ROSSI_COMBO_SEGMENT_1_ID
      && ctx.source.hitIndex === 2
      && ctx.state.markTriggerOnce(`${ctx.stepId}:rossi_combo_segment_2`)
    ) {
      ctx.state.triggerSelfCombo({
        sourceEventType: "COMBO_SKILL_HIT",
        label: "Rossi Combo Segment II Triggered",
        comboCommandId: ROSSI_COMBO_SEGMENT_2_ID,
      });
    }
    if (
      !ctx.state.isSelfPotentialActive(1)
      || ctx.source.commandId !== "rossi_battle_skill"
      || !ctx.state.markTriggerOnce(`${ctx.stepId}:rossi_potential_1_sp_return`)
    ) {
      return;
    }
    ctx.state.grantReturnedSp(10, "Rossi Potential 1");
  },
};

export const ROSSI: CharacterBase = {
  id: "rossi",
  name: "Rossi",
  skillIconPaths: {
    battleSkill: "/avatars/ROSSI/icon_skill_wulfa_01.webp",
    comboSkill: "/avatars/ROSSI/icon_combo_skill_wulfa_01.webp",
    ultimate: "/avatars/ROSSI/icon_ultimate_skill_wulfa_01.webp",
  },
  rarity: 6,
  class: "Vanguard",
  element: "Physical",
  scaling: {
    AGI: 0.005,
    INT: 0.002,
  },
  mainAttr: "AGI",
  secondaryAttr: "INT",
  uniqueTalentDefs: {
    [ROSSI_RAZOR_CLAWMARK_1_KEY]: {
      name: "Razor Clawmark I",
      defaultEnabled: false,
      condition: {
        minEliteStage: 1,
      },
    },
    [ROSSI_RAZOR_CLAWMARK_2_KEY]: {
      name: "Razor Clawmark II",
      defaultEnabled: false,
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [ROSSI_RAZOR_CLAWMARK_1_KEY],
      },
    },
    [ROSSI_SEETHING_BLOOD_1_KEY]: {
      name: "Seething Blood I",
      defaultEnabled: false,
      condition: {
        minEliteStage: 2,
      },
    },
    [ROSSI_SEETHING_BLOOD_2_KEY]: {
      name: "Seething Blood II",
      defaultEnabled: false,
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [ROSSI_SEETHING_BLOOD_1_KEY],
      },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: {
          AGI: 20,
        },
        modsDelta: {
          CRIT_RATE_PCT: 0.07,
        },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    return commands.map((command) => {
      let next = command;
      if (
        potentialLevel >= 1
        && (command.id === "rossi_battle_skill" || command.id === ROSSI_COMBO_SEGMENT_1_ID || command.id === ROSSI_COMBO_SEGMENT_2_ID)
      ) {
        next = {
          ...next,
          hits: next.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * 1.15,
          })),
        };
      }
      if (potentialLevel >= 4 && command.id === "rossi_ultimate") {
        next = {
          ...next,
          energyCost: next.energyCost * 0.85,
        };
      }
      if (potentialLevel >= 5 && command.id === "rossi_ultimate") {
        next = {
          ...next,
          commandModifiers: {
            ...(next.commandModifiers ?? {}),
            CRIT_DMG_PCT: 0.9,
          },
          hits: next.hits.map((hit) => ({
            ...hit,
            multiplier: hit.multiplier * 1.1,
          })),
        };
      }
      return next;
    });
  },
  combatHooks: ROSSI_COMBAT_HOOKS,
  executeHits: ROSSI_EXECUTE_HITS,
  levels: {
    STR: [
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
        49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
        59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
        69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
        79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
        89, 90, 91, 92, 93, 94, 95, 95, 96, 97
      ],
    AGI: [
        23, 24, 26, 28, 30, 31, 33, 35, 36, 38,
        40, 42, 43, 45, 47, 49, 50, 52, 54, 55,
        57, 59, 61, 62, 64, 66, 67, 69, 71, 73,
        74, 76, 78, 80, 81, 83, 85, 86, 88, 90,
        92, 93, 95, 97, 99, 100, 102, 104, 105, 107,
        109, 111, 112, 114, 116, 117, 119, 121, 123, 124,
        126, 128, 130, 131, 133, 135, 136, 138, 140, 142,
        143, 145, 147, 148, 150, 152, 154, 155, 157, 159,
        161, 162, 164, 166, 167, 169, 171, 173, 174, 176
      ],
    INT: [
        14, 15, 16, 17, 18, 19, 21, 22, 23, 24,
        25, 26, 28, 29, 30, 31, 32, 33, 35, 36,
        37, 38, 39, 40, 42, 43, 44, 45, 46, 47,
        49, 50, 51, 52, 53, 54, 56, 57, 58, 59,
        60, 61, 63, 64, 65, 66, 67, 68, 70, 71,
        72, 73, 74, 76, 77, 78, 79, 80, 81, 83,
        84, 85, 86, 87, 88, 90, 91, 92, 93, 94,
        95, 97, 98, 99, 100, 101, 102, 104, 105, 106,
        107, 108, 109, 111, 112, 113, 114, 115, 116, 118
      ],
    WIL: [
        9, 9, 10, 11, 12, 13, 14, 15, 16, 17,
        18, 19, 19, 20, 21, 22, 23, 24, 25, 26,
        27, 28, 29, 29, 30, 31, 32, 33, 34, 35,
        36, 37, 38, 39, 39, 40, 41, 42, 43, 44,
        45, 46, 47, 48, 48, 49, 50, 51, 52, 53,
        54, 55, 56, 57, 58, 58, 59, 60, 61, 62,
        63, 64, 65, 66, 67, 68, 68, 69, 70, 71,
        72, 73, 74, 75, 76, 77, 78, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 87, 88, 89
      ],
    ATK: [
        30, 33, 37, 40, 43, 46, 50, 53, 56, 60,
        63, 66, 70, 73, 76, 79, 83, 86, 89, 93,
        96, 99, 103, 106, 109, 112, 116, 119, 122, 126,
        129, 132, 136, 139, 142, 145, 149, 152, 155, 159,
        162, 165, 168, 172, 175, 178, 182, 185, 188, 192,
        195, 198, 201, 205, 208, 211, 215, 218, 221, 225,
        228, 231, 234, 238, 241, 244, 248, 251, 254, 258,
        261, 264, 267, 271, 274, 277, 281, 284, 287, 291,
        294, 297, 300, 304, 307, 310, 314, 317, 320, 323
      ],
    HP: [
        500, 556, 612, 668, 724, 781, 837, 893, 949, 1005,
        1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566,
        1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128,
        2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689,
        2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250,
        3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811,
        3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372,
        4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934,
        4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495
      ],
  },
  weaponType: "SWORD",
  commands: ROSSI_COMMANDS,
};

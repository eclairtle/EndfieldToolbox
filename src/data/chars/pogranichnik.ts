import type { CharacterBase } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID = "pogranichnik_full_moon_counter";
const POGRANICHNIK_STEEL_OATH_BUFF_ID = "pogranichnik_steel_oath";
const POGRANICHNIK_FERVENT_MORALE_BUFF_ID = "pogranichnik_fervent_morale";
const POGRANICHNIK_STEEL_OATH_HARASS_HIT_ID = "pogranichnik_steel_oath_harass";
const POGRANICHNIK_STEEL_OATH_DECISIVE_HIT_ID = "pogranichnik_steel_oath_decisive";
const POGRANICHNIK_TALENT_LIVING_BANNER_1 = "pogranichnik_the_living_banner_1";
const POGRANICHNIK_TALENT_LIVING_BANNER_2 = "pogranichnik_the_living_banner_2";
const POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_1 = "pogranichnik_tactical_instruction_1";
const POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_2 = "pogranichnik_tactical_instruction_2";

const steelOathSourceStepBySlot = new Map<number, string>();
const livingBannerSpRecoveredBySlot = new Map<number, number>();

const POGRANICHNIK_COMMANDS: CommandDefinition[] = [
  {
    id: "pogranichnik_basic_sequence",
    name: "Basic Attack Sequence",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    durationFrames: flat12(193.8),
    spCost: flat12(0),
    basicAttackVariant: "sequence",
    expandsToCommandIds: [
      "pogranichnik_basic_sequence_1",
      "pogranichnik_basic_sequence_2",
      "pogranichnik_basic_sequence_3",
      "pogranichnik_basic_sequence_4",
      "pogranichnik_basic_sequence_5",
    ],
    hits: [],
  },
  {
    id: "pogranichnik_basic_sequence_1",
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
    splitMultiplier: true,
    hits: [
      { multiplier: pct([23, 25, 28, 30, 32, 35, 37, 39, 41, 44, 48, 52]), offsetFrames: flat12(16.2) },
    ],
  },
  {
    id: "pogranichnik_basic_sequence_2",
    name: "Basic Attack Sequence II",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 2,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(40.2),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([14, 15, 17, 18, 20, 21, 22, 24, 25, 27, 29, 32]), offsetFrames: flat12(13.8) },
      { multiplier: pct([14, 15, 17, 18, 20, 21, 22, 24, 25, 27, 29, 32]), offsetFrames: flat12(28.2) },
    ],
  },
  {
    id: "pogranichnik_basic_sequence_3",
    name: "Basic Attack Sequence III",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 3,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(40.2),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37]), offsetFrames: flat12(18) },
      { multiplier: pct([17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37]), offsetFrames: flat12(30) },
    ],
  },
  {
    id: "pogranichnik_basic_sequence_4",
    name: "Basic Attack Sequence IV",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "sequence_segment",
    sequenceSegmentIndex: 4,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(37.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(6) },
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(10.2) },
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(13.8) },
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(22.2) },
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(25.8) },
      { multiplier: pct([6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 13, 14]), offsetFrames: flat12(30) },
    ],
  },
  {
    id: "pogranichnik_basic_sequence_5",
    name: "Final Strike",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    hiddenInLibrary: true,
    basicAttackVariant: "final_strike",
    sequenceSegmentIndex: 5,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(49.8),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: [
      {
        multiplier: pct([43, 47, 52, 56, 60, 65, 69, 73, 77, 83, 89, 97]),
        offsetFrames: flat12(31.8),
        stagger: flat12(18),
        spGenerated: flat12(20),
        requiresControlledOperator: true,
      },
    ],
  },
  {
    id: "pogranichnik_basic_finisher",
    name: "Finisher",
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Physical",
    basicAttackVariant: "finisher",
    mode: "single",
    durationFrames: flat12(90),
    spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(45) }],
  },
  {
    id: "pogranichnik_basic_dive",
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
    id: "pogranichnik_battle_skill",
    name: "The Pulverizing Front",
    skill: "battleSkill",
    attackType: "BATTLE_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(90),
    spCost: flat12(100),
    energyGain: flat12(6.5),
    hits: [
      { multiplier: pct([86, 94, 103, 111, 120, 128, 137, 145, 154, 165, 177, 192]), stagger: flat12(5), offsetFrames: flat12(55.8) },
      {
        multiplier: pct([106, 116, 127, 137, 148, 158, 169, 180, 190, 203, 219, 238]),
        stagger: flat12(5),
        offsetFrames: flat12(76.2),
        effects: [
          {
            type: "GRANT_SP_FROM_VULNERABILITY_STACKS",
            amountAt1Scaling: flat12(5),
            amountAt2Scaling: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
            amountAt3Scaling: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
            amountAt4Scaling: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
            label: "The Pulverizing Front SP Recovery",
          },
          { type: "APPLY_REACTION", reaction: "Breach", forceApply: false },
        ],
      },
    ],
  },
  {
    id: "pogranichnik_combo_skill",
    name: "Full Moon Slash",
    skill: "comboSkill",
    attackType: "COMBO_SKILL",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(132),
    comboCooldownSeconds: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
    spCost: flat12(0),
    energyGain: flat12(10),
    timeFreezeSeconds: flat12(32 / 60),
    hits: [
      { name: "Slash I", multiplier: pct([42, 46, 50, 55, 59, 63, 67, 71, 76, 81, 87, 95]), stagger: flat12(3), spGenerated: flat12(5), offsetFrames: flat12(46.2) },
      {
        name: "Slash II",
        multiplier: pct([54, 59, 65, 70, 76, 81, 86, 92, 97, 104, 112, 122]),
        stagger: flat12(3),
        spGenerated: flat12(7),
        offsetFrames: flat12(73.8),
        executeCondition: {
          requiresSelfBuffId: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
          requiresStacksAtLeast: 2,
        },
      },
      {
        name: "Slash III",
        multiplier: pct([66, 73, 79, 86, 92, 99, 106, 112, 119, 127, 137, 149]),
        stagger: flat12(4),
        spGenerated: flat12(13),
        offsetFrames: flat12(121.8),
        executeCondition: {
          requiresSelfBuffId: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
          requiresStacksExact: 3,
        },
      },
      {
        name: "Slash III Enhanced",
        multiplier: pct([132, 145, 158, 172, 185, 198, 211, 224, 238, 254, 274, 297]),
        stagger: flat12(9),
        spGenerated: flat12(23),
        offsetFrames: flat12(121.8),
        executeCondition: {
          requiresSelfBuffId: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
          requiresStacksExact: 4,
        },
      },
    ],
  },
  {
    id: "pogranichnik_ultimate",
    name: "Shieldguard Banner, Forward",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    mode: "single",
    durationFrames: flat12(180),
    spCost: flat12(0),
    energyCost: flat12(90),
    timeFreezeSeconds: flat12(140 / 60),
    hits: [
      {
        name: "Advance",
        multiplier: pct([133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300]),
        stagger: flat12(10),
        offsetFrames: flat12(148.2),
        effects: [
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: POGRANICHNIK_STEEL_OATH_BUFF_ID,
            label: "Steel Oath",
            stacks: 5,
            stackGroup: POGRANICHNIK_STEEL_OATH_BUFF_ID,
            maxStacks: 5,
            refreshExistingStacks: true,
            durationSeconds: 30,
            timeScale: "game",
            hidden: true,
          },
        ],
      },
    ],
  },
];

const POGRANICHNIK_EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: POGRANICHNIK_STEEL_OATH_HARASS_HIT_ID,
    name: "Shieldguard Harass",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    commandId: "pogranichnik_ultimate",
    commandName: "Shieldguard Banner, Forward",
    multiplier: pct([45, 49, 53, 58, 62, 67, 71, 76, 80, 86, 92, 100]),
    spGenerated: flat12(7.5),
    offsetFrames: flat12(0),
  },
  {
    id: POGRANICHNIK_STEEL_OATH_DECISIVE_HIT_ID,
    name: "Decisive Assault",
    skill: "ultimate",
    attackType: "ULTIMATE",
    damageType: "Physical",
    commandId: "pogranichnik_ultimate",
    commandName: "Shieldguard Banner, Forward",
    multiplier: pct([200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450]),
    stagger: flat12(15),
    spGenerated: flat12(30),
    offsetFrames: flat12(0),
  },
];

const POGRANICHNIK_HOOKS: CharacterCombatHooks = {
  onEvent: (ctx) => {
    if (ctx.event.type === "SNAPSHOT_INITIALIZED" && ctx.event.sourceSlot === ctx.self.slot) {
      livingBannerSpRecoveredBySlot.set(ctx.self.slot, 0);
      return;
    }

    const hasLivingBanner2 = ctx.state.isSelfUniqueTalentEnabled(POGRANICHNIK_TALENT_LIVING_BANNER_2);
    const hasLivingBanner1 = hasLivingBanner2 || ctx.state.isSelfUniqueTalentEnabled(POGRANICHNIK_TALENT_LIVING_BANNER_1);
    const ferventMoraleAtkPct = hasLivingBanner2 ? 0.08 : hasLivingBanner1 ? 0.04 : 0;
    const ferventMoraleArtsIntensity = hasLivingBanner2 ? 8 : hasLivingBanner1 ? 4 : 0;
    const ferventMoraleStackCap = ctx.state.isSelfPotentialActive(3) ? 5 : 3;
    const livingBannerSpThreshold = ctx.state.isSelfPotentialActive(3) ? 60 : 80;

    if (
      hasLivingBanner1
      && ctx.event.type === "SKILL_SP_RECOVERED"
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.event.amount != null
      && ctx.event.amount > 0
    ) {
      const commandAttackType = ctx.event.commandAttackType;
      const countsAsSkillRecovery =
        commandAttackType == null
        || commandAttackType === "BATTLE_SKILL"
        || commandAttackType === "COMBO_SKILL"
        || commandAttackType === "ULTIMATE";
      if (countsAsSkillRecovery) {
        const current = livingBannerSpRecoveredBySlot.get(ctx.self.slot) ?? 0;
        const next = current + ctx.event.amount;
        const stacksToGain = Math.floor(next / livingBannerSpThreshold);
        livingBannerSpRecoveredBySlot.set(
          ctx.self.slot,
          next - stacksToGain * livingBannerSpThreshold,
        );
        if (stacksToGain > 0) {
          for (let index = 0; index < stacksToGain; index += 1) {
            ctx.state.applySelfBuff({
              buffId: POGRANICHNIK_FERVENT_MORALE_BUFF_ID,
              label: "Fervent Morale",
              durationSeconds: 20,
              timeScale: "game",
              effects: {
                ATK_PCT: ferventMoraleAtkPct,
                ARTS_INTENSITY: ferventMoraleArtsIntensity,
              },
              stackGroup: POGRANICHNIK_FERVENT_MORALE_BUFF_ID,
              maxStacks: ferventMoraleStackCap,
              refreshExistingStacks: false,
            });
          }
        }
      }
    }

    if (
      ctx.event.type === "PHYSICAL_REACTION_APPLIED"
      && ctx.event.sourceSlot === ctx.self.slot
      && (ctx.event.label.startsWith("Crush") || ctx.event.label.startsWith("Breach"))
    ) {
      const consumedStacks = Math.max(1, Math.min(4, Math.floor(ctx.event.amount ?? 1)));
      ctx.state.applyEffects({
        effects: [
          {
            type: "REMOVE_BUFF",
            target: "self",
            buffId: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
          },
          {
            type: "APPLY_BUFF",
            target: "self",
            buffId: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
            label: "Full Moon Counter",
            hidden: true,
            durationSeconds: 10,
            timeScale: "game",
            stacks: consumedStacks,
            stackGroup: POGRANICHNIK_FULL_MOON_COUNTER_BUFF_ID,
            maxStacks: 4,
            refreshExistingStacks: true,
          },
        ],
        stepId: `${ctx.event.stepId ?? "event"}:pogranichnik_combo_counter`,
      });
      ctx.state.triggerSelfCombo({
        sourceEventType: "PHYSICAL_REACTION_APPLIED",
        label: "Pogranichnik Combo Triggered",
      });

    }

    const steelOathTriggerFromReaction = ctx.event.type === "PHYSICAL_REACTION_APPLIED";
    const steelOathTriggerFromComboHit =
      ctx.event.type === "COMBO_SKILL_HIT"
      && ctx.event.sourceSlot === ctx.self.slot;
    if (!steelOathTriggerFromReaction && !steelOathTriggerFromComboHit) {
      return;
    }
    const steelOathStacks = ctx.state.getSelfBuffStackCount(POGRANICHNIK_STEEL_OATH_BUFF_ID);
    if (steelOathStacks <= 0) {
      return;
    }
    const sourceStepId = steelOathSourceStepBySlot.get(ctx.self.slot) ?? ctx.event.stepId ?? "event";
    const isLastStack = steelOathStacks === 1;
    const triggerSlot = ctx.event.sourceSlot ?? ctx.event.slot ?? ctx.self.slot;
    const steelOathEffects = [
      {
        type: "REMOVE_BUFF" as const,
        target: "self" as const,
        buffId: POGRANICHNIK_STEEL_OATH_BUFF_ID,
        stacks: 1,
      },
      ...(isLastStack
        ? [
          {
            type: "ADD_TIME_FREEZE" as const,
            durationSeconds: 0.4,
          },
        ]
        : []),
      {
        type: "EXECUTE_HIT" as const,
        hitRefId: isLastStack
          ? POGRANICHNIK_STEEL_OATH_DECISIVE_HIT_ID
          : POGRANICHNIK_STEEL_OATH_HARASS_HIT_ID,
        executeDelayFrames: isLastStack ? 6 : 0,
        executeDelayTimeScale: "game" as const,
      },
    ];
    ctx.state.applyEffects({
      effects: steelOathEffects,
      stepId: sourceStepId,
    });

    const hasTacticalInstruction2 = ctx.state.isSelfUniqueTalentEnabled(POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_2);
    const hasTacticalInstruction1 = hasTacticalInstruction2 || ctx.state.isSelfUniqueTalentEnabled(POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_1);
    if (hasLivingBanner1 && hasTacticalInstruction1) {
      ctx.state.applyBuffToSlot({
        slot: triggerSlot,
        buffId: POGRANICHNIK_FERVENT_MORALE_BUFF_ID,
        label: "Fervent Morale",
        durationSeconds: hasTacticalInstruction2 ? 10 : 5,
        timeScale: "game",
        effects: {
          ATK_PCT: ferventMoraleAtkPct,
          ARTS_INTENSITY: ferventMoraleArtsIntensity,
        },
        stackGroup: POGRANICHNIK_FERVENT_MORALE_BUFF_ID,
        maxStacks: ferventMoraleStackCap,
        refreshExistingStacks: false,
      });
    }
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.slot !== ctx.self.slot || ctx.source.commandId !== "pogranichnik_ultimate" || ctx.source.hitIndex !== 0) {
      return;
    }
    steelOathSourceStepBySlot.set(ctx.self.slot, ctx.stepId);
  },
};

export const POGRANICHNIK: CharacterBase = {
  id: "pogranichnik",
  name: "Pogranichnik",
  skillIconPaths: {
    battleSkill: "/avatars/POGRANICHNK/icon_skill_pograni_01.webp",
    comboSkill: "/avatars/POGRANICHNK/icon_combo_skill_pograni_01.webp",
    ultimate: "/avatars/POGRANICHNK/icon_ultimate_skill_pograni_01.webp",
  },
  imagePath: "/avatars/POGRANICHNK/POGRANICHNK.webp",
  rarity: 6,
  class: "Guard",
  element: "Physical",
  scaling: { WIL: 0.005, AGI: 0.002 },
  mainAttr: "WIL",
  secondaryAttr: "AGI",
  weaponType: "SWORD",
  commands: POGRANICHNIK_COMMANDS,
  executeHits: POGRANICHNIK_EXECUTE_HITS,
  combatHooks: POGRANICHNIK_HOOKS,
  uniqueTalentDefs: {
    [POGRANICHNIK_TALENT_LIVING_BANNER_1]: {
      name: "The Living Banner I",
      condition: {
        minEliteStage: 1,
      },
    },
    [POGRANICHNIK_TALENT_LIVING_BANNER_2]: {
      name: "The Living Banner II",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [POGRANICHNIK_TALENT_LIVING_BANNER_1],
      },
    },
    [POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_1]: {
      name: "Tactical Instruction I",
      condition: {
        minEliteStage: 2,
        requiresUniqueTalentsEnabled: [POGRANICHNIK_TALENT_LIVING_BANNER_1],
      },
    },
    [POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_2]: {
      name: "Tactical Instruction II",
      condition: {
        minEliteStage: 3,
        requiresUniqueTalentsEnabled: [
          POGRANICHNIK_TALENT_LIVING_BANNER_1,
          POGRANICHNIK_TALENT_TACTICAL_INSTRUCTION_1,
        ],
      },
    },
  },
  potentialEffects: {
    2: {
      apply: () => ({
        attrsDelta: {
          WIL: 20,
        },
        modsDelta: {
          PHYSICAL_DMG_PCT: 0.1,
        },
      }),
    },
  },
  mutateResolvedCommands: (commands, ctx) => {
    const potentialLevel = ctx.buildState.potentialLevel ?? 0;
    if (potentialLevel < 4) {
      return commands;
    }
    return commands.map((command) => {
      if (command.id === "pogranichnik_ultimate") {
        return {
          ...command,
          energyCost: Math.max(0, command.energyCost * 0.85),
        };
      }

      if (potentialLevel >= 5 && command.id === "pogranichnik_combo_skill") {
        return {
          ...command,
          comboCooldownSeconds: Math.max(0, command.comboCooldownSeconds - 2),
          hits: command.hits.map((hit) => ({
            ...hit,
            spGenerated: hit.spGenerated * 1.2,
            spReturned: hit.spReturned * 1.2,
          })),
          spGeneratedOnEnd: command.spGeneratedOnEnd * 1.2,
          spReturnedOnEnd: command.spReturnedOnEnd * 1.2,
        };
      }

      return command;
    });
  },
  levels: {
    STR: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101],
    AGI: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 102, 103, 104, 105, 106, 107, 108, 109, 110],
    INT: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    WIL: [20, 22, 24, 25, 27, 29, 30, 32, 34, 36, 37, 39, 41, 42, 44, 46, 48, 49, 51, 53, 55, 56, 58, 60, 61, 63, 65, 67, 68, 70, 72, 73, 75, 77, 79, 80, 82, 84, 85, 87, 89, 91, 92, 94, 96, 98, 99, 101, 103, 104, 106, 108, 110, 111, 113, 115, 116, 118, 120, 122, 123, 125, 127, 129, 130, 132, 134, 135, 137, 139, 141, 142, 144, 146, 147, 149, 151, 153, 154, 156, 158, 159, 161, 163, 165, 166, 168, 170, 172, 173],
    ATK: [30, 33, 37, 40, 43, 46, 50, 53, 56, 59, 63, 66, 69, 72, 76, 79, 82, 85, 89, 92, 95, 99, 102, 105, 108, 112, 115, 118, 121, 125, 128, 131, 134, 138, 141, 144, 148, 151, 154, 157, 161, 164, 167, 170, 174, 177, 180, 183, 187, 190, 193, 196, 200, 203, 206, 210, 213, 216, 219, 223, 226, 229, 232, 236, 239, 242, 245, 249, 252, 255, 259, 262, 265, 268, 272, 275, 278, 281, 285, 288, 291, 294, 298, 301, 304, 307, 311, 314, 317, 321],
    HP: [500, 556, 612, 668, 724, 781, 837, 893, 949, 1005, 1061, 1117, 1173, 1230, 1286, 1342, 1398, 1454, 1510, 1566, 1622, 1679, 1735, 1791, 1847, 1903, 1959, 2015, 2071, 2128, 2184, 2240, 2296, 2352, 2408, 2464, 2520, 2577, 2633, 2689, 2745, 2801, 2857, 2913, 2969, 3026, 3082, 3138, 3194, 3250, 3306, 3362, 3418, 3474, 3531, 3587, 3643, 3699, 3755, 3811, 3867, 3923, 3980, 4036, 4092, 4148, 4204, 4260, 4316, 4372, 4429, 4485, 4541, 4597, 4653, 4709, 4765, 4821, 4878, 4934, 4990, 5046, 5102, 5158, 5214, 5270, 5327, 5383, 5439, 5495],
  },
};

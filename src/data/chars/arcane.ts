import type { CharacterBase, CharacterPotentialEffect } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const INT_FORM = "arcane_int_form";
const WILL_FORM = "arcane_will_form";
const ARRAY = "arcane_gloompurger_array";
const CLUSTERS = "arcane_clusterstrike_stacks";
const ARCANA_READY = "arcane_gloompurge_arcana_ready";
const IMPRISONMENT = "arcane_imprisonment";
const TACTICAL_PLANNING_AMP = "arcane_tactical_planning_amp";
const ARRAY_AMP_CONTROLLER = "arcane_array_amp_controller";
const ARCANA_READY_AMP_CONTROLLER = "arcane_ready_amp_controller";
const ARCANA_AMP_MIN_TIMER = "arcane_arcana_amp_min_timer";
const ARCANA_AMP_IDLE_TIMER = "arcane_arcana_amp_idle_timer";
const TACTICAL_PLANNING_I = "arcane_tactical_planning_1";
const TACTICAL_PLANNING_II = "arcane_tactical_planning_2";
const WEAPON_HONING_I = "arcane_weapon_honing_1";
const WEAPON_HONING_II = "arcane_weapon_honing_2";

const BATTLE_INT = "arcane_battle_skill_int";
const BATTLE_WILL = "arcane_battle_skill_will";
const COMBO_INT = "arcane_combo_skill_int";
const COMBO_WILL = "arcane_combo_skill_will";
const ULT_INT = "arcane_ultimate_int";
const ULT_WILL = "arcane_ultimate_will";
const ARCANA_INT = "arcane_gloompurge_arcana_int";
const ARCANA_WILL = "arcane_gloompurge_arcana_will";
const WILL_COMBO_INFLICTION_MARKERS = {
  Heat: "arcane_will_combo_heat_infliction",
  Cryo: "arcane_will_combo_cryo_infliction",
  Electric: "arcane_will_combo_electric_infliction",
  Nature: "arcane_will_combo_nature_infliction",
} as const;
const WILL_COMBO_INFLICTION_MARKER_IDS = Object.values(WILL_COMBO_INFLICTION_MARKERS);

function clearWillComboInflictionMarkers() {
  return WILL_COMBO_INFLICTION_MARKER_IDS.map((statusId) => ({
    type: "REMOVE_STATUS" as const,
    target: "self" as const,
    statusId,
  }));
}

const basicMults = [
  [19, 21, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42],
  [21, 23, 26, 28, 30, 32, 34, 36, 38, 41, 44, 48],
  [33, 37, 40, 43, 47, 50, 53, 57, 60, 64, 69, 75],
  [36, 39, 43, 46, 50, 53, 57, 61, 64, 69, 74, 80],
  [47, 52, 56, 61, 66, 71, 75, 80, 85, 90, 98, 106],
];
const battleInt = [222, 245, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500];
const battleWill = [133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300];
const comboMult = [35, 39, 42, 46, 50, 53, 57, 60, 64, 68, 73, 80];
const detonationMult = [53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120];
const ultMult = [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180];
const arcanaIntMult = [640, 704, 768, 832, 896, 960, 1024, 1088, 1152, 1232, 1328, 1440];
const arcanaWillMult = [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360];
const clusterTotal = [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360];

const sequenceDurations = [25.02, 27, 43.98, 42, 81];
const sequenceOffsets = [[24], [19.98, 24, 25.02], [10.02, 25.98, 43.98], [6, 12, 18, 24], [42]];

function sequenceSegment(index: number): CommandDefinition {
  const final = index === 4;
  return {
    id: `arcane_basic_sequence_${index + 1}`,
    name: final ? "Final Strike" : `Basic Attack Sequence ${index + 1}`,
    skill: "basic",
    attackType: "BASIC_ATTACK",
    damageType: "Nature",
    hiddenInLibrary: true,
    basicAttackVariant: final ? "final_strike" : "sequence_segment",
    sequenceSegmentIndex: index + 1,
    sequenceSegmentTotal: 5,
    durationFrames: flat12(sequenceDurations[index]!),
    spCost: flat12(0),
    splitMultiplier: true,
    hits: sequenceOffsets[index]!.map((offset, hitIndex) => ({
      name: `Hit ${hitIndex + 1}`,
      multiplier: pct(basicMults[index]!),
      offsetFrames: flat12(offset),
      stagger: flat12(final ? 17 : 0),
      spGenerated: flat12(final ? 17 : 0),
      requiresControlledOperator: final || undefined,
    })),
  };
}

const imprisonmentEffects = (durationSeconds: number) => [
  {
    type: "APPLY_STATUS" as const,
    target: "enemy" as const,
    statusId: IMPRISONMENT,
    label: "Imprisonment",
    durationSeconds,
    expireEffects: [{ type: "EXECUTE_HIT" as const, hitRefId: "arcane_imprisonment_detonation" }],
  },
];

const COMMANDS: CommandDefinition[] = [
  {
    id: "arcane_basic_sequence", name: "Basic Attack Sequence", skill: "basic", attackType: "BASIC_ATTACK",
    damageType: "Nature", basicAttackVariant: "sequence", durationFrames: flat12(219), spCost: flat12(0), hits: [],
    expandsToCommandIds: [1, 2, 3, 4, 5].map((i) => `arcane_basic_sequence_${i}`),
  },
  ...[0, 1, 2, 3, 4].map(sequenceSegment),
  {
    id: "arcane_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    basicAttackVariant: "finisher", targets: "finisher", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "arcane_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "arcane_battle_skill", name: "Battle Skill", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Nature",
    durationFrames: flat12(37.02), spCost: flat12(100), hits: [],
    transforms: [{ toCommandId: BATTLE_INT, requiresBuffId: INT_FORM }, { toCommandId: BATTLE_WILL, requiresBuffId: WILL_FORM }],
  },
  ...([[BATTLE_INT, battleInt], [BATTLE_WILL, battleWill]] as const).map(([id, mult]) => ({
    id, name: id === BATTLE_INT ? "Battle Skill · Intellect" : "Battle Skill · Will", skill: "battleSkill" as const,
    attackType: "BATTLE_SKILL" as const, damageType: "Nature" as const, hiddenInLibrary: true,
    durationFrames: flat12(37.02), spCost: flat12(100), hits: [{
      multiplier: pct(mult), offsetFrames: flat12(37.02), stagger: flat12(10),
      effects: [{ type: "APPLY_ARTS_INFLICTION" as const, element: "Nature" as const, stacks: 1 }],
    }],
  })),
  {
    id: COMBO_INT, name: "Combo Skill · Intellect", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Nature",
    durationFrames: flat12(60), timeFreezeSeconds: flat12(30 / 60), spCost: flat12(0), comboCooldownSeconds: [14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12], comboWindowDurationSeconds: flat12(5),
    transforms: [{ toCommandId: COMBO_WILL, requiresBuffId: WILL_FORM }],
    hits: [{ multiplier: pct(comboMult), offsetFrames: flat12(30), stagger: flat12(5), energyReturn: flat12(10), effects: [
      ...imprisonmentEffects(4),
      { type: "APPLY_BUFF", target: "enemy", buffId: "arcane_combo_susceptibility", label: "Nature/Cryo Susceptibility", durationSeconds: 4, effects: { NATURE_SUS_PCT: 0.04, CRYO_SUS_PCT: 0.04 } },
    ] }],
  },
  {
    id: COMBO_WILL, name: "Combo Skill · Will", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Nature",
    hiddenInLibrary: true, durationFrames: flat12(60), timeFreezeSeconds: flat12(36 / 60), spCost: flat12(0), comboCooldownSeconds: [20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18], comboWindowDurationSeconds: flat12(5),
    hits: [{ multiplier: pct(comboMult), offsetFrames: flat12(36), stagger: flat12(5), energyReturn: flat12(10), effects: [
      ...imprisonmentEffects(6),
      { type: "APPLY_BUFF", target: "enemy", buffId: "arcane_combo_susceptibility", label: "Nature/Cryo Susceptibility", durationSeconds: 6, effects: { NATURE_SUS_PCT: 0.08, CRYO_SUS_PCT: 0.08 } },
    ] }],
  },
  {
    id: "arcane_ultimate", name: "Ultimate", skill: "ultimate", attackType: "ULTIMATE", damageType: "Nature",
    durationFrames: flat12(145.02), spCost: flat12(0), energyCost: flat12(100), hits: [],
    cutscene: true, timeFreezeSeconds: flat12(94.98 / 60),
    transforms: [
      { toCommandId: ARCANA_INT, requiresBuffIdsAll: [ARCANA_READY, INT_FORM] },
      { toCommandId: ARCANA_WILL, requiresBuffIdsAll: [ARCANA_READY, WILL_FORM] },
      { toCommandId: ULT_INT, requiresBuffId: INT_FORM }, { toCommandId: ULT_WILL, requiresBuffId: WILL_FORM },
    ],
  },
  ...([ULT_INT, ULT_WILL] as const).map((id) => ({
    id, name: id === ULT_INT ? "Ultimate · Intellect" : "Ultimate · Will", skill: "ultimate" as const,
    attackType: "ULTIMATE" as const, damageType: "Nature" as const, hiddenInLibrary: true,
    durationFrames: flat12(145.02), spCost: flat12(0), energyCost: flat12(100),
    cutscene: true, timeFreezeSeconds: flat12(94.98 / 60),
    hits: [{ multiplier: pct(ultMult), offsetFrames: flat12(94.98), stagger: flat12(10), effects: [
      { type: "APPLY_REACTION" as const, reaction: "Corrosion" as const, durationSeconds: 15, forceApply: true },
    ] }],
  })),
  ...([[ARCANA_INT, arcanaIntMult], [ARCANA_WILL, arcanaWillMult]] as const).map(([id, mult]) => ({
    id, name: id === ARCANA_INT ? "Gloompurge Arcana · Intellect" : "Gloompurge Arcana · Will",
    skill: "ultimate" as const, attackType: "ULTIMATE" as const, damageType: "Nature" as const, hiddenInLibrary: true,
    enhanced: true,
    durationFrames: flat12(145.02), spCost: flat12(0), energyCost: flat12(0),
    cutscene: true, timeFreezeSeconds: flat12(94.98 / 60),
    hits: [{ multiplier: pct(mult), offsetFrames: flat12(94.98), stagger: flat12(10), effects: [
      { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: ARCANA_READY },
      { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: ARRAY },
      { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: CLUSTERS },
    ] }],
  })),
];

const EXECUTE_HITS: ExecuteHitDefinition[] = [
  {
    id: "arcane_imprisonment_detonation", commandId: "__arcane_imprisonment", commandName: "Imprisonment",
    name: "Imprisonment Detonation", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Nature",
    multiplier: pct(detonationMult), stagger: flat12(5), offsetFrames: flat12(0),
  },
  ...[0, 1, 2, 3].map((index): ExecuteHitDefinition => ({
    id: `arcane_clusterstrike_${index + 1}`, commandId: "__arcane_clusterstrike", commandName: "Clusterstrike",
    name: `Clusterstrike ${index + 1}`, skill: "ultimate", attackType: "ULTIMATE", damageType: "Nature",
    multiplier: pct(clusterTotal.map((value) => value / 8)), offsetFrames: flat12(24 + 7.98 * index),
  })),
  ...[0, 1, 2, 3, 4].map((index): ExecuteHitDefinition => ({
    id: `arcane_imprisonment_laser_${index + 1}`, commandId: "__arcane_imprisonment_lasers", commandName: "Imprisonment",
    name: `Tactical Double ${index + 1}`, skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Nature",
    multiplier: pct(battleInt.map((value) => value / 5 * (index === 4 ? 2.6 : 0.6))),
    offsetFrames: flat12(87 + 6 * index + (index === 4 ? 6 : 0)),
  })),
];

const HOOKS: CharacterCombatHooks = {
  eventTypes: ["SNAPSHOT_INITIALIZED", "COMBAT_INITIALIZED", "ARTS_INFLICTION_APPLIED", "BATTLE_SKILL_HIT", "BASIC_ATTACK_FINAL_STRIKE_HIT", "FINISHER_HIT", "ULTIMATE_HIT"],
  onEvent: (ctx) => {
    if (ctx.event.type === "SNAPSHOT_INITIALIZED" || ctx.event.type === "COMBAT_INITIALIZED") {
      const intForm = ctx.state.getSelfAttr("INT") >= ctx.state.getSelfAttr("WIL");
      ctx.state.applySelfBuff({ buffId: intForm ? INT_FORM : WILL_FORM, label: intForm ? "Intellect Form" : "Will Form", durationSeconds: 0, infiniteDuration: true, hidden: true });
      return;
    }
    if (ctx.event.type === "ARTS_INFLICTION_APPLIED") {
      const intForm = ctx.state.getSelfAttr("INT") >= ctx.state.getSelfAttr("WIL");
      const infliction = ctx.state.getEnemyArtsInfliction(ctx.event.enemySlotId);
      const qualifies = !intForm || ctx.event.consumedElement === "Nature" || (infliction?.stacks ?? 0) >= 2;
      if (qualifies) {
        if (!intForm && ctx.event.consumedElement) {
          ctx.state.applyEffects({
            stepId: `${ctx.event.stepId ?? "event"}:arcane_will_combo_marker`,
            effectTree: ctx.event.effectTree,
            effects: [
              ...clearWillComboInflictionMarkers(),
              {
                type: "APPLY_STATUS",
                target: "self",
                statusId: WILL_COMBO_INFLICTION_MARKERS[ctx.event.consumedElement],
                label: "Will Combo Infliction",
                hidden: true,
                durationSeconds: 10,
                timeScale: "real",
              },
            ],
          });
        }
        ctx.state.triggerSelfCombo({ comboCommandId: intForm ? COMBO_INT : COMBO_WILL, sourceEventType: ctx.event.type, label: `Arcane ${intForm ? "Intellect" : "Will"} Combo Triggered` });
      }
      return;
    }
    if (
      ctx.event.type === "ULTIMATE_HIT"
      && ctx.event.slot === ctx.self.slot
      && [ULT_INT, ULT_WILL, ARCANA_INT, ARCANA_WILL].includes(ctx.event.commandId ?? "")
    ) {
      const intForm = ctx.state.getSelfAttr("INT") >= ctx.state.getSelfAttr("WIL");
      const isBaseGloompurge = ctx.event.commandId === ULT_INT || ctx.event.commandId === ULT_WILL;
      if (isBaseGloompurge && !ctx.state.hasSelfBuff(ARRAY)) {
        ctx.state.applySelfBuff({ buffId: ARRAY, label: "Gloompurge Array", durationSeconds: 20 });
        ctx.state.applySelfBuff({ buffId: "no_energy_gain", label: "No Energy Gain", durationSeconds: 20, hidden: true });
        ctx.state.applyEffects({ effects: [{
          type: "APPLY_STATUS",
          target: "self",
          statusId: ARRAY_AMP_CONTROLLER,
          label: "Array Amp Controller",
          durationSeconds: 20,
          hidden: true,
          expireEffects: [{ type: "REMOVE_STATUS", target: "self", statusId: TACTICAL_PLANNING_AMP }],
          removeEffects: [{ type: "REMOVE_STATUS", target: "self", statusId: TACTICAL_PLANNING_AMP }],
        }] });
        ctx.state.applySelfBuff({
          buffId: CLUSTERS,
          label: "Clusterstrike",
          durationSeconds: 20,
          stackGroup: CLUSTERS,
          maxStacks: 2,
          refreshExistingStacks: false,
        });
        ctx.state.applySelfBuff({
          buffId: CLUSTERS,
          label: "Clusterstrike",
          durationSeconds: 20,
          stackGroup: CLUSTERS,
          maxStacks: 2,
          refreshExistingStacks: false,
        });
      }
      if (ctx.state.isSelfUniqueTalentEnabled(TACTICAL_PLANNING_II)) {
        if (intForm && isBaseGloompurge) {
          const amp = 0.24 + (ctx.state.isSelfPotentialActive(5) ? 0.16 : 0);
          ctx.state.applySelfBuff({
            buffId: TACTICAL_PLANNING_AMP,
            label: "Tactical Planning: Amp",
            durationSeconds: 0,
            infiniteDuration: true,
            effects: { DMG_AMP_PCT: amp },
          });
        } else {
          const talentSusceptibility = Math.min(12.8, ctx.state.getSelfAttr("WIL") * 0.02) / 100;
          const potentialSusceptibility = ctx.state.isSelfPotentialActive(5) ? 0.07 : 0;
          const enemySlotIds = ctx.event.affectedEnemySlotIds?.length
            ? ctx.event.affectedEnemySlotIds
            : ctx.event.enemySlotId ? [ctx.event.enemySlotId] : [];
          for (const enemySlotId of enemySlotIds) {
            ctx.state.applyEffectsToEnemySlot({
              enemySlotId,
              effects: [{
                type: "APPLY_BUFF",
                target: "enemy",
                buffId: "arcane_tactical_planning_susceptibility",
                label: "Tactical Planning: Nature/Cryo Susceptibility",
                durationSeconds: 10,
                effects: {
                  NATURE_SUS_PCT: talentSusceptibility + potentialSusceptibility,
                  CRYO_SUS_PCT: talentSusceptibility + potentialSusceptibility,
                },
              }],
            });
          }
        }
      }
      if (ctx.state.isSelfPotentialActive(5) && ctx.event.commandId === ARCANA_WILL) {
        ctx.state.shortenSelfComboCooldownByRatio(0.3);
      }
      return;
    }
    if (ctx.event.type === "BATTLE_SKILL_HIT" && ctx.event.slot === ctx.self.slot && ctx.event.commandId === BATTLE_INT && ctx.state.hasStatus({ statusId: IMPRISONMENT, target: "enemy", enemySlotId: ctx.event.enemySlotId })) {
      const enemySlotId = ctx.event.enemySlotId;
      if (!enemySlotId) return;
      ctx.state.grantReturnedSp(ctx.state.isSelfPotentialActive(1) ? 40 : 30, "Imprisonment SP Return");
      ctx.state.applyEffectsToEnemySlot({ enemySlotId, effects: [
        { type: "EXECUTE_HIT", hitRefId: "arcane_imprisonment_detonation" },
        ...[0, 1, 2, 3, 4].map((i) => ({ type: "EXECUTE_HIT" as const, hitRefId: `arcane_imprisonment_laser_${i + 1}` })),
        { type: "REMOVE_STATUS", target: "enemy", statusId: IMPRISONMENT },
        { type: "APPLY_BUFF", target: "enemy", buffId: "arcane_combo_susceptibility_detonate", label: "Nature/Cryo Susceptibility", durationSeconds: 2, effects: {
          NATURE_SUS_PCT: 0.04,
          CRYO_SUS_PCT: 0.04,
        } },
      ] });
      return;
    }
    if ((ctx.event.type === "BASIC_ATTACK_FINAL_STRIKE_HIT" || ctx.event.type === "FINISHER_HIT") && ctx.state.hasSelfBuff(ARRAY)) {
      const stacks = ctx.state.getSelfBuffStackCount(CLUSTERS);
      if (stacks <= 0) return;
      const enemySlotId = ctx.event.enemySlotId;
      if (!enemySlotId) return;
      ctx.state.applyEffectsToEnemySlot({ enemySlotId, effects: [0, 1, 2, 3].map((i) => ({ type: "EXECUTE_HIT", hitRefId: `arcane_clusterstrike_${i + 1}` })) });
      ctx.state.removeSelfBuff(CLUSTERS);
      if (stacks > 1) {
        ctx.state.applySelfBuff({
          buffId: CLUSTERS,
          label: "Clusterstrike",
          durationSeconds: ctx.state.getSelfBuffRemainingSeconds(ARRAY),
          stackGroup: CLUSTERS,
          maxStacks: 2,
          refreshExistingStacks: false,
        });
      } else {
        ctx.state.removeSelfBuff(ARRAY);
        ctx.state.applyEffects({ effects: [{ type: "REMOVE_STATUS", target: "self", statusId: ARRAY_AMP_CONTROLLER }] });
        const arcanaCommandId = ctx.state.getSelfAttr("INT") >= ctx.state.getSelfAttr("WIL") ? ARCANA_INT : ARCANA_WILL;
        ctx.state.applySelfBuff({ buffId: ARCANA_READY, label: "Gloompurge Arcana", durationSeconds: 10, readyCommandId: arcanaCommandId });
        ctx.state.applySelfBuff({ buffId: "no_energy_gain", label: "No Energy Gain", durationSeconds: 10, hidden: true });
        ctx.state.applyEffects({ effects: [{
          type: "APPLY_STATUS",
          target: "self",
          statusId: ARCANA_READY_AMP_CONTROLLER,
          label: "Arcana Ready Amp Controller",
          durationSeconds: 10,
          hidden: true,
          expireEffects: [{ type: "REMOVE_STATUS", target: "self", statusId: TACTICAL_PLANNING_AMP }],
        }] });
        if (ctx.state.isSelfUniqueTalentEnabled(TACTICAL_PLANNING_II) && ctx.state.getSelfAttr("INT") >= ctx.state.getSelfAttr("WIL")) {
          ctx.state.applySelfBuff({
            buffId: TACTICAL_PLANNING_AMP,
            label: "Tactical Planning: Amp",
            durationSeconds: 0,
            infiniteDuration: true,
            effects: { DMG_AMP_PCT: 0.24 + (ctx.state.isSelfPotentialActive(5) ? 0.16 : 0) },
          });
        }
      }
    }
  },
  onActionStart: (ctx) => {
    if (ctx.source.slot !== ctx.self.slot || ctx.source.attackType === "GENERIC") return;
    if (ctx.source.commandId === ULT_INT) {
      ctx.state.applySelfBuff({ buffId: ARRAY, label: "Gloompurge Array", durationSeconds: 20 });
      ctx.state.applySelfBuff({ buffId: "no_energy_gain", label: "No Energy Gain", durationSeconds: 20, hidden: true });
      ctx.state.applyEffects({ effects: [{
        type: "APPLY_STATUS",
        target: "self",
        statusId: ARRAY_AMP_CONTROLLER,
        label: "Array Amp Controller",
        durationSeconds: 20,
        hidden: true,
        expireEffects: [{ type: "REMOVE_STATUS", target: "self", statusId: TACTICAL_PLANNING_AMP }],
        removeEffects: [{ type: "REMOVE_STATUS", target: "self", statusId: TACTICAL_PLANNING_AMP }],
      }] });
      ctx.state.applySelfBuff({
        buffId: CLUSTERS,
        label: "Clusterstrike",
        durationSeconds: 20,
        stackGroup: CLUSTERS,
        maxStacks: 2,
        refreshExistingStacks: false,
      });
      ctx.state.applySelfBuff({
        buffId: CLUSTERS,
        label: "Clusterstrike",
        durationSeconds: 20,
        stackGroup: CLUSTERS,
        maxStacks: 2,
        refreshExistingStacks: false,
      });
      if (ctx.state.isSelfUniqueTalentEnabled(TACTICAL_PLANNING_II)) {
        ctx.state.applySelfBuff({
          buffId: TACTICAL_PLANNING_AMP,
          label: "Tactical Planning: Amp",
          durationSeconds: 0,
          infiniteDuration: true,
          effects: { DMG_AMP_PCT: 0.24 + (ctx.state.isSelfPotentialActive(5) ? 0.16 : 0) },
        });
      }
    }
    if (ctx.source.commandId === ARCANA_INT || ctx.source.commandId === ARCANA_WILL) {
      ctx.state.removeSelfBuff(ARCANA_READY);
      ctx.state.removeSelfBuff(ARRAY);
      ctx.state.removeSelfBuff(CLUSTERS);
      ctx.state.removeSelfBuff("no_energy_gain");
      ctx.state.applyEffects({ effects: [{ type: "REMOVE_STATUS", target: "self", statusId: ARCANA_READY_AMP_CONTROLLER }] });
    }
    if (ctx.source.commandId === ARCANA_INT && ctx.state.isSelfUniqueTalentEnabled(TACTICAL_PLANNING_II)) {
      ctx.state.applySelfBuff({ buffId: ARCANA_AMP_MIN_TIMER, label: "Arcana Amp Minimum Timer", durationSeconds: 1.2, hidden: true });
      ctx.state.applySelfBuff({ buffId: ARCANA_AMP_IDLE_TIMER, label: "Arcana Amp Idle Timer", durationSeconds: 3.2, hidden: true });
      ctx.state.applySelfBuff({
        buffId: TACTICAL_PLANNING_AMP,
        label: "Tactical Planning: Amp",
        durationSeconds: 3.2,
        effects: { DMG_AMP_PCT: 0.24 + (ctx.state.isSelfPotentialActive(5) ? 0.16 : 0) },
      });
      return;
    }
    if (ctx.source.commandId === ARCANA_WILL) return;
    if (!ctx.state.hasSelfBuff(ARCANA_AMP_IDLE_TIMER)) return;
    ctx.state.removeSelfBuff(ARCANA_AMP_IDLE_TIMER);
    const minimumRemaining = ctx.state.getSelfBuffRemainingSeconds(ARCANA_AMP_MIN_TIMER);
    if (minimumRemaining <= 0) {
      ctx.state.removeSelfBuff(TACTICAL_PLANNING_AMP);
      return;
    }
    ctx.state.applySelfBuff({
      buffId: TACTICAL_PLANNING_AMP,
      label: "Tactical Planning: Amp",
      durationSeconds: minimumRemaining,
      effects: { DMG_AMP_PCT: 0.24 + (ctx.state.isSelfPotentialActive(5) ? 0.16 : 0) },
    });
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.slot !== ctx.self.slot || ctx.source.commandId !== COMBO_WILL || !ctx.flags.dealsDamage) return;
    const marker = (Object.entries(WILL_COMBO_INFLICTION_MARKERS) as Array<[
      keyof typeof WILL_COMBO_INFLICTION_MARKERS,
      string,
    ]>).find(([, statusId]) => ctx.state.hasStatus({ statusId, target: "self" }));
    if (!marker) return;
    for (const enemySlotId of ctx.affectedEnemySlotIds) {
      ctx.state.applyEffectsToEnemySlot({
        enemySlotId,
        stepId: `${ctx.stepId}:arcane_will_combo_infliction`,
        effectTree: ctx.effectTree,
        effects: [{ type: "APPLY_ARTS_INFLICTION", element: marker[0], stacks: 1 }],
      });
    }
    ctx.state.applyEffects({
      stepId: `${ctx.stepId}:arcane_will_combo_marker_consume`,
      effectTree: ctx.effectTree,
      effects: clearWillComboInflictionMarkers(),
    });
  },
};

const linear = (start: number, end: number, integer = false) => Array.from({ length: 90 }, (_, i) => {
  const value = start + (end - start) * i / 89;
  return integer ? Math.round(value) : Math.round(value * 100) / 100;
});
const milestones = (values: [number, number, number, number, number, number]) => {
  const levels = [1, 20, 40, 60, 80, 90];
  return Array.from({ length: 90 }, (_, i) => {
    const level = i + 1;
    const right = levels.findIndex((candidate) => candidate >= level);
    if (right <= 0) return values[0];
    const left = right - 1;
    const ratio = (level - levels[left]!) / (levels[right]! - levels[left]!);
    return Math.round((values[left]! + (values[right]! - values[left]!) * ratio) * 100) / 100;
  });
};

const POTENTIALS: Record<number, CharacterPotentialEffect> = {
  2: { apply: () => ({ attrsDelta: { INT: 15, WIL: 15 }, modsDelta: { ARTS_INTENSITY: 16 } }) },
};

export const ARCANE: CharacterBase = {
  id: "ARCANE", name: "Arcane", imagePath: "/avatars/ARCANE/ARCANE.webp", rarity: 6, element: "Nature", class: "Caster",
  scaling: { INT: 0.005, WIL: 0.002 }, mainAttr: "INT", secondaryAttr: "WIL", weaponType: "ARTS_UNIT",
  genericTalentBonuses: [
    { INT: 8, WIL: 8 },
    { INT: 10, WIL: 10 },
    { INT: 10, WIL: 10 },
    { INT: 15, WIL: 15 },
  ],
  skillIconPaths: { battleSkill: "/avatars/ARCANE/battle_skill.webp", comboSkill: "/avatars/ARCANE/combo_skill.webp", ultimate: "/avatars/ARCANE/ultimate.webp" },
  levels: {
    STR: milestones([9, 26, 45, 64, 82, 91]), AGI: milestones([9, 27, 46, 65, 84, 93]),
    INT: milestones([21, 54, 89, 124, 159, 176]), WIL: milestones([14, 37, 61, 85, 109, 121]),
    ATK: linear(30, 312, true), HP: linear(500, 5495, true),
  },
  uniqueTalentDefs: {
    [TACTICAL_PLANNING_I]: {
      name: "Tactical Planning I",
      defaultEnabled: true,
      condition: { minEliteStage: 0 },
    },
    [TACTICAL_PLANNING_II]: {
      name: "Tactical Planning II",
      defaultEnabled: true,
      condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [TACTICAL_PLANNING_I] },
    },
    [WEAPON_HONING_I]: { name: "Weapon Honing I", defaultEnabled: true, condition: { minEliteStage: 1 } },
    [WEAPON_HONING_II]: {
      name: "Weapon Honing II",
      defaultEnabled: true,
      condition: { minEliteStage: 3, requiresUniqueTalentsEnabled: [WEAPON_HONING_I] },
    },
  },
  commands: COMMANDS, executeHits: EXECUTE_HITS, combatHooks: HOOKS, potentialEffects: POTENTIALS,
  mutateResolvedCommands: (commands, ctx) => commands.map((command) => {
    let next = command;
    if ((ctx.buildState.potentialLevel ?? 0) >= 1 && command.attackType === "COMBO_SKILL") {
      next = {
        ...next,
        hits: next.hits.map((hit) => ({
          ...hit,
          multiplier: hit.multiplier * 1.3,
          effects: hit.effects.map((effect) => {
            if (command.id !== COMBO_WILL || effect.type !== "APPLY_BUFF" || effect.buffId !== "arcane_combo_susceptibility") return effect;
            return {
              ...effect,
              effects: {
                ...effect.effects,
                NATURE_SUS_PCT: (effect.effects?.NATURE_SUS_PCT ?? 0) + 0.06,
                CRYO_SUS_PCT: (effect.effects?.CRYO_SUS_PCT ?? 0) + 0.06,
              },
            };
          }),
        })),
      };
    }
    if ((ctx.buildState.potentialLevel ?? 0) >= 4 && command.attackType === "ULTIMATE" && !command.id.includes("gloompurge_arcana")) next = { ...next, energyCost: next.energyCost * 0.85 };
    if ((ctx.buildState.potentialLevel ?? 0) >= 5 && command.id === ARCANA_INT) next = { ...next, hits: next.hits.map((hit) => ({ ...hit, multiplier: hit.multiplier * 1.3 })) };
    return next;
  }),
  mutateResolvedExecuteHits: (executeHits, ctx) => {
    if ((ctx.buildState.potentialLevel ?? 0) < 1) return executeHits;
    return Object.fromEntries(Object.entries(executeHits).map(([hitId, hit]) => [
      hitId,
      hit.skill === "comboSkill" || hitId.startsWith("arcane_imprisonment_laser_")
        ? { ...hit, hit: { ...hit.hit, multiplier: hit.hit.multiplier * 1.3 } }
        : hit,
    ]));
  },
};

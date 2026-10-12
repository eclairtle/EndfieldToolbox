import type { CharacterBase, CharacterPotentialEffect } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type CommandHitEffectDefinition, type ExecuteHitDefinition } from "@/lib/commands";
import { isUniqueTalentEnabled } from "@/lib/build/buildConditions";

const HUNTING_ARROW = "typhoeus_hunting_arrow";
const SIGN = "typhoeus_sign";
const HOVERING = "typhoeus_hovering";
const PIERCING_ARROW = "typhoeus_piercing_arrow";
const HAIL = "typhoeus_hail_of_arrows";
const TALENT_1_1 = "typhoeus_hunters_mark_1";
const TALENT_1_2 = "typhoeus_hunters_mark_2";
const TALENT_1_3 = "typhoeus_hunters_mark_3";
const HAIL_HIT = "typhoeus_hail_hit";
const HAIL_FINAL_HIT = "typhoeus_hail_final_hit";

const hoveringEffects = (durationSeconds = 2.2): CommandHitEffectDefinition[] => [
  {
    type: "APPLY_BUFF", target: "self", buffId: HOVERING, label: "Hovering",
    durationSeconds, refreshExistingStacks: true,
    expireEffects: [{ type: "REMOVE_BUFF", target: "self", buffId: PIERCING_ARROW, stacks: 99 }],
  },
];

const setPiercingArrows = (): CommandHitEffectDefinition[] => [
  { type: "REMOVE_BUFF", target: "self", buffId: PIERCING_ARROW, stacks: 99 },
  { type: "APPLY_BUFF", target: "self", buffId: PIERCING_ARROW, label: "Piercing Arrows", durationSeconds: 0, infiniteDuration: true, stacks: 5, stackGroup: PIERCING_ARROW, maxStacks: 5 },
];

const aerialStateEffects = (kind: "normal" | "power" | "final"): CommandHitEffectDefinition[] => [
  { type: "REMOVE_BUFF", target: "self", buffId: PIERCING_ARROW, stacks: 1 },
  ...(kind === "final"
    ? [
        { type: "REMOVE_BUFF" as const, target: "self" as const, buffId: HOVERING },
      ]
    : hoveringEffects()),
  ...(kind === "power" ? [{ type: "REMOVE_BUFF" as const, target: "self" as const, buffId: HUNTING_ARROW, stacks: 1 }] : []),
];

const natureBurstEffects = (): CommandHitEffectDefinition[] => [{
  type: "TRIGGER_ARTS_BURST",
  element: "Nature",
  baseMultiplier: 1.6,
  consumeMatchingInfliction: true,
  maxConsumedInflictionStacks: 1,
  consumedInflictionMultiplierScaling: [1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3],
}];

const basicMults = [
  [21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46],
  [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
  [38, 42, 46, 49, 53, 57, 61, 65, 68, 73, 79, 86],
  [42, 46, 50, 55, 59, 63, 67, 71, 76, 81, 87, 95],
  [56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125],
];
const basicDurations = [21, 25.98, 43.02, 54, 81];
const basicOffsets = [[13.98, 19.98], [19.02], [12, 31.02], [13.02, 34.98, 43.02, 49.02, 55.02, 63], [45]];

function basicSegment(index: number): CommandDefinition {
  return {
    id: `typhoeus_basic_sequence_${index + 1}`,
    name: index === 4 ? "Final Strike" : `Basic Attack Sequence ${index + 1}`,
    skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature", hiddenInLibrary: true,
    basicAttackVariant: index === 4 ? "final_strike" : "sequence_segment",
    sequenceSegmentIndex: index + 1, sequenceSegmentTotal: 5,
    durationFrames: flat12(basicDurations[index]!), spCost: flat12(0), splitMultiplier: true,
    hits: basicOffsets[index]!.map((offset, hitIndex) => ({
      name: `Hit ${hitIndex + 1}`, multiplier: pct(basicMults[index]!), offsetFrames: flat12(offset),
      stagger: flat12(index === 4 ? 17 : 0), spGenerated: flat12(index === 4 ? 21 : 0),
      countsAsFinalStrike: index === 4, requiresControlledOperator: index === 4,
    })),
  };
}

const COMMANDS: CommandDefinition[] = [
  {
    id: "typhoeus_basic_sequence", name: "Basic Attack Sequence", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    basicAttackVariant: "sequence", durationFrames: flat12(225), spCost: flat12(0), hits: [],
    transforms: [
      { toCommandId: "typhoeus_aerial_final_strike_resolved", requiresBuffStacksExact: { buffId: PIERCING_ARROW, stacks: 1 }, requiresBuffId: HOVERING },
      { toCommandId: "typhoeus_power_shot", requiresBuffIdsAll: [HOVERING, HUNTING_ARROW], requiresBuffStacksAtLeast: { buffId: PIERCING_ARROW, stacks: 2 } },
      { toCommandId: "typhoeus_aerial_basic_attack", requiresBuffId: HOVERING, requiresBuffStacksAtLeast: { buffId: PIERCING_ARROW, stacks: 2 } },
    ],
    expandsToCommandIds: [1, 2, 3, 4, 5].map((i) => `typhoeus_basic_sequence_${i}`),
  },
  ...[0, 1, 2, 3, 4].map(basicSegment),
  {
    id: "typhoeus_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    basicAttackVariant: "finisher", targets: "finisher", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "typhoeus_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "typhoeus_battle_skill", name: "Skybound Pursuit", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Nature",
    durationFrames: flat12(51), spCost: flat12(25), initialEffects: [...hoveringEffects(), ...setPiercingArrows()], splitMultiplier: true,
    hits: [
      { name: "Initial Shot 1", multiplier: pct([22, 25, 27, 29, 31, 33, 36, 38, 40, 43, 46, 50]), offsetFrames: flat12(10.02) },
      { name: "Initial Shot 2", multiplier: pct([22, 25, 27, 29, 31, 33, 36, 38, 40, 43, 46, 50]), offsetFrames: flat12(19.98) },
    ],
  },
  {
    id: "typhoeus_aerial_basic_attack", name: "ABA", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    hiddenInLibrary: true, showNameInTimeline: true, variant: "enhanced_basic_attack", targets: "multi_target", maxTargets: 2,
    durationFrames: flat12(37.98), spCost: flat12(0),
    initialEffects: aerialStateEffects("normal"),
    hits: [{ name: "Aerial Shot", multiplier: pct([29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65]), offsetFrames: flat12(4.98) }],
  },
  {
    id: "typhoeus_power_shot", name: "Power Shot", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    hiddenInLibrary: true, showNameInTimeline: true, variant: "enhanced_basic_attack", targets: "multi_target", maxTargets: 2,
    durationFrames: flat12(37.98), spCost: flat12(0),
    initialEffects: aerialStateEffects("power"),
    hits: [{ name: "Power Shot", multiplier: pct([29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65]), offsetFrames: flat12(4.98), postEffects: natureBurstEffects() }],
  },
  {
    id: "typhoeus_aerial_final_strike_resolved", name: "Enhanced Final Strike", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Nature",
    hiddenInLibrary: true, variant: "enhanced_basic_attack", basicAttackVariant: "final_strike", durationFrames: flat12(81), spCost: flat12(0),
    initialEffects: aerialStateEffects("final"),
    hits: [{ name: "Enhanced Final Strike", multiplier: pct([44, 49, 53, 58, 62, 66, 71, 75, 80, 85, 92, 100]), offsetFrames: flat12(22.02),
      stagger: flat12(20), spGenerated: flat12(23), countsAsFinalStrike: true, requiresControlledOperator: true, effects: natureBurstEffects() }],
  },
  {
    id: "typhoeus_combo_skill", name: "Barrage Array", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Nature",
    durationFrames: flat12(81), spCost: flat12(0), energyGain: flat12(10),
    timeFreezeSeconds: flat12(70/60),
    comboCooldownSeconds: [21, 21, 21, 21, 21, 21, 21, 21, 21, 20, 20, 19], comboWindowDurationSeconds: flat12(5), splitMultiplier: true,
    initialEffects: [
      { type: "REMOVE_BUFF", target: "self", buffId: SIGN, stacks: 8 },
      { type: "APPLY_BUFF", target: "self", buffId: HUNTING_ARROW, label: "Hunting Arrow", durationSeconds: 0, infiniteDuration: true, stacks: 4, stackGroup: HUNTING_ARROW, maxStacks: 4 },
      ...hoveringEffects(1.817),
    ],
    hits: [
      { name: "Barrage", multiplier: pct([89, 98, 107, 116, 125, 134, 142, 151, 160, 171, 185, 200]), offsetFrames: flat12(79.02), stagger: flat12(10) },
      { name: "Barrage Array", multiplier: pct([89, 98, 107, 116, 125, 134, 142, 151, 160, 171, 185, 200]), registerOffsetFrames: flat12(79.02),
        repeatRegisterOffsetWithInterval: false,
        offsetFrames: flat12(91.02), times: 6, 
        repeatIntervalFrames: flat12(6) },
    ],
  },
  {
    id: "typhoeus_ultimate", name: "Rain of the Huntress", skill: "ultimate", attackType: "ULTIMATE", damageType: "Nature",
    durationFrames: flat12(165), timeFreezeSeconds: flat12(2), cutscene: true, spCost: flat12(0), energyCost: flat12(200),
    initialEffects: [
      ...hoveringEffects(), ...setPiercingArrows(),
      { type: "REMOVE_BUFF", target: "self", buffId: HAIL, stacks: 99 },
      { type: "APPLY_BUFF", target: "self", buffId: HAIL, label: "Hail of Arrows", hidden: true, durationSeconds: 0, infiniteDuration: true, stacks: 5, stackGroup: HAIL, maxStacks: 5 },
    ],
    hits: [{ name: "Ultimate", multiplier: pct([133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300]), offsetFrames: flat12(127.02), stagger: flat12(20) }],
  },
];

const EXECUTE_HITS: ExecuteHitDefinition[] = [
  { id: HAIL_HIT, commandId: "typhoeus_ultimate", commandName: "Rain of the Huntress", name: "Hail of Arrows", skill: "ultimate", attackType: "ULTIMATE", damageType: "Nature", multiplier: pct([33, 37, 40, 43, 47, 50, 53, 57, 60, 64, 69, 75]), offsetFrames: flat12(0) },
  { id: HAIL_FINAL_HIT, commandId: "typhoeus_ultimate", commandName: "Rain of the Huntress", name: "Empowered Hail of Arrows", skill: "ultimate", attackType: "ULTIMATE", damageType: "Nature", multiplier: pct([89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 184, 200]), offsetFrames: flat12(0) },
];

const AERIAL_COMMANDS = new Set(["typhoeus_aerial_basic_attack", "typhoeus_power_shot", "typhoeus_aerial_final_strike", "typhoeus_aerial_final_strike_resolved"]);
const HOOKS: CharacterCombatHooks = {
  eventTypes: ["COMBAT_INITIALIZED", "ARTS_BURST_TRIGGERED", "ARTS_INFLICTION_CONSUMED"],
  onEvent: (ctx) => {
    if (ctx.event.type === "COMBAT_INITIALIZED" && ctx.event.sourceSlot === ctx.self.slot) {
      const signs = ctx.state.isSelfUniqueTalentEnabled(TALENT_1_3) ? 4 : ctx.state.isSelfUniqueTalentEnabled(TALENT_1_2) ? 2 : 1;
      for (const [buffId, label, stacks, maxStacks] of [[HUNTING_ARROW, "Hunting Arrow", 4, 4], [SIGN, "Sign", signs, 8]] as const) {
        ctx.state.applyEffects({ effects: [{ type: "APPLY_BUFF", target: "self", buffId, label, durationSeconds: 0, infiniteDuration: true, stacks, stackGroup: buffId, maxStacks }] });
      }
      return;
    }
    if (ctx.event.type === "ARTS_BURST_TRIGGERED" && ctx.event.element === "Nature") {
      if (!ctx.state.markTriggerOnce(`typhoeus_nature_burst_sign:${ctx.event.stepId ?? "event"}:${ctx.event.time}`)) return;
      const previousSigns = ctx.state.getSelfBuffStackCount(SIGN);
      ctx.state.applyEffects({ effects: [{ type: "APPLY_BUFF", target: "self", buffId: SIGN, label: "Sign", durationSeconds: 0, infiniteDuration: true, stacks: 1, stackGroup: SIGN, maxStacks: 8 }] });
      if (previousSigns >= 7) ctx.state.triggerSelfCombo({ sourceEventType: "ARTS_BURST_TRIGGERED", label: "Typhoeus Combo Triggered" });
      return;
    }
    if (
      ctx.event.type === "ARTS_INFLICTION_CONSUMED"
      && ctx.event.consumedElement === "Nature"
      && ctx.event.sourceSlot === ctx.self.slot
      && ctx.event.commandId != null
      && AERIAL_COMMANDS.has(ctx.event.commandId)
    ) {
      if (!ctx.state.markTriggerOnce(`typhoeus_nature_consume_sign:${ctx.event.stepId ?? "event"}:${ctx.event.time}`)) return;
      ctx.state.applyEffects({ effects: [{ type: "APPLY_BUFF", target: "self", buffId: SIGN, label: "Sign", durationSeconds: 0, infiniteDuration: true, stacks: 1, stackGroup: SIGN, maxStacks: 8 }] });
    }
  },
  onResolvedHit: (ctx) => {
    if (ctx.source.isControlledOperatorHit && ctx.state.getSelfBuffStackCount(SIGN) >= 8) {
      ctx.state.triggerSelfCombo({ sourceEventType: "CONTROLLED_OPERATOR_HIT", label: "Typhoeus Combo Triggered" });
    }
    if (!AERIAL_COMMANDS.has(ctx.source.commandId)) return;
    if (ctx.source.commandId === "typhoeus_aerial_basic_attack") {
      let consumedNatureInfliction = false;
      for (const enemySlotId of ctx.affectedEnemySlotIds) {
        const infliction = ctx.state.getEnemyArtsInfliction(enemySlotId);
        if (infliction?.element !== "Nature") continue;
        ctx.state.setEnemyArtsInfliction(infliction.stacks > 1
          ? { ...infliction, stacks: infliction.stacks - 1 }
          : null, enemySlotId);
        consumedNatureInfliction = true;
      }
      if (consumedNatureInfliction) {
        ctx.state.applyEffects({ effects: [{ type: "APPLY_BUFF", target: "self", buffId: SIGN, label: "Sign", durationSeconds: 0, infiniteDuration: true, stacks: 1, stackGroup: SIGN, maxStacks: 8 }] });
      }
    }
    const hailStacks = ctx.state.getSelfBuffStackCount(HAIL);
    if (hailStacks <= 0) return;
    ctx.state.applyEffects({ effects: [
      { type: "EXECUTE_HIT", hitRefId: hailStacks === 1 ? HAIL_FINAL_HIT : HAIL_HIT },
      { type: "REMOVE_BUFF", target: "self", buffId: HAIL, stacks: 1 },
    ] });
  },
  onActionStart: (ctx) => {
    if (ctx.source.commandId !== "typhoeus_combo_skill" || !ctx.state.hasSelfBuff(HOVERING)) return;
    ctx.state.applyEffects({ effects: setPiercingArrows() });
  },
};

const linear = (start: number, end: number) => Array.from({ length: 90 }, (_, i) => Math.round((start + (end - start) * i / 89) * 100) / 100);
const milestones = (values: [number, number, number, number, number, number]) => {
  const levels = [1, 20, 40, 60, 80, 90];
  return Array.from({ length: 90 }, (_, i) => {
    const level = i + 1; const right = levels.findIndex((candidate) => candidate >= level);
    if (right <= 0) return values[0]; const left = right - 1;
    return Math.round((values[left]! + (values[right]! - values[left]!) * (level - levels[left]!) / (levels[right]! - levels[left]!)) * 100) / 100;
  });
};
const POTENTIALS: Record<number, CharacterPotentialEffect> = {
  2: { apply: () => ({ attrsDelta: { AGI: 20 }, modsDelta: { ARTS_INTENSITY: 16 } }) },
};

export const TYPHOEUS: CharacterBase = {
  id: "TYPHOEUS", name: "Typhoeus", imagePath: "/avatars/TYPHOEUS/TYPHOEUS.webp", rarity: 6, element: "Nature", class: "Striker",
  scaling: { AGI: 0.005, WIL: 0.002 }, mainAttr: "AGI", secondaryAttr: "WIL", weaponType: "ARTS_UNIT",
  skillIconPaths: { battleSkill: "/avatars/TYPHOEUS/battle_skill.webp", comboSkill: "/avatars/TYPHOEUS/combo_skill.webp", ultimate: "/avatars/TYPHOEUS/ultimate.webp" },
  levels: {
    STR: milestones([9.9, 28.7, 48.49, 68.29, 88.08, 97.98]), AGI: milestones([21.96, 54.61, 88.99, 123.36, 157.74, 174.92]),
    INT: milestones([10, 29, 49, 69, 89, 99]), WIL: milestones([14.97, 37.24, 60.68, 84.12, 107.56, 119.27]),
    ATK: linear(30, 312), HP: linear(500, 5494.9),
  },
  uniqueTalentDefs: {
    [TALENT_1_1]: { name: "Prey Checklist I", defaultEnabled: true, condition: { minEliteStage: 0 } },
    [TALENT_1_2]: { name: "Prey Checklist II", condition: { minEliteStage: 2, requiresUniqueTalentsEnabled: [TALENT_1_1] } },
    [TALENT_1_3]: { name: "Prey Checklist III", condition: { minEliteStage: 4, requiresUniqueTalentsEnabled: [TALENT_1_2] } },
  },
  commands: COMMANDS, executeHits: EXECUTE_HITS, combatHooks: HOOKS, potentialEffects: POTENTIALS,
  mutateResolvedCommands: (commands, ctx) => {
    const talentMultiplier = isUniqueTalentEnabled(TALENT_1_3, ctx.buildState)
      ? 1.6
      : isUniqueTalentEnabled(TALENT_1_2, ctx.buildState) ? 1.4 : 1.2;
    return commands.map((command) => ({
      ...command,
      energyCost: command.id === "typhoeus_ultimate" && (ctx.buildState.potentialLevel ?? 0) >= 4 ? command.energyCost * 0.85 : command.energyCost,
      comboCooldownSeconds: command.attackType === "COMBO_SKILL" && (ctx.buildState.potentialLevel ?? 0) >= 3 ? Math.max(0, command.comboCooldownSeconds - 2) : command.comboCooldownSeconds,
      hits: command.hits.map((hit) => ({
        ...hit,
        multiplier: command.id === "typhoeus_power_shot"
          ? hit.multiplier * talentMultiplier
          : command.attackType === "ULTIMATE" && (ctx.buildState.potentialLevel ?? 0) >= 5
            ? hit.multiplier * 1.2
            : hit.multiplier,
      })),
    }));
  },
};

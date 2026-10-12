import type { CharacterBase, CharacterPotentialEffect } from "@/data/characters";
import type { CharacterCombatHooks } from "@/lib/combat/hooks";
import { flat12, pct, type CommandDefinition, type ExecuteHitDefinition } from "@/lib/commands";

const VOCALIST = "liino_vocalist_stance";
const COSMOVOICE = "liino_cosmovoice_stance";
const VOCALIST_TEAM = "liino_vocalist_team_buff";
const COSMOVOICE_TEAM = "liino_cosmovoice_team_buff";
const BATTLE_COOLDOWN = "liino_battle_skill_cooldown";
const VOCALIST_PULSE = "liino_vocalist_pulse";
const VOCALIST_HEALING = "liino_vocalist_healing";
const VOCALIST_HEALING_STATUS = "liino_vocalist_healing_status";
const COMBO_HEALING = "liino_combo_healing";
const ULTIMATE_INITIAL_HEALING = "liino_ultimate_initial_healing";
const COSMOVOICE_PULSE = "liino_cosmovoice_pulse";
const COSMOVOICE_HEALING = "liino_cosmovoice_healing";
const IDOL_ZONE_EFFECTS = { HEALING_RECEIVED_PCT: 0.2, DMG_TAKEN_PCT: -0.2 };
const vocalistAtk = [0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1];
const cosmoAmpRatio = [0.00018, 0.0002, 0.00021, 0.00023, 0.00025, 0.00027, 0.00028, 0.0003, 0.00032, 0.00034, 0.00037, 0.0004];
const cosmoAmpCap = [0.4, 0.4, 0.4, 0.4, 0.45, 0.45, 0.45, 0.45, 0.45, 0.5, 0.55, 0.6];

const unavailable = (id: string, name: string): CommandDefinition => ({
  id,
  name,
  skill: "basic",
  attackType: "GENERIC",
  damageType: "Electric",
  hiddenInLibrary: true,
  durationFrames: flat12(0),
  spCost: flat12(0),
  hits: [],
});

const basicMultipliers = [
  [19, 21, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42],
  [27, 29, 32, 35, 37, 40, 43, 45, 48, 51, 56, 60],
  [27, 29, 32, 35, 37, 40, 43, 45, 48, 51, 56, 60],
  [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
  [45, 49, 53, 58, 62, 67, 71, 76, 80, 86, 92, 100],
] as const;
const basicDurations = [33, 42, 42, 46.02, 69];
const basicOffsets = [[6, 19.02], [16.02, 19.98, 24, 28.02, 31.98], [25.02, 31.02, 34.02, 43.98, 52.98], [25.98, 28.98, 33, 36, 39, 43.02, 45, 49.02], [36]];

const segment = (index: number): CommandDefinition => ({
  id: `liino_basic_sequence_${index + 1}`,
  name: index === 4 ? "Final Strike" : `Basic Attack Sequence ${index + 1}`,
  skill: "basic",
  attackType: "BASIC_ATTACK",
  damageType: "Electric",
  hiddenInLibrary: true,
  basicAttackVariant: index === 4 ? "final_strike" : "sequence_segment",
  sequenceSegmentIndex: index + 1,
  sequenceSegmentTotal: 5,
  durationFrames: flat12(basicDurations[index]!),
  spCost: flat12(0),
  splitMultiplier: true,
  hits: basicOffsets[index]!.map((offset, hitIndex) => ({
    name: `Hit ${hitIndex + 1}`,
    multiplier: pct([...basicMultipliers[index]!]),
    offsetFrames: flat12(offset),
    stagger: flat12(index === 4 ? 19 : 0),
    spGenerated: flat12(index === 4 ? 20 : 0),
    countsAsFinalStrike: index === 4,
    requiresControlledOperator: index === 4,
  })),
});

const endEffects = [
  { type: "REMOVE_BUFF" as const, target: "self" as const, buffId: VOCALIST },
  { type: "REMOVE_BUFF" as const, target: "self" as const, buffId: COSMOVOICE },
  { type: "REMOVE_BUFF" as const, target: "team" as const, buffId: VOCALIST_TEAM },
  { type: "REMOVE_BUFF" as const, target: "team" as const, buffId: COSMOVOICE_TEAM },
  { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: VOCALIST },
  { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: VOCALIST_HEALING_STATUS },
  { type: "REMOVE_STATUS" as const, target: "self" as const, statusId: COSMOVOICE },
];

const COMMANDS: CommandDefinition[] = [
  {
    id: "liino_basic_sequence", name: "Basic Attack Sequence", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Electric",
    basicAttackVariant: "sequence", durationFrames: flat12(232.02), spCost: flat12(0), hits: [],
    transforms: [
      { toCommandId: "liino_basic_unavailable", requiresBuffId: VOCALIST },
      { toCommandId: "liino_basic_unavailable", requiresBuffId: COSMOVOICE },
    ],
    expandsToCommandIds: [1, 2, 3, 4, 5].map((i) => `liino_basic_sequence_${i}`),
  },
  ...[0, 1, 2, 3, 4].map(segment),
  unavailable("liino_basic_unavailable", "Basic Attack Unavailable During Stance"),
  {
    id: "liino_basic_finisher", name: "Finisher", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Electric",
    basicAttackVariant: "finisher", targets: "finisher", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900]), offsetFrames: flat12(30) }],
  },
  {
    id: "liino_basic_dive", name: "Dive Attack", skill: "basic", attackType: "BASIC_ATTACK", damageType: "Electric",
    basicAttackVariant: "dive_attack", durationFrames: flat12(60), spCost: flat12(0),
    hits: [{ multiplier: pct([80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180]), offsetFrames: flat12(30) }],
  },
  {
    id: "liino_battle_skill", name: "Dazzling Focus", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Electric",
    durationFrames: flat12(42), spCost: flat12(25),
    transforms: [
      { toCommandId: "liino_end_vocalist", requiresBuffId: VOCALIST },
      { toCommandId: "liino_end_cosmovoice", requiresBuffId: COSMOVOICE },
      { toCommandId: "liino_battle_cooldown", requiresBuffId: BATTLE_COOLDOWN },
    ],
    initialEffects: [
      { type: "APPLY_BUFF", target: "self", buffId: VOCALIST, label: "Vocalist Stance", hidden: true, durationSeconds: 60 },
      { type: "APPLY_BUFF", target: "team", buffId: VOCALIST_TEAM, label: "Vocalist Stance", durationSeconds: 60,
        effects: IDOL_ZONE_EFFECTS, effectScalings: { ATK_PCT: vocalistAtk } },
      { type: "APPLY_STATUS", target: "self", statusId: VOCALIST, label: "Vocalist Pulses", hidden: true, durationSeconds: 60, periods: 6, maxPeriods: 6,
        periodicEffects: [{ type: "EXECUTE_HIT", hitRefId: VOCALIST_PULSE }] },
      { type: "APPLY_STATUS", target: "self", statusId: VOCALIST_HEALING_STATUS, label: "Vocalist Healing", hidden: true, durationSeconds: 60, periods: 20, maxPeriods: 20,
        initialEffects: [{ type: "EXECUTE_HIT", hitRefId: VOCALIST_HEALING }], periodicEffects: [{ type: "EXECUTE_HIT", hitRefId: VOCALIST_HEALING }] },
    ],
    hits: [{
      name: "Dazzling Focus", multiplier: pct([107, 117, 128, 139, 149, 160, 170, 181, 192, 205, 221, 240]),
      offsetFrames: flat12(31.98), stagger: flat12(3),
    }],
  },
  unavailable("liino_battle_cooldown", "Dazzling Focus (Cooldown)"),
  {
    id: "liino_end_vocalist", name: "End Stance", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Electric",
    hiddenInLibrary: true, durationFrames: flat12(12), spCost: flat12(0), hits: [],
    initialEffects: [...endEffects, { type: "APPLY_BUFF", target: "self", buffId: BATTLE_COOLDOWN, label: "Battle Skill Cooldown", durationSeconds: 3, timeScale: "real", hidden: true }],
  },
  {
    id: "liino_end_cosmovoice", name: "End Stance", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Electric",
    hiddenInLibrary: true, durationFrames: flat12(12), spCost: flat12(0), hits: [], initialEffects: endEffects,
  },
  {
    id: "liino_combo_skill", name: "Stage Help", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Electric",
    durationFrames: flat12(97.02), timeFreezeSeconds: flat12(0), spCost: flat12(0), energyGain: flat12(0),
    comboCooldownSeconds: [10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 8], comboWindowDurationSeconds: flat12(5),
    transforms: [{ toCommandId: "liino_combo_unavailable", requiresBuffId: COSMOVOICE }],
    hits: [
      { name: "Hit 1", multiplier: pct([160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360].map((value) => value * 0.375)), offsetFrames: flat12(18) },
      { name: "Hit 2", multiplier: pct([160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360].map((value) => value * 0.625)), offsetFrames: flat12(66), energyReturn: flat12(20), stagger: flat12(5), postEffects: [{ type: "EXECUTE_HIT", hitRefId: COMBO_HEALING }] },
    ],
  },
  unavailable("liino_combo_unavailable", "Combo Skill Requires Vocalist Stance"),
  {
    id: "liino_ultimate", name: "Cosmic Solo", skill: "ultimate", attackType: "ULTIMATE", damageType: "Electric",
    durationFrames: flat12(262.2), timeFreezeSeconds: flat12(2.55), cutscene: true, spCost: flat12(0), energyCost: flat12(160), splitMultiplier: true,
    initialEffects: [
      ...endEffects,
      { type: "EXECUTE_HIT", hitRefId: ULTIMATE_INITIAL_HEALING, registerAtInitialTime: true },
      { type: "APPLY_BUFF", target: "self", buffId: COSMOVOICE, label: "Cosmovoice Stance", hidden: true, durationSeconds: 15 },
      { type: "APPLY_BUFF", target: "team", buffId: COSMOVOICE_TEAM, label: "Cosmovoice Stance", durationSeconds: 15,
        effects: { ...IDOL_ZONE_EFFECTS, ATK_PCT: 0.1 },
        effectAttributeScalings: {
          ELECTRIC_DMG_AMP_PCT: { attribute: "WIL", ratio: cosmoAmpRatio[0]!, ratioScaling: cosmoAmpRatio, max: cosmoAmpCap[0]!, maxScaling: cosmoAmpCap },
          NATURE_DMG_AMP_PCT: { attribute: "WIL", ratio: cosmoAmpRatio[0]!, ratioScaling: cosmoAmpRatio, max: cosmoAmpCap[0]!, maxScaling: cosmoAmpCap },
        } },
      { type: "APPLY_STATUS", target: "self", statusId: COSMOVOICE, label: "Cosmovoice Pulses", hidden: true, durationSeconds: 15, periods: 10, maxPeriods: 10,
        periodicEffects: [{ type: "EXECUTE_HIT", hitRefId: COSMOVOICE_PULSE }, { type: "EXECUTE_HIT", hitRefId: COSMOVOICE_HEALING }],
        expireEffects: [{ type: "EXECUTE_HIT", hitRefId: COSMOVOICE_PULSE, times: 3 }, { type: "EXECUTE_HIT", hitRefId: COSMOVOICE_HEALING, times: 3 }] },
    ],
    hits: [
      { name: "Pyrotechnics", multiplier: pct([142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320]), offsetFrames: flat12(156), times: 12, repeatIntervalFrames: flat12(6.72) },
      { name: "Finale", multiplier: pct([284, 313, 341, 370, 398, 427, 455, 483, 512, 547, 590, 640]), offsetFrames: flat12(247.02), stagger: flat12(20),
        effects: [{ type: "APPLY_REACTION", reaction: "Electrification", forceApply: true }] },
    ],
  },
];

const EXECUTE_HITS: ExecuteHitDefinition[] = [
  { id: VOCALIST_PULSE, commandId: "liino_battle_skill", commandName: "Dazzling Focus", name: "Vocalist Pulse", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Electric", multiplier: pct([53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120]), offsetFrames: flat12(0) },
  { id: VOCALIST_HEALING, commandId: "liino_battle_skill", commandName: "Dazzling Focus", name: "Vocalist Treatment", skill: "battleSkill", attackType: "BATTLE_SKILL", damageType: "Healing", healingTarget: "team", scalingStat: "AGI", multiplier: pct([4, 5, 6, 7, 7, 8, 8, 8, 9, 9, 9, 9]), flatAmount: [18, 22, 25, 29, 31, 32, 34, 36, 38, 39, 40, 41], offsetFrames: flat12(0) },
  { id: COMBO_HEALING, commandId: "liino_combo_skill", commandName: "Stage Help", name: "Stage Help Treatment", skill: "comboSkill", attackType: "COMBO_SKILL", damageType: "Healing", scalingStat: "AGI", multiplier: pct([17, 20, 24, 27, 29, 30, 32, 34, 35, 36, 37, 38]), flatAmount: [72, 86, 101, 115, 122, 130, 137, 144, 151, 155, 158, 162], offsetFrames: flat12(0) },
  { id: ULTIMATE_INITIAL_HEALING, commandId: "liino_ultimate", commandName: "Cosmic Solo", name: "Cosmic Solo Treatment", skill: "ultimate", attackType: "ULTIMATE", damageType: "Healing", healingTarget: "team", scalingStat: "AGI", multiplier: pct([76, 91, 106, 121, 129, 136, 144, 151, 159, 163, 166, 170]), flatAmount: [324, 389, 454, 518, 551, 583, 616, 648, 680, 697, 713, 729], offsetFrames: flat12(0) },
  { id: COSMOVOICE_PULSE, commandId: "liino_ultimate", commandName: "Cosmic Solo", name: "Cosmovoice Pulse", skill: "ultimate", attackType: "ULTIMATE", damageType: "Electric", multiplier: pct([27, 29, 32, 35, 37, 40, 42, 45, 48, 51, 55, 60]), offsetFrames: flat12(0) },
  { id: COSMOVOICE_HEALING, commandId: "liino_ultimate", commandName: "Cosmic Solo", name: "Cosmovoice Treatment", skill: "ultimate", attackType: "ULTIMATE", damageType: "Healing", healingTarget: "team", scalingStat: "AGI", multiplier: pct([8, 10, 12, 13, 14, 15, 16, 17, 18, 18, 18, 19]), flatAmount: [36, 43, 50, 58, 61, 65, 68, 72, 76, 77, 79, 81], offsetFrames: flat12(0) },
];

const HOOKS: CharacterCombatHooks = {
  eventTypes: ["ARTS_REACTION_APPLIED", "ARTS_REACTION_CONSUMED"],
  onEvent: (ctx) => {
    if (!ctx.state.hasSelfBuff(VOCALIST)) return;
    ctx.state.triggerSelfCombo({ sourceEventType: ctx.event.type, label: "Liino Combo Triggered" });
  },
};

const linear = (start: number, end: number) => Array.from({ length: 90 }, (_, index) => Math.round(start + (end - start) * index / 89));
const milestones = (values: [number, number, number, number, number, number]) => {
  const levels = [1, 20, 40, 60, 80, 90];
  return Array.from({ length: 90 }, (_, index) => {
    const level = index + 1;
    const right = levels.findIndex((candidate) => candidate >= level);
    if (right <= 0) return values[0];
    const left = right - 1;
    const ratio = (level - levels[left]!) / (levels[right]! - levels[left]!);
    return Math.round((values[left]! + (values[right]! - values[left]!) * ratio) * 100) / 100;
  });
};

const POTENTIALS: Record<number, CharacterPotentialEffect> = {
  2: { apply: () => ({ attrsDelta: { WIL: 20 }, modsDelta: { HEALING_PCT: 0.1 } }) },
};

export const LIINO: CharacterBase = {
  id: "LIINO", name: "Liino", imagePath: "/avatars/LIINO/LIINO.webp", rarity: 6, element: "Electric", class: "Supporter",
  scaling: { WIL: 0.005, AGI: 0.002 }, mainAttr: "WIL", secondaryAttr: "AGI", weaponType: "POLEARM",
  skillIconPaths: { battleSkill: "/avatars/LIINO/battle_skill.webp", comboSkill: "/avatars/LIINO/combo_skill.webp", ultimate: "/avatars/LIINO/ultimate.webp" },
  levels: {
    STR: milestones([9, 26, 44, 62, 80, 89]), AGI: milestones([14, 37, 61, 85, 109, 121]),
    INT: milestones([9, 26, 45, 64, 82, 91]), WIL: milestones([21, 55, 90, 125, 160, 177]),
    ATK: linear(30, 309), HP: linear(500, 5495),
  },
  commands: COMMANDS, executeHits: EXECUTE_HITS, combatHooks: HOOKS, potentialEffects: POTENTIALS,
  mutateResolvedCommands: (commands, ctx) => commands.map((command) => {
    const potential = ctx.buildState.potentialLevel ?? 0;
    let next = command;
    if (potential >= 3 && command.attackType === "COMBO_SKILL") {
      next = {
        ...next,
        comboCooldownSeconds: Math.max(0, next.comboCooldownSeconds - 1),
        hits: next.hits.map((hit) => ({ ...hit, multiplier: hit.multiplier * 1.4 })),
      };
    }
    if (potential >= 4 && command.id === "liino_ultimate") {
      next = { ...next, energyCost: next.energyCost * 0.85 };
    }
    if (potential >= 5 && (command.attackType === "BATTLE_SKILL" || command.attackType === "ULTIMATE")) {
      next = { ...next, hits: next.hits.map((hit) => ({ ...hit, multiplier: hit.multiplier * 1.2 })) };
    }
    return next;
  }),
  mutateResolvedExecuteHits: (executeHits, ctx) => {
    if ((ctx.buildState.potentialLevel ?? 0) < 3 || !executeHits[COMBO_HEALING]) return executeHits;
    const comboHealing = executeHits[COMBO_HEALING]!;
    return {
      ...executeHits,
      [COMBO_HEALING]: {
        ...comboHealing,
        hit: {
          ...comboHealing.hit,
          multiplier: comboHealing.hit.multiplier * 1.4,
          flatAmount: comboHealing.hit.flatAmount * 1.4,
        },
      },
    };
  },
};

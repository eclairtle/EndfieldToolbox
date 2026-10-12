import type { ElementType } from "@/data/characters";
import type { AttackType, CommandHitEffectDefinition, TimeScale } from "@/lib/commands";
import type { UnifiedStatusKind } from "@/lib/combat/statusModel";

export const TRIGGER_SUPPORTED_STATUS_IDS = [
  "bladebreaking",
  "team_link",
  "team_encumbered",
  "team_encumbered_suppression",
  "contract_battle_chill_cooldown",
  "contract_regeneration",
  "powerful_decapitation",
  "battle_skill_barrier",
  "estella_cryo_infliction_immunity",
  "tangtang_olden_stare_crowd_control",
  "lift",
  "knockdown",
  "solidification",
  "endministrator_originium_crystal",
  "vulnerability",
  "heat_infliction",
  "cryo_infliction",
  "electric_infliction",
  "nature_infliction",
] as const;

export type SupportedCombatStatusId = (typeof TRIGGER_SUPPORTED_STATUS_IDS)[number];

export type CombatStatusApplicationModel =
  | "actor_buff"
  | "actor_status"
  | "actor_arts_infliction"
  | "team_status"
  | "team_link_status"
  | "enemy_status"
  | "enemy_vulnerability"
  | "enemy_arts_infliction";

export type CombatStatusDefinition = {
  id: SupportedCombatStatusId;
  label: {
    en: string;
    zh: string;
  };
  defaultKind?: UnifiedStatusKind;
  defaultTimeScale?: TimeScale;
  defaultDurationSeconds?: number;
  defaultHidden?: boolean;
  maxStacks?: number;
  allowPermanent?: boolean;
  operatorApplicationModel?: CombatStatusApplicationModel;
  enemyApplicationModel?: CombatStatusApplicationModel;
  element?: Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">;
  blocksOperatorArtsInflictionElements?: Array<Extract<ElementType, "Heat" | "Cryo" | "Electric" | "Nature">>;
  blocksIncomingAttackTypes?: AttackType[];
  disableStatusIds?: string[];
  periodIntervalSeconds?: number;
  periodicRequiresEnemyNotCrowdControlled?: boolean;
  periodicRequiresEnemyNotStaggered?: boolean;
  periodicEffects?: CommandHitEffectDefinition[];
};

export const COMBAT_STATUS_DEFINITIONS: Record<SupportedCombatStatusId, CombatStatusDefinition> = {
  bladebreaking: {
    id: "bladebreaking",
    label: { en: "Bladebreaking", zh: "折刃" },
    defaultKind: "actor_buff",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "actor_buff",
    enemyApplicationModel: "enemy_status",
  },
  team_link: {
    id: "team_link",
    label: { en: "Link", zh: "链接" },
    defaultKind: "link_status",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 4,
    operatorApplicationModel: "team_link_status",
  },
  team_encumbered: {
    id: "team_encumbered",
    label: { en: "Team: Encumbered", zh: "队列：重负" },
    defaultKind: "team_status",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "team_status",
  },
  team_encumbered_suppression: {
    id: "team_encumbered_suppression",
    label: { en: "Team: Encumbered Suppression", zh: "队列：重负抑制" },
    defaultKind: "team_status",
    defaultTimeScale: "game",
    defaultDurationSeconds: 12,
    defaultHidden: true,
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "team_status",
  },
  contract_battle_chill_cooldown: {
    id: "contract_battle_chill_cooldown",
    label: { en: "Team: Battle Chill Cooldown", zh: "队列：失温冷却" },
    defaultKind: "special_stack",
    defaultTimeScale: "real",
    defaultHidden: true,
    defaultDurationSeconds: 3,
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "actor_status",
  },
  contract_regeneration: {
    id: "contract_regeneration",
    label: { en: "Edit: Regeneration", zh: "改写：愈合" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
  },
  powerful_decapitation: {
    id: "powerful_decapitation",
    label: { en: "Powerful Decapitation", zh: "斩首蓄势" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    defaultDurationSeconds: Number.POSITIVE_INFINITY,
    defaultHidden: true,
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
    periodIntervalSeconds: 2,
    periodicRequiresEnemyNotCrowdControlled: true,
    periodicRequiresEnemyNotStaggered: true,
    periodicEffects: [{
      type: "APPLY_STATUS",
      target: "enemy",
      statusId: "battle_skill_barrier",
      label: "Battle Skill Barrier",
      durationSeconds: 3,
      timeScale: "game",
      hidden: false,
      blocksIncomingAttackTypes: ["BATTLE_SKILL"],
      disableStatusIds: ["powerful_decapitation"],
    }],
  },
  battle_skill_barrier: {
    id: "battle_skill_barrier",
    label: { en: "Battle Skill Barrier", zh: "战技屏障" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    defaultDurationSeconds: 3,
    allowPermanent: false,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
    blocksIncomingAttackTypes: ["BATTLE_SKILL"],
    disableStatusIds: ["powerful_decapitation"],
  },
  estella_cryo_infliction_immunity: {
    id: "estella_cryo_infliction_immunity",
    label: { en: "Cryo Infliction Immunity", zh: "寒冷附着免疫" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    defaultHidden: true,
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "actor_status",
    blocksOperatorArtsInflictionElements: ["Cryo"],
  },
  tangtang_olden_stare_crowd_control: {
    id: "tangtang_olden_stare_crowd_control",
    label: { en: "Olden Stare", zh: "古老图形" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    defaultDurationSeconds: 0.5,
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
  },
  lift: {
    id: "lift",
    label: { en: "Lift", zh: "击飞" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
  },
  knockdown: {
    id: "knockdown",
    label: { en: "Knockdown", zh: "倒地" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
  },
  solidification: {
    id: "solidification",
    label: { en: "Solidification", zh: "冻结" },
    defaultKind: "reaction_status",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    operatorApplicationModel: "actor_status",
    enemyApplicationModel: "enemy_status",
  },
  endministrator_originium_crystal: {
    id: "endministrator_originium_crystal",
    label: { en: "Originium Crystal", zh: "源石晶体" },
    defaultKind: "special_stack",
    defaultTimeScale: "game",
    allowPermanent: true,
    maxStacks: 1,
    enemyApplicationModel: "enemy_status",
  },
  vulnerability: {
    id: "vulnerability",
    label: { en: "Vulnerability", zh: "脆弱" },
    defaultKind: "infliction",
    defaultTimeScale: "game",
    defaultDurationSeconds: 20,
    allowPermanent: true,
    maxStacks: 4,
    enemyApplicationModel: "enemy_vulnerability",
  },
  heat_infliction: {
    id: "heat_infliction",
    label: { en: "Heat Infliction", zh: "灼热附着" },
    defaultKind: "infliction",
    defaultTimeScale: "game",
    defaultDurationSeconds: 20,
    allowPermanent: true,
    maxStacks: 4,
    operatorApplicationModel: "actor_arts_infliction",
    enemyApplicationModel: "enemy_arts_infliction",
    element: "Heat",
  },
  cryo_infliction: {
    id: "cryo_infliction",
    label: { en: "Cryo Infliction", zh: "寒冷附着" },
    defaultKind: "infliction",
    defaultTimeScale: "game",
    defaultDurationSeconds: 20,
    allowPermanent: true,
    maxStacks: 4,
    operatorApplicationModel: "actor_arts_infliction",
    enemyApplicationModel: "enemy_arts_infliction",
    element: "Cryo",
  },
  electric_infliction: {
    id: "electric_infliction",
    label: { en: "Electric Infliction", zh: "电磁附着" },
    defaultKind: "infliction",
    defaultTimeScale: "game",
    defaultDurationSeconds: 20,
    allowPermanent: true,
    maxStacks: 4,
    operatorApplicationModel: "actor_arts_infliction",
    enemyApplicationModel: "enemy_arts_infliction",
    element: "Electric",
  },
  nature_infliction: {
    id: "nature_infliction",
    label: { en: "Nature Infliction", zh: "自然附着" },
    defaultKind: "infliction",
    defaultTimeScale: "game",
    defaultDurationSeconds: 20,
    allowPermanent: true,
    maxStacks: 4,
    operatorApplicationModel: "actor_arts_infliction",
    enemyApplicationModel: "enemy_arts_infliction",
    element: "Nature",
  },
};

export function getCombatStatusDefinition(statusId: string): CombatStatusDefinition | null {
  if (!(statusId in COMBAT_STATUS_DEFINITIONS)) {
    return null;
  }
  return COMBAT_STATUS_DEFINITIONS[statusId as SupportedCombatStatusId];
}

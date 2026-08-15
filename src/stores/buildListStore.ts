import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  BUILD_LIST_STORAGE_KEY,
  BUILD_STORE_STORAGE_KEY,
  ROTATION_CONTRACTS_STORAGE_KEY,
  ROTATION_ENEMY_COMMANDS_STORAGE_KEY,
  ROTATION_SCHEMES_STORAGE_KEY,
  ROTATION_SP_STORAGE_KEY,
} from "@/lib/storageKeys";
import type { BuildStoreStateSnapshot } from "@/stores/buildStore";
import { createDefaultBuildStoreStateSnapshot } from "@/stores/buildStore";
import type { RotationSchemesState } from "@/lib/combat/rotationSchemes";
import {
  makeDefaultBuildStageSettings,
  migrateLegacyStageEnemyIds,
  normalizeBuildStageSettings,
  normalizeCustomStageDefinitions,
  type CustomStageDefinition,
  type BuildStageSettings,
} from "@/lib/stages/stageSettings";
import { createDefaultRotationSchemesState } from "@/lib/combat/rotationSchemes";
import defaultTemplateBuildsSeed from "@/data/defaultTemplateBuilds.json";

export type BuildLocale = "en" | "zh-CN";
export type LocalizedBuildText = Partial<Record<BuildLocale, string>>;

export type BuildSummarySnapshot = {
  totalDamage: number | null;
  dps: number | null;
  updatedAt: number | null;
};

export type DamageTallyTiming = {
  enabled: boolean;
  startTime: number;
  endTime: number;
};

export type SavedBuildScopedRotationUiState = {
  sp: unknown;
  contracts: unknown;
};

export type SavedBuild = {
  id: string;
  name: string;
  description?: string;
  nameByLocale?: LocalizedBuildText;
  descriptionByLocale?: LocalizedBuildText;
  currentBuildState: BuildStoreStateSnapshot;
  plannedBuildState: BuildStoreStateSnapshot;
  rotationState: RotationSchemesState;
  stageSettings: BuildStageSettings;
  customStages?: CustomStageDefinition[];
  scopedRotationUiState?: SavedBuildScopedRotationUiState;
  summary: BuildSummarySnapshot;
  damageTallyTiming: DamageTallyTiming;
  compareSettings?: {
    enabled: boolean;
    leftVariantIndex: number;
    rightVariantIndex: number;
  };
};

function makeBuildId() {
  return `build_${Math.random().toString(36).slice(2, 10)}`;
}

function makeDefaultBuild(index: number): SavedBuild {
  return {
    id: makeBuildId(),
    name: `Build ${index}`,
    description: "",
    nameByLocale: {},
    descriptionByLocale: {},
    currentBuildState: createDefaultBuildStoreStateSnapshot(),
    plannedBuildState: createDefaultBuildStoreStateSnapshot(),
    rotationState: createDefaultRotationSchemesState(),
    stageSettings: makeDefaultBuildStageSettings(),
    customStages: [],
    scopedRotationUiState: {
      sp: null,
      contracts: null,
    },
    summary: {
      totalDamage: null,
      dps: null,
      updatedAt: null,
    },
    damageTallyTiming: {
      enabled: false,
      startTime: 0,
      endTime: 60,
    },
    compareSettings: {
      enabled: false,
      leftVariantIndex: 0,
      rightVariantIndex: 1,
    },
  };
}

function normalizeLocalizedBuildText(value: unknown): LocalizedBuildText {
  if (!value || typeof value !== "object") {
    return {};
  }
  const record = value as Record<string, unknown>;
  const out: LocalizedBuildText = {};
  if (typeof record.en === "string") {
    const trimmed = record.en.trim();
    if (trimmed) {
      out.en = trimmed;
    }
  }
  if (typeof record["zh-CN"] === "string") {
    const trimmed = record["zh-CN"].trim();
    if (trimmed) {
      out["zh-CN"] = trimmed;
    }
  }
  return out;
}

function getOtherLocale(locale: BuildLocale): BuildLocale {
  return locale === "zh-CN" ? "en" : "zh-CN";
}

function getLocalizedBuildText(
  localized: LocalizedBuildText | null | undefined,
  locale: BuildLocale,
  legacyFallback = "",
): string {
  const primary = localized?.[locale]?.trim();
  if (primary) {
    return primary;
  }
  const secondary = localized?.[getOtherLocale(locale)]?.trim();
  if (secondary) {
    return secondary;
  }
  return legacyFallback.trim();
}

export function getSavedBuildLocalizedName(build: SavedBuild, locale: BuildLocale): string {
  return getLocalizedBuildText(build.nameByLocale, locale, build.name);
}

export function getSavedBuildLocalizedDescription(build: SavedBuild, locale: BuildLocale): string {
  return getLocalizedBuildText(build.descriptionByLocale, locale, build.description ?? "");
}

export function makeDefaultExampleBuildZhuangFangyi(): SavedBuild {
  return cloneJson({
    id: "build_rs8ospee",
    name: "Build 1",
    currentBuildState: {
      slots: [
        {
          id: "slot_1",
          label: "Character 1",
          selectedCharId: "zhuangfangyi",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: false, TALENT_3: false, TALENT_4: false },
          uniqueTalentToggles: {
            zhuangfangyi_force_of_nature_1: true,
            zhuangfangyi_force_of_nature_2: true,
            zhuangfangyi_ordained_by_heaven_1: true,
            zhuangfangyi_ordained_by_heaven_2: true,
          },
          characterSkillLevels: { basic: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "lone_barge",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_expend_spell01_body_02", subLevels: [3, 3, 3] },
          gloves: { gearId: "item_equip_t4_suit_expend_spell01_hand_02", subLevels: [3, 3, 3] },
          kit1: { gearId: "item_equip_t4_suit_expend_spell01_edc_02", subLevels: [3, 3, 3] },
          kit2: { gearId: "item_equip_t4_suit_heal01_edc_03", subLevels: [3, 3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "zhuangfangyi::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_2",
          label: "Character 2",
          selectedCharId: "perlica",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            perlica_talent_staggered_damage_1: true,
            perlica_talent_staggered_damage_2: true,
            perlica_talent_combo_chain_1: true,
          },
          characterSkillLevels: { basic: 1, battleSkill: 1, comboSkill: 1, ultimate: 9 },
          selectedWeaponId: "detonation_unit",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [7, 5, 9],
          armor: { gearId: "item_equip_t4_suit_pulse_cryst01_body_01", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t3_suit_usp01_hand_01", subLevels: [0, 0, 0] },
          kit1: { gearId: "item_equip_t3_suit_usp01_edc_03", subLevels: [0, 0, 0] },
          kit2: { gearId: "item_equip_t3_suit_usp01_edc_03", subLevels: [0, 0, 0] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "perlica::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_3",
          label: "Character 3",
          selectedCharId: "endministrator",
          characterAscension: 4,
          characterPotential: 2,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            endministrator_essence_disintegration_1: true,
            endministrator_essence_disintegration_2: true,
            endministrator_realspace_stasis_1: true,
            endministrator_realspace_stasis_2: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 9, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "eminent_repute",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [3, 3, 9],
          armor: { gearId: "item_equip_t4_suit_phy01_body_02", subLevels: [3, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [3, 0, 3] },
          kit1: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [0, 0] },
          kit2: { gearId: "item_equip_t4_suit_phy01_edc_03", subLevels: [3, 0, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "endministrator::forgeborn_scathe": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_4",
          label: "Character 4",
          selectedCharId: "gilberta",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            gilberta_messengers_song_1: true,
            gilberta_messengers_song_2: true,
            gilberta_belated_reply_1: true,
            gilberta_belated_reply_2: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 6, comboSkill: 9, ultimate: 10 },
          selectedWeaponId: "stanza_of_memorials",
          weaponAscension: 0,
          weaponPotential: 5,
          weaponLevel: 20,
          weaponSkillLevels: [3, 3, 9],
          armor: { gearId: "item_equip_t4_suit_phy01_body_02", subLevels: [3, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [0, 3, 3] },
          kit1: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [3, 3] },
          kit2: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "gilberta::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
      ],
      activeSlotIndex: 0,
      activeVariantIndex: 0,
    },
    plannedBuildState: {
      slots: [
        {
          id: "slot_1",
          label: "Character 1",
          selectedCharId: "zhuangfangyi",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: false, TALENT_3: false, TALENT_4: false },
          uniqueTalentToggles: {
            zhuangfangyi_force_of_nature_1: true,
            zhuangfangyi_force_of_nature_2: true,
            zhuangfangyi_ordained_by_heaven_1: true,
            zhuangfangyi_ordained_by_heaven_2: true,
          },
          characterSkillLevels: { basic: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "lone_barge",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_expend_spell01_body_02", subLevels: [3, 3, 3] },
          gloves: { gearId: "item_equip_t4_suit_expend_spell01_hand_02", subLevels: [3, 3, 3] },
          kit1: { gearId: "item_equip_t4_suit_expend_spell01_edc_02", subLevels: [3, 3, 3] },
          kit2: { gearId: "item_equip_t4_suit_heal01_edc_03", subLevels: [3, 3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "zhuangfangyi::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_2",
          label: "Character 2",
          selectedCharId: "perlica",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            perlica_talent_staggered_damage_1: true,
            perlica_talent_staggered_damage_2: true,
            perlica_talent_combo_chain_1: true,
          },
          characterSkillLevels: { basic: 1, battleSkill: 1, comboSkill: 1, ultimate: 9 },
          selectedWeaponId: "detonation_unit",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [7, 5, 9],
          armor: { gearId: "item_equip_t4_suit_pulse_cryst01_body_01", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t3_suit_usp01_hand_01", subLevels: [0, 0, 0] },
          kit1: { gearId: "item_equip_t3_suit_usp01_edc_03", subLevels: [0, 0, 0] },
          kit2: { gearId: "item_equip_t3_suit_usp01_edc_03", subLevels: [0, 0, 0] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "perlica::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_3",
          label: "Character 3",
          selectedCharId: "endministrator",
          characterAscension: 4,
          characterPotential: 2,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            endministrator_essence_disintegration_1: true,
            endministrator_essence_disintegration_2: true,
            endministrator_realspace_stasis_1: true,
            endministrator_realspace_stasis_2: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 9, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "eminent_repute",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [3, 3, 9],
          armor: { gearId: "item_equip_t4_suit_phy01_body_02", subLevels: [3, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [3, 0, 3] },
          kit1: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [0, 0] },
          kit2: { gearId: "item_equip_t4_suit_phy01_edc_03", subLevels: [3, 0, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "endministrator::forgeborn_scathe": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
        {
          id: "slot_4",
          label: "Character 4",
          selectedCharId: "gilberta",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            gilberta_messengers_song_1: true,
            gilberta_messengers_song_2: true,
            gilberta_belated_reply_1: true,
            gilberta_belated_reply_2: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 6, comboSkill: 9, ultimate: 10 },
          selectedWeaponId: "stanza_of_memorials",
          weaponAscension: 0,
          weaponPotential: 5,
          weaponLevel: 20,
          weaponSkillLevels: [3, 3, 9],
          armor: { gearId: "item_equip_t4_suit_phy01_body_02", subLevels: [3, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [0, 3, 3] },
          kit1: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [3, 3] },
          kit2: { gearId: "item_equip_t4_suit_phy01_edc_01", subLevels: [3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {
            "gilberta::delivery_guaranteed": {
              weaponAscension: 4,
              weaponPotential: 0,
              weaponLevel: 90,
              weaponSkillLevels: [9, 9, 4],
            },
          },
        },
      ],
      activeSlotIndex: 0,
      activeVariantIndex: 0,
    },
    rotationState: {
      schemes: [
        {
          id: "rotation_r9uv4v9n",
          name: "Rotation 1",
          rotation: {
            steps: [
              { id: "step_96jjdbzo", slot: 0, commandId: "zhuangfangyi_ultimate", startTime: -1.7000000000000002 },
              { id: "step_l49y5g5y", slot: 0, commandId: "zhuangfangyi_ultimate_basic_sequence_1", startTime: -0.1 },
              { id: "step_8v1b7hmj", slot: 0, commandId: "zhuangfangyi_ultimate_basic_sequence_2", startTime: 0.6000000000000001 },
              { id: "step_onjilndj", slot: 0, commandId: "zhuangfangyi_ultimate_basic_sequence_3", startTime: 3.6 },
              { id: "step_gkuscsg5", slot: 1, commandId: "perlica_battle_skill", startTime: 3.5 },
              { id: "step_l4r8zdwb", slot: 0, commandId: "zhuangfangyi_ultimate_battle_skill", startTime: 2 },
              { id: "step_w078oa3m", slot: 0, commandId: "zhuangfangyi_ultimate_combo_skill", startTime: 4.6000000000000005 },
              { id: "step_si4okkx4", slot: 1, commandId: "perlica_combo_skill", startTime: 4.7 },
              { id: "step_k8kachiu", slot: 2, commandId: "endministrator_combo_skill", startTime: 5.6000000000000005 },
              { id: "step_otkow04g", slot: 3, commandId: "gilberta_combo_skill", startTime: 5.9 },
              { id: "step_hjmrm9y5", slot: 3, commandId: "gilberta_ultimate", startTime: 7.6000000000000005 },
              { id: "step_xxojc2tm", slot: 2, commandId: "endministrator_battle_skill", startTime: 9 },
              { id: "step_4fjw6bsd", slot: 0, commandId: "zhuangfangyi_ultimate_battle_skill", startTime: 9.1 },
            ],
            groups: [],
            critRiggingRules: [
              {
                id: "crit_rig_nsz81mwp",
                stepId: "step_4fjw6bsd",
                hitIndex: -2,
                repeatIndex: 0,
                executeCritRigId: "final_thunder_strike",
                mode: "force_crit",
                enabled: true,
              },
              {
                id: "crit_rig_h9r6dzxz",
                stepId: "step_4fjw6bsd",
                hitIndex: -2,
                repeatIndex: 0,
                executeCritRigId: "thunder_strike",
                mode: "force_non_crit",
                enabled: true,
              },
            ],
          },
        },
      ],
      activeSchemeId: "rotation_r9uv4v9n",
      selectedEnemyId: "rhodagn",
      enemyLevel: 90,
    },
    summary: {
      totalDamage: 1690360.9125437036,
      dps: 115778.14469477422,
      updatedAt: 1781509719501,
    },
    damageTallyTiming: {
      enabled: false,
      startTime: 0,
      endTime: 60,
    },
    compareSettings: {
      enabled: false,
      leftVariantIndex: 0,
      rightVariantIndex: 1,
    },
  }) as unknown as SavedBuild;
}

export function makeDefaultExampleBuildLastRite(): SavedBuild {
  return cloneJson({
    id: "build_sb34yazo",
    name: "别礼大王11秒罗丹",
    currentBuildState: {
      slots: [
        {
          id: "slot_1",
          label: "Character 1",
          selectedCharId: "lastrite",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            lastrite_talent_cryo_sus_1: true,
            lastrite_talent_cryo_sus_2: true,
            lastrite_talent_ult_sus_scale_1: true,
            lastrite_talent_ult_sus_scale_2: true,
          },
          characterSkillLevels: { basic: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "khravengger",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_attri01_body_03", subLevels: [1, 3, 3] },
          gloves: { gearId: "item_equip_t4_suit_burst01_hand_01", subLevels: [3, 1, 3] },
          kit1: { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 1, 3] },
          kit2: { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 2, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_2",
          label: "Character 2",
          selectedCharId: "ardelia",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            ardelia_friendly_presence_1: true,
            ardelia_friendly_presence_2: true,
            ardelia_friendly_presence_3: true,
            ardelia_mountainpeak_surfer: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 12, comboSkill: 9, ultimate: 10 },
          selectedWeaponId: "dreams_of_the_starry_beach",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 4, 9],
          armor: { gearId: "item_equip_t4_suit_criti01_body_03", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t4_suit_fire_natr01_hand_03", subLevels: [0, 0, 0] },
          kit1: { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] },
          kit2: { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_3",
          label: "Character 3",
          selectedCharId: "xaihi",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            xaihi_execute_process_1: true,
            xaihi_execute_process_2: true,
            xaihi_freeze_protocol: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 10, comboSkill: 9, ultimate: 12 },
          selectedWeaponId: "detonation_unit",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_usp02_body_01", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t4_suit_usp02_hand_02", subLevels: [3, 0, 0] },
          kit1: { gearId: "item_equip_t4_suit_usp02_edc_02", subLevels: [0, 0, 0] },
          kit2: { gearId: "item_equip_t4_suit_atb01_edc_04", subLevels: [0, 3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_4",
          label: "Character 4",
          selectedCharId: "perlica",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            perlica_talent_staggered_damage_1: true,
            perlica_talent_staggered_damage_2: true,
            perlica_talent_combo_chain_1: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 9, comboSkill: 9, ultimate: 9 },
          selectedWeaponId: "stanza_of_memorials",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [7, 3, 9],
          armor: { gearId: "item_equip_t4_suit_pulse_cryst01_body_01", subLevels: [0, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [0, 0, 2] },
          kit1: { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] },
          kit2: { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
      ],
      activeSlotIndex: 2,
      activeVariantIndex: 0,
    },
    plannedBuildState: {
      slots: [
        {
          id: "slot_1",
          label: "Character 1",
          selectedCharId: "lastrite",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            lastrite_talent_cryo_sus_1: true,
            lastrite_talent_cryo_sus_2: true,
            lastrite_talent_ult_sus_scale_1: true,
            lastrite_talent_ult_sus_scale_2: true,
          },
          characterSkillLevels: { basic: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          selectedWeaponId: "khravengger",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_attri01_body_03", subLevels: [1, 3, 3] },
          gloves: { gearId: "item_equip_t4_suit_burst01_hand_01", subLevels: [3, 1, 3] },
          kit1: { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 1, 3] },
          kit2: { gearId: "item_equip_t4_suit_burst01_edc_01", subLevels: [3, 2, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_2",
          label: "Character 2",
          selectedCharId: "ardelia",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            ardelia_friendly_presence_1: true,
            ardelia_friendly_presence_2: true,
            ardelia_friendly_presence_3: true,
            ardelia_mountainpeak_surfer: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 12, comboSkill: 9, ultimate: 10 },
          selectedWeaponId: "dreams_of_the_starry_beach",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 4, 9],
          armor: { gearId: "item_equip_t4_suit_criti01_body_03", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t4_suit_fire_natr01_hand_03", subLevels: [0, 0, 0] },
          kit1: { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] },
          kit2: { gearId: "item_equip_t4_suit_fire_natr01_edc_02", subLevels: [0, 0] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_3",
          label: "Character 3",
          selectedCharId: "xaihi",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            xaihi_execute_process_1: true,
            xaihi_execute_process_2: true,
            xaihi_freeze_protocol: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 10, comboSkill: 9, ultimate: 12 },
          selectedWeaponId: "detonation_unit",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [9, 9, 9],
          armor: { gearId: "item_equip_t4_suit_usp02_body_01", subLevels: [0, 0, 0] },
          gloves: { gearId: "item_equip_t4_suit_usp02_hand_02", subLevels: [3, 0, 0] },
          kit1: { gearId: "item_equip_t4_suit_usp02_edc_02", subLevels: [0, 0, 0] },
          kit2: { gearId: "item_equip_t4_suit_atb01_edc_04", subLevels: [0, 3, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
        {
          id: "slot_4",
          label: "Character 4",
          selectedCharId: "perlica",
          characterAscension: 4,
          characterPotential: 5,
          level: 90,
          characterTalentToggles: { TALENT_1: true, TALENT_2: true, TALENT_3: true, TALENT_4: true },
          uniqueTalentToggles: {
            perlica_talent_staggered_damage_1: true,
            perlica_talent_staggered_damage_2: true,
            perlica_talent_combo_chain_1: true,
          },
          characterSkillLevels: { basic: 9, battleSkill: 9, comboSkill: 9, ultimate: 9 },
          selectedWeaponId: "stanza_of_memorials",
          weaponAscension: 4,
          weaponPotential: 5,
          weaponLevel: 90,
          weaponSkillLevels: [7, 3, 9],
          armor: { gearId: "item_equip_t4_suit_pulse_cryst01_body_01", subLevels: [0, 0, 3] },
          gloves: { gearId: "item_equip_t4_suit_poise01_hand_01", subLevels: [0, 0, 2] },
          kit1: { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] },
          kit2: { gearId: "item_equip_t4_suit_pulse_cryst01_edc_02", subLevels: [0, 3] },
          activeBuffs: [],
          characterBuilds: {},
          weaponBuilds: {},
        },
      ],
      activeSlotIndex: 2,
      activeVariantIndex: 0,
    },
    rotationState: {
      schemes: [
        {
          id: "rotation_xpzih3i3",
          name: "Rotation 1",
          rotation: {
            steps: [
              { id: "step_yx248t0q", slot: 0, commandId: "lastrite_battle_skill", startTime: -9.9 },
              { id: "step_r7a98fhj", slot: 2, commandId: "xaihi_battle_skill", startTime: -9.2 },
              { id: "step_rbtfoijo", slot: 2, commandId: "xaihi_ultimate", startTime: -5.3 },
              { id: "step_0ll65ix7", slot: 1, commandId: "ardelia_ultimate", startTime: -3.7 },
              { id: "step_d99fzzg9", slot: 3, commandId: "perlica_ultimate", startTime: -1.9 },
              { id: "step_yw36e18u", slot: 0, commandId: "lastrite_basic_sequence_1", startTime: -8.9, groupId: "group_dlwvzyjf" },
              { id: "step_mc4sfksf", slot: 0, commandId: "lastrite_basic_sequence_2", startTime: -8.3, groupId: "group_dlwvzyjf" },
              { id: "step_vb0qnjs4", slot: 0, commandId: "lastrite_basic_sequence_3", startTime: -7.5, groupId: "group_dlwvzyjf" },
              { id: "step_sayh2y3n", slot: 0, commandId: "lastrite_basic_sequence_4", startTime: -5.7, groupId: "group_dlwvzyjf" },
              { id: "step_o34mcvu9", slot: 2, commandId: "__switch", startTime: 0.3 },
              { id: "step_y5x7jpux", slot: 2, commandId: "xaihi_basic_sequence_1", startTime: 0.6 },
              { id: "step_50cdfocb", slot: 2, commandId: "xaihi_basic_sequence_2", startTime: 1.1 },
              { id: "step_1r8o9gqg", slot: 2, commandId: "xaihi_basic_sequence_3", startTime: 1.7 },
              { id: "step_7b12jbas", slot: 2, commandId: "xaihi_basic_sequence_4", startTime: 2.2 },
              { id: "step_n1002i5p", slot: 2, commandId: "xaihi_basic_sequence_5", startTime: 2.9 },
              { id: "step_a4k932pm", slot: 0, commandId: "lastrite_battle_skill", startTime: 0.6 },
              { id: "step_zcgyg92f", slot: 2, commandId: "xaihi_combo_skill", startTime: 3.7 },
              { id: "step_102updpe", slot: 3, commandId: "perlica_combo_skill", startTime: 3.7 },
              { id: "step_8f4unvna", slot: 1, commandId: "ardelia_combo_skill", startTime: 3.7 },
              { id: "step_yor7p2qw", slot: 2, commandId: "xaihi_basic_sequence_1", startTime: 4.7 },
              { id: "step_2utrngbe", slot: 2, commandId: "xaihi_basic_sequence_2", startTime: 5.8 },
              { id: "step_d40hb14d", slot: 2, commandId: "xaihi_basic_sequence_3", startTime: 6.3 },
              { id: "step_j5fh0b24", slot: 2, commandId: "xaihi_basic_sequence_4", startTime: 6.8 },
              { id: "step_ps6kgcpg", slot: 2, commandId: "xaihi_basic_sequence_5", startTime: 7 },
              { id: "step_wqic1zyf", slot: 0, commandId: "lastrite_battle_skill", startTime: 5.8 },
              { id: "step_v5h1csgs", slot: 1, commandId: "ardelia_battle_skill", startTime: 6.2 },
              { id: "step_lx6tljsh", slot: 0, commandId: "lastrite_combo_skill", startTime: 8.2 },
            ],
            groups: [{ id: "group_dlwvzyjf", name: "group 1" }],
            critRiggingRules: [],
          },
        },
      ],
      activeSchemeId: "rotation_xpzih3i3",
      selectedEnemyId: "rhodagn",
      enemyLevel: 90,
    },
    summary: {
      totalDamage: 2125795.324985119,
      dps: 193959.4274621459,
      updatedAt: 1781247045717,
    },
    damageTallyTiming: {
      enabled: false,
      startTime: 0,
      endTime: 60,
    },
    compareSettings: {
      enabled: false,
      leftVariantIndex: 0,
      rightVariantIndex: 1,
    },
  }) as unknown as SavedBuild;
}

function seedDefaultRotationUiStateForBuild(build: SavedBuild) {
  if (typeof window === "undefined") {
    return;
  }

  const rotationSchemesRaw = window.localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
  let rotationSchemesParsed: { byBuild?: Record<string, RotationSchemesState> } = {};
  if (rotationSchemesRaw) {
    try {
      rotationSchemesParsed = JSON.parse(rotationSchemesRaw) as typeof rotationSchemesParsed;
    } catch {
      rotationSchemesParsed = {};
    }
  }
  if (!rotationSchemesParsed.byBuild) {
    rotationSchemesParsed.byBuild = {};
  }
  rotationSchemesParsed.byBuild[build.id] = cloneJson(build.rotationState);
  window.localStorage.setItem(ROTATION_SCHEMES_STORAGE_KEY, JSON.stringify(rotationSchemesParsed));

  const activeSchemeId = build.rotationState.activeSchemeId;
  if (!activeSchemeId) {
    return;
  }

  const spRaw = window.localStorage.getItem(ROTATION_SP_STORAGE_KEY);
  let spParsed: { byBuild?: Record<string, { byScheme?: Record<string, unknown> }> } = {};
  if (spRaw) {
    try {
      spParsed = JSON.parse(spRaw) as typeof spParsed;
    } catch {
      spParsed = {};
    }
  }
  if (!spParsed.byBuild) {
    spParsed.byBuild = {};
  }
  const seededSpState = build.scopedRotationUiState?.sp;
  if (seededSpState && typeof seededSpState === "object") {
    spParsed.byBuild[build.id] = cloneJson(seededSpState) as { byScheme?: Record<string, unknown> };
  } else {
    const defaultConsumableBySlot =
      build.id === "build_sb34yazo" || build.id === "build_rs8ospee"
        ? ["item_corp3_animal_1", null, null, null]
        : [null, null, null, null];
    spParsed.byBuild[build.id] = {
      byScheme: {
        [activeSchemeId]: {
          initialSp: 200,
          spRegenRate: 8,
          startingEnergyBySlot: [100, 100, 100, 100],
          consumableBySlot: defaultConsumableBySlot,
        },
      },
    };
  }
  window.localStorage.setItem(ROTATION_SP_STORAGE_KEY, JSON.stringify(spParsed));

  const enemyRaw = window.localStorage.getItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY);
  if (enemyRaw) {
    try {
      const enemyParsed = JSON.parse(enemyRaw) as { byBuild?: Record<string, unknown> };
      if (enemyParsed.byBuild && build.id in enemyParsed.byBuild) {
        delete enemyParsed.byBuild[build.id];
        window.localStorage.setItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY, JSON.stringify(enemyParsed));
      }
    } catch {
      // Ignore legacy enemy-command cleanup failures.
    }
  }

  const contractsRaw = window.localStorage.getItem(ROTATION_CONTRACTS_STORAGE_KEY);
  let contractsParsed: { byBuild?: Record<string, { byScheme?: Record<string, unknown[]> }> } = {};
  if (contractsRaw) {
    try {
      contractsParsed = JSON.parse(contractsRaw) as typeof contractsParsed;
    } catch {
      contractsParsed = {};
    }
  }
  if (!contractsParsed.byBuild) {
    contractsParsed.byBuild = {};
  }
  const seededContractState = build.scopedRotationUiState?.contracts;
  if (seededContractState && typeof seededContractState === "object") {
    contractsParsed.byBuild[build.id] = cloneJson(seededContractState) as { byScheme?: Record<string, unknown[]> };
  } else {
    contractsParsed.byBuild[build.id] = {
      byScheme: {
        [activeSchemeId]: [],
      },
    };
  }
  window.localStorage.setItem(ROTATION_CONTRACTS_STORAGE_KEY, JSON.stringify(contractsParsed));
}

function seedDefaultRotationUiStateForBuilds(builds: SavedBuild[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ROTATION_SCHEMES_STORAGE_KEY, JSON.stringify({ byBuild: {} }));
  window.localStorage.setItem(ROTATION_SP_STORAGE_KEY, JSON.stringify({ byBuild: {} }));
  window.localStorage.setItem(ROTATION_ENEMY_COMMANDS_STORAGE_KEY, JSON.stringify({ byBuild: {} }));
  window.localStorage.setItem(ROTATION_CONTRACTS_STORAGE_KEY, JSON.stringify({ byBuild: {} }));
  for (const build of builds) {
    seedDefaultRotationUiStateForBuild(build);
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function coerceBuildStateSnapshot(value: unknown): BuildStoreStateSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<BuildStoreStateSnapshot>;
  if (!Array.isArray(maybe.slots) || maybe.slots.length !== 4) {
    return null;
  }

  const activeSlotIndex =
    typeof maybe.activeSlotIndex === "number" && maybe.activeSlotIndex >= 0 && maybe.activeSlotIndex < 4
      ? maybe.activeSlotIndex
      : 0;

  return {
    slots: cloneJson(maybe.slots),
    activeSlotIndex,
  };
}

function coerceRotationStateSnapshot(value: unknown): RotationSchemesState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<RotationSchemesState>;
  if (!Array.isArray(maybe.schemes) || maybe.schemes.length === 0) {
    return null;
  }

  return cloneJson(maybe as RotationSchemesState);
}

function mergeLegacyEnemyCommandsIntoRotationState(
  rotationState: RotationSchemesState,
  legacyEnemyCommandsState: unknown,
): RotationSchemesState {
  if (!legacyEnemyCommandsState || typeof legacyEnemyCommandsState !== "object") {
    return rotationState;
  }
  const byScheme =
    (legacyEnemyCommandsState as { byScheme?: Record<string, Record<string, unknown[]>> }).byScheme;
  if (!byScheme || typeof byScheme !== "object") {
    return rotationState;
  }
  const next = cloneJson(rotationState);
  for (const scheme of next.schemes) {
    if (!scheme.enemyCommandsByEnemy) {
      scheme.enemyCommandsByEnemy = {};
    }
    const legacyByEnemy = byScheme[scheme.id];
    if (!legacyByEnemy || typeof legacyByEnemy !== "object") {
      continue;
    }
    for (const [enemyId, placements] of Object.entries(legacyByEnemy)) {
      if (!Array.isArray(placements) || scheme.enemyCommandsByEnemy[enemyId]) {
        continue;
      }
      scheme.enemyCommandsByEnemy[enemyId] = cloneJson(placements) as never;
    }
  }
  return next;
}

function readScopedRotationStateFromStorage(buildId: string): RotationSchemesState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const byBuild = record.byBuild;
    if (byBuild && typeof byBuild === "object") {
      const scoped = (byBuild as Record<string, unknown>)[buildId];
      return coerceRotationStateSnapshot(scoped);
    }
    return coerceRotationStateSnapshot(parsed);
  } catch {
    return null;
  }
}

function loadLegacySingleBuild(): { buildState: BuildStoreStateSnapshot; rotationState: RotationSchemesState } | null {
  try {
    const legacyBuildRaw = localStorage.getItem(BUILD_STORE_STORAGE_KEY);
    const legacyRotationRaw = localStorage.getItem(ROTATION_SCHEMES_STORAGE_KEY);
    const legacyBuild = legacyBuildRaw ? coerceBuildStateSnapshot(JSON.parse(legacyBuildRaw)) : null;
    const legacyRotation = legacyRotationRaw ? coerceRotationStateSnapshot(JSON.parse(legacyRotationRaw)) : null;
    if (!legacyBuild || !legacyRotation) {
      return null;
    }
    return {
      buildState: legacyBuild,
      rotationState: legacyRotation,
    };
  } catch (error) {
    console.warn("Failed to migrate legacy single-build storage", error);
    return null;
  }
}

function isBuildRuntimeBlank(build: SavedBuild): boolean {
  const hasAnyCharacter = build.currentBuildState.slots.some((slot) => Boolean(slot.selectedCharId));
  const hasAnyWeapon = build.currentBuildState.slots.some((slot) => Boolean(slot.selectedWeaponId));
  const hasAnyGear = build.currentBuildState.slots.some((slot) =>
    Boolean(slot.armor?.gearId || slot.gloves?.gearId || slot.kit1?.gearId || slot.kit2?.gearId),
  );
  const hasAnyRotationSteps = build.rotationState.schemes.some((scheme) => (scheme.rotation.steps?.length ?? 0) > 0);
  return !hasAnyCharacter && !hasAnyWeapon && !hasAnyGear && !hasAnyRotationSteps;
}

export const useBuildListStore = defineStore("buildListStore", () => {
  const MAX_BUILDS_PER_USER = 6;
  const userBuilds = ref<SavedBuild[]>([]);
  const templateBuilds = ref<SavedBuild[]>([]);
  const builds = computed(() => [...templateBuilds.value, ...userBuilds.value]);
  const activeBuildId = ref<string>("");

  function createSeededTemplateBuilds() {
    const rawBuilds = Array.isArray(defaultTemplateBuildsSeed.builds) ? defaultTemplateBuildsSeed.builds : [];
    const seededBuilds = rawBuilds.map((entry, index) =>
      normalizeStoredBuild(entry as unknown as Partial<SavedBuild> & { buildState?: BuildStoreStateSnapshot }, index),
    );
    const fallbackActiveBuildId = seededBuilds[0]?.id ?? "";
    const seededActiveBuildId =
      typeof defaultTemplateBuildsSeed.activeBuildId === "string"
      && seededBuilds.some((build) => build.id === defaultTemplateBuildsSeed.activeBuildId)
        ? defaultTemplateBuildsSeed.activeBuildId
        : fallbackActiveBuildId;
    seedDefaultRotationUiStateForBuilds(seededBuilds);
    return {
      builds: seededBuilds,
      activeBuildId: seededActiveBuildId,
    };
  }

  function normalizeStoredBuild(
    raw: Partial<SavedBuild> & { buildState?: BuildStoreStateSnapshot },
    index: number,
  ): SavedBuild {
    const fallback = makeDefaultBuild(index + 1);
    const rawBuildId = typeof raw.id === "string" && raw.id ? raw.id : fallback.id;
    const legacyBuildState =
      raw.buildState && Array.isArray(raw.buildState.slots) && raw.buildState.slots.length === 4
        ? cloneJson(raw.buildState)
        : null;
    const recoveredRotationState = readScopedRotationStateFromStorage(rawBuildId);
    const normalizedRotationState = migrateLegacyStageEnemyIds(
      raw.rotationState && Array.isArray(raw.rotationState.schemes) && raw.rotationState.schemes.length > 0
        ? mergeLegacyEnemyCommandsIntoRotationState(
            cloneJson(raw.rotationState),
            (raw as { scopedRotationUiState?: { enemyCommands?: unknown } }).scopedRotationUiState?.enemyCommands,
          )
        : recoveredRotationState
          ? mergeLegacyEnemyCommandsIntoRotationState(
              cloneJson(recoveredRotationState),
              (raw as { scopedRotationUiState?: { enemyCommands?: unknown } }).scopedRotationUiState?.enemyCommands,
            )
        : fallback.rotationState,
    );
    return {
      id: rawBuildId,
      name: typeof raw.name === "string" && raw.name ? raw.name : fallback.name,
      description: typeof raw.description === "string" ? raw.description : fallback.description,
      nameByLocale: normalizeLocalizedBuildText(raw.nameByLocale),
      descriptionByLocale: normalizeLocalizedBuildText(raw.descriptionByLocale),
      currentBuildState:
        raw.currentBuildState && Array.isArray(raw.currentBuildState.slots) && raw.currentBuildState.slots.length === 4
          ? cloneJson(raw.currentBuildState)
          : legacyBuildState ?? fallback.currentBuildState,
      plannedBuildState:
        raw.plannedBuildState && Array.isArray(raw.plannedBuildState.slots) && raw.plannedBuildState.slots.length === 4
          ? cloneJson(raw.plannedBuildState)
          : legacyBuildState ?? fallback.plannedBuildState,
      rotationState: normalizedRotationState,
      stageSettings: normalizeBuildStageSettings(raw.stageSettings),
      customStages: normalizeCustomStageDefinitions(raw.customStages),
      scopedRotationUiState: {
        sp: raw.scopedRotationUiState?.sp != null ? cloneJson(raw.scopedRotationUiState.sp) : fallback.scopedRotationUiState?.sp ?? null,
        contracts:
          raw.scopedRotationUiState?.contracts != null
            ? cloneJson(raw.scopedRotationUiState.contracts)
            : fallback.scopedRotationUiState?.contracts ?? null,
      },
      summary: {
        totalDamage:
          typeof raw.summary?.totalDamage === "number" && Number.isFinite(raw.summary.totalDamage)
            ? raw.summary.totalDamage
            : null,
        dps:
          typeof raw.summary?.dps === "number" && Number.isFinite(raw.summary.dps)
            ? raw.summary.dps
            : null,
        updatedAt:
          typeof raw.summary?.updatedAt === "number" && Number.isFinite(raw.summary.updatedAt)
            ? raw.summary.updatedAt
            : null,
      },
      damageTallyTiming: {
        enabled: raw.damageTallyTiming?.enabled === true,
        startTime:
          typeof raw.damageTallyTiming?.startTime === "number" && Number.isFinite(raw.damageTallyTiming.startTime)
            ? raw.damageTallyTiming.startTime
            : 0,
        endTime:
          typeof raw.damageTallyTiming?.endTime === "number" && Number.isFinite(raw.damageTallyTiming.endTime)
            ? raw.damageTallyTiming.endTime
            : 60,
      },
      compareSettings: {
        enabled: raw.compareSettings?.enabled === true,
        leftVariantIndex:
          typeof raw.compareSettings?.leftVariantIndex === "number"
            && Number.isFinite(raw.compareSettings.leftVariantIndex)
            && raw.compareSettings.leftVariantIndex >= 0
            && raw.compareSettings.leftVariantIndex < 4
            ? Math.trunc(raw.compareSettings.leftVariantIndex)
            : 0,
        rightVariantIndex:
          typeof raw.compareSettings?.rightVariantIndex === "number"
            && Number.isFinite(raw.compareSettings.rightVariantIndex)
            && raw.compareSettings.rightVariantIndex >= 0
            && raw.compareSettings.rightVariantIndex < 4
            ? Math.trunc(raw.compareSettings.rightVariantIndex)
            : 1,
      },
    };
  }

  function loadFromStorage() {
    const seededTemplates = createSeededTemplateBuilds();
    templateBuilds.value = seededTemplates.builds;

    const raw = localStorage.getItem(BUILD_LIST_STORAGE_KEY);
    if (!raw) {
      const legacySingleBuild = loadLegacySingleBuild();
      if (legacySingleBuild) {
        const first = makeDefaultBuild(1);
        first.currentBuildState = legacySingleBuild.buildState;
        first.plannedBuildState = cloneJson(legacySingleBuild.buildState);
        first.rotationState = legacySingleBuild.rotationState;
        userBuilds.value = [first];
        activeBuildId.value = first.id;
        return;
      }

      userBuilds.value = [];
      activeBuildId.value = seededTemplates.activeBuildId;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { builds?: Partial<SavedBuild>[]; activeBuildId?: string };
      const normalized = Array.isArray(parsed.builds)
        ? parsed.builds.map((entry, index) => normalizeStoredBuild(entry, index))
        : [];

      if (normalized.length === 0) {
        userBuilds.value = [];
      } else {
        userBuilds.value = normalized;
      }

      activeBuildId.value =
        typeof parsed.activeBuildId === "string"
        && [...seededTemplates.builds, ...normalized].some((build) => build.id === parsed.activeBuildId)
          ? parsed.activeBuildId
          : normalized[0]?.id ?? seededTemplates.activeBuildId;

      if (normalized.length === 1 && isBuildRuntimeBlank(normalized[0]!)) {
        const legacySingleBuild = loadLegacySingleBuild();
        if (legacySingleBuild) {
          normalized[0]!.currentBuildState = legacySingleBuild.buildState;
          normalized[0]!.plannedBuildState = cloneJson(legacySingleBuild.buildState);
          normalized[0]!.rotationState = legacySingleBuild.rotationState;
        }
      }
    } catch (error) {
      console.warn("Failed to load build list from localStorage", error);
      userBuilds.value = [];
      activeBuildId.value = seededTemplates.activeBuildId;
    }
  }

  function saveToStorage() {
    localStorage.setItem(
      BUILD_LIST_STORAGE_KEY,
      JSON.stringify({
        builds: userBuilds.value,
        activeBuildId: activeBuildId.value,
      }),
    );
  }

  loadFromStorage();

  watch([userBuilds, activeBuildId], saveToStorage, { deep: true });

  const activeBuild = computed(() => builds.value.find((build) => build.id === activeBuildId.value) ?? null);
  const activeBuildSource = computed<"template" | "user" | null>(() => {
    if (!activeBuildId.value) {
      return null;
    }
    if (templateBuilds.value.some((build) => build.id === activeBuildId.value)) {
      return "template";
    }
    if (userBuilds.value.some((build) => build.id === activeBuildId.value)) {
      return "user";
    }
    return null;
  });

  function findBuildById(id: string): SavedBuild | null {
    return builds.value.find((build) => build.id === id) ?? null;
  }

  function isTemplateBuild(id: string): boolean {
    return templateBuilds.value.some((build) => build.id === id);
  }

  function isUserBuild(id: string): boolean {
    return userBuilds.value.some((build) => build.id === id);
  }

  function makeUniqueBuildId(): string {
    let id = makeBuildId();
    while (builds.value.some((build) => build.id === id)) {
      id = makeBuildId();
    }
    return id;
  }

  function createBuild(): string | null {
    if (userBuilds.value.length >= MAX_BUILDS_PER_USER) {
      return null;
    }
    const next = makeDefaultBuild(userBuilds.value.length + 1);
    next.id = makeUniqueBuildId();
    userBuilds.value.push(next);
    seedDefaultRotationUiStateForBuild(next);
    return next.id;
  }

  function importBuild(raw: unknown): string | null {
    if (userBuilds.value.length >= MAX_BUILDS_PER_USER) {
      return null;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }

    const candidate = raw as Partial<SavedBuild> & { buildState?: BuildStoreStateSnapshot };
    const currentSlots = candidate.currentBuildState?.slots;
    const legacySlots = candidate.buildState?.slots;
    const schemes = candidate.rotationState?.schemes;
    if (
      (!Array.isArray(currentSlots) || currentSlots.length !== 4)
      && (!Array.isArray(legacySlots) || legacySlots.length !== 4)
    ) {
      return null;
    }
    if (!Array.isArray(schemes) || schemes.length === 0) {
      return null;
    }

    const next = normalizeStoredBuild(candidate, userBuilds.value.length);
    next.id = makeUniqueBuildId();
    userBuilds.value.push(next);
    seedDefaultRotationUiStateForBuild(next);
    return next.id;
  }

  function copyBuild(sourceBuildId: string): string | null {
    if (userBuilds.value.length >= MAX_BUILDS_PER_USER) {
      return null;
    }
    const source = findBuildById(sourceBuildId);
    if (!source) {
      return null;
    }
    const next = cloneJson(source);
    next.id = makeUniqueBuildId();
    next.name = `${source.name} Copy`;
    next.nameByLocale = cloneJson(source.nameByLocale ?? {});
    next.descriptionByLocale = cloneJson(source.descriptionByLocale ?? {});
    userBuilds.value.push(next);
    seedDefaultRotationUiStateForBuild(next);
    return next.id;
  }

  function createBuildFromRuntime(args: {
    sourceBuildId: string;
    currentBuildState: BuildStoreStateSnapshot;
    plannedBuildState: BuildStoreStateSnapshot;
    rotationState: RotationSchemesState;
    scopedRotationUiState?: SavedBuildScopedRotationUiState;
    summary?: BuildSummarySnapshot;
    damageTallyTiming: DamageTallyTiming;
    compareSettings?: {
      enabled: boolean;
      leftVariantIndex: number;
      rightVariantIndex: number;
    };
  }): string | null {
    if (userBuilds.value.length >= MAX_BUILDS_PER_USER) {
      return null;
    }
    const source = findBuildById(args.sourceBuildId);
    if (!source) {
      return null;
    }
    const next = cloneJson(source);
    next.id = makeUniqueBuildId();
    next.currentBuildState = cloneJson(args.currentBuildState);
    next.plannedBuildState = cloneJson(args.plannedBuildState);
    next.rotationState = cloneJson(args.rotationState);
    next.scopedRotationUiState = args.scopedRotationUiState
      ? cloneJson(args.scopedRotationUiState)
      : {
          sp: null,
          contracts: null,
        };
    next.summary = args.summary
      ? {
          totalDamage: args.summary.totalDamage,
          dps: args.summary.dps,
          updatedAt: args.summary.updatedAt ?? Date.now(),
        }
      : {
          totalDamage: null,
          dps: null,
          updatedAt: null,
        };
    next.damageTallyTiming = cloneJson(args.damageTallyTiming);
    next.compareSettings = cloneJson(
      args.compareSettings ?? {
        enabled: false,
        leftVariantIndex: 0,
        rightVariantIndex: 1,
      },
    );
    userBuilds.value.push(next);
    seedDefaultRotationUiStateForBuild(next);
    return next.id;
  }

  function setActiveBuild(id: string) {
    if (builds.value.some((build) => build.id === id)) {
      activeBuildId.value = id;
    }
  }

  function updateBuildRuntime(args: {
    buildId: string;
    currentBuildState: BuildStoreStateSnapshot;
    plannedBuildState: BuildStoreStateSnapshot;
    rotationState: RotationSchemesState;
    stageSettings?: BuildStageSettings;
    customStages?: CustomStageDefinition[];
    scopedRotationUiState?: SavedBuildScopedRotationUiState;
    summary?: { totalDamage: number; dps: number };
    damageTallyTiming?: DamageTallyTiming;
    compareSettings?: {
      enabled: boolean;
      leftVariantIndex: number;
      rightVariantIndex: number;
    };
  }) {
    const target = userBuilds.value.find((build) => build.id === args.buildId);
    if (!target) {
      return;
    }

    target.currentBuildState = cloneJson(args.currentBuildState);
    target.plannedBuildState = cloneJson(args.plannedBuildState);
    target.rotationState = cloneJson(args.rotationState);
    if (args.stageSettings) {
      target.stageSettings = normalizeBuildStageSettings(args.stageSettings);
    }
    if (args.customStages) {
      target.customStages = normalizeCustomStageDefinitions(args.customStages);
    }
    if (args.scopedRotationUiState) {
      target.scopedRotationUiState = cloneJson(args.scopedRotationUiState);
    }
    if (args.summary) {
      target.summary = {
        totalDamage: args.summary.totalDamage,
        dps: args.summary.dps,
        updatedAt: Date.now(),
      };
    }
    if (args.damageTallyTiming) {
      target.damageTallyTiming = cloneJson(args.damageTallyTiming);
    }
    if (args.compareSettings) {
      target.compareSettings = cloneJson(args.compareSettings);
    }
  }

  function updateBuildLocalizedMetadata(args: {
    id: string;
    locale: BuildLocale;
    name: string;
    description: string;
  }) {
    const target = userBuilds.value.find((build) => build.id === args.id);
    const trimmedName = args.name.trim();
    if (!target || !trimmedName) {
      return;
    }

    const nextNameByLocale = { ...(target.nameByLocale ?? {}) };
    nextNameByLocale[args.locale] = trimmedName;
    target.nameByLocale = nextNameByLocale;

    const trimmedDescription = args.description.trim();
    const nextDescriptionByLocale = { ...(target.descriptionByLocale ?? {}) };
    if (trimmedDescription) {
      nextDescriptionByLocale[args.locale] = trimmedDescription;
    } else {
      delete nextDescriptionByLocale[args.locale];
    }
    target.descriptionByLocale = nextDescriptionByLocale;
  }

  function renameBuild(id: string, name: string) {
    const target = userBuilds.value.find((build) => build.id === id);
    const trimmed = name.trim();
    if (!target || !trimmed) {
      return;
    }
    target.name = trimmed;
  }

  function removeBuild(id: string) {
    const index = userBuilds.value.findIndex((build) => build.id === id);
    if (index < 0) {
      return;
    }
    userBuilds.value.splice(index, 1);

    if (activeBuildId.value === id) {
      activeBuildId.value = userBuilds.value[Math.max(0, index - 1)]?.id ?? templateBuilds.value[0]?.id ?? "";
    }
  }

  function resetAll() {
    const seeded = createSeededTemplateBuilds();
    templateBuilds.value = seeded.builds;
    userBuilds.value = [];
    activeBuildId.value = seeded.activeBuildId;
    saveToStorage();
  }

  return {
    userBuilds,
    templateBuilds,
    builds,
    activeBuildId,
    activeBuild,
    activeBuildSource,
    findBuildById,
    isTemplateBuild,
    isUserBuild,
    createBuild,
    importBuild,
    copyBuild,
    createBuildFromRuntime,
    setActiveBuild,
    updateBuildRuntime,
    updateBuildLocalizedMetadata,
    renameBuild,
    removeBuild,
    resetAll,
  };
});

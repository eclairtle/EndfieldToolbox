import type { ModifierStatKey } from "@/lib/build/stats";
import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase, WeaponEventListenerContext } from "@/data/weapons";
import { ATK_TABLE_50_490, ATK_TABLE_51_505 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getElementalArtsTakenStat(
  element: WeaponEventListenerContext["event"]["consumedElement"],
): ModifierStatKey | null {
  switch (element) {
    case "Heat":
      return "HEAT_SUS_PCT";
    case "Cryo":
      return "CRYO_SUS_PCT";
    case "Electric":
      return "ELECTRIC_SUS_PCT";
    case "Nature":
      return "NATURE_SUS_PCT";
    default:
      return null;
  }
}

export const ARTSY_TYRANNICAL: WeaponBase = {
  id: "artsy_tyrannical",
  name: "Artzy Tyrannical",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Tachyon Screening Lattice ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Fracture: Artzy Exaggeration", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      CRYO_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Cryo DMG Dealt +${percent(12.8 + 3.2 * y)}.`,
      `After the wielder scores a critical hit with a battle skill or combo skill, gain Cryo DMG Dealt +${percent(11.2 + 2.8 * y)} for 30s.`,
      "Max stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "BATTLE_OR_COMBO_HIT") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    const triggerCount = ctx.helpers.consumeThreshold({
      key: `artsy_tyrannical:${ctx.wearer.slot}`,
      amount: ctx.event.expectedCritCount ?? 0,
    });
    if (triggerCount <= 0) {
      return;
    }

    if (
      !ctx.helpers.tryActivateCooldown({
        key: `artsy_tyrannical_cd:${ctx.wearer.slot}`,
        durationSeconds: 0.1,
        timeScale: "real",
      })
    ) {
      return;
    }

    ctx.helpers.applySelfBuff({
      buffId: "weapon_artsy_tyrannical_cryo_damage",
      label: "Artzy Tyrannical",
      durationSeconds: 30,
      effects: {
        CRYO_DMG_PCT: (11.2 + 2.8 * y) / 100,
      },
      stackGroup: "weapon_artsy_tyrannical_cryo_damage",
      maxStacks: 3,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const CLANNIBAL: WeaponBase = {
  id: "clannibal",
  name: "Clannibal",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Wulingstone ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Vicious Purge", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ARTS_DMG_PCT: (9.6 + 2.4 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Arts DMG Dealt +${percent(9.6 + 2.4 * y)}.`,
      `After the wielder consumes an Arts Reaction, the target enemy suffers +${percent(8 + 2 * y)} Arts DMG Taken of the consumed element for 15s.`,
      "Each elemental effect applies separately and does not stack with itself. Effect only triggers once every 25s.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ARTS_REACTION_CONSUMED") {
      return;
    }

    const debuffStat = getElementalArtsTakenStat(ctx.event.consumedElement);
    if (!debuffStat) {
      return;
    }

    if (
      !ctx.helpers.tryActivateCooldown({
        key: `clannibal:${ctx.wearer.slot}:${ctx.event.consumedElement}`,
        durationSeconds: 25,
        timeScale: "game",
      })
    ) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyEnemyBuff({
      buffId: `weapon_clannibal_${ctx.event.consumedElement?.toLowerCase()}`,
      label: "Clannibal",
      effects: {
        [debuffStat]: (8 + 2 * y) / 100,
      },
      durationSeconds: 15,
      timeScale: "game",
    });
  },
};

export const BRIGANDS_CALLING: WeaponBase = {
  id: "brigands_calling",
  name: "Brigand's Calling",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Brigand's Bane", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      CRYO_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Cryo DMG Dealt +${percent(12.8 + 3.2 * y)}.`,
      `When the wielder casts a battle skill or ultimate, gain Cryo DMG Dealt +${percent(16 + 4 * y)} for 20s.`,
      `When the wielder applies Arts Susceptibility, target enemy suffers Arts DMG Taken +${percent(4.8 + 1.2 * y)} for 20s.`,
      "The two effects apply separately and do not stack with themselves.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);

    if (ctx.event.type === "BATTLE_SKILL_CAST" || ctx.event.type === "ULTIMATE_CAST") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_brigands_calling_cryo_damage",
        label: "Brigand's Calling",
        durationSeconds: 20,
        effects: {
          CRYO_DMG_PCT: (16 + 4 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
      return;
    }

    if (ctx.event.type === "ENEMY_DEBUFF_APPLIED" && ctx.event.debuffStat === "ARTS_SUS_PCT") {
      ctx.helpers.applyEnemyBuff({
        buffId: "weapon_brigands_calling_arts_taken",
        label: "Brigand's Calling",
        effects: {
          ARTS_DMG_TAKEN_PCT: (4.8 + 1.2 * y) / 100,
        },
        durationSeconds: 20,
        timeScale: "game",
      });
    }
  },
};

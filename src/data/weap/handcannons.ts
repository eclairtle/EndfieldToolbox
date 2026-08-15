import type { ModifierStatKey } from "@/lib/build/stats";
import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase, WeaponEventListenerContext } from "@/data/weapons";
import { ATK_TABLE_42_411, ATK_TABLE_50_490, ATK_TABLE_51_505 } from "@/data/weap/baseAtkTables";

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

const RATIONAL_FAREWELL_BATTLE_SKILL_DMG_PCT = [
  0.1,
  0.12,
  0.14,
  0.16,
  0.18,
  0.2,
  0.22,
  0.24,
  0.28,
] as const;

const RATIONAL_FAREWELL_ATK_PCT = [
  0.16,
  0.192,
  0.224,
  0.256,
  0.288,
  0.32,
  0.352,
  0.384,
  0.448,
] as const;

export const ARTSY_TYRANNICAL: WeaponBase = {
  id: "artsy_tyrannical",
  name: "Artzy Tyrannical",
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0010.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Tachyon Screening Lattice ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Fracture: Artzy Exaggeration", rank: 1, implemented: true },
  ],
  combatEventTypes: ["CRIT_THRESHOLD_REACHED"],
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
    if (
      sourceSlot !== ctx.wearer.slot
      || ctx.event.type !== "CRIT_THRESHOLD_REACHED"
      || (ctx.event.commandAttackType !== "BATTLE_SKILL" && ctx.event.commandAttackType !== "COMBO_SKILL")
    ) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    if ((ctx.event.amount ?? 0) <= 0) {
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
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0009.webp",
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
  combatEventTypes: ["ARTS_REACTION_CONSUMED"],
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
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0011.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Brigand's Bane", rank: 1, implemented: true },
  ],
  combatEventTypes: ["BATTLE_SKILL_CAST", "ULTIMATE_CAST", "ENEMY_DEBUFF_APPLIED"],
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

export const RATIONAL_FAREWELL: WeaponBase = {
  id: "rational_farewell",
  name: "Rational Farewell",
  rarity: 5,
  imagePath: "/weapons/pistol/wpn_pistol_0004.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 2, implemented: true },
    { id: "HEAT_DMG_UP", name: "Heat DMG Boost [M]", rank: 2, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Aid from the Past", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => ({
    BATTLE_SKILL_DMG_PCT: RATIONAL_FAREWELL_BATTLE_SKILL_DMG_PCT[Math.max(0, uniqueSkillLevel - 1)] ?? 0,
  }),
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const dmgPct = (RATIONAL_FAREWELL_BATTLE_SKILL_DMG_PCT[Math.max(0, uniqueSkillLevel - 1)] ?? 0) * 100;
    const atkPct = (RATIONAL_FAREWELL_ATK_PCT[Math.max(0, uniqueSkillLevel - 1)] ?? 0) * 100;
    return [
      `Battle Skill DMG +${percent(dmgPct)}.`,
      `When the wielder's combo skill applies Arts Burst or Combusted, the wielder gains ATK +${percent(atkPct)} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  combatEventTypes: ["ARTS_BURST_APPLIED", "COMBUSTION_APPLIED"],
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || ctx.event.commandAttackType !== "COMBO_SKILL"
      || (ctx.event.type !== "ARTS_BURST_APPLIED" && ctx.event.type !== "COMBUSTION_APPLIED")
    ) {
      return;
    }

    if (!ctx.helpers.markOnce(`weapon_rational_farewell:${ctx.wearer.slot}:${ctx.event.stepId ?? ctx.event.time}`)) {
      return;
    }

    const atkPct = RATIONAL_FAREWELL_ATK_PCT[Math.max(0, (ctx.wearer.weaponSkillLevels[2] ?? 1) - 1)] ?? 0;
    ctx.helpers.applySelfBuff({
      buffId: "weapon_rational_farewell_atk",
      label: "Rational Farewell",
      durationSeconds: 15,
      effects: {
        ATK_PCT: atkPct,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

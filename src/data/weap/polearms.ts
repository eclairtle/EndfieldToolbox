import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_51_500 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

export const JET: WeaponBase = {
  id: "jet",
  name: "JET",
  rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0011.webp",
    weaponType: "POLEARM",
    baseAtkTable: ATK_TABLE_51_500,
    tuningMaterials: ["Quadrant Fitting Fluid ×16", "Wulingstone ×8"],
    skills: [
        { id: "MAIN_ATTR_UP", name: "Main Attribute UP",  rank: 3, implemented: true },
        { id: "ATK_UP", name: "ATK% UP",  rank: 3, implemented: true },
        { id: "UNIQUE", name: "Suppression: Astrophysics",  rank: 1, implemented: true },
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
        `When the wielder casts a battle skill, gain Arts DMG Dealt +${percent(9.6 + 2.4 * y)} for 15s.`,
        `When the wielder casts a combo skill, gain Arts DMG Dealt +${percent(9.6 + 2.4 * y)} for 15s.`,
        "The two effects apply separately and do not stack with themselves.",
      ].join("\n");
    },
    onCombatEvent: (ctx) => {
      const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
      if (sourceSlot !== ctx.wearer.slot) {
        return;
      }
      const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);

      if (ctx.event.type === "BATTLE_SKILL_CAST") {
        ctx.helpers.applySelfBuff({
          buffId: "weapon_jet_battle_skill_arts_damage",
          label: "JET",
          durationSeconds: 15,
          effects: {
            ARTS_DMG_PCT: (9.6 + 2.4 * y) / 100,
          },
          eventType: "WEAPON_BUFF_APPLIED",
        });
        return;
      }

      if (ctx.event.type === "COMBO_SKILL_HIT") {
        if (!ctx.helpers.markOnce(`jet_combo:${ctx.wearer.slot}:${ctx.event.stepId ?? `${ctx.event.time}`}`)) {
          return;
        }
        ctx.helpers.applySelfBuff({
          buffId: "weapon_jet_combo_skill_arts_damage",
          label: "JET",
          durationSeconds: 15,
          effects: {
            ARTS_DMG_PCT: (9.6 + 2.4 * y) / 100,
          },
          eventType: "WEAPON_BUFF_APPLIED",
        });
      }
    },
}

export const MOUNTAIN_BEARER: WeaponBase = {
  id: "mountain_bearer",
  name: "Mountain Bearer",
  rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0012.webp",
  weaponType: "POLEARM",
  baseAtkTable: [51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146, 152, 157, 162, 167, 172, 177, 182, 187, 192, 197, 202, 207, 212, 217, 222, 227, 232, 237, 242, 247, 253, 258, 263, 268, 273, 278, 283, 288, 293, 298, 303, 308, 313, 318, 323, 328, 333, 338, 343, 348, 354, 359, 364, 369, 374, 379, 384, 389, 394, 399, 404, 409, 414, 419, 424, 429, 434, 439, 444, 449, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "PHYSICAL_DMG_UP", name: "Physical DMG Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Weight of Mountain", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Against Vulnerable enemies, the wielder gains DMG Dealt +${percent(scaledPercentFromRank1(20, y))}.`,
      `When the wielder's battle skill applies Vulnerability, the wielder gains All Attributes +${percent(scaledPercentFromRank1(8, y))} for 15s.`,
      `When the wielder's battle skill applies Physical Susceptibility, the wielder gains All Attributes +${percent(scaledPercentFromRank1(8, y))} for 15s.`,
      "The two effects apply separately and do not stack with themselves.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);

    // "Against Vulnerable enemies": approximated as a short self-buff whenever Vulnerability is applied.
    if (ctx.event.type === "ENEMY_DEBUFF_APPLIED" && ctx.event.label === "Vulnerability Applied") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_mountain_bearer_vs_vulnerable",
        label: "Mountain Bearer",
        durationSeconds: 10,
        effects: {
          ALL_DMG_PCT: scaledPercentFromRank1(20, y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }

    if (sourceSlot !== ctx.wearer.slot || ctx.event.commandAttackType !== "BATTLE_SKILL") {
      return;
    }

    if (ctx.event.type === "ENEMY_DEBUFF_APPLIED" && ctx.event.label === "Vulnerability Applied") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_mountain_bearer_all_attr_vulnerability",
        label: "Mountain Bearer",
        durationSeconds: 15,
        effects: {
          ALL_ATTR_PCT: scaledPercentFromRank1(8, y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
      return;
    }

    const isPhysicalSusApplication =
      ctx.event.type === "ENEMY_DEBUFF_APPLIED"
      && (
        ctx.event.debuffStat === "PHYSICAL_SUS_PCT"
        || (ctx.event.label?.includes("Physical Susceptibility") ?? false)
      );

    if (isPhysicalSusApplication) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_mountain_bearer_all_attr_physical_sus",
        label: "Mountain Bearer",
        durationSeconds: 15,
        effects: {
          ALL_ATTR_PCT: scaledPercentFromRank1(8, y) / 100,
        },
        stackGroup: "weapon_mountain_bearer_all_attr_physical_sus",
        maxStacks: 1,
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }
  },
};

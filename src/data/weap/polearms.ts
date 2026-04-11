import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_51_500 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export const JET: WeaponBase = {
    id: "jet",
    name: "JET",
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

      if (ctx.event.type === "BATTLE_OR_COMBO_HIT" && ctx.event.commandAttackType === "COMBO_SKILL") {
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

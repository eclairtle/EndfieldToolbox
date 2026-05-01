import { GEAR_SET_BONUSES, getEquippedGearSetName, type GearBase, type GearSetBonus } from "@/data/gears";
import type { CommandHitEffectDefinition } from "@/lib/commands";
import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { CharacterCombatSnapshot, RotationCombatEvent } from "@/lib/combat/rotation";

export type ActiveGearSetInfo = GearSetBonus & {
  staticModifiers?: Partial<ModifierStats>;
};

const ACTIVE_GEAR_SET_EFFECTS: Record<string, ActiveGearSetInfo> = {
  "Hot Work": {
    ...GEAR_SET_BONUSES["Hot Work"]!,
    staticModifiers: {
      ARTS_INTENSITY: 30,
    },
  },
  Catastrophe: {
    ...GEAR_SET_BONUSES.Catastrophe!,
    staticModifiers: {
      ULT_GAIN_PCT: 0.2,
    },
  },
  "Eternal Xiranite": {
    ...GEAR_SET_BONUSES["Eternal Xiranite"]!,
    staticModifiers: {
      FLAT_HP: 1000,
    },
  },
  "MI Security": {
    ...GEAR_SET_BONUSES["MI Security"]!,
    staticModifiers: {
      CRIT_RATE_PCT: 0.05,
    },
  },
  Bonekrusha: {
    ...GEAR_SET_BONUSES.Bonekrusha!,
    staticModifiers: {
      ATK_PCT: 0.15,
    },
  },
  Swordmancer: {
    ...GEAR_SET_BONUSES.Swordmancer!,
    staticModifiers: {
      STAGGER_EFFICIENCY_PCT: 0.2,
    },
  },
  "Pulser Labs": {
    ...GEAR_SET_BONUSES["Pulser Labs"]!,
    staticModifiers: {
      ARTS_INTENSITY: 30,
    },
  },
};

export function getActiveGearSetInfo(
  gearBases: readonly (GearBase | null | undefined)[],
): ActiveGearSetInfo | null {
  const setName = getEquippedGearSetName(gearBases);
  if (!setName) {
    return null;
  }

  const bonus = ACTIVE_GEAR_SET_EFFECTS[setName] ?? GEAR_SET_BONUSES[setName];
  return bonus ? { ...bonus } : null;
}

export function getActiveGearSetStaticModifiers(
  gearBases: readonly (GearBase | null | undefined)[],
): Partial<ModifierStats> | undefined {
  return getActiveGearSetInfo(gearBases)?.staticModifiers;
}

export type GearSetListenerContext = {
  wearer: CharacterCombatSnapshot;
  event: RotationCombatEvent;
  helpers: {
    applySelfBuff(args: {
      buffId: string;
      label: string;
      hidden?: boolean;
      durationSeconds: number;
      timeScale?: "real" | "game";
      effects: Partial<ModifierStats>;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    applyOtherTeammatesBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: "real" | "game";
      effects: Partial<ModifierStats>;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    grantReturnedSp(args: {
      amount: number;
      label: string;
      onceKey?: string;
    }): void;
    markOnce(onceKey: string): boolean;
    hasSelfBuff(buffId: string): boolean;
    removeSelfBuff(buffId: string): void;
    getSelfBuffStackCount(buffId: string): number;
    consumeThreshold(args: {
      key: string;
      amount: number;
      threshold?: number;
    }): number;
    applyEffects(args: {
      effects: CommandHitEffectDefinition[];
      stepId?: string;
    }): void;
  };
};

const SUSCEPTIBILITY_STATS = new Set<ModifierStatKey>([
  "PHYSICAL_SUS_PCT",
  "ARTS_SUS_PCT",
  "HEAT_SUS_PCT",
  "CRYO_SUS_PCT",
  "ELECTRIC_SUS_PCT",
  "NATURE_SUS_PCT",
  "AETHER_SUS_PCT",
]);

const DAMAGE_TAKEN_STATS = new Set<ModifierStatKey>([
  "DMG_TAKEN_PCT",
  "ARTS_DMG_TAKEN_PCT",
  "PHYSICAL_DMG_TAKEN_PCT",
  "HEAT_DMG_TAKEN_PCT",
  "CRYO_DMG_TAKEN_PCT",
  "ELECTRIC_DMG_TAKEN_PCT",
  "NATURE_DMG_TAKEN_PCT",
  "AETHER_DMG_TAKEN_PCT",
]);

function isAmpOrProtectedBuff(event: RotationCombatEvent): boolean {
  const token = `${event.buffId ?? ""} ${event.label}`.toLowerCase();
  return token.includes("amp") || token.includes("protected");
}

function isSusceptibilityOrWeakened(event: RotationCombatEvent): boolean {
  return (event.debuffStat != null && SUSCEPTIBILITY_STATS.has(event.debuffStat))
    || (event.debuffStat != null && DAMAGE_TAKEN_STATS.has(event.debuffStat));
}

export function runGearSetEventListener(ctx: GearSetListenerContext) {
  const activeSetName = ctx.wearer.activeGearSet?.name;
  if (!activeSetName) {
    return;
  }
  const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;

  if (activeSetName === "Hot Work") {
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    if (ctx.event.type === "COMBUSTION_APPLIED") {
      ctx.helpers.applySelfBuff({
        buffId: "set_hot_work_heat",
        label: "Hot Work: Heat DMG",
        durationSeconds: 10,
        effects: {
          HEAT_DMG_PCT: 0.5,
        },
      });
    }

    if (ctx.event.type === "CORROSION_APPLIED") {
      ctx.helpers.applySelfBuff({
        buffId: "set_hot_work_nature",
        label: "Hot Work: Nature DMG",
        durationSeconds: 10,
        effects: {
          NATURE_DMG_PCT: 0.5,
        },
      });
    }

    return;
  }

  if (activeSetName === "Catastrophe") {
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "BATTLE_SKILL_CAST") {
      return;
    }

    if (ctx.helpers.hasSelfBuff("set_catastrophe_used")) {
      return;
    }

    ctx.helpers.applySelfBuff({
      buffId: "set_catastrophe_used",
      label: "Catastrophe Used",
      hidden: true,
      durationSeconds: 9999,
      effects: {},
    });

    ctx.helpers.grantReturnedSp({
      amount: 50,
      label: "Catastrophe: SP Return",
    });
    return;
  }

  if (activeSetName === "Eternal Xiranite") {
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    const triggeredByActorBuff =
      ctx.event.type === "ACTOR_BUFF_APPLIED" && isAmpOrProtectedBuff(ctx.event);
    const triggeredByEnemyDebuff =
      ctx.event.type === "ENEMY_DEBUFF_APPLIED" && isSusceptibilityOrWeakened(ctx.event);

    if (!triggeredByActorBuff && !triggeredByEnemyDebuff) {
      return;
    }

    ctx.helpers.applyOtherTeammatesBuff({
      buffId: "set_eternal_xiranite_team_damage",
      label: "Eternal Xiranite",
      durationSeconds: 15,
      effects: {
        ALL_DMG_PCT: 0.16,
      },
    });
    return;
  }

  if (activeSetName === "MI Security") {
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "CRIT_THRESHOLD_REACHED") {
      return;
    }

    const triggerCount = Math.max(0, Math.floor(ctx.event.amount ?? 0));
    if (triggerCount <= 0) {
      return;
    }

    for (let i = 0; i < triggerCount; i += 1) {
      ctx.helpers.applySelfBuff({
        buffId: "set_mi_security_attack_stack",
        label: "MI Security",
        durationSeconds: 5,
        effects: {
          ATK_PCT: 0.05,
        },
        stackGroup: "set_mi_security_attack_stack",
        maxStacks: 5,
      });
    }

    if (ctx.helpers.getSelfBuffStackCount("set_mi_security_attack_stack") >= 5) {
      ctx.helpers.applySelfBuff({
        buffId: "set_mi_security_crit_bonus",
        label: "MI Security Crit",
        durationSeconds: 5,
        effects: {
          CRIT_RATE_PCT: 0.05,
        },
      });
    }
    return;
  }

  if (activeSetName === "Bonekrusha") {
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    if (
      ctx.event.type === "BATTLE_OR_COMBO_HIT"
      && ctx.event.commandAttackType === "COMBO_SKILL"
    ) {
      const onceKey = `set_bonekrusha_combo:${ctx.wearer.slot}:${ctx.event.stepId ?? `${ctx.event.time}`}`;
      if (!ctx.helpers.markOnce(onceKey)) {
        return;
      }

      ctx.helpers.applySelfBuff({
        buffId: "set_bonekrusha_smash_stack",
        label: "Bonekrushing Smash",
        hidden: true,
        durationSeconds: 9999,
        effects: {
          BATTLE_SKILL_DMG_PCT: 0.3,
        },
        stackGroup: "set_bonekrusha_smash_stack",
        maxStacks: 2,
      });
      return;
    }

    if (ctx.event.type === "BATTLE_SKILL_CAST") {
      const stackCount = ctx.helpers.getSelfBuffStackCount("set_bonekrusha_smash_stack");
      if (stackCount <= 0) {
        return;
      }

      ctx.helpers.removeSelfBuff("set_bonekrusha_smash_stack");
      ctx.helpers.applySelfBuff({
        buffId: "set_bonekrusha_next_battle_skill",
        label: "Bonekrusha",
        hidden: true,
        durationSeconds: 8,
        effects: {
          BATTLE_SKILL_DMG_PCT: 0.3 * stackCount,
        },
      });
    }
  }

  if (activeSetName === "Pulser Labs") {
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ARTS_REACTION_APPLIED") {
      return;
    }

    if (ctx.event.label.startsWith("Electrification Applied")) {
      ctx.helpers.applySelfBuff({
        buffId: "set_pulser_labs_electric",
        label: "Pulser Labs: Electric DMG",
        durationSeconds: 10,
        effects: {
          ELECTRIC_DMG_PCT: 0.5,
        },
      });
      return;
    }

    if (ctx.event.label.startsWith("Solidification Applied")) {
      ctx.helpers.applySelfBuff({
        buffId: "set_pulser_labs_cryo",
        label: "Pulser Labs: Cryo DMG",
        durationSeconds: 10,
        effects: {
          CRYO_DMG_PCT: 0.5,
        },
      });
      return;
    }
  }

  if (activeSetName === "Swordmancer") {
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "PHYSICAL_REACTION_APPLIED") {
      return;
    }

    const isPhysicalStatusApplied =
      ctx.event.label.startsWith("Lift Applied")
      || ctx.event.label.startsWith("Knockdown Applied")
      || ctx.event.label.startsWith("Crush Applied")
      || ctx.event.label.startsWith("Breach Applied");

    if (!isPhysicalStatusApplied) {
      return;
    }

    ctx.helpers.applyEffects({
      stepId: `set_swordmancer:${ctx.event.time.toFixed(3)}`,
      effects: [
        {
          type: "EXECUTE_HIT",
          hitRefId: "set_swordmancer_extra_hit",
          inheritSourceBonuses: false,
          condition: {
            type: "not",
            condition: {
              type: "require_status",
              statusId: "set_swordmancer_cooldown",
              target: "self",
            },
          },
        },
        {
          type: "APPLY_STATUS",
          target: "self",
          statusId: "set_swordmancer_cooldown",
          label: "Swordmancer Cooldown",
          durationSeconds: 15,
          timeScale: "real",
        },
      ],
    });
  }
}

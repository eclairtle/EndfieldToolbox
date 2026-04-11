import { GEAR_SET_BONUSES, getEquippedGearSetName, type GearBase, type GearSetBonus } from "@/data/gears";
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
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    grantReturnedSp(args: {
      amount: number;
      label: string;
      onceKey?: string;
    }): void;
    markOnce(onceKey: string): boolean;
    hasSelfBuff(buffId: string): boolean;
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
  }
}

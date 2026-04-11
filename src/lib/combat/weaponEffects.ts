import type { ModifierStats } from "@/lib/build/stats";
import { getWeaponById, type WeaponEventListenerContext } from "@/data/weapons";

type WeaponStaticContext = {
  weaponId: string;
  uniqueSkillLevel: number;
};

export type WeaponListenerContext = WeaponEventListenerContext;

export function getWeaponUniqueStaticModifiers(
  ctx: WeaponStaticContext,
): Partial<ModifierStats> {
  return getWeaponById(ctx.weaponId)?.getUniqueStaticModifiers?.(ctx.uniqueSkillLevel) ?? {};
}

export function combineModifierPartials(
  ...parts: Array<Partial<ModifierStats> | null | undefined>
): Partial<ModifierStats> {
  const out: Partial<ModifierStats> = {};

  for (const part of parts) {
    if (!part) {
      continue;
    }

    for (const [key, value] of Object.entries(part)) {
      if (value == null) {
        continue;
      }

      out[key as keyof ModifierStats] = (out[key as keyof ModifierStats] ?? 0) + value;
    }
  }

  return out;
}

export function getWeaponUniqueSkillDescription(
  weaponId: string,
  uniqueSkillLevel: number,
): string | null {
  return getWeaponById(weaponId)?.getUniqueSkillDescription?.(uniqueSkillLevel) ?? null;
}

export function runWeaponEventListener(ctx: WeaponListenerContext) {
  getWeaponById(ctx.wearer.weaponId)?.onCombatEvent?.(ctx);
}

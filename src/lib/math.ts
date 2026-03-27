// src/lib/math.ts
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function lerpLevel(valueLv1: number, valueLv90: number, level: number): number {
  const lv = clamp(level, 1, 90);
  const t = (lv - 1) / 89;
  return Math.floor(valueLv1 + (valueLv90 - valueLv1) * t);
}

/** multiplier(L) = 1 + g*(L-1) */
export function mult(level: number, g: number): number {
  const lv = clamp(level, 1, 90);
  return 1 + g * (lv - 1);
}

export function firstOrThrow<T>(arr: T[], name: string): T {
  const value = arr[0];
  if (!value) {
    throw new Error(`${name} is empty`);
  }
  return value;
}
import { computed, ref, type Ref } from "vue";
import { ENEMIES, type EnemyBase } from "@/data/enemies";
import { calculateEnemyStats } from "@/lib/enemy/enemyScaling";
import type { EnemySlotState } from "@/lib/combat/rotation";

function firstOrThrow<T>(arr: T[], name: string): T {
  const value = arr[0];
  if (!value) throw new Error(`${name} is empty`);
  return value;
}

export function useEnemyState(enemyHpBaseOverrides?: Ref<Record<string, number>>) {
  const firstEnemy = firstOrThrow(ENEMIES, "ENEMIES");
  const defaultEnemy = ENEMIES.find((enemy) => enemy.id === "rhodagn") ?? firstEnemy;

  const enemySlots = ref<EnemySlotState[]>([
    {
      slotId: "enemy_slot_1",
      enemyId: defaultEnemy.id,
      level: 90,
      spawnTimeEnabled: false,
      spawnTime: 0,
      noDeath: false,
    },
  ]);
  const targetedEnemySlotId = ref<string>(enemySlots.value[0]!.slotId);

  const targetedEnemySlot = computed<EnemySlotState>(() => {
    const targeted = enemySlots.value.find((slot) => slot.slotId === targetedEnemySlotId.value);
    if (targeted) {
      return targeted;
    }
    return enemySlots.value[0] ?? {
      slotId: "enemy_slot_1",
      enemyId: defaultEnemy.id,
      level: 90,
      spawnTimeEnabled: false,
      spawnTime: 0,
      noDeath: false,
    };
  });

  const selectedEnemyId = computed<string>({
    get: () => targetedEnemySlot.value.enemyId,
    set: (value) => {
      const normalized = ENEMIES.find((enemy) => enemy.id === value)?.id ?? defaultEnemy.id;
      const targetSlotId = targetedEnemySlot.value.slotId;
      enemySlots.value = enemySlots.value.map((slot) =>
        slot.slotId === targetSlotId
          ? { ...slot, enemyId: normalized }
          : slot,
      );
    },
  });

  const enemyLevel = computed<number>({
    get: () => targetedEnemySlot.value.level,
    set: (value) => {
      const normalized = Math.max(1, Math.min(100, Math.round(value)));
      const targetSlotId = targetedEnemySlot.value.slotId;
      enemySlots.value = enemySlots.value.map((slot) =>
        slot.slotId === targetSlotId
          ? { ...slot, level: normalized }
          : slot,
      );
    },
  });

  const selectedEnemy = computed<EnemyBase>(() => {
    const base = ENEMIES.find((e) => e.id === selectedEnemyId.value) ?? defaultEnemy;
    const hpOverride = enemyHpBaseOverrides?.value[base.id];
    return hpOverride == null ? base : { ...base, baseHpLv1: hpOverride };
  });

  const resolvedEnemyStats = computed(() => {
    const enemy = selectedEnemy.value;
    const level = Math.max(1, Math.min(100, enemyLevel.value));

    return {
      level,
      ...calculateEnemyStats(enemy, level),
      resistances: enemy.resistances,
    };
  });

  return {
    ENEMIES,
    enemySlots,
    targetedEnemySlotId,
    targetedEnemySlot,
    selectedEnemyId,
    selectedEnemy,
    enemyLevel,
    resolvedEnemyStats,
  };
}

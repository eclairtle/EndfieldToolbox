import { computed, ref } from "vue";
import { ENEMIES, type EnemyBase } from "@/data/enemies";
import { calculateEnemyStats } from "@/lib/enemy/enemyScaling";

function firstOrThrow<T>(arr: T[], name: string): T {
  const value = arr[0];
  if (!value) throw new Error(`${name} is empty`);
  return value;
}

export function useEnemyState() {
  const defaultEnemy = firstOrThrow(ENEMIES, "ENEMIES");

  const selectedEnemyId = ref<string>(defaultEnemy.id);
  const enemyLevel = ref<number>(100);

  const selectedEnemy = computed<EnemyBase>(() => {
    return ENEMIES.find((e) => e.id === selectedEnemyId.value) ?? defaultEnemy;
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
    selectedEnemyId,
    selectedEnemy,
    enemyLevel,
    resolvedEnemyStats,
  };
}
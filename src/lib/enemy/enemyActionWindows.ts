import type { EnemyActionWindow } from "@/lib/combat/rotation";

export type EnemyCommandDefinition = {
  id: string;
  label: string;
  durationSeconds: number;
  invulnerable?: boolean;
  tintColor?: string;
  effects?: EnemyActionWindow["effects"];
  interruptible?: boolean;
};

export type EnemyCommandPlacement = {
  id: string;
  commandId: string;
  startTime: number;
  interrupted?: boolean;
  interruptedSpGain?: number;
  interruptedStagger?: number;
};

const DUMMY_ATTACK_DEFINITION: EnemyCommandDefinition = {
  id: "dummy_attack",
  label: "Dummy Attack",
  durationSeconds: 1,
};

const RHODAGN_COMMAND_DEFINITIONS: EnemyCommandDefinition[] = [
  {
    id: "opening_attack",
    label: "Opening Attack",
    durationSeconds: 2.5,
    invulnerable: true,
    tintColor: "rgba(215, 64, 64, 0.25)",
    interruptible: false,
  },
  {
    id: "phase_transition",
    label: "Phase Transition",
    durationSeconds: 0.5,
    effects: [{ type: "RESET_STAGGER" }, { type: "INTERRUPT_ONGOING_COMMANDS" }],
    interruptible: false,
  },
];

const RHODAGN_DEFAULT_COMMANDS: EnemyCommandPlacement[] = [
  { id: "rhodagn_opening_attack", commandId: "opening_attack", startTime: 0 },
];

export function getEnemyCommandDefinitions(enemyId: string): EnemyCommandDefinition[] {
  const baseDefinitions: EnemyCommandDefinition[] = [{ ...DUMMY_ATTACK_DEFINITION }];
  if (enemyId === "rhodagn") {
    return baseDefinitions.concat(RHODAGN_COMMAND_DEFINITIONS.map((definition) => ({
      ...definition,
      effects: definition.effects ? definition.effects.map((effect) => ({ ...effect })) : undefined,
    })));
  }
  return baseDefinitions;
}

export function getDefaultEnemyCommandPlacements(enemyId: string): EnemyCommandPlacement[] {
  if (enemyId === "rhodagn") {
    return RHODAGN_DEFAULT_COMMANDS.map((placement) => ({ ...placement }));
  }
  return [];
}

export function buildEnemyActionWindows(enemyId: string, placements: EnemyCommandPlacement[]): EnemyActionWindow[] {
  const definitions = getEnemyCommandDefinitions(enemyId);
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
  const windows: EnemyActionWindow[] = [];
  for (const placement of placements) {
    const definition = definitionById.get(placement.commandId);
    if (!definition) {
      continue;
    }
    const startTime = Math.max(0, placement.startTime);
    const endTime = startTime + Math.max(0, definition.durationSeconds);
    windows.push({
      id: placement.id,
      commandId: placement.commandId,
      label: definition.label,
      startTime,
      endTime,
      invulnerable: definition.invulnerable,
      tintColor: definition.tintColor,
      effects: definition.effects ? definition.effects.map((effect) => ({ ...effect })) : undefined,
      interruptible: definition.interruptible !== false,
      interrupted: definition.interruptible === false ? false : placement.interrupted === true,
      interruptedSpGain:
        definition.interruptible === false || placement.interrupted !== true
          ? 0
          : Math.max(0, Number(placement.interruptedSpGain ?? 0)),
      interruptedStagger:
        definition.interruptible === false || placement.interrupted !== true
          ? 0
          : Math.max(0, Number(placement.interruptedStagger ?? 0)),
    });
  }
  windows.sort((left, right) => left.startTime - right.startTime);
  return windows;
}

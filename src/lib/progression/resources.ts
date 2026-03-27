export type ResourceId =
  | "T_CREDITS"
  | "CHARACTER_EXP_BASIC"
  | "CHARACTER_EXP_ADVANCED"
  | "WEAPON_EXP"
  | "PROTODISK"
  | "PROTOSET"
  | "CAST_DIE"
  | "HEAVY_CAST_DIE"
  | "PROTOPRISM"
  | "PROTOHEDRON"
  | "D96_STEEL_SAMPLE_4"
  | "METADIASTIMA_PHOTOEMISSION_TUBE"
  | "TACHYON_SCREENING_LATTICE"
  | "QUADRANT_FITTING_FLUID"
  | "TRIPHASIC_NANOFLAKE";

export type ResourceDefinition = {
  id: ResourceId;
  label: string;
  category:
    | "currency"
    | "character_leveling"
    | "weapon_leveling"
    | "character_ascension"
    | "weapon_ascension"
    | "skill_leveling"
    | "rare_material";
  amountPerTrip: number; // amount from one 80-sanity run
};

export const SANITY_PER_TRIP = 80;

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "T_CREDITS",
    label: "T-Creds",
    category: "currency",
    amountPerTrip: 34000,
  },
  {
    id: "CHARACTER_EXP_BASIC",
    label: "Character EXP (Basic)",
    category: "character_leveling",
    amountPerTrip: 170000,
  },
  {
    id: "CHARACTER_EXP_ADVANCED",
    label: "Character EXP (Advanced)",
    category: "character_leveling",
    amountPerTrip: 68000,
  },
  {
    id: "WEAPON_EXP",
    label: "Weapon EXP",
    category: "weapon_leveling",
    amountPerTrip: 170000,
  },
  {
    id: "PROTODISK",
    label: "Protodisk",
    category: "character_ascension",
    amountPerTrip: 34,
  },
  {
    id: "PROTOSET",
    label: "Protoset",
    category: "character_ascension",
    amountPerTrip: 14,
  },
  {
    id: "CAST_DIE",
    label: "Cast Die",
    category: "weapon_ascension",
    amountPerTrip: 34,
  },
  {
    id: "HEAVY_CAST_DIE",
    label: "Heavy Cast Die",
    category: "weapon_ascension",
    amountPerTrip: 14,
  },
  {
    id: "PROTOPRISM",
    label: "Protoprism",
    category: "skill_leveling",
    amountPerTrip: 85,
  },
  {
    id: "PROTOHEDRON",
    label: "Protohedron",
    category: "skill_leveling",
    amountPerTrip: 17,
  },
  {
    id: "D96_STEEL_SAMPLE_4",
    label: "D96 Steel Sample 4",
    category: "rare_material",
    amountPerTrip: 6.8,
  },
  {
    id: "METADIASTIMA_PHOTOEMISSION_TUBE",
    label: "Metadiastima Photoemission Tube",
    category: "rare_material",
    amountPerTrip: 6.8,
  },
  {
    id: "TACHYON_SCREENING_LATTICE",
    label: "Tachyon Screening Lattice",
    category: "rare_material",
    amountPerTrip: 6.8,
  },
  {
    id: "QUADRANT_FITTING_FLUID",
    label: "Quadrant Fitting Fluid",
    category: "rare_material",
    amountPerTrip: 6.8,
  },
  {
    id: "TRIPHASIC_NANOFLAKE",
    label: "Triphasic Nanoflake",
    category: "rare_material",
    amountPerTrip: 6.8,
  },
];

export const RESOURCES_BY_ID: Record<ResourceId, ResourceDefinition> =
  RESOURCE_DEFINITIONS.reduce(
    (acc, resource) => {
      acc[resource.id] = resource;
      return acc;
    },
    {} as Record<ResourceId, ResourceDefinition>,
  );

export function getResourceDefinition(resourceId: ResourceId): ResourceDefinition {
  return RESOURCES_BY_ID[resourceId];
}

export function getAmountPerSanity(resourceId: ResourceId): number {
  const definition = getResourceDefinition(resourceId);
  return definition.amountPerTrip / SANITY_PER_TRIP;
}

export function getSanityPerUnit(resourceId: ResourceId): number {
  const perSanity = getAmountPerSanity(resourceId);
  if (perSanity <= 0) return Number.POSITIVE_INFINITY;
  return 1 / perSanity;
}

export function convertSanityToResourceAmount(
  sanity: number,
  resourceId: ResourceId,
): number {
  return sanity * getAmountPerSanity(resourceId);
}

export function convertResourceAmountToSanity(
  amount: number,
  resourceId: ResourceId,
): number {
  return amount * getSanityPerUnit(resourceId);
}

export function convertResourceToResource(args: {
  amount: number;
  from: ResourceId;
  to: ResourceId;
}): number {
  const sanityCost = convertResourceAmountToSanity(args.amount, args.from);
  return convertSanityToResourceAmount(sanityCost, args.to);
}

export function getTripsFromSanity(sanity: number, roundUp = true): number {
  const trips = sanity / SANITY_PER_TRIP;
  return roundUp ? Math.ceil(trips) : trips;
}

export type ResourcePlanRow = {
  resourceId: ResourceId;
  requestedAmount: number;
  sanityCost: number;
  trips: number;
};

export function buildResourcePlan(
  requested: Partial<Record<ResourceId, number>>,
): {
  rows: ResourcePlanRow[];
  totalSanity: number;
  totalTrips: number;
} {
  const rows: ResourcePlanRow[] = [];

  for (const definition of RESOURCE_DEFINITIONS) {
    const amount = requested[definition.id] ?? 0;
    if (amount <= 0) continue;

    const sanityCost = convertResourceAmountToSanity(amount, definition.id);
    rows.push({
      resourceId: definition.id,
      requestedAmount: amount,
      sanityCost,
      trips: getTripsFromSanity(sanityCost, true),
    });
  }

  const totalSanity = rows.reduce((sum, row) => sum + row.sanityCost, 0);
  const totalTrips = rows.reduce((sum, row) => sum + row.trips, 0);

  return {
    rows,
    totalSanity,
    totalTrips,
  };
}

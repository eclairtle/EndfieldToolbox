import type { PartySlot } from "@/lib/combat/rotation";

export type CombatEffectTarget =
  | { type: "enemy" }
  | { type: "self"; slot: PartySlot }
  | { type: "ally"; slot: PartySlot }
  | { type: "team" }
  | { type: "global" }
  | { type: "field" };

export type CombatEffectTreeSourceKind =
  | "command"
  | "character_hook"
  | "gear_set"
  | "weapon_skill"
  | "status"
  | "reaction"
  | "system";

export type CombatEffectTreeNode = {
  kind: CombatEffectTreeSourceKind;
  stepId: string;
  slot?: PartySlot;
  characterId?: string;
  characterName?: string;
  commandId?: string;
  commandName?: string;
  sourceId?: string;
  sourceName?: string;
  target?: CombatEffectTarget;
};

export type CombatEffectTree = {
  root: CombatEffectTreeNode;
  current: CombatEffectTreeNode;
  lineage: CombatEffectTreeNode[];
};

export function createRootEffectTree(node: CombatEffectTreeNode): CombatEffectTree {
  return {
    root: node,
    current: node,
    lineage: [node],
  };
}

export function extendEffectTree(
  tree: CombatEffectTree | undefined,
  node: CombatEffectTreeNode,
): CombatEffectTree {
  if (!tree) {
    return createRootEffectTree(node);
  }
  return {
    root: tree.root,
    current: node,
    lineage: [...tree.lineage, node],
  };
}

export function withEffectTreeTarget(
  tree: CombatEffectTree | undefined,
  target: CombatEffectTarget | undefined,
): CombatEffectTree | undefined {
  if (!tree || !target) {
    return tree;
  }
  return {
    root: {
      ...tree.root,
      target: tree.root.target ?? target,
    },
    current: {
      ...tree.current,
      target,
    },
    lineage: tree.lineage.map((node, index) => (
      index === tree.lineage.length - 1
        ? { ...node, target }
        : node
    )),
  };
}

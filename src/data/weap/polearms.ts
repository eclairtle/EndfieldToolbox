
import type { WeaponBase } from "@/data/weapons";

export const JET: WeaponBase = {
    id: "jet",
    name: "JET",
    weaponType: "POLEARM",
    baseAtkLv1: 51,
    baseAtkLv90: 500,
    skills: [
        { id: "MAIN_ATTR_UP", name: "Main Attribute UP",  rank: 3, implemented: true },
        { id: "ATK_UP", name: "ATK% UP",  rank: 3, implemented: true },
        { id: "NotImplemented", name: "Conditional Arts DMG UP (later)",  rank: 3, implemented: false },
    ],
}
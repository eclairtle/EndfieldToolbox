import type { LevelStatTable } from "@/lib/build/stats";

type SummaryPoints = {
  lv1: number;
  lv20: number;
  lv40: number;
  lv60: number;
  lv80: number;
  lv90: number;
};

function segment(startLevel: number, endLevel: number, start: number, end: number): number[] {
  const len = endLevel - startLevel;
  const out: number[] = [];
  for (let i = 0; i <= len; i += 1) {
    const t = len === 0 ? 0 : i / len;
    out.push(Math.round(start + (end - start) * t));
  }
  return out;
}

export function fromSummaryPoints(points: SummaryPoints): number[] {
  const p1 = segment(1, 20, points.lv1, points.lv20);
  const p2 = segment(20, 40, points.lv20, points.lv40).slice(1);
  const p3 = segment(40, 60, points.lv40, points.lv60).slice(1);
  const p4 = segment(60, 80, points.lv60, points.lv80).slice(1);
  const p5 = segment(80, 90, points.lv80, points.lv90).slice(1);
  return [...p1, ...p2, ...p3, ...p4, ...p5];
}

export function buildLevelTable(summary: {
  STR: SummaryPoints;
  AGI: SummaryPoints;
  INT: SummaryPoints;
  WIL: SummaryPoints;
  ATK: SummaryPoints;
  HP: SummaryPoints;
}): LevelStatTable {
  return {
    STR: fromSummaryPoints(summary.STR),
    AGI: fromSummaryPoints(summary.AGI),
    INT: fromSummaryPoints(summary.INT),
    WIL: fromSummaryPoints(summary.WIL),
    ATK: fromSummaryPoints(summary.ATK),
    HP: fromSummaryPoints(summary.HP),
  };
}

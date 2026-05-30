const STATUS_BUFF_LABELS: Record<string, { en: string; zhCN: string }> = {
  "Olden Stare": { en: "Olden Stare", zhCN: "古老凝视" },
  "Long Wish": { en: "Long Wish", zhCN: "久愿" },
  "Originium Crystal": { en: "Originium Crystal", zhCN: "源石晶体" },
  "Steel Oath": { en: "Steel Oath", zhCN: "钢铁誓约" },
  "Fervent Morale": { en: "Fervent Morale", zhCN: "激昂士气" },
  "Yinglung's Edge": { en: "Yinglung's Edge", zhCN: "应龙之锋" },
  "Hypothermic Perfusion": { en: "Hypothermic Perfusion", zhCN: "低温灌注" },
  "Arts Burst": { en: "Arts Burst", zhCN: "法术爆发" },
  "Arts Infliction": { en: "Arts Infliction", zhCN: "法术附着" },
  "Arts Reaction": { en: "Arts Reaction", zhCN: "法术异常" },
  "Physical Status": { en: "Physical Status", zhCN: "物理异常" },
  "Vulnerability": { en: "Vulnerability", zhCN: "破防" },
  "Physical Vulnerability": { en: "Physical Vulnerability", zhCN: "物理易伤" },
  "Heat Vulnerability": { en: "Heat Vulnerability", zhCN: "灼热易伤" },
  "Cryo Vulnerability": { en: "Cryo Vulnerability", zhCN: "寒冷易伤" },
  "Electric Vulnerability": { en: "Electric Vulnerability", zhCN: "电磁易伤" },
  "Nature Vulnerability": { en: "Nature Vulnerability", zhCN: "自然易伤" },
  "Aether Vulnerability": { en: "Aether Vulnerability", zhCN: "超域易伤" },
  "Physical Susceptibility": { en: "Physical Susceptibility", zhCN: "物理易伤害" },
  "Heat Susceptibility": { en: "Heat Susceptibility", zhCN: "灼热易伤害" },
  "Cryo Susceptibility": { en: "Cryo Susceptibility", zhCN: "寒冷易伤害" },
  "Electric Susceptibility": { en: "Electric Susceptibility", zhCN: "电磁易伤害" },
  "Nature Susceptibility": { en: "Nature Susceptibility", zhCN: "自然易伤害" },
  "Aether Susceptibility": { en: "Aether Susceptibility", zhCN: "超域易伤害" },
  "Knock Down": { en: "Knock Down", zhCN: "倒地" },
  "Knockdown": { en: "Knockdown", zhCN: "倒地" },
  "Lift": { en: "Lift", zhCN: "击飞" },
  "Breach": { en: "Breach", zhCN: "碎甲" },
  "Crush": { en: "Crush", zhCN: "猛击" },
  "Solidification": { en: "Solidification", zhCN: "冻结" },
  "Shatter": { en: "Shatter", zhCN: "碎冰" },
  "Corrosion": { en: "Corrosion", zhCN: "腐蚀" },
  "Combustion": { en: "Combustion", zhCN: "燃烧" },
  "Electrification": { en: "Electrification", zhCN: "导电" },
};

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

const NORMALIZED_STATUS_BUFF_LABELS: Record<string, { en: string; zhCN: string }> = Object.fromEntries(
  Object.entries(STATUS_BUFF_LABELS).map(([key, value]) => [normalizeLabel(key), value]),
);

const TERM_REPLACEMENTS_ZH = [
  ["Physical Vulnerability", "物理易伤"],
  ["Heat Vulnerability", "灼热易伤"],
  ["Cryo Vulnerability", "寒冷易伤"],
  ["Electric Vulnerability", "电磁易伤"],
  ["Nature Vulnerability", "自然易伤"],
  ["Aether Vulnerability", "超域易伤"],
  ["Physical Susceptibility", "物理易伤害"],
  ["Heat Susceptibility", "灼热易伤害"],
  ["Cryo Susceptibility", "寒冷易伤害"],
  ["Electric Susceptibility", "电磁易伤害"],
  ["Nature Susceptibility", "自然易伤害"],
  ["Aether Susceptibility", "超域易伤害"],
  ["Arts Infliction", "法术附着"],
  ["Arts Reaction", "法术异常"],
  ["Arts Burst", "法术爆发"],
  ["Physical Status", "物理异常"],
  ["Vulnerability", "破防"],
  ["Solidification", "冻结"],
  ["Electrification", "导电"],
  ["Combustion", "燃烧"],
  ["Corrosion", "腐蚀"],
  ["Knock Down", "倒地"],
  ["Knockdown", "倒地"],
  ["Breach", "碎甲"],
  ["Crush", "猛击"],
  ["Shatter", "碎冰"],
  ["Lift", "击飞"],
] as const;

function applyZhTermReplacements(label: string): string {
  let result = label;
  for (const [source, target] of TERM_REPLACEMENTS_ZH) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), target);
  }
  return result;
}

export function getLocalizedStatusBuffLabel(
  label: string | null | undefined,
  locale: "en" | "zh-CN",
): string {
  if (!label) {
    return "";
  }
  const mapped = NORMALIZED_STATUS_BUFF_LABELS[normalizeLabel(label)];
  if (!mapped) {
    return locale === "zh-CN" ? applyZhTermReplacements(label) : label;
  }
  return locale === "zh-CN" ? mapped.zhCN : mapped.en;
}

import { CHARACTERS } from "@/data/characters";

const enCharacterNames = Object.fromEntries(
  CHARACTERS.map((character) => [character.id, character.name]),
) as Record<string, string>;

const zhCNCharacterNameOverrides: Record<string, string> = {
  gilberta: "洁尔佩塔",
  laevatain: "莱万汀",
  yvonne: "伊冯",
  akekuri: "秋栗",
  antal: "安塔尔",
  ardelia: "艾尔黛拉",
  wulfgard: "狼卫",
  arclight: "弧光",
  avywenna: "艾维文娜",
  ember: "余烬",
  lifeng: "黎风",
  snowshine: "昼雪",
  endministrator: "管理员",
  dapan: "大潘",
  perlica: "佩丽卡",
  estella: "埃特拉",
  fluorite: "萤石",
  catcher: "卡契尔",
  alesh: "阿列什",
  lastrite: "别礼",
  chenqianyu: "陈千语",
  xaihi: "赛希",
  tangtang: "汤汤",
  rossi: "洛茜",
  pogranichnik: "骏卫",
  zhuangfangyi: "庄方宜",
};

export const characterNamesByLocale = {
  en: enCharacterNames,
  "zh-CN": {
    ...enCharacterNames,
    ...zhCNCharacterNameOverrides,
  },
} as const;

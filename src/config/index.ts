export const Height = 1080;

/** 检测是否为移动端（触屏 + 窄屏 或 移动端 UA） */
export const IS_MOBILE = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth < 768;
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isTouch && (isNarrow || isMobileUA);
})();

/** 移动端有效高度（补偿浏览器任务栏遮挡，缩小 6%） */
export const MobileHeight = Math.round(Height * 0.94);

/** 移动端 9:16 画幅宽度 */
export const MobileWidth = Math.round(MobileHeight * 9 / 16);

/** 实际游戏尺寸（PC 端正方形，移动端 9:16 竖屏） */
export const Width = IS_MOBILE ? MobileWidth : Height;
export const GameHeight = IS_MOBILE ? MobileHeight : Height;

/** 移动端水果大小缩放（缩小 10%） */
export const MOBILE_FRUIT_SCALE = IS_MOBILE ? 0.9 : 1;

export const Ratio = 35;
export const TimeStep = 1 / 120;
export const VelocityIterations = 10;
export const PositionIterations = 10;

export const Fruits = [
  { name: './fruits/amana.png', radius: 56, imgRadius: 200 },
  { name: './fruits/asahi.png', radius: 59, imgRadius: 200 },
  { name: './fruits/chiyoko.png', radius: 62, imgRadius: 200 },
  { name: './fruits/chiyuki.png', radius: 65, imgRadius: 200 },
  { name: './fruits/fuyuko.png', radius: 68, imgRadius: 200 },
  { name: './fruits/hana.png', radius: 71, imgRadius: 200 },
  { name: './fruits/haruki.png', radius: 74, imgRadius: 200 },
  { name: './fruits/hinana.png', radius: 77, imgRadius: 200 },
  { name: './fruits/hiori.png', radius: 80, imgRadius: 200 },
  { name: './fruits/juri.png', radius: 83, imgRadius: 200 },
  { name: './fruits/kaho.png', radius: 86, imgRadius: 200 },
  { name: './fruits/kiriko.png', radius: 89, imgRadius: 200 },
  { name: './fruits/kogane.png', radius: 92, imgRadius: 200 },
  { name: './fruits/koito.png', radius: 95, imgRadius: 200 },
  { name: './fruits/luka.png', radius: 98, imgRadius: 200 },
  { name: './fruits/madoka.png', radius: 101, imgRadius: 200 },
  { name: './fruits/mamimi.png', radius: 104, imgRadius: 200 },
  { name: './fruits/mano.png', radius: 107, imgRadius: 200 },
  { name: './fruits/meguru.png', radius: 110, imgRadius: 200 },
  { name: './fruits/mei.png', radius: 114, imgRadius: 200 },
  { name: './fruits/mikoto.png', radius: 116, imgRadius: 200 },
  { name: './fruits/mitsumine.png', radius: 120, imgRadius: 200 },
  { name: './fruits/natsuha.png', radius: 122, imgRadius: 200 },
  { name: './fruits/nichika.png', radius: 126, imgRadius: 200 },
  { name: './fruits/rinze.png', radius: 128, imgRadius: 200 },
  { name: './fruits/sakuya.png', radius: 132, imgRadius: 200 },
  { name: './fruits/tenka.png', radius: 134, imgRadius: 200 },
  { name: './fruits/toru.png', radius: 138, imgRadius: 200 },
];

export enum GameMode {
  Normal = 'normal',
  Infinite = 'infinite',
}

/** 预设/分组 */
export interface FruitConfig {
  name: string;
  radius: number;
  imgRadius: number;
}

export interface Preset {
  id: string;
  name: string;
  logo: string;
  /** BGM 音频路径 */
  bgm: string;
  /** 该预设的水果合成路线（从小到大排列） */
  fruits: FruitConfig[];
}

/** 默认 28 种水果（其他预设未配置时使用） */
const DefaultFruits: FruitConfig[] = Fruits;

export const Presets: Preset[] = [
  {
    id: 'illumination',
    name: 'illumination STARS',
    logo: './logo/illuminationstars.png',
    bgm: './music/晴れのちバルーン (Off Vocal) - イルミネーションスターズ.mp3',
    fruits: [
      { name: './fruits/chibi_gurumi/chibi_mano.png',   radius: 45, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_hiori.png',   radius: 50, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_meguru.png',  radius: 55, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_mano2.png',   radius: 60, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_hiori2.png',  radius: 65, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_meguru2.png', radius: 70, imgRadius: 200 },
      { name: './fruits/meguru.png', radius: 116, imgRadius: 183 },
      { name: './fruits/hiori.png', radius: 143, imgRadius: 183 },
      { name: './fruits/mano.png',  radius: 171, imgRadius: 183 },
    ],
  },
  {
    id: 'alstroemeria',
    name: 'ALSTROEMERIA',
    logo: './logo/alstroemeria.png',
    bgm: './music/DAYDREAM.mp3',
    fruits: [
      { name: './fruits/chibi_gurumi/chibi_amana.png',  radius: 43, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_tenka.png',   radius: 49, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_chiyuki.png', radius: 55, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_amana2.png',  radius: 65, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_tenka2.png',  radius: 71, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_chiyuki2.png',radius: 77, imgRadius: 200 },
      { name: './fruits/amana.png',  radius: 116, imgRadius: 183 },
      { name: './fruits/tenka.png',  radius: 143, imgRadius: 183 },
      { name: './fruits/chiyuki.png',radius: 171, imgRadius: 183 },
    ],
  },
  {
    id: 'antica',
    name: "L'ANTICA",
    logo: './logo/lantica.png',
    bgm: './music/文明開花輪舞 -シティ・ハレルヤ- (Off Vocal) - 藤井健太郎.mp3',
    fruits: [
      { name: './fruits/chibi_gurumi/chibi_kogane.png',    radius: 40, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_mamimi.png',    radius: 45, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_sakuya.png',    radius: 49, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_mitsumine.png', radius: 53, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_kiriko.png',    radius: 57, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_kogane2.png',    radius: 65, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_mamimi2.png',    radius: 69, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_sakuya2.png',    radius: 73, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_mitsumine2.png', radius: 77, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_kiriko2.png',    radius: 81, imgRadius: 200 },
      { name: './fruits/kogane.png',    radius: 116, imgRadius: 183 },
      { name: './fruits/mamimi.png',    radius: 127, imgRadius: 183 },
      { name: './fruits/sakuya.png',    radius: 138, imgRadius: 183 },
      { name: './fruits/mitsumine.png', radius: 154, imgRadius: 183 },
      { name: './fruits/kiriko.png',    radius: 171, imgRadius: 183 },
    ],
  },
  {
    id: 'after_school',
    name: '放课后',
    logo: './logo/hokagoclimaxgirls.png',
    bgm: './music/パーティーマジックデザイナー (Off Vocal) - 牧野太洋.mp3',
    fruits: [
      { name: './fruits/chibi_gurumi/chibi_kaho.png',    radius: 40, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_chiyoko.png', radius: 45, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_rinze.png',   radius: 49, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_juri.png',    radius: 53, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_natsuha.png', radius: 57, imgRadius: 150 },
      { name: './fruits/chibi_gurumi/chibi_kaho2.png',    radius: 65, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_chiyoko2.png', radius: 69, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_rinze2.png',   radius: 73, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_juri2.png',    radius: 77, imgRadius: 200 },
      { name: './fruits/chibi_gurumi/chibi_natsuha2.png', radius: 81, imgRadius: 200 },
      { name: './fruits/kaho.png',    radius: 116, imgRadius: 183 },
      { name: './fruits/chiyoko.png', radius: 127, imgRadius: 183 },
      { name: './fruits/rinze.png',   radius: 138, imgRadius: 183 },
      { name: './fruits/juri.png',    radius: 154, imgRadius: 183 },
      { name: './fruits/natsuha.png', radius: 171, imgRadius: 183 },
    ],
  },
  {
    id: '283',
    name: '283',
    bgm: './music/Migratory Echoes (Off Vocal) - シャイニーカラーズ.mp3',
    logo: './logo/283Pro_Logo.png',
    fruits: [],  // 使用默认 28 种水果
  },
];

/** 根据预设 ID 获取水果列表（移动端自动缩小 10%） */
export function getPresetFruits(presetId?: string): FruitConfig[] {
  let list: FruitConfig[];
  if (presetId) {
    const preset = Presets.find((p) => p.id === presetId);
    list = (preset && preset.fruits.length > 0) ? preset.fruits : DefaultFruits;
  } else {
    list = DefaultFruits;
  }
  if (MOBILE_FRUIT_SCALE !== 1) {
    return list.map((f) => ({ ...f, radius: Math.round(f.radius * MOBILE_FRUIT_SCALE) }));
  }
  return list;
}

/** 合成第 n 级水果得 (n+1)² × 10 分 */
export function getScoreValues(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) ** 2 * 10);
}

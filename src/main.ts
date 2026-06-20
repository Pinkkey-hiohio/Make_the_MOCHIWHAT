import pixi from './pixi';
import { Fruits, GameHeight, Width, IS_MOBILE, IN_APP_BROWSER, GameMode, Presets, getPresetFruits } from './config';
import app from './app';
import { init, startGame, stopGame, setGameCallbacks } from './core';
import './index.css';

const { Loader } = pixi;
// 收集所有预设 + 默认水果的图片路径
const allFruitNames = new Set<string>();
Fruits.forEach((f) => allFruitNames.add(f.name));
Presets.forEach((p) => {
  const presetFruits = getPresetFruits(p.id);
  presetFruits.forEach((f) => allFruitNames.add(f.name));
});
const images = Array.from(allFruitNames);
const root = document.getElementById('root')!;
const canvas = app.view;
root.appendChild(canvas);

// ===== 加载进度条 =====
const loadingOverlay = document.getElementById('loading-overlay')!;
const loadingBar = document.getElementById('loading-bar')!;
const loadingPercent = document.getElementById('loading-percent')!;

// BGM 文件路径列表（用于预加载）
const menuBgmPath = './music/稲垣敬也 - TOWN (SCmix).mp3';
const allBgmPaths = [menuBgmPath, ...Presets.map((p) => p.bgm)];
const totalAssets = images.length + allBgmPaths.length;
let loadedCount = 0;

const updateProgress = () => {
  const pct = Math.round((loadedCount / totalAssets) * 100);
  loadingBar.style.width = `${pct}%`;
  loadingPercent.textContent = `${pct}%`;
};

// 预加载单个 BGM（超时 + canplaythrough + suspect 兜底）
const BGM_LOAD_TIMEOUT = 8000;
const preloadBgm = (src: string): Promise<void> => new Promise((resolve) => {
  const audio = new Audio();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    loadedCount++;
    updateProgress();
    resolve();
  };
  audio.src = src;
  audio.addEventListener('canplaythrough', finish, { once: true });
  audio.addEventListener('suspend', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  setTimeout(finish, BGM_LOAD_TIMEOUT);
  audio.load();
});

// PIXI 加载图片，每张完成时更新进度
Loader.shared.onProgress.add(() => {
  loadedCount++;
  updateProgress();
});

// 资源全部就绪后的回调（保证加载动画至少持续 1000ms）
const loadingStartTime = Date.now();
const onAllAssetsReady = () => {
  init();
  initBgmElements();
  activeBgmId = '__menu__';

  const elapsed = Date.now() - loadingStartTime;
  const remaining = Math.max(0, 1000 - elapsed);

  // 淡出加载界面
  setTimeout(() => {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      menuOverlay.classList.remove('hidden');
      bgmControl.classList.remove('hidden');

      // 立即播放菜单 BGM（已预加载，无需等待用户点击）
      if (menuBgm) {
        menuBgm.play().then(() => {
          bgmPlaying = true;
          bgmToggle.textContent = '🔊';
        }).catch(() => {});
      }
    }, 400);
  }, remaining);
};

// 开始加载所有资源（整体超时兜底：最长 15 秒）
const ALL_LOAD_TIMEOUT = 15000;
Promise.race([
  Promise.all([
    new Promise<void>((resolve) => {
      Loader.shared.add(images).load(() => resolve());
    }),
    ...allBgmPaths.map(preloadBgm),
  ]),
  new Promise<void>((resolve) => {
    setTimeout(resolve, ALL_LOAD_TIMEOUT);
  }),
]).then(onAllAssetsReady);

const resetSize = () => {
  const { innerWidth: vw, innerHeight: vh } = window;

  // PC 端：动态 rem 根字体（以 1280×720 为基准 → 约 85% 屏占比）
  if (!IS_MOBILE) {
    document.documentElement.style.fontSize =
      `${Math.min(vw / 1280, vh / 720) * 16}px`;
  } else {
    document.documentElement.style.fontSize = '';
  }

  // 统一弹性填充方案：画布等比缩放撑满视口
  const gameAspect = Width / GameHeight;
  const screenAspect = vw / vh;
  let scale: number;
  if (screenAspect > gameAspect) {
    scale = vh / GameHeight;
  } else {
    scale = vw / Width;
  }
  canvas.style.width = `${Width}px`;
  canvas.style.height = `${GameHeight}px`;
  canvas.style.transform = `scale(${scale})`;
  root.style.width = `${vw}px`;
  root.style.height = `${vh}px`;
};

canvas.style.width = `${Width}px`;
canvas.style.height = `${GameHeight}px`;
resetSize();

window.onresize = resetSize;

// 标记移动端以启用响应式 CSS
if (IS_MOBILE) {
  document.body.classList.add('is-mobile');
}

// ===== 菜单与 UI 逻辑 =====
const menuOverlay = document.getElementById('menu-overlay')!;
const mainMenuPanel = document.getElementById('main-menu-panel')!;
const presetPanel = document.getElementById('preset-panel')!;
const scoreDisplay = document.getElementById('score-display')!;
const gameOverOverlay = document.getElementById('game-over-overlay')!;
const finalScoreEl = document.getElementById('final-score')!;
const modeButtons = document.querySelectorAll('.mode-btn');

let selectedMode: GameMode = GameMode.Normal;
let selectedPresetId: string = Presets[0].id;

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    modeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMode = (btn as HTMLElement).dataset.mode as GameMode;
  });
});

// 开始按钮：普通模式进入预设选择，无限模式直接开始
document.getElementById('start-btn')!.addEventListener('click', () => {
  if (selectedMode === GameMode.Normal) {
    // 进入预设选择面板
    mainMenuPanel.classList.add('hidden');
    presetPanel.classList.remove('hidden');
    // 默认选中第一个
    const items = presetPanel.querySelectorAll('.preset-item');
    items.forEach((i) => i.classList.remove('active'));
    if (items[0]) { items[0].classList.add('active'); selectedPresetId = Presets[0].id; }
    switchBgm(Presets[0].id);
  } else {
    menuOverlay.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    showReturnBtn();
    switchBgm('283');
    startGame(selectedMode);
  }
});

// 生成预设列表
const presetList = document.getElementById('preset-list')!;
Presets.forEach((preset) => {
  const item = document.createElement('div');
  item.className = 'preset-item';
  item.dataset.presetId = preset.id;
  item.innerHTML = `
    <img class="preset-item-logo" src="${preset.logo}" alt="${preset.name}" />
    <span class="preset-item-name">${preset.name}</span>
  `;
  item.addEventListener('click', () => {
    presetList.querySelectorAll('.preset-item').forEach((el) => el.classList.remove('active'));
    item.classList.add('active');
    selectedPresetId = preset.id;
    switchBgm(preset.id);
  });
  presetList.appendChild(item);
});
// 默认选中第一个
presetList.querySelectorAll('.preset-item')[0]?.classList.add('active');

// 预设面板的按钮
document.getElementById('preset-start-btn')!.addEventListener('click', () => {
  menuOverlay.classList.add('hidden');
  presetPanel.classList.add('hidden');
  mainMenuPanel.classList.remove('hidden');
  scoreDisplay.classList.remove('hidden');
  gameOverOverlay.classList.add('hidden');
  showReturnBtn();
  startGame(GameMode.Normal, selectedPresetId);
});
document.getElementById('back-main-btn')!.addEventListener('click', () => {
  presetPanel.classList.add('hidden');
  mainMenuPanel.classList.remove('hidden');
  switchBgm('__menu__');
});

document.getElementById('restart-btn')!.addEventListener('click', () => {
  gameOverOverlay.classList.add('hidden');
  scoreDisplay.classList.remove('hidden');
  showReturnBtn();
  startGame(selectedMode, selectedPresetId);
});

document.getElementById('back-menu-btn')!.addEventListener('click', () => {
  stopGame();
  hideReturnBtn();
  gameOverOverlay.classList.add('hidden');
  scoreDisplay.classList.add('hidden');
  menuOverlay.classList.remove('hidden');
  switchBgm('__menu__');
});

// ===== 游戏中返回按钮 + 退出确认 =====
const gameReturnBtn = document.getElementById('game-return-btn')!;
const confirmDialog = document.getElementById('confirm-dialog')!;

const showReturnBtn = () => {
  gameReturnBtn.classList.remove('hidden');
  if (IS_MOBILE) document.body.classList.add('is-in-game');
};
const hideReturnBtn = () => {
  gameReturnBtn.classList.add('hidden');
  bgmPopup.classList.remove('show');
  if (IS_MOBILE) document.body.classList.remove('is-in-game');
};

gameReturnBtn.addEventListener('click', () => {
  confirmDialog.classList.remove('hidden');
});

document.getElementById('confirm-yes-btn')!.addEventListener('click', () => {
  confirmDialog.classList.add('hidden');
  hideReturnBtn();
  stopGame();
  scoreDisplay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  menuOverlay.classList.remove('hidden');
  switchBgm('__menu__');
});

document.getElementById('confirm-no-btn')!.addEventListener('click', () => {
  confirmDialog.classList.add('hidden');
});

// 点击弹窗外关闭
confirmDialog.addEventListener('click', (e) => {
  if (e.target === confirmDialog) confirmDialog.classList.add('hidden');
});



setGameCallbacks(
  (score: number) => {
    scoreDisplay.textContent = `得分: ${score}`;
  },
  (score: number, _mode: GameMode) => {
    scoreDisplay.classList.add('hidden');
    hideReturnBtn();
    finalScoreEl.textContent = `最终得分: ${score}`;
    gameOverOverlay.classList.remove('hidden');
  },
);

// ===== 菜单 Logo =====
const logoImg = document.getElementById('logo-img') as HTMLImageElement;
logoImg.src = './fruits/mano.webp';

// ===== BGM 控制 =====
let bgmElements: Map<string, HTMLAudioElement> = new Map();
let menuBgm: HTMLAudioElement | null = null;
let activeBgmId = '';
let bgmPlaying = false;

const bgmControl = document.getElementById('bgm-control')!;
const bgmToggle = document.getElementById('bgm-toggle')!;
const bgmVolume = document.getElementById('bgm-volume') as HTMLInputElement;

// 创建所有 BGM
const initBgmElements = () => {
  // 菜单 BGM
  menuBgm = new Audio('./music/稲垣敬也 - TOWN (SCmix).mp3');
  menuBgm.loop = true;
  menuBgm.volume = parseFloat(bgmVolume.value) / 100;
  bgmElements.set('__menu__', menuBgm);

  // 各预设 BGM
  Presets.forEach((p) => {
    const audio = new Audio(p.bgm);
    audio.loop = true;
    audio.volume = parseFloat(bgmVolume.value) / 100;
    bgmElements.set(p.id, audio);
  });
};

// 停止所有 BGM
const stopAllBgm = () => {
  bgmElements.forEach((a) => { a.pause(); a.currentTime = 0; });
};

// 切换到指定 BGM
const switchBgm = (bgmId: string) => {
  if (bgmId === activeBgmId) return;
  stopAllBgm();
  activeBgmId = bgmId;
  if (bgmPlaying) {
    const bgm = bgmElements.get(bgmId);
    if (bgm) { bgm.play().catch(() => {}); }
  }
};

const bgmPopup = document.getElementById('bgm-popup')!;

bgmVolume.addEventListener('input', (e) => {
  e.stopPropagation();
  const vol = parseFloat(bgmVolume.value) / 100;
  bgmElements.forEach((audio) => { audio.volume = vol; });
});

bgmToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  if (bgmPlaying) {
    stopAllBgm();
    bgmToggle.textContent = '🔇';
  } else {
    const bgm = bgmElements.get(activeBgmId);
    if (bgm) { bgm.play().catch(() => {}); }
    bgmToggle.textContent = '🔊';
  }
  bgmPlaying = !bgmPlaying;

  // 移动端游戏时：切换音量弹出面板
  if (IS_MOBILE && gameReturnBtn && !gameReturnBtn.classList.contains('hidden')) {
    bgmPopup.classList.toggle('show');
  }
});

// 移动端：点击弹出面板外部关闭
document.addEventListener('click', (e) => {
  if (!IS_MOBILE) return;
  const target = e.target as HTMLElement;
  if (!bgmPopup.contains(target) && target !== bgmToggle) {
    bgmPopup.classList.remove('show');
  }
});

// ===== 微信/QQ 内置浏览器引导 =====
if (IN_APP_BROWSER) {
  const guideOverlay = document.getElementById('browser-guide-overlay')!;
  const guideCopyBtn = document.getElementById('guide-copy-btn')!;
  const guideUrl = document.getElementById('guide-url-display')!;
  const guideCopiedHint = document.getElementById('guide-copied-hint')!;
  const guideStepIcon1 = document.getElementById('guide-step-icon')!;
  const guideStepIcon2 = document.getElementById('guide-step-icon2')!;

  guideUrl.textContent = window.location.href;
  guideOverlay.classList.remove('hidden');

  // 微信：绿色按钮图标
  if (IN_APP_BROWSER === 'wechat') {
    guideStepIcon1.textContent = '⋮';
    guideStepIcon1.style.background = '#07c160';
    guideStepIcon2.textContent = '🌐';
  }
  // QQ：蓝色按钮图标
  if (IN_APP_BROWSER === 'qq') {
    guideStepIcon1.textContent = '⋮';
    guideStepIcon1.style.background = '#12b7f5';
    guideStepIcon2.textContent = '🌐';
  }

  // 复制链接按钮
  guideCopyBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    guideCopiedHint.classList.remove('hidden');
    setTimeout(() => guideCopiedHint.classList.add('hidden'), 2500);
  });
}
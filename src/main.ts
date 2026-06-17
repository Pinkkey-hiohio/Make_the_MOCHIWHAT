import pixi from './pixi';
import { Fruits, Height, Width, GameMode, Presets, getPresetFruits } from './config';
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

const resetSize = () => {
  const { innerWidth, innerHeight } = window;
  const scaleX = innerWidth / Width;
  const scaleY = innerHeight / Height;
  const scale = Math.min(scaleX, scaleY);
  canvas.style.width = `${Width}px`;
  canvas.style.height = `${Height}px`;
  canvas.style.transform = `scale(${scale})`;
  root.style.width = `${innerWidth}px`;
  root.style.height = `${innerHeight}px`;
};

canvas.style.width = `${Width}px`;
canvas.style.height = `${Height}px`;
resetSize();

window.onresize = resetSize;

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

const showReturnBtn = () => { gameReturnBtn.classList.remove('hidden'); };
const hideReturnBtn = () => { gameReturnBtn.classList.add('hidden'); };

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
logoImg.src = './fruits/mano.png';

Loader.shared.add(images).load(() => {
  init();
  initBgmElements();
  activeBgmId = '__menu__';
  menuOverlay.classList.remove('hidden');
  bgmControl.classList.remove('hidden');
});

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

// 切换到指定 BGM（始终尝试播放，调用方负责确认用户已交互）
const switchBgm = (bgmId: string) => {
  if (bgmId === activeBgmId && bgmPlaying) return;
  stopAllBgm();
  activeBgmId = bgmId;
  const bgm = bgmElements.get(bgmId);
  if (bgm) {
    bgm.play().then(() => {
      bgmPlaying = true;
      bgmToggle.textContent = '🔊';
    }).catch(() => {});
  }
};

bgmVolume.addEventListener('input', () => {
  const vol = parseFloat(bgmVolume.value) / 100;
  bgmElements.forEach((audio) => { audio.volume = vol; });
});

bgmToggle.addEventListener('click', () => {
  if (bgmPlaying) {
    stopAllBgm();
    bgmToggle.textContent = '🔇';
  } else {
    const bgm = bgmElements.get(activeBgmId);
    if (bgm) { bgm.play().catch(() => {}); }
    bgmToggle.textContent = '🔊';
  }
  bgmPlaying = !bgmPlaying;
});

// 首次交互触发当前 BGM（重试直到成功）
const tryPlayBgm = () => {
  if (bgmPlaying) return;
  const bgm = bgmElements.get(activeBgmId);
  if (bgm) {
    bgm.play().then(() => {
      bgmPlaying = true;
      bgmToggle.textContent = '🔊';
    }).catch(() => {});
  }
};
document.addEventListener('click', tryPlayBgm);


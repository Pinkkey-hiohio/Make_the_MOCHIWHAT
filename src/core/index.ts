import { Sprite as SpriteType } from '@pixi/sprite';
import pixi from '../pixi';
import b2 from '../box2d';
import app from '../app';
import {
  Ratio, PositionIterations, VelocityIterations, TimeStep, Height, Width,
  GameMode,
  getPresetFruits, getScoreValues,
  FruitConfig,
} from '../config';
import { b2Body } from '../b2/dynamics/b2_body';

const { Sprite, Loader, Graphics } = pixi;
const world = new b2.World({ x: 0, y: 10 });

let currentScore = 0;
let gameMode: GameMode = GameMode.Normal;
let isGameOver = false;
let animationId: number | null = null;

let onScoreUpdate: ((score: number) => void) | null = null;
let onGameOverCallback: ((score: number, mode: GameMode) => void) | null = null;

export const setGameCallbacks = (
  scoreCb: (score: number) => void,
  gameOverCb: (score: number, mode: GameMode) => void,
) => {
  onScoreUpdate = scoreCb;
  onGameOverCallback = gameOverCb;
};

const createWall = () => {
  const wallBodyDef = new b2.BodyDef();
  const wallFixtureDef = new b2.FixtureDef();
  wallBodyDef.type = b2.staticBody;
  wallFixtureDef.density = 0;
  wallFixtureDef.friction = 0.2;
  wallFixtureDef.restitution = 0.3;
  wallFixtureDef.filter.groupIndex = -20;
  wallFixtureDef.shape = new b2.ChainShape().CreateLoop([
    { x: 0, y: 0 / Ratio },
    { x: 0, y: Height / Ratio },
    { x: Width / Ratio, y: Height / Ratio },
    { x: Width / Ratio, y: 0 / Ratio },
  ]);
  const wallBody = world.CreateBody(wallBodyDef);
  wallBody.CreateFixture(wallFixtureDef);
  wallBody.SetUserData({ type: -1 });
};

let deathLine: pixi.Graphics | null = null;
const createDeathLine = () => {
  const g = new Graphics();
  g.lineStyle(3, 0x999999, 0.5);
  const dashLen = 12;
  const gapLen = 8;
  const y = 10; // 与 checkGameOver 中的阈值一致（画面顶端下方10px）
  let x = 0;
  let draw = true;
  while (x < Width) {
    if (draw) {
      g.moveTo(x, y);
      const endX = Math.min(x + dashLen, Width);
      g.lineTo(endX, y);
    }
    x += dashLen;
    draw = !draw;
    if (!draw) x += gapLen;
  }
  app.stage.addChild(g);
  deathLine = g;
};

const fruitDefaultY = 150 / Ratio;
const fruitBodyDef = new b2.BodyDef();
fruitBodyDef.type = b2.dynamicBody;
fruitBodyDef.position.Set(Width / 2 / Ratio, fruitDefaultY);

let activeFruits: FruitConfig[] = [];
let activeFruitFixtureDefs: b2.FixtureDef[] = [];
let activeScoreValues: number[] = [];

const rebuildFruitData = (list: FruitConfig[]) => {
  activeFruits = list;
  activeFruitFixtureDefs = list.map((fruit) => {
    const fixtureDef = new b2.FixtureDef();
    fixtureDef.density = 0.1;
    fixtureDef.friction = 0.2;
    fixtureDef.restitution = 0.3;
    fixtureDef.shape = new b2.CircleShape(fruit.radius / Ratio);
    fixtureDef.filter.groupIndex = 1;
    return fixtureDef;
  });
  activeScoreValues = getScoreValues(list.length);
};

let fruitId = 0;
const fruits: {[key: string]: {body: b2Body, sprite: SpriteType}} = {};
const contactedFruits = new Map<number, number>();
const mergingFruitSet = new Set();
const createSprite = (type: number, x = -299, y = -299) => {
  const fruit = activeFruits[type];
  const sprite = new Sprite();
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.texture = Loader.shared.resources[fruit.name].texture!;
  sprite.scale.set(fruit.radius / fruit.imgRadius);
  return sprite;
};
const currentNextFruit = {
  current: 0,
  next: 0,
};
let currentFruitSprite: SpriteType;
let nextFruitSprite: SpriteType;
const setCurrentNextFruit = () => {
  let currentFruit = 0;
  let nextFruit = 0;
  Object.defineProperty(currentNextFruit, 'current', {
    get() {
      return currentFruit;
    },
    set(value) {
      currentFruit = value;
      const fruit = activeFruits[value];
      currentFruitSprite.texture = Loader.shared.resources[fruit.name].texture!;
      currentFruitSprite.scale.set(fruit.radius / fruit.imgRadius);
    },
  });
  Object.defineProperty(currentNextFruit, 'next', {
    get() {
      return nextFruit;
    },
    set(value) {
      nextFruit = value;
      const fruit = activeFruits[value];
      nextFruitSprite.texture = Loader.shared.resources[fruit.name].texture!;
      nextFruitSprite.scale.set(fruit.radius / fruit.imgRadius);
    },
  });
};
setCurrentNextFruit();
const createFruit = (id: number, x = Width / 2) => {
  let newX = x;
  if (x < 5) newX = 5;
  if (x > Width - 5) newX = Width - 5;
  const fruit = activeFruits[id];
  const fruitBody = world.CreateBody(fruitBodyDef);
  fruitBody.SetSleepingAllowed(true);
  fruitBody.SetPositionXY(newX / Ratio, fruitDefaultY);
  fruitBody.CreateFixture(activeFruitFixtureDefs[id]);
  fruitBody.SetUserData({ type: id, id: fruitId });
  const sprite = createSprite(id);
  app.stage.addChild(sprite);
  fruits[fruitId++] = { body: fruitBody, sprite };
  currentNextFruit.current = currentNextFruit.next;
  const maxType = activeFruits.length - 1;
  const genCap = (n: number) => Math.min(n, maxType - 1);
  if (fruitId < 4) currentNextFruit.next = Math.floor(Math.random() * genCap(2));
  else if (fruitId < 8) currentNextFruit.next = Math.floor(Math.random() * genCap(3));
  else if (fruitId < 16) currentNextFruit.next = Math.floor(Math.random() * genCap(5));
  else if (fruitId < 32) currentNextFruit.next = Math.floor(Math.random() * genCap(7));
  else if (fruitId < 64) currentNextFruit.next = Math.floor(Math.random() * genCap(10));
  else currentNextFruit.next = Math.floor(Math.random() * genCap(13));
};

const animationFruits = [];

const doWithContactedFruits = () => {
  contactedFruits.forEach((maxId, minId) => {
    let top = fruits[maxId];
    let bottom = fruits[minId];
    if (top.body.GetPosition().y > bottom.body.GetPosition().y) {
      const mid = top;
      top = bottom;
      bottom = mid;
    }
    bottom.body.DestroyFixture(bottom.body.GetFixtureList()!);
    const data = bottom.body.GetUserData();
    bottom.body.CreateFixture(activeFruitFixtureDefs[data.type + 1]);
    bottom.body.SetUserData({ ...data, type: data.type + 1 });
    mergingFruitSet.delete(minId);
    mergingFruitSet.delete(maxId);
    delete fruits[top.body.GetUserData().id];
    world.DestroyBody(top.body);
    app.stage.removeChild(top.sprite);
    const newFruit = activeFruits[data.type + 1];
    bottom.sprite.texture = Loader.shared.resources[newFruit.name].texture!;
    bottom.sprite.scale.set(newFruit.radius / newFruit.imgRadius);
    currentScore += activeScoreValues[data.type];
    if (onScoreUpdate) onScoreUpdate(currentScore);
  });
  contactedFruits.clear();
};

const checkGameOver = (): boolean => {
  if (gameMode === GameMode.Infinite) return false;
  const keys = Object.keys(fruits);
  for (let i = 0; i < keys.length; i++) {
    const fruit = fruits[keys[i]];
    const data = fruit.body.GetUserData();
    const fruitConfig = activeFruits[data.type];
    // 水果顶部边缘越过死亡线判定失败
    const topEdge = fruit.body.GetPosition().y * Ratio - fruitConfig.radius;
    if (topEdge < 10) {
      return true;
    }
  }
  return false;
};

const loop = () => {
  if (isGameOver) return;
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  world.Step(TimeStep, VelocityIterations, PositionIterations);
  doWithContactedFruits();
  Object.keys(fruits).forEach((id) => {
    const fruit = fruits[id];
    const { body, sprite } = fruit;
    const { x, y } = body.GetPosition();
    const angle = body.GetAngle();
    sprite.x = x * Ratio;
    sprite.y = y * Ratio;
    sprite.rotation = angle;
  });
  if (checkGameOver()) {
    isGameOver = true;
    if (onGameOverCallback) onGameOverCallback(currentScore, gameMode);
    return;
  }
  animationId = requestAnimationFrame(loop);
};

const rootElement = document.getElementById('root')!;
let lastClickTime = 0;
const tooFrequent = () => {
  const now = new Date().getTime();
  if (now - lastClickTime < 500) return true;
  lastClickTime = now;
  return false;
};

export const init = () => {
  const canvas = document.getElementsByTagName('canvas')[0];
  canvas.addEventListener('touchmove', (event) => {
    if (isGameOver) return;
    const { changedTouches } = event;
    if (changedTouches.length !== 1) return;
    const left = parseFloat(getComputedStyle(rootElement).marginLeft);
    const { clientX } = changedTouches[0];
    // @ts-ignore
    const newX = (clientX - left) / parseFloat(rootElement.childNodes[0].style.transform.slice(6));
    currentFruitSprite.x = newX;
  });
  canvas.addEventListener('touchend', (event) => {
    if (isGameOver) return;
    if (tooFrequent()) return;
    const { changedTouches } = event;
    if (changedTouches.length !== 1) return;
    const left = parseFloat(getComputedStyle(rootElement).marginLeft);
    const { clientX } = changedTouches[0];
    // @ts-ignore
    const newX = (clientX - left) / parseFloat(rootElement.childNodes[0].style.transform.slice(6));
    currentFruitSprite.x = Width / 2;
    // @ts-ignore
    createFruit(currentNextFruit.current, newX);
  });
  canvas.addEventListener('mousemove', (event) => {
    if ('ontouchend' in window) return;
    if (isGameOver) return;
    const { offsetX } = event;
    currentFruitSprite.x = offsetX;
  });
  canvas.addEventListener('click', (event) => {
    if ('ontouchend' in window) return;
    if (isGameOver) return;
    if (tooFrequent()) return;
    const { offsetX } = event;
    currentFruitSprite.x = offsetX;
    createFruit(currentNextFruit.current, offsetX);
  });
  createWall();
  createDeathLine();

  b2.ContactListener.prototype.PreSolve = (contact) => {
    const a = contact.GetFixtureA().GetBody().GetUserData();
    const b = contact.GetFixtureB().GetBody().GetUserData();
    if (a.type !== b.type || a.type >= activeFruits.length - 1) return;
    const minId = Math.min(a.id, b.id);
    const maxId = Math.max(a.id, b.id);
    const contactedFruit = contactedFruits.get(minId);
    if (!contactedFruit) {
      if (mergingFruitSet.has(minId) || mergingFruitSet.has(maxId)) return;
      contactedFruits.set(minId, maxId);
      mergingFruitSet.add(minId);
      mergingFruitSet.add(maxId);
      contact.SetEnabled(false);
      return;
    }
    if (contactedFruit === maxId) {
      contact.SetEnabled(false);
    }
  };
};

const destroyAllFruits = () => {
  const keys = Object.keys(fruits);
  for (let i = 0; i < keys.length; i++) {
    const fruit = fruits[keys[i]];
    world.DestroyBody(fruit.body);
    app.stage.removeChild(fruit.sprite);
    delete fruits[keys[i]];
  }
  fruitId = 0;
  contactedFruits.clear();
  mergingFruitSet.clear();
};

export const startGame = (mode: GameMode, presetId?: string) => {
  gameMode = mode;
  currentScore = 0;
  isGameOver = false;
  fruitId = 0;

  // 根据预设加载对应水果列表
  const presetFruits = getPresetFruits(presetId);
  rebuildFruitData(presetFruits);

  // 普通模式显示警戒线，无限模式隐藏
  if (deathLine) deathLine.visible = mode === GameMode.Normal;

  destroyAllFruits();

  if (currentFruitSprite) app.stage.removeChild(currentFruitSprite);
  if (nextFruitSprite) app.stage.removeChild(nextFruitSprite);

  // 先创建 sprite，否则 setter 中访问 currentFruitSprite 会报 undefined
  const initialMax = Math.min(2, activeFruits.length);
  const currentType = Math.floor(Math.random() * initialMax);
  const nextType = Math.floor(Math.random() * initialMax);
  currentFruitSprite = createSprite(currentType, Width / 2, fruitDefaultY * Ratio);
  nextFruitSprite = createSprite(nextType, Width / 2, 0);
  app.stage.addChild(currentFruitSprite);
  app.stage.addChild(nextFruitSprite);

  currentNextFruit.current = currentType;
  currentNextFruit.next = nextType;

  if (onScoreUpdate) onScoreUpdate(0);

  loop();
};

export const stopGame = () => {
  isGameOver = true;
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

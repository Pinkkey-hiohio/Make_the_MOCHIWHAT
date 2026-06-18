import pixi from './pixi';
import { Height, Width } from './config';

const app = new pixi.Application({
  width: Width,
  height: Height,
  antialias: true,
  backgroundColor: 0xffe89d,
});

/** 动态调整 PIXI 渲染器尺寸（移动端适配用） */
export function resizeApp(w: number, h: number): void {
  app.renderer.resize(w, h);
}

export default app;

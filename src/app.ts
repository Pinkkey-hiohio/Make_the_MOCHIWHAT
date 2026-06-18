import pixi from './pixi';
import { GameHeight, Width } from './config';

export default new pixi.Application({
  width: Width,
  height: GameHeight,
  antialias: true,
  backgroundColor: 0xffe89d,
});

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#16213e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,        // 비율 유지하면서 화면에 맞춤
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 중앙 정렬
    width: 1024,                   // 기준 너비
    height: 768,                   // 기준 높이
    min: {
      width: 320,
      height: 240,
    },
    max: {
      width: 2048,
      height: 1536,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, UIScene],
};

new Phaser.Game(config);


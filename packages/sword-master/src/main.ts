import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,              // WebGL 강제 (더 선명한 렌더링)
  parent: 'game-container',
  backgroundColor: '#16213e',
  // 렌더링 설정 - 선명한 그래픽
  render: {
    antialias: true,               // 안티앨리어싱 활성화
    pixelArt: false,               // 스무딩 허용 → 선명한 텍스트/그래픽
  },
  scale: {
    mode: Phaser.Scale.FIT,        // 비율 유지하면서 화면에 맞춤
    autoCenter: Phaser.Scale.CENTER_BOTH,  // 중앙 정렬
    width: 1920,                   // 높은 해상도
    height: 1080,
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


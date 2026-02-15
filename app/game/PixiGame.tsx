'use client';

import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';

type CardType = 'attack' | 'defend';

interface CardDef {
  key: string;
  name: string;
  cost: number;
  type: CardType;
  value: number;
  desc: string;
}

interface Card extends CardDef {
  id: number;
}

interface Enemy {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  delay: number;
  delayMax: number;
  reward: number;
}

const CARD_POOL: CardDef[] = [
  { key: 'slash', name: '베기', cost: 1, type: 'attack', value: 9, desc: '적 1명에게 9 피해' },
  { key: 'thrust', name: '찌르기', cost: 1, type: 'attack', value: 7, desc: '적 1명에게 7 피해' },
  { key: 'power', name: '강타', cost: 2, type: 'attack', value: 16, desc: '적 1명에게 16 피해' },
  { key: 'guard', name: '가드', cost: 1, type: 'defend', value: 8, desc: '방어 +8' },
  { key: 'iron', name: '철벽', cost: 2, type: 'defend', value: 14, desc: '방어 +14' },
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function PixiGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    let disposed = false;
    let initialized = false;

    const app = new Application();
    const scene = new Container();

    const state = {
      player: {
        hp: 80,
        maxHp: 80,
        mana: 3,
        maxMana: 3,
        block: 0,
        gold: 0,
        wave: 1,
      },
      deck: [] as Card[],
      discard: [] as Card[],
      hand: [] as Card[],
      enemies: [] as Enemy[],
      message: '카드를 눌러 전투를 진행하세요.',
      gameOver: false,
      nextCardId: 1,
      nextEnemyId: 1,
    };

    function makeStarterDeck(): Card[] {
      const list: Card[] = [];
      const pushCard = (key: string, count: number) => {
        const def = CARD_POOL.find((c) => c.key === key);
        if (!def) return;
        for (let i = 0; i < count; i += 1) {
          list.push({ ...def, id: state.nextCardId++ });
        }
      };

      pushCard('slash', 4);
      pushCard('thrust', 3);
      pushCard('power', 2);
      pushCard('guard', 3);
      pushCard('iron', 2);

      return shuffle(list);
    }

    function getAliveEnemies(): Enemy[] {
      return state.enemies.filter((enemy) => enemy.hp > 0);
    }

    function spawnWave(wave: number) {
      const count = Math.min(1 + Math.floor((wave - 1) / 2), 3);
      const names = ['잔철 망령', '심연 파수병', '붉은 추적자'];
      state.enemies = Array.from({ length: count }).map((_, index) => {
        const hp = 26 + wave * 7 + index * 6;
        const delayMax = 2 + (index % 2);
        return {
          id: state.nextEnemyId++,
          name: names[index] ?? `균열체 ${index + 1}`,
          hp,
          maxHp: hp,
          attack: 7 + Math.floor(wave * 1.4) + index,
          delay: delayMax,
          delayMax,
          reward: 4 + wave,
        };
      });
    }

    function drawCards(count: number) {
      for (let i = 0; i < count; i += 1) {
        if (state.deck.length === 0) {
          if (state.discard.length === 0) break;
          state.deck = shuffle(state.discard);
          state.discard = [];
        }

        const card = state.deck.pop();
        if (!card) break;
        state.hand.push(card);
      }
    }

    function startTurn() {
      if (state.gameOver) return;
      state.player.mana = state.player.maxMana;
      state.player.block = 0;
      drawCards(Math.max(0, 5 - state.hand.length));
      state.message = '플레이어 턴: 카드를 사용하거나 턴 종료를 누르세요.';
    }

    function applyDamageToPlayer(raw: number) {
      const absorbed = Math.min(state.player.block, raw);
      state.player.block -= absorbed;
      const damage = raw - absorbed;
      if (damage > 0) {
        state.player.hp -= damage;
      }

      if (state.player.hp <= 0) {
        state.player.hp = 0;
        state.gameOver = true;
        state.message = '패배했습니다. 다시 시작하세요.';
      }
    }

    function resolveEnemyAttacks() {
      if (state.gameOver) return;
      for (const enemy of getAliveEnemies()) {
        if (enemy.delay <= 0) {
          applyDamageToPlayer(enemy.attack);
          enemy.delay = enemy.delayMax;
        }
      }
    }

    function advanceEnemyDelays(step: number) {
      for (const enemy of getAliveEnemies()) {
        enemy.delay -= step;
      }
      resolveEnemyAttacks();
    }

    function clearWaveIfNeeded() {
      if (state.gameOver) return;
      if (getAliveEnemies().length > 0) return;

      const reward = state.enemies.reduce((sum, enemy) => sum + enemy.reward, 0);
      state.player.gold += reward;
      state.player.wave += 1;

      state.deck = shuffle([...state.deck, ...state.discard, ...state.hand]);
      state.discard = [];
      state.hand = [];

      spawnWave(state.player.wave);
      state.message = `웨이브 클리어! +${reward}G, 다음 웨이브 시작`;
      startTurn();
    }

    function playCard(handIndex: number) {
      if (state.gameOver) return;

      const card = state.hand[handIndex];
      if (!card) return;

      if (state.player.mana < card.cost) {
        state.message = '마나가 부족합니다.';
        render();
        return;
      }

      state.player.mana -= card.cost;

      if (card.type === 'attack') {
        const target = getAliveEnemies()[0];
        if (!target) {
          state.message = '공격할 적이 없습니다.';
        } else {
          target.hp = Math.max(0, target.hp - card.value);
          state.message = `${card.name}: ${target.name}에게 ${card.value} 피해`;
        }
      }

      if (card.type === 'defend') {
        state.player.block += card.value;
        state.message = `${card.name}: 방어 +${card.value}`;
      }

      state.hand.splice(handIndex, 1);
      state.discard.push(card);

      advanceEnemyDelays(1);
      clearWaveIfNeeded();
      render();
    }

    function endTurn() {
      if (state.gameOver) return;
      advanceEnemyDelays(1);
      clearWaveIfNeeded();
      if (!state.gameOver) {
        startTurn();
      }
      render();
    }

    function restart() {
      state.player.hp = state.player.maxHp;
      state.player.mana = state.player.maxMana;
      state.player.block = 0;
      state.player.gold = 0;
      state.player.wave = 1;
      state.deck = makeStarterDeck();
      state.discard = [];
      state.hand = [];
      state.gameOver = false;
      spawnWave(1);
      startTurn();
      render();
    }

    function clearScene() {
      const children = scene.removeChildren();
      for (const child of children) {
        child.destroy({ children: true });
      }
    }

    function panel(x: number, y: number, w: number, h: number, color: number): Graphics {
      const g = new Graphics();
      g.roundRect(x, y, w, h, 12);
      g.fill({ color });
      return g;
    }

    function label(text: string, x: number, y: number, size = 14, color = '#f4f7fb', bold = false) {
      const t = new Text({
        text,
        style: {
          fill: color,
          fontSize: size,
          fontWeight: bold ? '700' : '500',
          fontFamily: 'Noto Sans KR, sans-serif',
        },
      });
      t.position.set(x, y);
      scene.addChild(t);
      return t;
    }

    function button(opts: {
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      fill: number;
      textColor?: string;
      onClick: () => void;
      disabled?: boolean;
    }) {
      const g = panel(opts.x, opts.y, opts.w, opts.h, opts.disabled ? 0x3a3f48 : opts.fill);
      g.eventMode = opts.disabled ? 'none' : 'static';
      g.cursor = opts.disabled ? 'default' : 'pointer';
      if (!opts.disabled) {
        g.on('pointertap', opts.onClick);
      }

      scene.addChild(g);

      const t = new Text({
        text: opts.text,
        style: {
          fill: opts.textColor ?? '#0f1115',
          fontSize: 15,
          fontWeight: '700',
          fontFamily: 'Noto Sans KR, sans-serif',
        },
      });
      t.anchor.set(0.5);
      t.position.set(opts.x + opts.w * 0.5, opts.y + opts.h * 0.5);
      scene.addChild(t);
    }

    function render() {
      clearScene();

      const w = app.screen.width;
      const h = app.screen.height;
      const pad = 14;

      const topH = 92;
      scene.addChild(panel(pad, pad, w - pad * 2, topH, 0x171b22));
      label(`HP ${state.player.hp}/${state.player.maxHp}`, pad + 16, pad + 16, 18, '#f4f7fb', true);
      label(`마나 ${state.player.mana}/${state.player.maxMana} · 방어 ${state.player.block}`, pad + 16, pad + 46, 14, '#a7b0bf');
      label(`Wave ${state.player.wave} · Gold ${state.player.gold}G`, w - 260, pad + 20, 15, '#d4b463', true);

      const midY = pad + topH + 12;
      const midH = h - midY - 188;
      scene.addChild(panel(pad, midY, w - pad * 2, midH, 0x12161d));

      label(state.message, pad + 14, midY + 10, 14, '#a7b0bf');

      const enemies = getAliveEnemies();
      const enemyW = Math.min(210, (w - pad * 2 - 24 - (enemies.length - 1) * 10) / Math.max(1, enemies.length));
      const enemyH = 150;
      enemies.forEach((enemy, index) => {
        const x = pad + 12 + index * (enemyW + 10);
        const y = midY + 38;
        scene.addChild(panel(x, y, enemyW, enemyH, 0x2a1717));
        label(enemy.name, x + 12, y + 10, 16, '#ffd9d9', true);
        label(`HP ${enemy.hp}/${enemy.maxHp}`, x + 12, y + 46, 14, '#ffe8e8');
        label(`ATK ${enemy.attack}`, x + 12, y + 72, 14, '#ffbdbd');
        label(`공격까지 ${Math.max(0, enemy.delay)} 턴`, x + 12, y + 98, 13, '#f0a8a8');
      });

      const handY = h - 168;
      scene.addChild(panel(pad, handY, w - pad * 2, 154, 0x171b22));
      label('핸드', pad + 14, handY + 10, 14, '#d4b463', true);

      const cardW = 154;
      const cardH = 112;
      const gap = 10;
      const startX = pad + 12;

      state.hand.forEach((card, index) => {
        const x = startX + index * (cardW + gap);
        const y = handY + 28;
        if (x + cardW > w - pad - 70) return;

        const usable = state.player.mana >= card.cost && !state.gameOver;
        const fill = card.type === 'attack' ? 0x3a2020 : 0x20343a;
        const body = panel(x, y, cardW, cardH, usable ? fill : 0x2a2f35);

        body.eventMode = usable ? 'static' : 'none';
        body.cursor = usable ? 'pointer' : 'default';
        if (usable) {
          body.on('pointertap', () => playCard(index));
        }

        scene.addChild(body);
        label(card.name, x + 10, y + 8, 15, '#f4f7fb', true);
        label(`코스트 ${card.cost}`, x + 10, y + 32, 13, '#d4b463');
        label(card.desc, x + 10, y + 56, 12, '#c7ceda');
      });

      button({
        x: w - pad - 120,
        y: handY + 44,
        w: 104,
        h: 44,
        text: '턴 종료',
        fill: 0xd4b463,
        onClick: endTurn,
        disabled: state.gameOver,
      });

      if (state.gameOver) {
        const overlay = panel(0, 0, w, h, 0x000000);
        overlay.alpha = 0.66;
        scene.addChild(overlay);

        const boxW = 360;
        const boxH = 190;
        const boxX = w * 0.5 - boxW * 0.5;
        const boxY = h * 0.5 - boxH * 0.5;
        scene.addChild(panel(boxX, boxY, boxW, boxH, 0x171b22));
        label('GAME OVER', boxX + 108, boxY + 34, 30, '#f4f7fb', true);
        label(`도달 웨이브: ${state.player.wave}`, boxX + 120, boxY + 84, 16, '#a7b0bf');

        button({
          x: boxX + 110,
          y: boxY + 122,
          w: 140,
          h: 44,
          text: '다시 시작',
          fill: 0xd4b463,
          onClick: restart,
        });
      }
    }

    const init = async () => {
      await app.init({
        width: host.clientWidth,
        height: host.clientHeight,
        background: '#0b0d12',
        antialias: false,
        resolution: 1,
      });

      if (disposed) {
        if (initialized) {
          app.destroy(true);
        }
        return;
      }

      initialized = true;
      host.appendChild(app.canvas);
      app.stage.addChild(scene);

      state.deck = makeStarterDeck();
      spawnWave(1);
      startTurn();
      render();

      const onResize = () => {
        if (!hostRef.current) return;
        app.renderer.resize(hostRef.current.clientWidth, hostRef.current.clientHeight);
        render();
      };

      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
      };
    };

    let cleanup: (() => void) | undefined;

    init().then((maybeCleanup) => {
      cleanup = maybeCleanup;
    });

    return () => {
      disposed = true;
      cleanup?.();
      if (initialized) {
        app.destroy(true);
      }
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="game-stage-inner" />;
}

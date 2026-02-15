# 소드마스터 - 데이터 레퍼런스

본 문서는 현재 코드(`lib/game-data.ts`) 기준의 데이터 소스를 정리합니다.

## 1) 플레이어 기본값

```ts
PLAYER_BASE = {
  hp: 80,
  mana: 3,
}
```

## 2) 카드 풀 (`CARD_POOL`)

| key | 이름 | 타입 | 코스트 | 값 | 설명 |
|-----|------|------|--------|----|------|
| slash | 베기 | attack | 1 | 9 | 적 1명에게 9 피해 |
| thrust | 찌르기 | attack | 1 | 7 | 적 1명에게 7 피해 |
| power | 강타 | attack | 2 | 16 | 적 1명에게 16 피해 |
| guard | 가드 | defend | 1 | 8 | 방어 +8 |
| iron | 철벽 | defend | 2 | 14 | 방어 +14 |

## 3) 시작 덱 (`STARTER_DECK`)

| key | 수량 |
|-----|------|
| slash | 4 |
| thrust | 3 |
| power | 2 |
| guard | 3 |
| iron | 2 |

총 14장.

## 4) 적 이름 풀 (`ENEMY_NAMES`)

```ts
['잔철 망령', '심연 파수병', '붉은 추적자']
```

웨이브당 적 수가 최대 3명이므로 슬롯별 이름이 고정 매핑됩니다.

## 5) 웨이브/적 생성 공식

### 적 수

```text
getWaveEnemyCount(wave) = min(1 + floor((wave - 1) / 2), 3)
```

### 개별 적 스탯

```text
hp       = 26 + wave * 7 + index * 6
delayMax = 2 + (index % 2)
attack   = 7 + floor(wave * 1.4) + index
reward   = 4 + wave
```

`delay` 초기값은 `delayMax`와 동일합니다.

## 6) Fictional Unique Swords (Lore Draft)

아래 이름은 룰북/설정 확장 시 사용할 수 있는 **픽션 전용** 유니크 검 콘셉트입니다.
실존 무기 명칭을 직접 사용하지 않도록 유지합니다.

- 성흔절도
- 공허침식도
- 폭풍유리검
- 야식맹세검
- 여명파열도

현재 런타임에는 미구현이며, 데이터 테이블도 아직 코드에 연결되어 있지 않습니다.

## 7) 룰북 데이터 확장 방법(JSON/MD)

룰북을 코드 하드코딩 대신 외부 데이터로 관리하려면 다음 형태를 권장합니다.

```text
data/
  rulebook/
    cards.json
    enemies.json
    glossary.md
```

도입 순서:
1. `lib/game-data.ts`를 기준으로 JSON 스키마를 먼저 고정
2. `app/rulebook/page.tsx`에서 JSON 로드 후 렌더링
3. 긴 설명/세계관은 `.md`로 분리
4. 데이터 변경 시 e2e 스냅샷 테스트로 회귀 확인

핵심은 "코드 값"과 "문서 값"이 분리되어 드리프트하지 않게 관리하는 것입니다.

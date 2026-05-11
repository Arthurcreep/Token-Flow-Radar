# Token Flow Radar

**Token Flow Radar** — MVP-приложение для анализа зрелых Ethereum-токенов через on-chain потоки, поведение крупных держателей, CEX inflow/outflow, top holders, accumulation/distribution score и signal journal.

Цель проекта — не угадывать цену, а определять рыночную фазу токена:

```text
accumulation -> narrative seeding -> shill phase -> retail attention -> distribution
```

---

## MVP Scope

Первая версия работает только с:

- Ethereum mainnet
- ARB
- 1INCH
- UNI
- AAVE
- LINK

Основные модули MVP:

- Token Registry
- Entity / Address Labels
- Token Transfers
- CEX Flow Analyzer
- Top Holders Analyzer
- Token Metrics / Accumulation Score
- Regime Detector
- Signal Journal
- Social Lifecycle Radar — позже

---

## Tech Stack

### Backend

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- Zod
- Pino Logger
- Nodemon

### Frontend

- React.js без TypeScript
- Vite
- Tailwind CSS
- Recharts
- lightweight-charts

Docker Compose в MVP не используется.

---

## Project Structure

```text
token-flow-radar/
  README.md
  .gitignore

  backend/
    package.json
    .env.example
    .sequelizerc

    src/
      config/
      database/
        migrations/
        seeders/
      errors/
      middlewares/
      models/
      modules/
        tokens/
        labels/
        transfers/
        cex-flows/
        holders/
        metrics/
        signals/
        jobs/
      utils/
      app.js
      server.js

  frontend/
```

Backend строится по принципу:

```text
routes -> controllers -> services -> repositories/models
```

Роуты должны быть тонкими. Вся бизнес-логика живет в services.

---

## Backend Setup

Перейти в backend:

```bash
cd backend
```

Установить зависимости:

```bash
npm install
```

Создать `.env`:

```bash
cp .env.example .env
```

Пример `.env`:

```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=token_flow_radar
DB_USER=postgres
DB_PASSWORD=postgres

LOG_LEVEL=debug
```

Создать базу:

```bash
npm run db:create
```

Выполнить миграции:

```bash
npm run db:migrate
```

Засидить MVP-данные:

```bash
npm run mvp:seed
```

Запустить backend:

```bash
npm run dev
```

Backend запускается на:

```text
http://localhost:4000
```

---

## Available Scripts

```bash
npm run dev                 # запуск backend в dev-режиме
npm run start               # запуск backend

npm run db:create           # создать базу данных
npm run db:migrate          # выполнить миграции
npm run db:seed             # выполнить все seeders
npm run db:undo             # откатить последнюю миграцию
npm run db:reset            # откатить все миграции, накатить заново и засидить MVP

npm run seed:tokens         # seed MVP-токенов
npm run seed:labels         # seed entities/address labels
npm run seed:fake-transfers # seed fake UNI transfers
npm run seed:fake-holders   # seed fake UNI holder snapshots

npm run mvp:seed            # выполнить все MVP seeders в правильном порядке
```

---

## MVP Backend Pipeline

После запуска backend MVP pipeline выглядит так:

```bash
# 1. Миграции
cd backend
npm run db:migrate

# 2. Seed базовых данных
npm run mvp:seed

# 3. Запуск backend
npm run dev
```

Расчет аналитики:

```bash
# Рассчитать CEX flows для UNI
curl -X POST http://localhost:4000/api/jobs/calculate-cex-flows/UNI

# Рассчитать token metrics / score / regime
curl -X POST http://localhost:4000/api/jobs/calculate-token-metrics/UNI

# Сгенерировать signal journal
curl -X POST http://localhost:4000/api/jobs/generate-signals/UNI
```

Проверка:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/db

curl http://localhost:4000/api/tokens
curl http://localhost:4000/api/tokens/UNI
curl http://localhost:4000/api/tokens/UNI/overview

curl http://localhost:4000/api/labels
curl http://localhost:4000/api/transfers?token=UNI

curl http://localhost:4000/api/tokens/UNI/cex-flows
curl http://localhost:4000/api/tokens/UNI/holders/top
curl http://localhost:4000/api/tokens/UNI/metrics/latest
curl http://localhost:4000/api/tokens/UNI/signals
curl http://localhost:4000/api/signals
```

Текущая fake UNI картина:

```text
CEX netflow 7d: -650,000 UNI
CEX balance change 7d: -1,500,000 UNI
Non-CEX holder change 7d: +2,420,000 UNI
Regime: ACCUMULATION
Signal: accumulation_detected
```

---

## Current API

### Health

```http
GET /api/health
GET /api/health/db
```

### Tokens

```http
GET /api/tokens
GET /api/tokens/:symbol
GET /api/tokens/:symbol/overview
```

### Labels

```http
GET /api/labels
GET /api/labels?addressType=cex
GET /api/labels/:address
```

### Transfers

```http
GET /api/transfers?token=UNI
```

### CEX Flows

```http
GET /api/tokens/:symbol/cex-flows
```

### Holders

```http
GET /api/tokens/:symbol/holders/top
```

### Metrics

```http
GET /api/tokens/:symbol/metrics/latest
```

### Signals

```http
GET /api/signals
GET /api/tokens/:symbol/signals
```

### Jobs

```http
POST /api/jobs/calculate-cex-flows/:symbol
POST /api/jobs/calculate-token-metrics/:symbol
POST /api/jobs/generate-signals/:symbol
```

---

## API Response Format

Успешный ответ:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Ошибка:

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token not found",
    "details": null
  }
}
```

---

## Error Handling

В backend используется централизованная обработка ошибок:

```text
service throws AppError
asyncHandler catches error
global errorHandler formats response
```

Основные типы ошибок:

- BadRequestError
- NotFoundError
- ConflictError
- ExternalApiError
- Sequelize errors
- Validation errors

---

## Core Product Logic

Главная модель анализа:

```text
address -> entity -> role -> confidence -> behavior -> score -> regime -> signal
```

Без качественных labels приложение будет врать.

Главный принцип:

```text
No labels -> no confidence
```

---

## Current MVP Analytical Flow

```text
tokens
  ↓
entities / addresses / labels
  ↓
token_transfers
  ↓
cex_flow_daily
  ↓
holder_snapshots
  ↓
token_metrics_daily
  ↓
signals
  ↓
overview
```

Для текущего fake UNI сценария:

```text
CEX outflow > CEX inflow
CEX balances decrease
Non-CEX top holders increase balances
Final regime = ACCUMULATION
```

---

## Database Modules

Текущие таблицы backend MVP:

- tokens
- entities
- addresses
- token_transfers
- cex_flow_daily
- holder_snapshots
- token_metrics_daily
- signals

Запланированные позже:

- whale_cohort_daily
- job_runs
- token_social_tags
- social_mentions
- social_metrics_daily

---

## Signal Journal

Signal Journal сохраняет важные события.

Пример текущего сигнала:

```json
{
  "signalType": "accumulation_detected",
  "severity": "high",
  "confidence": 0.88,
  "score": 100,
  "regime": "ACCUMULATION",
  "summary": "UNI shows accumulation regime"
}
```

Смысл:

```text
metric = текущее состояние токена
signal = событие, которое система заметила и записала
```

---

## Social Lifecycle Radar

Social-модуль нужен не для примитивного “токен хайпится”.

Он должен определять фазу цикла:

```text
fund accumulation
narrative seeding
influencer / Telegram shill
retail attention spike
distribution into hype
```

Ключевой вопрос:

```text
Что делали крупные до хайпа, во время хайпа и после хайпа?
```

Social слой будет добавляться позже, после базового dashboard.

---

## Important Notes

### Score v1 is intentionally simple

Текущий score — MVP-формула:

```text
CEX netflow < 0 => accumulation pressure
Non-CEX holders balance change > 0 => accumulation pressure
CEX holder balance change < 0 => exchange supply drain
```

Это не финальная торговая модель.

Позже score нужно нормализовать по:

- supply share
- historical flow volatility
- USD value
- token-specific thresholds
- label coverage
- whale cohorts
- price context

### Labels are critical

Если CEX/bridge/contract/treasury адреса размечены плохо, score будет врать.

Особенно опасно перепутать:

- CEX hot wallet
- bridge contract
- vesting wallet
- treasury
- market maker
- настоящий whale address

---

## Current Backend Status

Готово:

- backend skeleton
- PostgreSQL connection
- Sequelize config
- migrations
- seed tokens
- health endpoints
- token endpoints
- centralized error handling
- request validation
- structured logging
- entity/address labels
- token transfers
- CEX flow analyzer
- holder snapshots
- top holders analyzer
- token metrics daily
- accumulation score v1
- regime detector v1
- signal journal
- overview endpoint

---

## Next Development Step

Следующий этап:

```text
Frontend dashboard
```

Минимальные страницы:

```text
/tokens
/tokens/:symbol
/signals
```

Главный frontend endpoint:

```http
GET /api/tokens/:symbol/overview
```

Дополнительные:

```http
GET /api/tokens/:symbol/cex-flows
GET /api/tokens/:symbol/holders/top
GET /api/tokens/:symbol/signals
```

---

## Git Commit

Рекомендуемая точка коммита:

```bash
git add .
git commit -m "Build backend MVP analytics pipeline"
```

# Прокси для OpenRouter (Cloudflare Worker — T9)

Безопасный серверный прокси на базе Cloudflare Workers для приложения **English Algorithm Trainer**. Позволяет нескольким ученикам пользоваться бесплатными ИИ-моделями OpenRouter по индивидуальным кодам доступа (`X-Access-Code`), не передавая API-ключ OpenRouter в браузер.

## Что делает прокси
- `GET /models` — запрашивает список моделей OpenRouter, оставляет только бесплатные (`pricing.prompt === "0" && pricing.completion === "0"`), кеширует ответ на 1 час в Cache API.
- `POST /chat` — проверяет:
  1. Наличие заголовка `X-Access-Code` в списке разрешённых секретов `ACCESS_CODES` (иначе `401 Unauthorized`).
  2. Что запрошенная `model` и все `models[]` входят в список бесплатных моделей (иначе `400 Bad Request` — защита от случайных трат на платные модели).
  3. Суммарную длину `messages` ≤ 16 000 символов (иначе `413 Payload Too Large`) и ограничивает `max_tokens` ≤ 1500.
  4. Дневной лимит запросов на каждый код доступа (`day:<YYYY-MM-DD>:<code>` в Cloudflare KV, по умолчанию `60` запросов в сутки; при превышении возвращает `429 {"error":"daily_limit"}`).
- Настраивает CORS для `https://higolol.github.io`, `http://localhost:5173` и `http://localhost:4173`.
- Не пишет в логи ключи, коды доступа и тексты запросов учеников.

---

## Пошаговая инструкция по деплою (для владельца)

### 1. Создайте отдельный ключ OpenRouter
На сайте [openrouter.ai/keys](https://openrouter.ai/keys) создайте **отдельный** API-ключ специально для прокси и установите ему **Credit Limit** (например, `$1` или `$0`), чтобы при любой нештатной ситуации списания были исключены.

### 2. Установите Wrangler и авторизуйтесь в Cloudflare
```bash
npm i -g wrangler
wrangler login
```
Откроется окно браузера для подтверждения входа в аккаунт Cloudflare.

### 3. Создайте KV-хранилище для дневных лимитов
Перейдите в папку `app/worker` и выполните:
```bash
cd app/worker
wrangler kv namespace create LIMITS
```
Скопируйте полученный `id` из вывода команды, раскомментируйте блок `[[kv_namespaces]]` в файле `wrangler.toml` и впишите туда `id`:
```toml
[[kv_namespaces]]
binding = "LIMITS"
id = "ваш_id_из_вывода_команды"
```

### 4. Задайте секреты в Cloudflare
```bash
wrangler secret put OPENROUTER_KEY
# Вставьте ключ OpenRouter (sk-or-v1-...)

wrangler secret put ACCESS_CODES
# Введите коды доступа учеников через запятую, например:
# nikolay-2026,student-anna,student-max
```

### 5. Задеплойте Worker
```bash
wrangler deploy
```
В консоли появится URL вашего воркера, например:
`https://ea-proxy.<ваш-аккаунт>.workers.dev`

Пропишите этот URL в GitHub репозитории (`Settings → Secrets and variables → Actions → Variables → New repository variable`) под именем:
- `VITE_PROXY_URL` = `https://ea-proxy.<ваш-аккаунт>.workers.dev`

---

## 6. Проверка работы (curl)

### Локальный запуск (`wrangler dev`)
Создайте локальный файл `.dev.vars` в `app/worker/` (он в `.gitignore`, **не коммитить!**):
```ini
OPENROUTER_KEY=sk-or-v1-...
ACCESS_CODES=test-code-1,test-code-2
```
Запустите локально:
```bash
wrangler dev
```

### Тестовые запросы
1. **Список бесплатных моделей (`GET /models` → 200 OK):**
```bash
curl -i http://127.0.0.1:8787/models
```

2. **Запрос без кода доступа (`POST /chat` → 401 Unauthorized):**
```bash
curl -i -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"openrouter/free","messages":[{"role":"user","content":"Hi"}]}'
```

3. **Запрос с платной моделью (`POST /chat` → 400 Bad Request):**
```bash
curl -i -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -H "X-Access-Code: test-code-1" \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"Hi"}]}'
```

4. **Рабочий запрос с верным кодом и бесплатной моделью (`POST /chat` → 200 OK):**
```bash
curl -i -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -H "X-Access-Code: test-code-1" \
  -d '{"model":"openrouter/free","messages":[{"role":"user","content":"Return JSON: {\"ok\":true}"}]}'
```

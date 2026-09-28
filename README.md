# English Algorithm Trainer (EA Trainer)

Мобильный PWA-тренажёр грамматики английского языка по авторской методике «English Algorithm» (Жандос Адетбеков).

## Стек технологий
- **Фреймворк**: Vite + React 18 + TypeScript (strict)
- **Стили**: Tailwind CSS
- **Роутинг**: `react-router-dom` с `HashRouter` (для GitHub Pages)
- **PWA**: `vite-plugin-pwa` (offline precache бандла и данных, autoUpdate, service worker)
- **Хранилище**: React state + `localStorage`

## Команды запуска

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки (Dev Server)
```bash
npm run dev
```
Dev-сервер запускается с локальным прокси для ИИ (`/api/ai` → OpenRouter / прокси владельца).
При старте в консоли выводится статус:
`AI dev proxy → <host>, key: set|missing` (без значения самого ключа).

### Сборка для продакшена (Build)
```bash
npm run build
```
Выполняет проверку типов TypeScript (`tsc -b`) и собирает оптимизированный PWA-бандл в директорию `dist/`.

### Предпросмотр сборки (Preview)
```bash
npm run preview
```
Запускает локальный сервер для проверки готового бандла и работы Service Worker / PWA офлайн.

## Структура проекта
```
app/
  public/                     # Статические ресурсы (иконки PWA, манифест)
  src/
    components/               # Layout, навигация, общие компоненты
    data/                     # dataset.sample.json, index.ts (экспорт датасета)
    lib/                      # settings.ts (настройки в localStorage)
    screens/                  # Экраны приложения (Home, Translate, Formula, Grid, Theory, AiLab, Me)
    types.ts                  # Единый контракт типов методики
    App.tsx                   # Корневой компонент с HashRouter
    main.tsx                  # Точка входа и регистрация PWA Service Worker
```

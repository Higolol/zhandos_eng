import React, { useState, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
  applyTheme,
  getProxyUrl,
  type AppSettings,
  type ThemeMode,
  type AiMode,
} from '../lib/settings';

export const Me: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [showKey, setShowKey] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const handleUpdate = (patch: Partial<AppSettings>) => {
    const updated = saveSettings(patch);
    setSettings(updated);
    if (patch.theme) {
      applyTheme(patch.theme);
    }
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const proxyUrl = getProxyUrl();

  return (
    <div className="p-4 flex flex-col gap-5 pt-safe">
      <header className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            Я и Настройки
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Прогресс ученика и параметры приложения
          </p>
        </div>
        {savedBanner && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md transition-all">
            Сохранено
          </span>
        )}
      </header>

      {/* Progress Summary Section */}
      <section className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Мой прогресс
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-lg font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Пройдено</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">0%</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Точность</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">0</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Ошибок</div>
          </div>
        </div>
      </section>

      {/* Theme Settings */}
      <section className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Тема оформления
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((t) => (
            <button
              key={t}
              onClick={() => handleUpdate({ theme: t })}
              className={`min-h-touch py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                settings.theme === t
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t === 'system' ? 'Системная' : t === 'light' ? 'Светлая' : 'Тёмная'}
            </button>
          ))}
        </div>
      </section>

      {/* AI Settings */}
      <section className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex flex-col gap-3.5">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Настройки ИИ
        </h2>

        {/* AI Mode selector */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5 font-medium">
            Режим подключения
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['dev', 'proxy', 'byok'] as AiMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleUpdate({ aiMode: mode })}
                className={`min-h-touch py-2 px-2 rounded-lg text-xs font-semibold border uppercase tracking-wider transition-colors ${
                  settings.aiMode === mode
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
            {settings.aiMode === 'dev' && 'dev: локальный прокси Vite (/api/ai → OpenRouter)'}
            {settings.aiMode === 'proxy' && 'proxy: продакшен-прокси Cloudflare Worker (T9)'}
            {settings.aiMode === 'byok' && 'byok: собственный ключ ученика (Bring Your Own Key)'}
          </p>
        </div>

        {/* Proxy URL info for proxy mode */}
        {settings.aiMode === 'proxy' && (
          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Адрес Worker-прокси:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100 break-all">
              {proxyUrl || '(не задан в VITE_PROXY_URL)'}
            </span>
          </div>
        )}

        {/* BYOK warning & input */}
        {settings.aiMode === 'byok' && (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Ключ хранится на этом устройстве</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
              Ваш персональный ключ OpenRouter сохраняется только в localStorage текущего браузера и никуда не передаётся.
            </p>
            <div className="relative mt-1">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={settings.openrouterKey}
                onChange={(e) => handleUpdate({ openrouterKey: e.target.value })}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-sm font-mono min-h-touch text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs p-1"
              >
                {showKey ? 'Скрыть' : 'Показать'}
              </button>
            </div>
          </div>
        )}

        {/* Primary Model */}
        <div>
          <label htmlFor="primary-model-input" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Основная модель
          </label>
          <input
            id="primary-model-input"
            type="text"
            value={settings.primaryModel}
            onChange={(e) => handleUpdate({ primaryModel: e.target.value })}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm font-mono min-h-touch text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {/* Fallback Models */}
        <div>
          <span className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Резервные модели</span>
          <div className="flex flex-wrap gap-1.5">
            {settings.fallbackModels.map((m) => (
              <span
                key={m}
                className="text-[11px] font-mono px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

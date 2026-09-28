import React, { useState, useEffect } from 'react';
import { getSettings, type AppSettings } from '../lib/settings';

export const AiLab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4 pt-safe">
      <header className="border-b border-gray-200 dark:border-gray-800 pb-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">ИИ</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Умный помощник и объяснение ошибок
        </p>
      </header>

      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Режим ИИ:</span>
        <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
          {settings.aiMode}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3 my-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">
          Экран «ИИ Помощник»
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          Заглушка каркаса PWA (задача T3). Интеграция с моделями OpenRouter через dev-прокси или
          Cloudflare Worker подключается в задаче T7.
        </p>
      </div>
    </div>
  );
};

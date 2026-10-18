import React, { useState, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
  applyTheme,
  type AppSettings,
  type ThemeMode,
} from '../lib/settings';
import { ProgressPanel } from '../components/ProgressPanel';
import { AiSettings } from '../components/AiSettings';

export const Me: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
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

  return (
    <div className="p-4 flex flex-col gap-5 pt-safe pb-24 max-w-5xl mx-auto w-full">
      <header className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            Я и Настройки
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Прогресс ученика по темам и параметры приложения
          </p>
        </div>
        {savedBanner && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md transition-all">
            Сохранено
          </span>
        )}
      </header>

      <div className="cq-me-grid">
        {/* Левая колонка на ПК: Панель прогресса ученика (T4) */}
        <section aria-label="Мой прогресс" className="min-w-0">
          <ProgressPanel />
        </section>

        {/* Правая колонка на ПК: Тема + Настройки ИИ */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Тема оформления */}
          <section className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Тема оформления
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'light', 'dark'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleUpdate({ theme: t })}
                  className={`min-h-touch py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
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

          {/* Настройки ИИ и выбор моделей (T7) */}
          <section aria-label="Настройки ИИ" className="min-w-0">
            <AiSettings
              onSettingsChanged={(newSettings) => {
                setSettings(newSettings);
                setSavedBanner(true);
                setTimeout(() => setSavedBanner(false), 2000);
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

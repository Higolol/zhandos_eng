import React, { useState, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
  type AppSettings,
  type AiMode,
} from '../lib/settings';
import {
  getStoredModels,
  fetchFreeModels,
  selectDefaultModels,
  type AiModelInfo,
} from '../lib/models';

interface AiSettingsProps {
  onSettingsChanged?: (newSettings: AppSettings) => void;
  className?: string;
}

export const AiSettings: React.FC<AiSettingsProps> = ({
  onSettingsChanged,
  className = '',
}) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [models, setModels] = useState<AiModelInfo[]>(getStoredModels);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Определение эндпоинта для загрузки моделей в зависимости от режима
  const getModelsUrl = (mode: AiMode): { url: string; headers?: Record<string, string> } => {
    if (mode === 'dev') {
      return { url: '/api/ai/models' };
    }
    if (mode === 'proxy') {
      const base = (import.meta.env.VITE_PROXY_URL as string | undefined) ?? '';
      return {
        url: `${base.replace(/\/+$/, '')}/models`,
        headers: settings.accessCode ? { 'X-Access-Code': settings.accessCode } : undefined,
      };
    }
    return {
      url: 'https://openrouter.ai/api/v1/models',
      headers: settings.openrouterKey ? { Authorization: `Bearer ${settings.openrouterKey}` } : undefined,
    };
  };

  const loadModels = async (force = false) => {
    setIsLoadingModels(true);
    setStatusMessage(null);
    try {
      const { url, headers } = getModelsUrl(settings.aiMode);
      const loaded = await fetchFreeModels(url, headers, force);
      setModels(loaded);
      const cur = getSettings();
      if (loaded.length > 0 && !loaded.some((m) => m.id === cur.primaryModel)) {
        const auto = selectDefaultModels(loaded);
        const updated = saveSettings({ primaryModel: auto.primary, fallbackModels: auto.fallbacks });
        setSettings(updated);
        onSettingsChanged?.(updated);
      }
      setStatusMessage(`Загружено ${loaded.length} бесплатных моделей`);
    } catch (err: any) {
      console.error('Ошибка загрузки моделей:', err);
      setStatusMessage(`Ошибка обновления: ${err.message || 'сеть недоступна'}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    loadModels(false);
  }, [settings.aiMode]);

  const handleModeChange = (mode: AiMode) => {
    const updated = saveSettings({ aiMode: mode });
    setSettings(updated);
    onSettingsChanged?.(updated);
  };

  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    const updated = saveSettings({ accessCode: code });
    setSettings(updated);
    onSettingsChanged?.(updated);
  };

  const handleOpenrouterKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    const updated = saveSettings({ openrouterKey: key });
    setSettings(updated);
    onSettingsChanged?.(updated);
  };

  const handlePrimaryModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    const updated = saveSettings({ primaryModel: model });
    setSettings(updated);
    onSettingsChanged?.(updated);
  };

  const handleFallbackChange = (index: number, modelId: string) => {
    const current = [...(settings.fallbackModels || [])];
    if (modelId) {
      current[index] = modelId;
    } else {
      current.splice(index, 1);
    }
    const clean = Array.from(new Set(current.filter(Boolean))).slice(0, 2);
    const updated = saveSettings({ fallbackModels: clean });
    setSettings(updated);
    onSettingsChanged?.(updated);
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 shadow-sm space-y-4 text-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Настройки ИИ</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            OpenRouter: основная модель и каскад резервных
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadModels(true)}
          disabled={isLoadingModels}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          title="Обновить список бесплатных моделей"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoadingModels ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {statusMessage && (
        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {/* Выбор режима */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Режим подключения
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['dev', 'proxy', 'byok'] as AiMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                settings.aiMode === mode
                  ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
              }`}
            >
              {mode === 'dev' && 'Dev (Vite)'}
              {mode === 'proxy' && 'Прокси T9'}
              {mode === 'byok' && 'Свой ключ'}
            </button>
          ))}
        </div>
      </div>

      {/* Поля ключа/доступа */}
      {settings.aiMode === 'dev' && (
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
          В dev-режиме ключ подставляет Vite-прокси автоматически. Запросы идут на{' '}
          <code className="text-gray-800 dark:text-gray-200">/api/ai/...</code>
        </div>
      )}

      {settings.aiMode === 'proxy' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Код доступа ученика
          </label>
          <input
            type="password"
            value={settings.accessCode}
            onChange={handleAccessCodeChange}
            placeholder="Введите код доступа..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      )}

      {settings.aiMode === 'byok' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Ключ OpenRouter API
          </label>
          <input
            type="password"
            value={settings.openrouterKey}
            onChange={handleOpenrouterKeyChange}
            placeholder="sk-or-v1-..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      )}

      {/* Выбор основной модели */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span>Основная модель (Primary)</span>
          <span className="text-[10px] text-gray-400">приоритет запросов</span>
        </label>
        <select
          value={settings.primaryModel}
          onChange={handlePrimaryModelChange}
          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {/* Если текущей модели нет в списке, покажем её */}
          {!models.some((m) => m.id === settings.primaryModel) && (
            <option value={settings.primaryModel}>{settings.primaryModel}</option>
          )}
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.id} {m.supportsJson ? '✓ JSON' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Резервная модель 1 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span>Резервная модель 1 (Fallback 1)</span>
          <span className="text-[10px] text-gray-400">если основная дала 429</span>
        </label>
        <select
          value={settings.fallbackModels[0] || ''}
          onChange={(e) => handleFallbackChange(0, e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">(Не выбрана)</option>
          {settings.fallbackModels[0] &&
            !models.some((m) => m.id === settings.fallbackModels[0]) && (
              <option value={settings.fallbackModels[0]}>{settings.fallbackModels[0]}</option>
            )}
          {models
            .filter((m) => m.id !== settings.primaryModel)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id} {m.supportsJson ? '✓ JSON' : ''}
              </option>
            ))}
        </select>
      </div>

      {/* Резервная модель 2 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span>Резервная модель 2 (Fallback 2)</span>
          <span className="text-[10px] text-gray-400">второй уровень каскада</span>
        </label>
        <select
          value={settings.fallbackModels[1] || ''}
          onChange={(e) => handleFallbackChange(1, e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">(Не выбрана)</option>
          {settings.fallbackModels[1] &&
            !models.some((m) => m.id === settings.fallbackModels[1]) && (
              <option value={settings.fallbackModels[1]}>{settings.fallbackModels[1]}</option>
            )}
          {models
            .filter((m) => m.id !== settings.primaryModel && m.id !== settings.fallbackModels[0])
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id} {m.supportsJson ? '✓ JSON' : ''}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

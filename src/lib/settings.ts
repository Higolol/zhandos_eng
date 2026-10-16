export type AiMode = 'dev' | 'proxy' | 'byok';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  aiMode: AiMode;
  accessCode: string;
  openrouterKey: string;
  primaryModel: string;
  fallbackModels: string[];
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiMode: import.meta.env.DEV ? 'dev' : 'proxy',
  accessCode: '',
  openrouterKey: '',
  primaryModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  fallbackModels: [
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'openai/gpt-oss-120b:free',
  ],
  theme: 'system',
};

const SETTINGS_KEY = 'ea_trainer_settings';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      aiMode: parsed.aiMode ?? (import.meta.env.DEV ? 'dev' : 'proxy'),
      accessCode: parsed.accessCode ?? '',
      openrouterKey: parsed.openrouterKey ?? '',
      primaryModel: parsed.primaryModel ?? DEFAULT_SETTINGS.primaryModel,
      fallbackModels: Array.isArray(parsed.fallbackModels) ? parsed.fallbackModels : [...DEFAULT_SETTINGS.fallbackModels],
      theme: parsed.theme ?? 'system',
    };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  try {
    const current = getSettings();
    const updated: AppSettings = { ...current, ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
    return { ...DEFAULT_SETTINGS, ...patch };
  }
}

export function getProxyUrl(): string {
  return (import.meta.env.VITE_PROXY_URL as string | undefined) ?? '';
}

export function applyTheme(theme: ThemeMode): void {
  try {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Failed to apply theme:', err);
  }
}

/**
 * Проверка готовности настроек ИИ для текущего режима.
 * В режиме 'dev' ключ инжектируется прокси Vite, поэтому готов всегда.
 * В режиме 'proxy' требуется accessCode.
 * В режиме 'byok' требуется openrouterKey.
 */
export function isAiReady(customSettings?: AppSettings): boolean {
  const s = customSettings ?? getSettings();
  if (s.aiMode === 'dev') return true;
  if (s.aiMode === 'proxy') return Boolean(s.accessCode.trim());
  if (s.aiMode === 'byok') return Boolean(s.openrouterKey.trim());
  return false;
}

/**
 * Обновить выбранную основную и запасные модели
 */
export function updateAiModelSelection(primary: string, fallbacks: string[]): AppSettings {
  return saveSettings({
    primaryModel: primary,
    fallbackModels: fallbacks.slice(0, 2),
  });
}


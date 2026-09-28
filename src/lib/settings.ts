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
  primaryModel: 'google/gemini-2.5-flash',
  fallbackModels: ['meta-llama/llama-3.3-70b-instruct'],
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

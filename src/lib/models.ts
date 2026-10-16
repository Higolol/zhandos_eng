// Управление моделями ИИ (OpenRouter)
// Бесплатные модели не хардкодятся, загружаются из API и кешируются на 24 часа.

export interface AiModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  supportsJson: boolean;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface CachedModelsData {
  timestamp: number;
  models: AiModelInfo[];
}

export const CACHE_KEY = 'ea_free_models_cache';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

/** Приоритеты автовыбора моделей из ТЗ T7 */
export const PRIORITY_PATTERNS: RegExp[] = [
  /nvidia\/nemotron.*120b/i,
  /qwen.*(72b|80b|235b|32b|instruct|coder)/i,
  /openai\/gpt-oss/i,
  /gemini.*flash/i,
  /deepseek.*(chat|v3|r1)/i,
  /llama-3\.[1-9].*(70b|405b)/i,
  /mistral|ministral/i,
  /gemma-[34]-(27b|31b)/i,
];

/** Базовые резервные модели на случай отсутствия сети при первом запуске */
export const DEFAULT_FALLBACK_MODELS: AiModelInfo[] = [
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'NVIDIA Nemotron 3 Super 120B (Free)',
    description: 'Мощная бесплатная модель от NVIDIA',
    supportsJson: true,
    pricing: { prompt: '0', completion: '0' },
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    name: 'Qwen3 Next 80B Instruct (Free)',
    description: 'Инструктивная модель Qwen 80B',
    supportsJson: true,
    pricing: { prompt: '0', completion: '0' },
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'OpenAI GPT-OSS 120B (Free)',
    description: 'Открытая модель 120B с поддержкой JSON',
    supportsJson: true,
    pricing: { prompt: '0', completion: '0' },
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    description: 'Автоматическая маршрутизация на доступные бесплатные модели OpenRouter',
    supportsJson: false,
    pricing: { prompt: '0', completion: '0' },
  },
];

/**
 * Получить сохранённый в localStorage список моделей (если валиден),
 * либо дефолтный список.
 */
export function getStoredModels(): AiModelInfo[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: CachedModelsData = JSON.parse(raw);
      if (Array.isArray(parsed.models) && parsed.models.length > 0) {
        return parsed.models;
      }
    }
  } catch (err) {
    console.warn('Не удалось прочитать кеш моделей из localStorage:', err);
  }
  return DEFAULT_FALLBACK_MODELS;
}

/**
 * Сортировка моделей по критериям ТЗ:
 * 1. Совпадение с регулярками приоритета
 * 2. Поддержка JSON (response_format / structured_outputs)
 * 3. Алфавитный порядок
 */
export function sortModels(models: AiModelInfo[]): AiModelInfo[] {
  return [...models].sort((a, b) => {
    // openrouter/free ставим в конец списка приоритетных, чтобы сначала выбирались конкретные LLM
    if (a.id === 'openrouter/free' && b.id !== 'openrouter/free') return 1;
    if (b.id === 'openrouter/free' && a.id !== 'openrouter/free') return -1;

    const aPriIdx = PRIORITY_PATTERNS.findIndex((p) => p.test(a.id));
    const bPriIdx = PRIORITY_PATTERNS.findIndex((p) => p.test(b.id));

    const aPri = aPriIdx >= 0 ? aPriIdx : 999;
    const bPri = bPriIdx >= 0 ? bPriIdx : 999;

    if (aPri !== bPri) {
      return aPri - bPri;
    }

    if (a.supportsJson !== b.supportsJson) {
      return a.supportsJson ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Автоматический выбор primary и до 2 fallback моделей
 */
export function selectDefaultModels(models: AiModelInfo[]): {
  primary: string;
  fallbacks: string[];
} {
  const sorted = sortModels(models);
  const primary = sorted[0]?.id ?? 'openrouter/free';

  const fallbacks: string[] = [];
  for (let i = 1; i < sorted.length && fallbacks.length < 2; i++) {
    const candidate = sorted[i].id;
    if (candidate !== primary && candidate !== 'openrouter/free' && !fallbacks.includes(candidate)) {
      fallbacks.push(candidate);
    }
  }

  // Если fallback меньше 2, дополним резервными
  if (fallbacks.length === 0 && primary !== 'openrouter/free') {
    fallbacks.push('openrouter/free');
  }

  return { primary, fallbacks };
}

/**
 * Загрузить бесплатные модели из API эндпоинта.
 * Кеширует на сутки в localStorage.
 */
export async function fetchFreeModels(
  url: string,
  headers?: Record<string, string>,
  forceRefresh = false
): Promise<AiModelInfo[]> {
  try {
    if (!forceRefresh) {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CachedModelsData = JSON.parse(raw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_TTL_MS && Array.isArray(cached.models) && cached.models.length > 0) {
          return cached.models;
        }
      }
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Ошибка загрузки моделей: HTTP ${res.status}`);
    }

    const data = await res.json();
    const isDirectArray = Array.isArray(data);
    const rawList: any[] = isDirectArray ? data : Array.isArray(data?.data) ? data.data : [];

    // Фильтр бесплатных моделей: pricing prompt==0 && completion==0 или id заканчивается на :free (или уже отфильтрованный массив от прокси)
    const freeRaw = rawList.filter((m) => {
      if (typeof m.id === 'string' && /guard|moderation|safeguard|embed/i.test(m.id)) {
        return false;
      }
      const isFreePricing =
        m.pricing &&
        (m.pricing.prompt === '0' || m.pricing.prompt === 0) &&
        (m.pricing.completion === '0' || m.pricing.completion === 0);
      const isFreeId = typeof m.id === 'string' && (m.id.endsWith(':free') || m.id === 'openrouter/free');
      return isDirectArray || isFreePricing || isFreeId;
    });

    const parsedModels: AiModelInfo[] = freeRaw.map((m) => {
      const params: string[] = Array.isArray(m.supported_parameters) ? m.supported_parameters : [];
      const supportsJson = params.includes('response_format') || params.includes('structured_outputs');
      return {
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        contextLength: m.context_length,
        supportsJson,
        pricing: m.pricing
          ? {
              prompt: String(m.pricing.prompt ?? '0'),
              completion: String(m.pricing.completion ?? '0'),
            }
          : undefined,
      };
    });

    // Убедимся, что openrouter/free присутствует, если моделей мало
    if (!parsedModels.some((m) => m.id === 'openrouter/free')) {
      parsedModels.push({
        id: 'openrouter/free',
        name: 'OpenRouter Free Auto-Router',
        description: 'Автоматический выбор работающей бесплатной модели',
        supportsJson: true,
        pricing: { prompt: '0', completion: '0' },
      });
    }

    const sorted = sortModels(parsedModels);

    // Сохраняем в кеш
    const cacheData: CachedModelsData = {
      timestamp: Date.now(),
      models: sorted,
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (saveErr) {
      console.warn('Не удалось сохранить модели в localStorage:', saveErr);
    }

    return sorted;
  } catch (err) {
    console.warn('Ошибка при получении моделей из сети, используем кеш/резерв:', err);
    return getStoredModels();
  }
}

// Клиент ИИ для тренажёра English Algorithm (OpenRouter / Cloudflare Worker / Dev-Proxy)
import type { Exercise, Slot, Topic, Aspect, Tense, Voice, Form, SlotKind, Pos, WritingTask } from '../types';
import { getSettings, getProxyUrl, type AppSettings } from './settings';
import {
  buildCheckPrompt,
  buildExplainPrompt,
  buildGeneratePrompt,
  buildEssayPrompt,
  type AiCheckResult,
  type AiExplainResult,
  type AiGenerateResult,
  type GeneratedExerciseItem,
  type AiEssayResult,
  type AiErrorType,
  type EssayRequirementCheck,
  type EssayErrorItem,
} from './prompts';

export type {
  AiCheckResult,
  AiExplainResult,
  AiGenerateResult,
  GeneratedExerciseItem,
  AiEssayResult,
  AiErrorType,
  EssayRequirementCheck,
  EssayErrorItem,
};
import { dataset } from '../data';

import { getStoredModels } from './models';

export const AI_EXERCISES_STORAGE_KEY = 'ea_ai_exercises';

export interface AiRequestOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  baseUrl?: string;
}

const ASPECTS: Aspect[] = ['dela', 'sostoyanie', 'rezultat', 'imeyu_pravo', 'modal', 'none'];
const TENSES: Tense[] = ['past', 'present', 'future', 'none'];
const VOICES: Voice[] = ['active', 'passive'];
const FORMS: Form[] = ['affirmative', 'negative', 'yes_no_question', 'wh_question', 'who_subject', 'who_object'];
const KINDS: SlotKind[] = ['question', 'code', 'subject', 'verb', 'ing', 'v3', 'been', 'to', 'object', 'ctx', 'neg'];
const POS: Pos[] = [-1, 0, 1, 2, 3, 'ctx'];
const QFORMS: Form[] = ['yes_no_question', 'wh_question', 'who_subject', 'who_object'];
const LEAD = /^(If|Until|Before|After|As soon as|In case|When (I|you|he|she|it|we|they|the|my|your|his|her|our|their|this|that))\b/;

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:"«»()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/**
 * Валидатор сгенерированного упражнения по тем же правилам, что tasks/tools/validate.mjs
 */
export function validateGeneratedItem(item: any): { valid: boolean; reason?: string } {
  if (!item || typeof item !== 'object') {
    return { valid: false, reason: 'Элемент не является объектом' };
  }
  if (!item.ru || typeof item.ru !== 'string' || !item.ru.trim()) {
    return { valid: false, reason: 'ru пуст' };
  }
  if (!Array.isArray(item.en) || item.en.length === 0 || item.en.some((x: any) => !x || typeof x !== 'string')) {
    return { valid: false, reason: 'en[] пуст или некорректен' };
  }
  const ref = item.en[0].trim();
  if (!/[.?!]$/.test(ref)) {
    return { valid: false, reason: 'en[0] не заканчивается точкой или вопросительным знаком' };
  }
  if (QFORMS.includes(item.form) && !ref.endsWith('?')) {
    return { valid: false, reason: `Вопрос (${item.form}) без '?' в конце` };
  }
  if (LEAD.test(ref) && !ref.includes(',')) {
    return { valid: false, reason: `Нет запятой после придаточного предложения: "${ref}"` };
  }
  if (!ASPECTS.includes(item.aspect)) {
    return { valid: false, reason: `Недопустимый aspect: ${item.aspect}` };
  }
  if (!TENSES.includes(item.tense)) {
    return { valid: false, reason: `Недопустимый tense: ${item.tense}` };
  }
  if (!VOICES.includes(item.voice)) {
    return { valid: false, reason: `Недопустимый voice: ${item.voice}` };
  }
  if (!FORMS.includes(item.form)) {
    return { valid: false, reason: `Недопустимый form: ${item.form}` };
  }
  if (!item.code || typeof item.code !== 'string' || !item.code.trim()) {
    return { valid: false, reason: 'code пуст' };
  }
  if (!Array.isArray(item.formula) || item.formula.length === 0) {
    return { valid: false, reason: 'formula пуста' };
  }

  for (let i = 0; i < item.formula.length; i++) {
    const s = item.formula[i];
    if (!s || typeof s !== 'object') {
      return { valid: false, reason: `Слот ${i} не является объектом` };
    }
    if (!POS.includes(s.pos)) {
      return { valid: false, reason: `Слот ${i}: недопустимая pos: ${s.pos}` };
    }
    if (!KINDS.includes(s.kind)) {
      return { valid: false, reason: `Слот ${i}: недопустимый kind: ${s.kind}` };
    }
    // Ключевое правило методики: 'be' после кода должен быть kind: 'been'
    if (typeof s.text === 'string' && s.text.toLowerCase() === 'be' && s.kind !== 'been') {
      return { valid: false, reason: `Слово "be" в слоте ${i} должно иметь kind: 'been'` };
    }
  }

  // Если модель продублировала вопросительное слово или код (например, Can в pos -1 и can в pos 0, или Who в pos -1 и pos 1),
  // убираем лишний дубликат слота, если это даёт точное пословное совпадение с en[0]
  let wordsFormula = words(item.formula.map((s: Slot) => s.text).join(' ')).join(' ');
  const wordsEn0 = words(ref).join(' ');
  if (wordsFormula !== wordsEn0 && item.formula.length > 1) {
    for (let i = 0; i < item.formula.length; i++) {
      const w = String(item.formula[i].text || '').trim().toLowerCase();
      const hasDup = item.formula.some(
        (other: Slot, idx: number) => idx !== i && String(other.text || '').trim().toLowerCase() === w
      );
      if (hasDup) {
        const candidate = item.formula.filter((_: Slot, idx: number) => idx !== i);
        const candWords = words(candidate.map((s: Slot) => s.text).join(' ')).join(' ');
        if (candWords === wordsEn0) {
          item.formula = candidate;
          wordsFormula = candWords;
          break;
        }
      }
    }
  }

  // Проверка пословного соответствия formula и en[0]
  if (wordsFormula !== wordsEn0) {
    return { valid: false, reason: `formula не совпадает с en[0]: "${wordsFormula}" vs "${wordsEn0}"` };
  }

  if (item.voice === 'passive' && !item.formula.some((s: Slot) => s.kind === 'v3')) {
    return { valid: false, reason: 'Пассивный залог без слота v3' };
  }

  return { valid: true };
}

/**
 * Получить сохранённые сгенерированные упражнения из localStorage
 */
export function getStoredAiExercises(): Exercise[] {
  try {
    const raw = localStorage.getItem(AI_EXERCISES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Ошибка загрузки ai-exercises из localStorage:', err);
    return [];
  }
}

/**
 * Сохранить список сгенерированных упражнений в localStorage
 */
export function saveStoredAiExercises(exercises: Exercise[]): void {
  try {
    localStorage.setItem(AI_EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
  } catch (err) {
    console.error('Ошибка сохранения ai-exercises в localStorage:', err);
  }
}

/**
 * Удалить упражнение по id из localStorage
 */
export function deleteStoredAiExercise(id: string): void {
  const current = getStoredAiExercises();
  const filtered = current.filter((e) => e.id !== id);
  saveStoredAiExercises(filtered);
}

/**
 * Очистить все сгенерированные упражнения
 */
export function clearStoredAiExercises(): void {
  try {
    localStorage.removeItem(AI_EXERCISES_STORAGE_KEY);
  } catch (err) {
    console.error('Ошибка очистки ai-exercises:', err);
  }
}

/**
 * Извлечение и парсинг JSON из сырого текста модели
 */
export function extractJsonFromResponse<T = any>(rawText: string): T {
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Удаляем обрамляющие markdown блоки типа ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // Если модель продублировала открывающую скобку, например "{\n {"
  if (/^\{\s*\{/.test(cleaned)) {
    cleaned = cleaned.replace(/^\{\s*\{/, '{');
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`В ответе ИИ не найден JSON-объект: "${rawText.slice(0, 150)}..."`);
  }

  const isInnerFragment = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return true;
    const isTopLevel =
      'ok' in obj ||
      'explanation' in obj ||
      'items' in obj ||
      'wordCount' in obj ||
      'meetsRequirements' in obj ||
      'errors' in obj;
    if (isTopLevel) return false;
    // Если это вложенный элемент массива formula / errors / items
    if ('pos' in obj && 'kind' in obj) return true;
    if ('quote' in obj && 'fix' in obj) return true;
    if ('req' in obj && 'comment' in obj) return true;
    if ('ru' in obj && 'en' in obj && !('items' in obj)) return true;
    return false;
  };

  const tryParseObj = (str: string): T | null => {
    const fixed = str.replace(/,\s*([}\]])/g, '$1');
    try {
      const parsed = JSON.parse(fixed);
      if (!isInnerFragment(parsed)) {
        return parsed as T;
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Сначала пробуем прямой срез от первой '{' до последней '}'
  const direct = tryParseObj(cleaned.slice(start, end + 1));
  if (direct !== null) return direct;

  // Ищем сбалансированные JSON-объекты { ... }
  const candidates: string[] = [];
  for (let i = start; i <= end; i++) {
    if (cleaned[i] !== '{') continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = i; j <= end; j++) {
      const ch = cleaned[j];
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\' && inStr) {
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            candidates.push(cleaned.slice(i, j + 1));
            break;
          }
        }
      }
    }
  }

  // Сортируем кандидатов по длине по убыванию, чтобы выбрать основной JSON-ответ
  candidates.sort((a, b) => b.length - a.length);
  for (const cand of candidates) {
    const parsed = tryParseObj(cand);
    if (parsed !== null) return parsed;
  }
  throw new Error(`Не удалось распарсить JSON из ответа ИИ: "${cleaned.slice(start, start + 160)}..."`);
}

const RELIABLE_FREE_FALLBACKS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
];

/**
 * Базовый вызов ИИ с обработкой ошибок, dev-прокси, заголовков и повторов при невалидном JSON
 */
export async function callAiChat<T = any>(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: AiRequestOptions = {}
): Promise<T> {
  const settings: AppSettings = getSettings();
  const mode = settings.aiMode;

  let url: string;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (mode === 'dev') {
    const devBase = options.baseUrl ? options.baseUrl.replace(/\/+$/, '') : '/api/ai';
    url = `${devBase}/chat/completions`;
    // Заголовок Authorization подставляет Vite dev-прокси
  } else if (mode === 'proxy') {
    const proxyBase = getProxyUrl().replace(/\/+$/, '');
    if (!proxyBase) {
      throw new Error('Не указан VITE_PROXY_URL для режима proxy');
    }
    url = `${proxyBase}/chat`;
    if (settings.accessCode) {
      headers['X-Access-Code'] = settings.accessCode;
    }
  } else {
    // byok
    url = 'https://openrouter.ai/api/v1/chat/completions';
    if (!settings.openrouterKey) {
      throw new Error('Не задан ключ OpenRouter в настройках (режим Свой ключ)');
    }
    headers['Authorization'] = `Bearer ${settings.openrouterKey}`;
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    headers['X-Title'] = 'English Algorithm Trainer';
  }

  const primary = options.model || settings.primaryModel || 'nvidia/nemotron-3-super-120b-a12b:free';
  const fallbacks = (settings.fallbackModels || []).filter((m) => m && m !== primary);
  // OpenRouter допускает максимум 3 модели в параметре models
  const modelsList = [primary, ...fallbacks].slice(0, 3);

  const storedModels = getStoredModels();
  const allSupportJson = modelsList.every((id) => {
    const info = storedModels.find((m) => m.id === id);
    return info ? info.supportsJson : false;
  });

  const maxTokens = Math.max(options.maxTokens ?? 4000, 4000);

  const fullMessages =
    messages[0]?.role === 'system'
      ? messages
      : [
          {
            role: 'system' as const,
            content: 'detailed thinking off\nRespond strictly with a valid JSON object starting with { and ending with }. Do not include markdown or explanations outside JSON.',
          },
          ...messages,
        ];

  const bodyPayload: Record<string, any> = {
    model: primary,
    models: modelsList,
    messages: fullMessages,
    temperature: options.temperature ?? 0.2,
    max_tokens: maxTokens,
    reasoning: { enabled: false },
    ...(allSupportJson ? { response_format: { type: 'json_object' } } : {}),
  };

  let responseText = '';
  try {
    let res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    // Если выбранная модель вернула 400/404/429/5xx, перебираем надёжные резервные бесплатные модели
    if (!res.ok && res.status !== 401 && res.status !== 403 && !options.model) {
      for (const fbModel of [...fallbacks, ...RELIABLE_FREE_FALLBACKS]) {
        if (fbModel === primary) continue;
        const fbRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: fbModel,
            messages: fullMessages,
            temperature: options.temperature ?? 0.2,
            max_tokens: maxTokens,
            reasoning: { enabled: false },
          }),
        });
        if (fbRes.ok) {
          res = fbRes;
          break;
        }
      }
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Неверный код доступа / ключ');
      }
      if (res.status === 429) {
        throw new Error('Лимит бесплатных запросов исчерпан. Попробуйте позже');
      }
      const errBody = await res.text();
      let msg = `Ошибка ИИ (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      } catch {
        // use default
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    responseText = choice?.message?.content || '';
    if (!responseText && choice?.message?.reasoning) {
      responseText = choice.message.reasoning;
    }
  } catch (err: any) {
    if (
      err.name === 'TypeError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('fetch failed')
    ) {
      throw new Error('Нет интернета — ИИ недоступен, локальная проверка работает');
    }
    throw err;
  }

  // Попытка 1: парсим JSON
  try {
    return extractJsonFromResponse<T>(responseText);
  } catch (firstErr) {
    console.warn('Не удалось распарсить JSON с первой попытки, делаем 1 повтор:', firstErr);

    // 1 повтор с явным требованием только JSON на надёжной модели
    const retryMessages = [
      ...fullMessages,
      { role: 'user' as const, content: 'ВАЖНО: Верни ТОЛЬКО валидный JSON-объект (начиная с { и заканчивая }) без пояснений и без markdown.' },
    ];

    try {
      const retryModel = RELIABLE_FREE_FALLBACKS[0];
      const retryRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: retryModel,
          messages: retryMessages,
          temperature: 0.1,
          max_tokens: Math.max(maxTokens, 6000),
          reasoning: { enabled: false },
        }),
      });

      if (!retryRes.ok) {
        throw new Error(`Ошибка при повторном запросе: HTTP ${retryRes.status}`);
      }

      const retryData = await retryRes.json();
      const retryChoice = retryData.choices?.[0];
      const retryText = retryChoice?.message?.content || retryChoice?.message?.reasoning || '';
      return extractJsonFromResponse<T>(retryText);
    } catch (secondErr: any) {
      throw new Error(`ИИ вернул невалидный JSON: ${secondErr.message || secondErr}`);
    }
  }
}

/**
 * Проверка ответа ученика (check)
 */
export async function aiCheck(
  ex: Pick<Exercise, 'ru' | 'en' | 'aspect' | 'tense' | 'voice' | 'form' | 'code'>,
  answer: string,
  options?: AiRequestOptions
): Promise<AiCheckResult> {
  const prompt = buildCheckPrompt(ex, answer);
  const result = await callAiChat<AiCheckResult>([{ role: 'user', content: prompt }], options);

  // Валидируем обязательные поля результата
  if (typeof result.ok !== 'boolean' || !result.explanation) {
    throw new Error('ИИ вернул неполный результат проверки ответа');
  }

  return {
    ok: result.ok,
    corrected: result.corrected || ex.en[0],
    errorType: result.errorType,
    explanation: result.explanation,
    formula: Array.isArray(result.formula) ? result.formula : [],
  };
}

/**
 * Объяснение эталона (explain / «Почему так?»)
 */
export async function aiExplain(
  ex: Exercise,
  options?: AiRequestOptions
): Promise<AiExplainResult> {
  const prompt = buildExplainPrompt(ex);
  const result = await callAiChat<AiExplainResult>([{ role: 'user', content: prompt }], options);

  if (!result.explanation) {
    throw new Error('ИИ не предоставил объяснение эталона');
  }

  return {
    explanation: result.explanation,
    literal: result.literal || ex.literal || '',
    formula: Array.isArray(result.formula) && result.formula.length > 0 ? result.formula : ex.formula,
  };
}

/**
 * Генерация похожих тренировочных заданий (generate)
 * Клиентская валидация отбрасывает невалидные задания.
 * Валидные сохраняются в localStorage.
 */
export async function aiGenerate(
  topic: Topic,
  n = 5,
  options?: AiRequestOptions
): Promise<{ valid: Exercise[]; dropped: number; rawCount: number }> {
  // Найдём до 3 примеров из датасета по этой теме для few-shot
  const allExercises = dataset.exercises || [];
  const topicExercises = allExercises.filter((e) => e.topics.includes(topic));
  const sampleCandidates = topicExercises.length > 0 ? topicExercises : allExercises;

  // Выбираем 3 случайных
  const shuffled = [...sampleCandidates].sort(() => 0.5 - Math.random());
  const examples = shuffled.slice(0, 3);

  const prompt = buildGeneratePrompt(topic, examples, n);
  const response = await callAiChat<AiGenerateResult>([{ role: 'user', content: prompt }], {
    ...options,
    maxTokens: Math.max(2200, n * 450),
  });

  const rawItems = Array.isArray(response.items) ? response.items : [];
  const validExercises: Exercise[] = [];
  let dropped = 0;

  const now = Date.now();
  rawItems.forEach((item, index) => {
    const val = validateGeneratedItem(item);
    if (val.valid) {
      const exercise: Exercise = {
        id: `ai-${now}-${index}`,
        hw: 'AI',
        lesson: null,
        worksheet: 'ai-generated',
        n: null,
        type: 'translate_ru_en',
        ru: item.ru,
        en: item.en,
        formula: item.formula,
        literal: item.literal,
        aspect: item.aspect,
        tense: item.tense,
        voice: item.voice,
        form: item.form,
        topics: [topic],
        code: item.code,
      };
      validExercises.push(exercise);
    } else {
      console.warn(`Отброшено невалидное сгенерированное задание [${index}]:`, val.reason, item);
      dropped++;
    }
  });

  // Сохраняем валидные задания в localStorage
  if (validExercises.length > 0) {
    const existing = getStoredAiExercises();
    saveStoredAiExercises([...validExercises, ...existing]);
  }

  return {
    valid: validExercises,
    dropped,
    rawCount: rawItems.length,
  };
}

/**
 * Проверка письменной работы / эссе (essay)
 */
export async function aiEssay(
  task: WritingTask,
  text: string,
  options?: AiRequestOptions
): Promise<AiEssayResult> {
  const prompt = buildEssayPrompt(task, text);
  const result = await callAiChat<AiEssayResult>([{ role: 'user', content: prompt }], {
    ...options,
    maxTokens: 6000,
  });

  return {
    wordCount: typeof result.wordCount === 'number' ? result.wordCount : text.trim().split(/\s+/).filter(Boolean).length,
    meetsRequirements: Array.isArray(result.meetsRequirements) ? result.meetsRequirements : [],
    errors: Array.isArray(result.errors) ? result.errors : [],
    tenseConsistency: result.tenseConsistency || '',
    improved: result.improved || '',
    summary: result.summary || '',
  };
}

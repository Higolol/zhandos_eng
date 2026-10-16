import { describe, it, expect } from 'vitest';
import { extractJsonFromResponse, validateGeneratedItem, aiCheck } from './ai';
import { sortModels, selectDefaultModels, type AiModelInfo } from './models';

const store: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    },
    configurable: true,
  });
}

describe('T7 AI Module Unit Tests', () => {
  describe('extractJsonFromResponse', () => {
    it('извлекает JSON из блока ```json и игнорирует <think> рассуждения', () => {
      const raw = `<think>Размышления модели со скобками {"pos": 1, "kind": "subject", "text": "He"}</think>
Вот ваш ответ:
\`\`\`json
{
  "ok": false,
  "corrected": "Would they ask?",
  "errorType": "word_order",
  "explanation": "В вопросе код выходит на позицию 0.",
  "formula": [
    { "pos": 0, "kind": "code", "text": "Would", }
  ]
}
\`\`\``;
      const parsed = extractJsonFromResponse<any>(raw);
      expect(parsed.ok).toBe(false);
      expect(parsed.corrected).toBe('Would they ask?');
      expect(parsed.formula).toHaveLength(1);
    });

    it('отвергает обрезанный JSON, где остались только внутренние слоты formula', () => {
      const truncated = `{"items": [{"ru": "Тест", "en": ["Test."], "formula": [{"pos": 1, "kind": "subject", "text": "Test"}`;
      expect(() => extractJsonFromResponse(truncated)).toThrow();
    });
  });

  describe('validateGeneratedItem', () => {
    it('принимает валидное пассивное задание и дедуплицирует повторённый вопросительный слот', () => {
      const item = {
        ru: 'Когда будет построен новый мост?',
        en: ['When will the new bridge be built?'],
        formula: [
          { pos: -1, kind: 'question', text: 'When' },
          { pos: 0, kind: 'code', text: 'will' },
          { pos: 1, kind: 'subject', text: 'the new bridge' },
          { pos: 2, kind: 'been', text: 'be' },
          { pos: 2, kind: 'v3', text: 'built' },
        ],
        literal: 'Когда будет являться новый мост построенным?',
        aspect: 'dela',
        tense: 'future',
        voice: 'passive',
        form: 'wh_question',
        code: 'will',
      };
      expect(validateGeneratedItem(item).valid).toBe(true);

      const dupQuestionItem = {
        ru: 'Кто был приглашён на вечеринку?',
        en: ['Who was invited to the party?'],
        formula: [
          { pos: -1, kind: 'question', text: 'Who' },
          { pos: 0, kind: 'code', text: 'was' },
          { pos: 1, kind: 'subject', text: 'Who' },
          { pos: 2, kind: 'v3', text: 'invited' },
          { pos: 3, kind: 'object', text: 'to the party' },
        ],
        aspect: 'dela',
        tense: 'past',
        voice: 'passive',
        form: 'who_subject',
        code: 'was',
      };
      expect(validateGeneratedItem(dupQuestionItem).valid).toBe(true);
      expect(dupQuestionItem.formula).toHaveLength(4);
    });

    it('отклоняет задание без знака вопроса, без запятой после If или с be !== kind been', () => {
      const noQuestionMark = {
        ru: 'Где он?',
        en: ['Where is he.'],
        formula: [
          { pos: -1, kind: 'question', text: 'Where' },
          { pos: 0, kind: 'code', text: 'is' },
          { pos: 1, kind: 'subject', text: 'he' },
        ],
        aspect: 'sostoyanie',
        tense: 'present',
        voice: 'active',
        form: 'wh_question',
        code: 'is',
      };
      expect(validateGeneratedItem(noQuestionMark).valid).toBe(false);

      const wrongBeKind = {
        ru: 'Это можно сделать.',
        en: ['It can be done.'],
        formula: [
          { pos: 1, kind: 'subject', text: 'It' },
          { pos: 0, kind: 'code', text: 'can' },
          { pos: 2, kind: 'verb', text: 'be' },
          { pos: 2, kind: 'v3', text: 'done' },
        ],
        aspect: 'modal',
        tense: 'present',
        voice: 'passive',
        form: 'affirmative',
        code: 'can',
      };
      expect(validateGeneratedItem(wrongBeKind).valid).toBe(false);
    });
  });

  describe('sortModels & selectDefaultModels', () => {
    it('выбирает приоритетные модели с поддержкой JSON и ставит openrouter/free в резерв', () => {
      const models: AiModelInfo[] = [
        { id: 'openrouter/free', name: 'Free Router', supportsJson: true },
        { id: 'random/small-model:free', name: 'Random', supportsJson: false },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 120B', supportsJson: true },
        { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B', supportsJson: true },
      ];
      const sorted = sortModels(models);
      expect(sorted[0].id).toBe('nvidia/nemotron-3-super-120b-a12b:free');
      expect(sorted[1].id).toBe('google/gemma-4-31b-it:free');

      const selected = selectDefaultModels(models);
      expect(selected.primary).toBe('nvidia/nemotron-3-super-120b-a12b:free');
      expect(selected.fallbacks).toContain('google/gemma-4-31b-it:free');
    });
  });

  describe('offline error handling', () => {
    it('выдаёт понятное сообщение на русском языке при недоступности сети', async () => {
      await expect(
        aiCheck(
          {
            ru: 'Они могли спросить.',
            en: ['They could ask.'],
            aspect: 'modal',
            tense: 'past',
            voice: 'active',
            form: 'affirmative',
            code: 'could',
          },
          'They can ask',
          { baseUrl: 'http://127.0.0.1:59999/api/ai' }
        )
      ).rejects.toThrow('Нет интернета — ИИ недоступен, локальная проверка работает');
    });
  });
});

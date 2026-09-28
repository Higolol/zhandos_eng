import { describe, it, expect } from 'vitest';
import { check } from './check';
import type { Exercise } from '../types';
import datasetJson from '../data/dataset.json';

const makeDummyEx = (en: string[] | string, extra: Partial<Exercise> = {}): Exercise => ({
  id: 'TEST-01',
  hw: 'HW1',
  lesson: 1,
  worksheet: 'test.jpg',
  n: 1,
  type: 'translate_ru_en',
  ru: 'Тестовое предложение',
  en: Array.isArray(en) ? en : [en],
  formula: [],
  aspect: 'dela',
  tense: 'present',
  voice: 'active',
  form: 'affirmative',
  topics: ['dela'],
  code: 'do',
  ...extra,
});

describe('check.ts: локальная проверка ответов', () => {
  it("раскрывает сокращения (I don't know = I do not know)", () => {
    const ex = makeDummyEx('I do not know.');
    expect(check("I don't know", ex).verdict).toBe('exact');
  });

  it("раскрывает двусмысленный 's как has/is (He's been working = He has been working)", () => {
    const ex = makeDummyEx('He has been working.');
    expect(check("He's been working", ex).verdict).toBe('exact');
  });

  it('считает whom ≡ who (Whom did you call? = Who did you call?)', () => {
    const ex = makeDummyEx('Who did you call?');
    expect(check('Whom did you call?', ex).verdict).toBe('exact');
  });

  it('определяет ошибку в коде как wrong (I can was invited)', () => {
    const ex = makeDummyEx('I can be invited.');
    const res = check('I can was invited', ex);
    expect(res.verdict).toBe('wrong');
  });

  it('определяет опечатку с пробелом как near (everyday вместо every day)', () => {
    const ex = makeDummyEx('He plays every day.');
    const res = check('He plays everyday', ex);
    expect(res.verdict).toBe('near');
  });

  it('определяет замену кода как wrong даже при 1 отличии (She is cleaning вместо She was cleaning)', () => {
    const ex = makeDummyEx('She was cleaning.');
    const res = check('She is cleaning', ex);
    expect(res.verdict).toBe('wrong');
  });

  it('игнорирует пунктуацию, регистр и скобки ученика', () => {
    const ex = makeDummyEx('They went home yesterday.');
    expect(check('they went home yesterday (now)', ex).verdict).toBe('exact');
    expect(check('THEY WENT HOME YESTERDAY!!!', ex).verdict).toBe('exact');
  });

  it('сохраняет притяжательный падеж people\'s mistakes', () => {
    const ex = makeDummyEx("I should not pay for other people's mistakes.");
    expect(check("I should not pay for other people's mistakes", ex).verdict).toBe('exact');
  });

  describe('Проверка на полном датасете (все 1074 задания)', () => {
    const exercises = (datasetJson as { exercises: Exercise[] }).exercises;

    it('для каждого en[i] каждого задания выдаёт exact', () => {
      let mismatches = 0;
      for (const ex of exercises) {
        for (const variant of ex.en) {
          const res = check(variant, ex);
          if (res.verdict !== 'exact') {
            mismatches++;
            console.error(`Mismatch for ${ex.id}: ${variant}`);
          }
        }
      }
      expect(mismatches).toBe(0);
    });

    it('для всех ответов ученика с myPastAnswerOk=true выдаёт exact', () => {
      let mismatches = 0;
      for (const ex of exercises) {
        if (ex.myPastAnswer && ex.myPastAnswerOk === true) {
          const res = check(ex.myPastAnswer, ex);
          if (res.verdict !== 'exact') {
            mismatches++;
            console.error(`Past answer mismatch for ${ex.id}: ${ex.myPastAnswer}`);
          }
        }
      }
      expect(mismatches).toBe(0);
    });
  });

  describe('progress.ts: сохранение попыток и статистика', async () => {
    const { recordAttempt, clearProgress, getExerciseStatus, isMistake, getMistakeExerciseIds, getStreakDays } =
      await import('./progress');

    it('корректно обновляет статус задания: new -> learning -> known', () => {
      clearProgress();
      expect(getExerciseStatus('EX-1')).toBe('new');

      recordAttempt({ exerciseId: 'EX-1', answer: 'test', verdict: 'wrong' });
      expect(getExerciseStatus('EX-1')).toBe('learning');

      recordAttempt({ exerciseId: 'EX-1', answer: 'test', verdict: 'exact' });
      expect(getExerciseStatus('EX-1')).toBe('learning');

      recordAttempt({ exerciseId: 'EX-1', answer: 'test', verdict: 'exact' });
      expect(getExerciseStatus('EX-1')).toBe('known');
    });

    it('обрабатывает категорию Мои ошибки', () => {
      clearProgress();
      const pastMistakeEx = makeDummyEx('Hello', { id: 'MISTAKE-1', myPastAnswerOk: false });
      expect(isMistake(pastMistakeEx)).toBe(true);

      // После успешного решения уходит из ошибок
      recordAttempt({ exerciseId: 'MISTAKE-1', answer: 'Hello', verdict: 'exact' });
      expect(isMistake(pastMistakeEx)).toBe(false);

      // При новой ошибке возвращается в ошибки
      recordAttempt({ exerciseId: 'MISTAKE-1', answer: 'Wrong', verdict: 'wrong' });
      expect(isMistake(pastMistakeEx)).toBe(true);

      const list = getMistakeExerciseIds([pastMistakeEx]);
      expect(list).toContain('MISTAKE-1');
    });

    it('считает streak дней', () => {
      clearProgress();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      recordAttempt({ exerciseId: 'EX-1', answer: 'a', verdict: 'exact', at: now });
      recordAttempt({ exerciseId: 'EX-2', answer: 'b', verdict: 'exact', at: now - oneDay });
      recordAttempt({ exerciseId: 'EX-3', answer: 'c', verdict: 'exact', at: now - 2 * oneDay });
      expect(getStreakDays()).toBe(3);
    });
  });
});


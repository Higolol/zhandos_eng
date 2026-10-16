import { describe, it, expect } from 'vitest';
import { generate, generatedToExercise, SUBJECTS, MEANINGS } from './generator';
import { VERBS } from './verbs';
import { check } from './check';
import { dataset } from '../data';

describe('generator.ts: режим «Главный × Смысл» (T6)', () => {
  it('сверяет все 29 заданий HW1 (grid_build) из датасета T1', () => {
    const hw1Exercises = dataset.exercises.filter(
      (ex) => ex.hw === 'HW1' && ex.type === 'grid_build' && ex.grid
    );
    expect(hw1Exercises.length).toBe(29);

    for (const ex of hw1Exercises) {
      const gen = generate(ex.grid!.subject, ex.grid!.meaning, 'ask', ex.voice);
      expect(gen.en).toBe(ex.en[0]);
      expect(gen.code).toBe(ex.code);
      expect(gen.form).toBe(ex.form);
      expect(gen.formula).toEqual(ex.formula);
      // Проверяем, что check() даёт exact при проверке против задания из датасета
      expect(check(gen.en, ex).verdict).toBe('exact');
    }
  });

  it('корректно строит модальный пассив (HW13: can be invited, should not be fined и др.)', () => {
    const c1 = generate('I', 'can_pos', 'invite', 'passive');
    expect(c1.en).toBe('I can be invited.');
    expect(c1.formula.find((s) => s.text === 'be')?.kind).toBe('been');
    expect(c1.formula.find((s) => s.text === 'invited')?.kind).toBe('v3');

    const c2 = generate('he', 'should_neg', 'fine', 'passive');
    expect(c2.en).toBe('He should not be fined.');

    const c3 = generate('the_documents', 'will_q', 'submit', 'passive');
    expect(c3.en).toBe('Will the documents be submitted?');

    const c4 = generate('the_car', 'must_pos', 'wash', 'passive');
    expect(c4.en).toBe('The car must be washed.');
  });

  it('корректно строит аспекты в активе и пассиве (HW15, HW23, HW29)', () => {
    // Дела-наст. актив со скрытым кодом does
    const d1 = generate('she', 'dela_pres_pos', 'remember', 'active');
    expect(d1.en).toBe('She remembers every day.');
    expect(d1.formula[1]).toEqual({ pos: 2, kind: 'verb', text: 'remembers', hiddenCode: 'does' });

    // Дела-прош. актив со скрытым кодом did
    const d2 = generate('they', 'dela_past_pos', 'help', 'active');
    expect(d2.en).toBe('They helped every day.');
    expect(d2.formula[1]).toEqual({ pos: 2, kind: 'verb', text: 'helped', hiddenCode: 'did' });

    // Дела-наст. пассив (HW23/HW29)
    const d3 = generate('the_car', 'dela_pres_pos', 'clean', 'passive');
    expect(d3.en).toBe('The car is cleaned every day.');

    // Состояние-наст. пассив (is being V3, HW23/HW29)
    const s1 = generate('the_car', 'sost_pres_pos', 'wash', 'passive');
    expect(s1.en).toBe('The car is being washed.');
    expect(s1.formula.map((f) => `${f.text}:${f.kind}`)).toEqual([
      'The car:subject',
      'is:code',
      'being:been',
      'washed:v3',
    ]);

    // Состояние-прош. актив и пассив с маркером at 10 am yesterday
    const s2 = generate('he', 'sost_past_q', 'drive', 'active');
    expect(s2.en).toBe('Was he driving at 10 am yesterday?');

    // Результат актив и пассив (have/has been V3, HW23/HW29)
    const r1 = generate('the_documents', 'rez_pres_pos', 'send', 'passive');
    expect(r1.en).toBe('The documents have been sent.');

    const r2 = generate('she', 'rez_pres_neg', 'tidy', 'active');
    expect(r2.en).toBe('She has not tidied.');

    // Имею право актив и пассив (редкая форма has been being V3, HW29/HW30)
    const ip1 = generate('i', 'ip_pres_pos', 'tidy', 'active');
    expect(ip1.en).toBe('I have been tidying for two hours.');
    expect(ip1.isRarePassive).toBe(false);

    const ip2 = generate('the_car', 'ip_pres_pos', 'wash', 'passive');
    expect(ip2.en).toBe('The car has been being washed for two hours.');
    expect(ip2.isRarePassive).toBe(true);
  });

  it('корректно обрабатывает фразовые глаголы wake up и talk to', () => {
    const p1 = generate('she', 'dela_pres_pos', 'wake up', 'active');
    expect(p1.en).toBe('She wakes up every day.');
    expect(p1.formula.some((s) => s.kind === 'to' && s.text === 'up')).toBe(true);

    const p2 = generate('he', 'can_q', 'talk to', 'passive');
    expect(p2.en).toBe('Can he be talked to?');
  });

  it('генерирует 50 комбинаций без ошибок и проходит валидацию слотов и check()', () => {
    let count = 0;
    for (let i = 0; i < 50; i++) {
      const voice = i % 3 === 0 ? 'passive' : 'active';
      const subjPool = voice === 'passive' ? SUBJECTS : SUBJECTS.filter((s) => !s.passiveOnly);
      const subj = subjPool[i % subjPool.length];
      const meaning = MEANINGS[i % MEANINGS.length];
      const verb = VERBS[i % 30];

      const item = generate(subj, meaning, verb, voice);
      const ex = generatedToExercise(item, `GRID-TEST-${i + 1}`);

      expect(item.en.length).toBeGreaterThan(5);
      expect(/[.?!]$/.test(item.en)).toBe(true);
      expect(check(item.en, ex).verdict).toBe('exact');
      // Без необязательного маркера времени ответ также засчитывается как exact
      expect(check(item.enVariants[1] || item.en, ex).verdict).toBe('exact');
      count++;
    }
    expect(count).toBe(50);
  });
});

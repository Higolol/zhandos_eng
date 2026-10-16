import type { Slot, Voice, Aspect, Tense, Form, Exercise } from '../types';
import { VERBS, type Verb } from './verbs';

export type SubjectId =
  | 'i'
  | 'you'
  | 'he'
  | 'she'
  | 'it'
  | 'we'
  | 'they'
  | 'the_car'
  | 'the_documents';

export interface SubjInfo {
  id: SubjectId;
  ru: string;
  en: string;
  capEn: string;
  person: '1s' | '2' | '3s' | '1p' | '3p';
  passiveOnly?: boolean;
}

export const SUBJECTS: SubjInfo[] = [
  { id: 'i', ru: 'Я', en: 'I', capEn: 'I', person: '1s' },
  { id: 'you', ru: 'Ты · Вы', en: 'you', capEn: 'You', person: '2' },
  { id: 'he', ru: 'Он', en: 'he', capEn: 'He', person: '3s' },
  { id: 'she', ru: 'Она', en: 'she', capEn: 'She', person: '3s' },
  { id: 'it', ru: 'Оно', en: 'it', capEn: 'It', person: '3s' },
  { id: 'we', ru: 'Мы', en: 'we', capEn: 'We', person: '1p' },
  { id: 'they', ru: 'Они', en: 'they', capEn: 'They', person: '3p' },
  { id: 'the_car', ru: 'Машина', en: 'the car', capEn: 'The car', person: '3s', passiveOnly: true },
  {
    id: 'the_documents',
    ru: 'Документы',
    en: 'the documents',
    capEn: 'The documents',
    person: '3p',
    passiveOnly: true,
  },
];

export type MeaningId =
  // Модальные
  | 'can_pos'
  | 'can_neg'
  | 'can_q'
  | 'could_pos'
  | 'could_neg'
  | 'could_q'
  | 'will_pos'
  | 'will_neg'
  | 'will_q'
  | 'would_pos'
  | 'would_neg'
  | 'would_q'
  | 'should_pos'
  | 'should_neg'
  | 'should_q'
  | 'must_pos'
  | 'must_neg'
  | 'must_q'
  // Аспекты
  | 'dela_pres_pos'
  | 'dela_pres_neg'
  | 'dela_pres_q'
  | 'dela_past_pos'
  | 'dela_past_neg'
  | 'dela_past_q'
  | 'sost_pres_pos'
  | 'sost_pres_neg'
  | 'sost_pres_q'
  | 'sost_past_pos'
  | 'sost_past_neg'
  | 'sost_past_q'
  | 'rez_pres_pos'
  | 'rez_pres_neg'
  | 'rez_pres_q'
  | 'ip_pres_pos'
  | 'ip_pres_neg'
  | 'ip_pres_q';

export interface MeaningInfo {
  id: MeaningId;
  label: string;
  group: 'modals' | 'aspects';
  aspect: Aspect;
  tense: Tense;
  form: Form;
  modalCode?: string;
  ctx?: string;
}

export const MEANINGS: MeaningInfo[] = [
  // Модальные
  { id: 'can_pos', label: 'Может', group: 'modals', aspect: 'modal', tense: 'present', form: 'affirmative', modalCode: 'can' },
  { id: 'can_neg', label: 'НЕ может', group: 'modals', aspect: 'modal', tense: 'present', form: 'negative', modalCode: 'can' },
  { id: 'can_q', label: 'Может?', group: 'modals', aspect: 'modal', tense: 'present', form: 'yes_no_question', modalCode: 'can' },
  { id: 'could_pos', label: 'Мог(ла) бы', group: 'modals', aspect: 'modal', tense: 'past', form: 'affirmative', modalCode: 'could' },
  { id: 'could_neg', label: 'НЕ мог бы', group: 'modals', aspect: 'modal', tense: 'past', form: 'negative', modalCode: 'could' },
  { id: 'could_q', label: 'Мог бы?', group: 'modals', aspect: 'modal', tense: 'past', form: 'yes_no_question', modalCode: 'could' },
  { id: 'will_pos', label: 'Будущее', group: 'modals', aspect: 'dela', tense: 'future', form: 'affirmative', modalCode: 'will' },
  { id: 'will_neg', label: 'Будущее+НЕ', group: 'modals', aspect: 'dela', tense: 'future', form: 'negative', modalCode: 'will' },
  { id: 'will_q', label: 'Будущее?', group: 'modals', aspect: 'dela', tense: 'future', form: 'yes_no_question', modalCode: 'will' },
  { id: 'would_pos', label: 'Бы', group: 'modals', aspect: 'modal', tense: 'none', form: 'affirmative', modalCode: 'would' },
  { id: 'would_neg', label: 'Бы НЕ', group: 'modals', aspect: 'modal', tense: 'none', form: 'negative', modalCode: 'would' },
  { id: 'would_q', label: 'Бы?', group: 'modals', aspect: 'modal', tense: 'none', form: 'yes_no_question', modalCode: 'would' },
  { id: 'should_pos', label: 'Следует', group: 'modals', aspect: 'modal', tense: 'present', form: 'affirmative', modalCode: 'should' },
  { id: 'should_neg', label: 'НЕ следует', group: 'modals', aspect: 'modal', tense: 'present', form: 'negative', modalCode: 'should' },
  { id: 'should_q', label: 'Следует?', group: 'modals', aspect: 'modal', tense: 'present', form: 'yes_no_question', modalCode: 'should' },
  { id: 'must_pos', label: 'Должен', group: 'modals', aspect: 'modal', tense: 'present', form: 'affirmative', modalCode: 'must' },
  { id: 'must_neg', label: 'НЕ должен', group: 'modals', aspect: 'modal', tense: 'present', form: 'negative', modalCode: 'must' },
  { id: 'must_q', label: 'Должен?', group: 'modals', aspect: 'modal', tense: 'present', form: 'yes_no_question', modalCode: 'must' },

  // Аспекты
  { id: 'dela_pres_pos', label: 'Дела-наст. +', group: 'aspects', aspect: 'dela', tense: 'present', form: 'affirmative', ctx: 'every day' },
  { id: 'dela_pres_neg', label: 'Дела-наст. НЕ', group: 'aspects', aspect: 'dela', tense: 'present', form: 'negative', ctx: 'every day' },
  { id: 'dela_pres_q', label: 'Дела-наст. ?', group: 'aspects', aspect: 'dela', tense: 'present', form: 'yes_no_question', ctx: 'every day' },

  { id: 'dela_past_pos', label: 'Дела-прош. +', group: 'aspects', aspect: 'dela', tense: 'past', form: 'affirmative', ctx: 'every day' },
  { id: 'dela_past_neg', label: 'Дела-прош. НЕ', group: 'aspects', aspect: 'dela', tense: 'past', form: 'negative', ctx: 'every day' },
  { id: 'dela_past_q', label: 'Дела-прош. ?', group: 'aspects', aspect: 'dela', tense: 'past', form: 'yes_no_question', ctx: 'every day' },

  { id: 'sost_pres_pos', label: 'Состояние-наст. +', group: 'aspects', aspect: 'sostoyanie', tense: 'present', form: 'affirmative' },
  { id: 'sost_pres_neg', label: 'Состояние-наст. НЕ', group: 'aspects', aspect: 'sostoyanie', tense: 'present', form: 'negative' },
  { id: 'sost_pres_q', label: 'Состояние-наст. ?', group: 'aspects', aspect: 'sostoyanie', tense: 'present', form: 'yes_no_question' },

  { id: 'sost_past_pos', label: 'Состояние-прош. +', group: 'aspects', aspect: 'sostoyanie', tense: 'past', form: 'affirmative', ctx: 'at 10 am yesterday' },
  { id: 'sost_past_neg', label: 'Состояние-прош. НЕ', group: 'aspects', aspect: 'sostoyanie', tense: 'past', form: 'negative', ctx: 'at 10 am yesterday' },
  { id: 'sost_past_q', label: 'Состояние-прош. ?', group: 'aspects', aspect: 'sostoyanie', tense: 'past', form: 'yes_no_question', ctx: 'at 10 am yesterday' },

  { id: 'rez_pres_pos', label: 'Результат +', group: 'aspects', aspect: 'rezultat', tense: 'present', form: 'affirmative' },
  { id: 'rez_pres_neg', label: 'Результат НЕ', group: 'aspects', aspect: 'rezultat', tense: 'present', form: 'negative' },
  { id: 'rez_pres_q', label: 'Результат ?', group: 'aspects', aspect: 'rezultat', tense: 'present', form: 'yes_no_question' },

  { id: 'ip_pres_pos', label: 'Имею право +', group: 'aspects', aspect: 'imeyu_pravo', tense: 'present', form: 'affirmative', ctx: 'for two hours' },
  { id: 'ip_pres_neg', label: 'Имею право НЕ', group: 'aspects', aspect: 'imeyu_pravo', tense: 'present', form: 'negative', ctx: 'for two hours' },
  { id: 'ip_pres_q', label: 'Имею право ?', group: 'aspects', aspect: 'imeyu_pravo', tense: 'present', form: 'yes_no_question', ctx: 'for two hours' },
];

export type SubjInput = SubjectId | SubjInfo | string;
export type MeaningInput = MeaningId | MeaningInfo | string;
export type VerbInput = Verb | string;

export interface GeneratedGridItem {
  en: string;
  enVariants: string[];
  formula: Slot[];
  label: string;
  isRarePassive?: boolean;
  aspect: Aspect;
  tense: Tense;
  voice: Voice;
  form: Form;
  code: string;
  subjectInfo: SubjInfo;
  meaningInfo: MeaningInfo;
  verbInfo: Verb;
}

function resolveSubject(input: SubjInput): SubjInfo {
  if (typeof input === 'object' && input !== null && 'id' in input) {
    return input;
  }
  const s = String(input).trim().toLowerCase();
  const byId = SUBJECTS.find(
    (x) =>
      x.id === s ||
      x.en.toLowerCase() === s ||
      x.ru.toLowerCase() === s
  );
  if (byId) return byId;
  if (s === 'ты' || s === 'вы' || s === 'ты/вы' || s === 'ты·вы') {
    return SUBJECTS.find((x) => x.id === 'you')!;
  }
  if (s === 'машина' || s === 'this car' || s === 'the car') {
    return SUBJECTS.find((x) => x.id === 'the_car')!;
  }
  if (s === 'документы' || s === 'documents' || s === 'the documents') {
    return SUBJECTS.find((x) => x.id === 'the_documents')!;
  }
  throw new Error(`Unknown subject: ${String(input)}`);
}

const MEANING_ALIASES: Record<string, MeaningId> = {
  'может': 'can_pos',
  'не может': 'can_neg',
  'не можешь': 'can_neg',
  'может?': 'can_q',
  'мог(ла) бы': 'could_pos',
  'мог бы': 'could_pos',
  'мог': 'could_pos',
  'могла': 'could_pos',
  'могли': 'could_pos',
  'не мог бы': 'could_neg',
  'не мог': 'could_neg',
  'не могла': 'could_neg',
  'не могли': 'could_neg',
  'мог бы?': 'could_q',
  'могли?': 'could_q',
  'мог?': 'could_q',
  'будущее': 'will_pos',
  'будущее+не': 'will_neg',
  'будущее + не': 'will_neg',
  'будущее+ не': 'will_neg',
  'будущее?': 'will_q',
  'бы': 'would_pos',
  'бы не': 'would_neg',
  'бы?': 'would_q',
  'следует': 'should_pos',
  'не следует': 'should_neg',
  'следует?': 'should_q',
  'должен': 'must_pos',
  'не должен': 'must_neg',
  'должен?': 'must_q',
};

function resolveMeaning(input: MeaningInput): MeaningInfo {
  if (typeof input === 'object' && input !== null && 'id' in input) {
    return input;
  }
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  const byId = MEANINGS.find(
    (m) => m.id === lower || m.label.toLowerCase() === lower
  );
  if (byId) return byId;
  const alias = MEANING_ALIASES[lower];
  if (alias) return MEANINGS.find((m) => m.id === alias)!;
  throw new Error(`Unknown meaning: ${raw}`);
}

function resolveVerb(input: VerbInput): Verb {
  if (typeof input === 'object' && input !== null && 'v1' in input) {
    return input;
  }
  const s = String(input).trim().toLowerCase();
  const found = VERBS.find(
    (v) =>
      v.v1.toLowerCase() === s ||
      `${v.v1} ${v.particle || ''}`.trim().toLowerCase() === s
  );
  if (found) return found;
  throw new Error(`Unknown verb: ${String(input)}`);
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getBePresent(person: SubjInfo['person']): string {
  if (person === '1s') return 'am';
  if (person === '3s') return 'is';
  return 'are';
}

function getBePast(person: SubjInfo['person']): string {
  if (person === '1s' || person === '3s') return 'was';
  return 'were';
}

function getHavePresent(person: SubjInfo['person']): string {
  return person === '3s' ? 'has' : 'have';
}

function getDoPresent(person: SubjInfo['person']): 'do' | 'does' {
  return person === '3s' ? 'does' : 'do';
}

export interface GenerateOptions {
  includeCtx?: boolean;
}

/**
 * Детерминированный генератор предложений для режима «Главный × Смысл» (T6).
 */
export function generate(
  subjectInput: SubjInput,
  meaningInput: MeaningInput,
  verbInput: VerbInput,
  voice: Voice = 'active',
  options?: GenerateOptions
): GeneratedGridItem {
  const subj = resolveSubject(subjectInput);
  const meaning = resolveMeaning(meaningInput);
  const verb = resolveVerb(verbInput);

  const includeCtx = options?.includeCtx ?? true;
  const ctxText = includeCtx ? meaning.ctx : undefined;

  const isQuestion = meaning.form === 'yes_no_question';
  const isNeg = meaning.form === 'negative';
  const isAff = meaning.form === 'affirmative';

  const subjSlotText = isQuestion ? subj.en : subj.capEn;
  const formula: Slot[] = [];
  let code = '';
  let isRarePassive = false;

  // Вспомогательная функция добавления частицы фразового глагола (wake up, talk to)
  const pushParticleIfAny = () => {
    if (verb.particle) {
      formula.push({ pos: 2, kind: 'to', text: verb.particle });
    }
  };

  if (meaning.modalCode) {
    // 1. МОДАЛЬНЫЕ И БУДУЩЕЕ (can, could, will, would, should, must)
    code = meaning.modalCode;
    if (voice === 'active') {
      if (isQuestion) {
        formula.push({ pos: 0, kind: 'code', text: capitalize(code) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: code });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: code });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      }
    } else {
      // Passive: modal + be + V3
      if (isQuestion) {
        formula.push({ pos: 0, kind: 'code', text: capitalize(code) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'been', text: 'be' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: code });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'been', text: 'be' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: code });
        formula.push({ pos: 2, kind: 'been', text: 'be' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  } else if (meaning.aspect === 'dela' && meaning.tense === 'present') {
    // 2. ДЕЛА — НАСТОЯЩЕЕ
    if (voice === 'active') {
      const doCode = getDoPresent(subj.person);
      code = doCode;
      if (isAff) {
        const verbWord = subj.person === '3s' ? verb.s : verb.v1;
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'verb', text: verbWord, hiddenCode: doCode });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: doCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(doCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      }
    } else {
      // Passive: am/is/are + V3
      const beCode = getBePresent(subj.person);
      code = beCode;
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(beCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  } else if (meaning.aspect === 'dela' && meaning.tense === 'past') {
    // 3. ДЕЛА — ПРОШЕДШЕЕ
    if (voice === 'active') {
      code = 'did';
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'verb', text: verb.v2, hiddenCode: 'did' });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: 'did' });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: 'Did' });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'verb', text: verb.v1 });
        pushParticleIfAny();
      }
    } else {
      // Passive: was/were + V3
      const beCode = getBePast(subj.person);
      code = beCode;
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(beCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  } else if (meaning.aspect === 'sostoyanie') {
    // 4. СОСТОЯНИЕ (am/is/are/was/were + ing | passive: + being + V3)
    const beCode = meaning.tense === 'past' ? getBePast(subj.person) : getBePresent(subj.person);
    code = beCode;
    if (voice === 'active') {
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(beCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      }
    } else {
      // Passive: beCode + being + V3
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: beCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(beCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  } else if (meaning.aspect === 'rezultat') {
    // 5. РЕЗУЛЬТАТ (have/has + V3 | passive: have/has + been + V3)
    const haveCode = getHavePresent(subj.person);
    code = haveCode;
    if (voice === 'active') {
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(haveCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    } else {
      // Passive: have/has + been + V3
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(haveCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  } else if (meaning.aspect === 'imeyu_pravo') {
    // 6. ИМЕЮ ПРАВО (have/has + been + ing | passive: have/has + been + being + V3)
    const haveCode = getHavePresent(subj.person);
    code = haveCode;
    if (voice === 'active') {
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(haveCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'ing', text: verb.ing });
        pushParticleIfAny();
      }
    } else {
      // Passive: have/has + been + being + V3 (редкая форма курса HW29/HW30)
      isRarePassive = true;
      if (isAff) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else if (isNeg) {
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 0, kind: 'code', text: haveCode });
        formula.push({ pos: 0, kind: 'neg', text: 'not' });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      } else {
        formula.push({ pos: 0, kind: 'code', text: capitalize(haveCode) });
        formula.push({ pos: 1, kind: 'subject', text: subjSlotText });
        formula.push({ pos: 2, kind: 'been', text: 'been' });
        formula.push({ pos: 2, kind: 'been', text: 'being' });
        formula.push({ pos: 2, kind: 'v3', text: verb.v3 });
        pushParticleIfAny();
      }
    }
  }

  const coreWords = formula.map((s) => s.text).join(' ');
  if (ctxText) {
    formula.push({ pos: 'ctx', kind: 'ctx', text: ctxText });
  }

  const endPunct = isQuestion ? '?' : '.';
  const fullWords = formula.map((s) => s.text).join(' ');
  const en = `${fullWords}${endPunct}`;
  const enWithoutCtx = `${coreWords}${endPunct}`;

  const enVariants = Array.from(new Set([en, enWithoutCtx]));
  if (code === 'can' && isNeg) {
    enVariants.push(en.replace(/\bcan not\b/i, 'cannot'));
    enVariants.push(enWithoutCtx.replace(/\bcan not\b/i, 'cannot'));
  }

  const fullVerbEn = verb.particle ? `${verb.v1} ${verb.particle}` : verb.v1;
  const voiceBadge = voice === 'passive' ? ' [Пассив]' : '';
  const label = `${subj.ru} (${subj.en}) + ${meaning.label}${voiceBadge} (${fullVerbEn} — ${verb.ru})`;

  return {
    en,
    enVariants,
    formula,
    label,
    isRarePassive,
    aspect: meaning.aspect,
    tense: meaning.tense,
    voice,
    form: meaning.form,
    code,
    subjectInfo: subj,
    meaningInfo: meaning,
    verbInfo: verb,
  };
}

/**
 * Превращает сгенерированный элемент в объект Exercise для совместимости с check() и компонентами.
 */
export function generatedToExercise(item: GeneratedGridItem, id = 'GRID-1'): Exercise {
  return {
    id,
    hw: 'GRID',
    lesson: 2,
    worksheet: 'grid',
    n: 1,
    type: 'grid_build',
    ru: item.label,
    en: item.enVariants,
    formula: item.formula,
    aspect: item.aspect,
    tense: item.tense,
    voice: item.voice,
    form: item.form,
    topics: item.voice === 'passive' ? ['passive'] : [item.meaningInfo.group === 'modals' ? 'modals' : (item.aspect as any)],
    code: item.code,
    grid: {
      subject: item.subjectInfo.ru,
      meaning: item.meaningInfo.label,
    },
  };
}

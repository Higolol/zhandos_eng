// ЕДИНЫЙ КОНТРАКТ ДАННЫХ. Копируется как есть в app/src/types.ts (задача T3).
// Менять только через оркестратора: от этих типов зависят T1, T2, T4–T7.

// ---------- Методика ----------

/** Позиции формулы English Algorithm. 'ctx' — обстоятельства (every day, at 10 am, by email). */
export type Pos = -1 | 0 | 1 | 2 | 3 | 'ctx';

/** Подтип слота — управляет цветом. Палитра — в COLORS ниже. */
export type SlotKind =
  | 'question'   // -1  What / Why / Who ...
  | 'code'       // 0   do, does, did, am, is, was, have, had, will, can, would ...
  | 'subject'    // 1   Ведущий
  | 'verb'       // 2   «чёрный глагол» V1
  | 'ing'        // 2   V-ing (суффикс ing подсвечивается красным)
  | 'v3'         // 2   3-я форма (бирюзовый)
  | 'been'       // 2   been / being / голый be после модального кода (фиолетовый)
  | 'to'         // 2   to + V (complex object)
  | 'object'     // 3
  | 'ctx'        // обстоятельства
  | 'neg';       // not / never / no

export interface Slot {
  pos: Pos;
  kind: SlotKind;
  text: string;
  /** Скрытый код: для "helped" -> "did", для "plays" -> "does". Только у слота kind='verb'. */
  hiddenCode?: 'do' | 'does' | 'did';
}

export type Aspect = 'dela' | 'sostoyanie' | 'rezultat' | 'imeyu_pravo' | 'modal' | 'none';
export type Tense = 'past' | 'present' | 'future' | 'none';
export type Voice = 'active' | 'passive';
export type Form =
  | 'affirmative'
  | 'negative'
  | 'yes_no_question'
  | 'wh_question'
  | 'who_subject'   // Who helped you?  (прямой порядок 1-0-2-3, «Кто» = Ведущий)
  | 'who_object';   // Who did you help? (-1 0 1 2)

export type Topic =
  | 'modals'            // HW1: can/could/will/would/should/must (+ «Бы», «Следует»)
  | 'dela'              // do/does/did, скрытый код
  | 'sostoyanie'        // am/is/are/was/were + ing
  | 'rezultat'          // have/has/had + V3
  | 'imeyu_pravo'       // have/has been + ing, since/for, How long
  | 'passive'           // be + V3 во всех аспектах (is being done, has been done ...)
  | 'modal_passive'     // can be invited, should get paid (HW13, HW15)
  | 'who_questions'     // вопрос к Ведущему vs к объекту, предлог в конце (HW7–9, 23)
  | 'negation'          // одно отрицание: nobody/anybody/never/ever (HW2, 10, 11)
  | 'have_possession'   // do you have / has (HW4)
  | 'conditionals'      // If/When/Until + present, главная часть will (HW12, 16)
  | 'there_is'          // There is/are, в т.ч. в прошлом/будущем/пассиве (HW17, 22)
  | 'complex_object'    // I want him to..., I need them to be woken up (HW18, 20)
  | 'must_have_to'      // HW32
  | 'been_to_in'        // HW30 s3–4, HW31
  | 'past_perfect'      // had done / had been doing, очерёдность событий (HW30 s7, HW33)
  | 'future_perfect'    // will have done / will have been doing
  | 'whose'             // HW29
  | 'mixed';            // All in one (HW10, 11)

// ---------- Датасет (T1) ----------

export type ExerciseType =
  | 'translate_ru_en'   // основной тип: русская фраза -> английский
  | 'translate_en_ru'   // HW33: англ -> рус + очерёдность событий
  | 'grid_build';       // Lesson 2: «Кто главный» + «Смысл» -> предложение

export interface Exercise {
  id: string;                 // "HW8-s1-07" — уникален
  hw: string;                 // "HW8"
  lesson: number | null;      // номер «Lesson N» с рабочего листа, если виден
  worksheet: string;          // имя файла из source/worksheets
  n: number | null;           // номер строки на листе
  type: ExerciseType;
  ru: string;                 // формулировка задания как на листе (с пометками {сейчас} и т.п.)
  en: string[];               // допустимые ответы, en[0] — эталон. Минимум 1.
  formula: Slot[];            // разбор эталона en[0] по позициям, в порядке слов
  literal?: string;           // дословный «алгоритмический» перевод: «Когда является этот документ отправленным?»
  aspect: Aspect;
  tense: Tense;
  voice: Voice;
  form: Form;
  topics: Topic[];            // первая — основная
  code: string;               // код предложения: "did", "has been", "can", "will be" ...
  pairId?: string;            // id парного задания (актив<->пассив, утверждение<->Who-вопрос)
  myPastAnswer?: string;      // ответ ученика из презентации, дословно
  myPastAnswerOk?: boolean;   // совпадает ли он с одним из en[]
  myPastAnswerNote?: string;  // коротко: в чём ошибка, в терминах методики
  grid?: { subject: string; meaning: string };        // только для grid_build
  events?: { order: number[]; note: string };          // только для translate_en_ru (HW33)
}

export interface Lesson {
  hw: string;                 // "HW8"
  title: string;              // "WHO: вопрос к Ведущему и к объекту"
  topics: Topic[];
  instruction: string;        // инструкция с листа
  exerciseIds: string[];
}

export interface Dataset {
  version: string;
  lessons: Lesson[];
  exercises: Exercise[];
}

// ---------- Теория (T2) ----------

export interface TheoryCard {
  id: string;                 // "codes-do-does"
  title: string;
  topics: Topic[];
  /** Короткие абзацы в терминах методики. Разрешён inline-разбор: [[0:do]] [[1:they]] [[v3:sent]] */
  body: string[];
  examples: { en: string; ru: string; literal?: string; formula?: Slot[] }[];
  timeline?: 'dela' | 'sostoyanie' | 'rezultat' | 'imeyu_pravo' | 'dela_past' | 'sostoyanie_past';
  sourceScheme?: string;      // имя файла из source/schemes
}

export interface WritingTask {
  id: string;
  hw: string;
  title: string;
  prompt: string;
  requirements: string[];     // «Use Past Perfect...», «120–150 words»
  template?: string[];        // Introduction / Body / Conclusion
  sourceText?: string;        // для paraphrase (HW27)
  myPastDraft?: string;
  myPastCorrected?: string;
}

// ---------- Прогресс (T4) ----------

export interface Attempt {
  exerciseId: string;
  at: number;                 // Date.now()
  answer: string;
  verdict: 'exact' | 'near' | 'wrong' | 'ai_ok' | 'ai_wrong';
}

// ---------- Палитра методики (из схем Жандоса Адетбекова) ----------

export const COLORS: Record<SlotKind, string> = {
  question: '#15803d', // зелёный
  code:     '#dc2626', // красный
  subject:  '#2563eb', // синий
  verb:     '#111827', // чёрный (в тёмной теме — светлый, см. T3)
  ing:      '#111827', // основа чёрная, суффикс ing — красный
  v3:       '#06b6d4', // бирюзовый
  been:     '#7c3aed', // фиолетовый
  to:       '#111827',
  object:   '#f97316', // оранжевый
  ctx:      '#6b7280', // серый
  neg:      '#dc2626', // not — часть кода, красный
};

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataset } from '../data';
import { Slot, SlotKind, Pos, Exercise } from '../types';
import { Formula as FormulaDisplay } from '../components/Formula';
import { recordAttempt } from '../lib/progress';

// 6 канонических демонстрационных предложений по спецификации T5
const DEMO_EXERCISES: Exercise[] = [
  {
    id: 'demo-1-question',
    hw: 'HW8',
    lesson: 2,
    worksheet: '02_slova_voprosy_formula.jpg',
    n: 1,
    type: 'translate_ru_en',
    ru: 'Почему они нам помогают?',
    en: ['Why do they help us?'],
    aspect: 'dela',
    tense: 'present',
    voice: 'active',
    form: 'wh_question',
    topics: ['who_questions', 'dela'],
    code: 'do',
    literal: 'Почему делают они помогать нам?',
    formula: [
      { pos: -1, kind: 'question', text: 'Why' },
      { pos: 0, kind: 'code', text: 'do' },
      { pos: 1, kind: 'subject', text: 'they' },
      { pos: 2, kind: 'verb', text: 'help' },
      { pos: 3, kind: 'object', text: 'us?' }
    ]
  },
  {
    id: 'demo-2-hidden-code',
    hw: 'HW3',
    lesson: 3,
    worksheet: '03_did_skrytyi_kod.jpg',
    n: 2,
    type: 'translate_ru_en',
    ru: 'Они помогали мне.',
    en: ['They helped me.'],
    aspect: 'dela',
    tense: 'past',
    voice: 'active',
    form: 'affirmative',
    topics: ['dela'],
    code: 'did',
    literal: 'Они делали помогать мне.',
    formula: [
      { pos: 1, kind: 'subject', text: 'They' },
      { pos: 2, kind: 'verb', text: 'helped', hiddenCode: 'did' },
      { pos: 3, kind: 'object', text: 'me.' }
    ]
  },
  {
    id: 'demo-3-sostoyanie',
    hw: 'HW5',
    lesson: 5,
    worksheet: '06_dela_vs_sostoyanie_timeline.jpg',
    n: 3,
    type: 'translate_ru_en',
    ru: 'Я убираю свою комнату прямо сейчас.',
    en: ['I am cleaning my room.'],
    aspect: 'sostoyanie',
    tense: 'present',
    voice: 'active',
    form: 'affirmative',
    topics: ['sostoyanie'],
    code: 'am',
    literal: 'Я являюсь убирающим мою комнату.',
    formula: [
      { pos: 1, kind: 'subject', text: 'I' },
      { pos: 0, kind: 'code', text: 'am' },
      { pos: 2, kind: 'ing', text: 'cleaning' },
      { pos: 3, kind: 'object', text: 'my room.' }
    ]
  },
  {
    id: 'demo-4-passive-rezultat',
    hw: 'HW13',
    lesson: 13,
    worksheet: '13_passive_timeline_3.jpg',
    n: 4,
    type: 'translate_ru_en',
    ru: 'Машина помыта.',
    en: ['The car has been washed.'],
    aspect: 'rezultat',
    tense: 'present',
    voice: 'passive',
    form: 'affirmative',
    topics: ['passive', 'rezultat'],
    code: 'has been',
    literal: 'Машина имеет себя помытой.',
    formula: [
      { pos: 1, kind: 'subject', text: 'The car' },
      { pos: 0, kind: 'code', text: 'has' },
      { pos: 2, kind: 'been', text: 'been' },
      { pos: 2, kind: 'v3', text: 'washed.' }
    ]
  },
  {
    id: 'demo-5-passive-question',
    hw: 'HW8',
    lesson: 8,
    worksheet: '08_passive_voprosy_formula.jpg',
    n: 5,
    type: 'translate_ru_en',
    ru: 'Когда закрывают это окно?',
    en: ['When is the window closed?'],
    aspect: 'dela',
    tense: 'present',
    voice: 'passive',
    form: 'wh_question',
    topics: ['passive', 'who_questions'],
    code: 'is',
    literal: 'Когда является это окно закрытым?',
    formula: [
      { pos: -1, kind: 'question', text: 'When' },
      { pos: 0, kind: 'code', text: 'is' },
      { pos: 1, kind: 'subject', text: 'the window' },
      { pos: 2, kind: 'v3', text: 'closed?' }
    ]
  },
  {
    id: 'demo-6-imeyu-pravo',
    hw: 'HW15',
    lesson: 15,
    worksheet: '15_chetyre_aspekta_timeline.jpg',
    n: 6,
    type: 'translate_ru_en',
    ru: 'Я работаю здесь на протяжении 3 лет.',
    en: ['I have been working here for 3 years.'],
    aspect: 'imeyu_pravo',
    tense: 'present',
    voice: 'active',
    form: 'affirmative',
    topics: ['imeyu_pravo'],
    code: 'have been',
    literal: 'Я имею бывшим работающим здесь в течение 3 лет.',
    formula: [
      { pos: 1, kind: 'subject', text: 'I' },
      { pos: 0, kind: 'code', text: 'have' },
      { pos: 2, kind: 'been', text: 'been' },
      { pos: 2, kind: 'ing', text: 'working' },
      { pos: 'ctx', kind: 'ctx', text: 'here' },
      { pos: 'ctx', kind: 'ctx', text: 'for 3 years.' }
    ]
  }
];

interface Tile {
  id: string;
  slot: Slot;
  isDistractor?: boolean;
}

const POSITION_NAMES: Record<string, string> = {
  '-1': 'Вопрос',
  '0': 'Код',
  '1': 'Ведущий',
  '2': 'Действие',
  '3': 'Объект',
  'ctx': 'Обст.'
};

const POSITION_COLORS: Record<string, string> = {
  '-1': '#15803d',
  '0': '#dc2626',
  '1': '#2563eb',
  '2': 'var(--slot-verb, #111827)',
  '3': '#f97316',
  'ctx': '#6b7280'
};

/** Генерация 2–3 дистракторов-кодов для задания */
function generateDistractors(exercise: Exercise): Slot[] {
  const codeSlot = exercise.formula.find((s) => s.pos === 0 || s.kind === 'code');
  const codeText = (codeSlot?.text || exercise.code || '').trim().toLowerCase();
  const distractors: Slot[] = [];

  const add = (text: string, kind: SlotKind = 'code', pos: Pos = 0) => {
    const norm = text.toLowerCase();
    if (
      !exercise.formula.some((s) => s.text.toLowerCase() === norm) &&
      !distractors.some((s) => s.text.toLowerCase() === norm)
    ) {
      distractors.push({ text, kind, pos });
    }
  };

  switch (codeText) {
    case 'does':
      add('do');
      add('did');
      break;
    case 'do':
      add('does');
      add('did');
      break;
    case 'did':
      add('do');
      add('does');
      break;
    case 'am':
      add('is');
      add('are');
      break;
    case 'is':
      add('are');
      add('was');
      break;
    case 'are':
      add('is');
      add('were');
      break;
    case 'was':
      add('were');
      add('is');
      break;
    case 'were':
      add('was');
      add('are');
      break;
    case 'has':
      add('have');
      add('had');
      break;
    case 'have':
      add('has');
      add('had');
      break;
    case 'had':
      add('have');
      add('has');
      break;
    case 'will':
      add('would');
      add('can');
      break;
    case 'would':
      add('will');
      add('could');
      break;
    case 'can':
      add('could');
      add('will');
      break;
    case 'could':
      add('can');
      add('would');
      break;
    case 'should':
      add('must');
      add('could');
      break;
    case 'must':
      add('should');
      add('have to', 'to', 2);
      break;
    default:
      if (codeText.includes('has been')) {
        add('have been');
        add('is being');
      } else if (codeText.includes('have been')) {
        add('has been');
        add('are being');
      } else if (codeText.includes('is being')) {
        add('has been');
        add('was being');
      } else {
        add('do');
        add('did');
      }
      break;
  }

  // Гарантируем минимум 2 дистрактора
  if (distractors.length < 2) {
    if (!distractors.some((d) => d.text === 'did') && codeText !== 'did') add('did');
    if (!distractors.some((d) => d.text === 'does') && codeText !== 'does') add('does');
    if (!distractors.some((d) => d.text === 'do') && codeText !== 'do') add('do');
  }

  return distractors.slice(0, 3);
}

/** Подсказка при ошибке в позиции 0 (Код) */
function getCodeErrorHint(exercise: Exercise): string {
  const subjectSlot = exercise.formula.find((s) => s.pos === 1 || s.kind === 'subject');
  const codeSlot = exercise.formula.find((s) => s.pos === 0 || s.kind === 'code');
  const subject = subjectSlot?.text || 'Ведущий';
  const correctCode = codeSlot?.text || exercise.code;

  const subLower = subject.toLowerCase();

  if (['he', 'she', 'it', 'the car', 'the window', 'my colleague', 'this document'].some((s) => subLower.includes(s))) {
    if (correctCode.toLowerCase() === 'does') {
      return `Ведущий — «${subject}» (3-е лицо ед. ч.), значит код — «does» (на конце -s).`;
    }
    if (correctCode.toLowerCase() === 'is') {
      return `Ведущий — «${subject}» (ед. ч.), значит код состояния — «is».`;
    }
    if (correctCode.toLowerCase() === 'was') {
      return `Ведущий — «${subject}» (ед. ч. в прошлом), значит код состояния — «was».`;
    }
    if (correctCode.toLowerCase() === 'has') {
      return `Ведущий — «${subject}», значит в Результате код — «has».`;
    }
  }

  if (['they', 'we', 'you', 'i'].some((s) => subLower.includes(s))) {
    if (correctCode.toLowerCase() === 'do') {
      return `Ведущий — «${subject}», значит код регулярных Дел — «do».`;
    }
    if (correctCode.toLowerCase() === 'are') {
      return `Ведущий — «${subject}», значит код состояния — «are».`;
    }
    if (correctCode.toLowerCase() === 'were') {
      return `Ведущий — «${subject}», значит в прошлом код состояния — «were».`;
    }
    if (correctCode.toLowerCase() === 'have') {
      return `Ведущий — «${subject}», значит код Результата — «have».`;
    }
    if (correctCode.toLowerCase() === 'am') {
      return `Ведущий — «I», значит код состояния в настоящем — «am».`;
    }
  }

  if (correctCode.toLowerCase() === 'did') {
    return `Действие произошло в прошлом (аспект Дела) — код всегда «did».`;
  }

  return `Ведущий — «${subject}», значит правильный код — «${correctCode}».`;
}

export const Formula: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const paramTopic = searchParams.get('topic') || '';
  const paramHw = searchParams.get('hw') || '';

  // Фильтр или демо
  const exercisesPool = useMemo(() => {
    if (isDemo) {
      return DEMO_EXERCISES;
    }
    const base = (dataset.exercises || []).filter(
      (e) => e.formula && e.formula.length > 0 && e.type !== 'translate_en_ru'
    );
    const filtered = base.filter((e) => {
      if (paramHw && e.hw !== paramHw) return false;
      if (paramTopic && !e.topics.includes(paramTopic as any)) return false;
      return true;
    });
    return filtered.length > 0 ? filtered : base.length > 0 ? base : DEMO_EXERCISES;
  }, [isDemo, paramTopic, paramHw]);

  // Индекс текущего задания
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    setCurrentIndex(0);
  }, [isDemo, paramTopic, paramHw]);
  const exercise = exercisesPool[currentIndex] || exercisesPool[0];

  // Состояние конструктора
  const [placedTiles, setPlacedTiles] = useState<(Tile | null)[]>([]);
  const [poolTiles, setPoolTiles] = useState<Tile[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Настройки отображения эталона
  const [showPositions, setShowPositions] = useState(true);
  const [showHiddenCode, setShowHiddenCode] = useState(false);
  const [showDemoShowcase, setShowDemoShowcase] = useState(false);

  // Счётчик выполненных подряд заданий
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionSuccess, setSessionSuccess] = useState(0);

  // Инициализация нового задания
  useEffect(() => {
    if (!exercise || !exercise.formula) return;

    // Сетка пустых ячеек под количество слотов эталона
    setPlacedTiles(new Array(exercise.formula.length).fill(null));

    // Формируем плашки эталона + дистракторы
    const targetTiles: Tile[] = exercise.formula.map((slot, i) => ({
      id: `target-${i}`,
      slot,
      isDistractor: false
    }));

    const distractorSlots = generateDistractors(exercise);
    const distractorTiles: Tile[] = distractorSlots.map((slot, i) => ({
      id: `distractor-${i}`,
      slot,
      isDistractor: true
    }));

    // Перемешиваем пул плашек
    const all = [...targetTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    setPoolTiles(all);

    setIsChecked(false);
    setIsAllCorrect(false);
    setCodeError(null);
  }, [exercise]);

  // Тап по плашке в пуле: кладёт в первую свободную ячейку
  const handleTileClick = (tile: Tile) => {
    if (isChecked) return; // После проверки не перемещаем

    const emptyIdx = placedTiles.findIndex((t) => t === null);
    if (emptyIdx === -1) return; // Все ячейки заняты

    const nextPlaced = [...placedTiles];
    nextPlaced[emptyIdx] = tile;
    setPlacedTiles(nextPlaced);

    // Удаляем из доступного пула
    setPoolTiles((prev) => prev.filter((t) => t.id !== tile.id));
  };

  // Тап по ячейке: возвращает плашку в пул
  const handleCellClick = (index: number) => {
    if (isChecked) return;

    const tile = placedTiles[index];
    if (!tile) return;

    const nextPlaced = [...placedTiles];
    nextPlaced[index] = null;
    setPlacedTiles(nextPlaced);

    // Возвращаем в пул
    setPoolTiles((prev) => [...prev, tile]);
  };

  // Сброс всех ячеек обратно в пул
  const handleReset = () => {
    if (!exercise) return;
    const targetTiles: Tile[] = exercise.formula.map((slot, i) => ({
      id: `target-${i}`,
      slot,
      isDistractor: false
    }));
    const distractorSlots = generateDistractors(exercise);
    const distractorTiles: Tile[] = distractorSlots.map((slot, i) => ({
      id: `distractor-${i}`,
      slot,
      isDistractor: true
    }));
    setPoolTiles([...targetTiles, ...distractorTiles].sort(() => Math.random() - 0.5));
    setPlacedTiles(new Array(exercise.formula.length).fill(null));
    setIsChecked(false);
    setIsAllCorrect(false);
    setCodeError(null);
  };

  // Проверка решения
  const handleCheck = () => {
    if (!exercise) return;

    let allCorrect = true;
    let codeErr: string | null = null;

    placedTiles.forEach((tile, idx) => {
      const targetSlot = exercise.formula[idx];
      const userText = tile?.slot.text.toLowerCase().trim() || '';
      const targetText = targetSlot.text.toLowerCase().trim();

      if (userText !== targetText) {
        allCorrect = false;

        // Проверяем, является ли эта ячейка позицией кода
        if (targetSlot.pos === 0 || targetSlot.kind === 'code') {
          codeErr = getCodeErrorHint(exercise);
        }
      }
    });

    setIsChecked(true);
    setIsAllCorrect(allCorrect);
    setCodeError(codeErr);

    setSessionCount((prev) => prev + 1);
    if (allCorrect) {
      setSessionSuccess((prev) => prev + 1);
    }

    // Запись результата в progress (T4) с тем же exerciseId
    try {
      recordAttempt({
        exerciseId: exercise.id,
        answer: placedTiles.map((t) => t?.slot.text).filter(Boolean).join(' '),
        verdict: allCorrect ? 'exact' : 'wrong',
        at: Date.now()
      });
    } catch (e) {
      console.warn('Failed to record attempt in progress:', e);
    }
  };

  // Переход к следующему заданию
  const handleNext = () => {
    if (currentIndex < exercisesPool.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Все ли ячейки заполнены
  const isFilled = placedTiles.length > 0 && placedTiles.every((t) => t !== null);

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen flex flex-col p-4 pb-24 pt-safe select-none">
      {/* Шапка экрана */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-touch min-w-touch flex items-center justify-center transition-colors"
            aria-label="Назад к тренировке"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Конструктор формулы
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDemo ? 'Демонстрация 6 канонических схем' : `Задание ${currentIndex + 1} из ${exercisesPool.length}`}
            </p>
          </div>
        </div>

        {/* Переключатель Демо / Тренировка */}
        <button
          onClick={() => {
            const next = !isDemo;
            setSearchParams(next ? { demo: '1' } : {});
            setCurrentIndex(0);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-touch flex items-center gap-1.5 ${
            isDemo
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span>{isDemo ? '★ Демо' : 'Демо'}</span>
        </button>
      </header>

      {/* Демо-переключатель 6 канонических предложений */}
      {isDemo && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
              6 видов раскраски (ТЗ T5)
            </span>
            <button
              onClick={() => setShowDemoShowcase((v) => !v)}
              className="text-xs font-semibold text-red-600 dark:text-red-400 underline"
            >
              {showDemoShowcase ? 'Скрыть витрину' : 'Показать все 6 сразу'}
            </button>
          </div>

          {/* Быстрые табы по 6 схемам */}
          <div className="grid grid-cols-6 gap-1">
            {DEMO_EXERCISES.map((demoEx, idx) => (
              <button
                key={demoEx.id}
                onClick={() => setCurrentIndex(idx)}
                className={`py-1.5 text-xs font-black rounded-lg min-h-[38px] transition-all flex items-center justify-center ${
                  currentIndex === idx
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-gray-700'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>

          {/* Витрина всех 6 формул одновременно */}
          {showDemoShowcase && (
            <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/40 space-y-4">
              {DEMO_EXERCISES.map((demoEx, idx) => (
                <div
                  key={`showcase-${demoEx.id}`}
                  className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      #{idx + 1} · {demoEx.aspect} ({demoEx.voice})
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{demoEx.code}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-200 mb-2">
                    {demoEx.ru}
                  </div>
                  <FormulaDisplay
                    slots={demoEx.formula}
                    showPositions={true}
                    showHiddenCode={true}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Карточка текущего задания */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm mb-4">
        {/* Метки темы и прогресса */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {exercise.hw || 'EA'} {exercise.topics?.[0] ? `· ${exercise.topics[0]}` : ''}
          </span>
          <span className="font-mono">
            Верно: {sessionSuccess}/{sessionCount}
          </span>
        </div>

        {/* Русская фраза задания */}
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2">
          {exercise.ru}
        </h2>

        {/* Дословный перевод (если есть) */}
        {exercise.literal && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
            Дословно: «{exercise.literal}»
          </p>
        )}

        {/* Панель настроек эталона при проверке */}
        {isChecked && (
          <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showHiddenCode}
                onChange={(e) => setShowHiddenCode(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span>Показать скрытый код</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showPositions}
                onChange={(e) => setShowPositions(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span>Позиции</span>
            </label>
          </div>
        )}
      </div>

      {/* Зона ячеек предложения (Целевой ряд) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Позиции предложения ({placedTiles.filter(Boolean).length}/{exercise.formula.length})
          </span>
          <button
            onClick={handleReset}
            disabled={placedTiles.every((t) => t === null) || isChecked}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
          >
            Очистить
          </button>
        </div>

        {/* Сетка ячеек: адаптирована к ширине 360px с переносом */}
        <div className="flex flex-wrap items-stretch gap-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800 min-h-[90px]">
          {exercise.formula.map((targetSlot, idx) => {
            const placed = placedTiles[idx];
            const posKey = String(targetSlot.pos);
            const posName = POSITION_NAMES[posKey] || 'обст.';
            const posColor = POSITION_COLORS[posKey] || '#6b7280';
            const isCtx = targetSlot.pos === 'ctx';

            // Проверка правильности
            const isCellCorrect =
              isChecked &&
              placed &&
              placed.slot.text.toLowerCase().trim() === targetSlot.text.toLowerCase().trim();

            return (
              <div
                key={`cell-${idx}`}
                onClick={() => handleCellClick(idx)}
                className={`flex-1 min-w-[68px] sm:min-w-[80px] max-w-[140px] flex flex-col justify-between items-center p-2 rounded-xl border transition-all text-center min-h-[72px] cursor-pointer ${
                  placed
                    ? isChecked
                      ? isCellCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-xs'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-500 dark:border-red-600 shadow-xs animate-shake'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-xs active:scale-95'
                    : 'bg-transparent border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {/* Содержимое ячейки */}
                <div className="w-full flex-1 flex items-center justify-center">
                  {placed ? (
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words leading-tight">
                      {placed.slot.text}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 font-mono text-sm font-bold">
                      +
                    </span>
                  )}
                </div>

                {/* Подвал ячейки: номер позиции и подпись методики */}
                <div className="w-full pt-1 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold" style={{ color: posColor }}>
                    {!isCtx ? targetSlot.pos : '•'}
                  </span>
                  <span className="font-medium truncate max-w-[48px]" style={{ color: posColor }}>
                    {posName}
                  </span>
                  {isChecked && (
                    <span className="font-black text-xs">
                      {isCellCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">✗</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Сообщения и подсказки */}
      {isChecked && (
        <div className="mb-4">
          {isAllCorrect ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Отлично! Предложение собрано строго по формуле алгоритма.</span>
            </div>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>✕</span>
                <span>Есть ошибки в сборке формулы:</span>
              </div>
              {codeError && (
                <p className="text-xs text-red-700 dark:text-red-300 font-medium pl-4">
                  {codeError}
                </p>
              )}
            </div>
          )}

          {/* Эталонная формула под разбором */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Эталон алгоритма:
            </div>
            <FormulaDisplay
              slots={exercise.formula}
              showPositions={showPositions}
              showHiddenCode={showHiddenCode}
              size="md"
            />
          </div>
        </div>
      )}

      {/* Пул доступных плашек */}
      <div className="mt-auto pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Выберите слова (включая дистракторы):
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {poolTiles.length} доступно
          </span>
        </div>

        {/* Плашки со словами */}
        <div className="flex flex-wrap gap-2 p-3 bg-gray-100 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700 min-h-[80px]">
          {poolTiles.length === 0 ? (
            <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 py-3 italic">
              Все плашки перенесены в ячейки
            </div>
          ) : (
            poolTiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={isChecked}
                className="px-3 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-bold text-sm sm:text-base shadow-xs hover:border-blue-500 active:scale-95 disabled:opacity-40 transition-all min-h-touch flex items-center justify-center"
              >
                {tile.slot.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="mt-4 flex gap-3">
        {!isChecked ? (
          <button
            onClick={handleCheck}
            disabled={!isFilled}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-touch flex items-center justify-center gap-2"
          >
            <span>Проверить формулу</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all min-h-touch flex items-center justify-center gap-2"
          >
            <span>Следующее задание →</span>
          </button>
        )}
      </div>
    </div>
  );
};

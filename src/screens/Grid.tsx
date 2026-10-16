import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Voice } from '../types';
import { VERBS } from '../lib/verbs';
import {
  SUBJECTS,
  MEANINGS,
  generate,
  generatedToExercise,
  type GeneratedGridItem,
  type SubjectId,
  type MeaningId,
} from '../lib/generator';
import { check, type CheckResult } from '../lib/check';
import { recordAttempt } from '../lib/progress';
import { Formula } from '../components/Formula';

const BEST_COMBO_KEY = 'ea_grid_best_combo';
const BEST_SPRINT_SCORE_KEY = 'ea_grid_best_sprint';

type MeaningFilter = 'all' | 'modals' | 'aspects';
type VoiceFilter = 'active' | 'passive' | 'mixed';

function getStoredNumber(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export const Grid: React.FC = () => {
  const navigate = useNavigate();

  // Фильтры сверху
  const [selectedVerb, setSelectedVerb] = useState<string>('random');
  const [meaningFilter, setMeaningFilter] = useState<MeaningFilter>('all');
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>('active');

  // Ручной выбор ячейки (опционально)
  const [manualSubj, setManualSubj] = useState<SubjectId | 'random'>('random');
  const [manualMeaning, setManualMeaning] = useState<MeaningId | 'random'>('random');

  // Состояние текущего задания
  const [currentItem, setCurrentItem] = useState<GeneratedGridItem>(() =>
    generate('she', 'can_pos', 'ask', 'active')
  );
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Спринт (60 секунд) и комбо
  const [isSprint, setIsSprint] = useState(false);
  const [sprintRunning, setSprintRunning] = useState(false);
  const [sprintFinished, setSprintFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [sprintScore, setSprintScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState<number>(() => getStoredNumber(BEST_COMBO_KEY));
  const [bestSprint, setBestSprint] = useState<number>(() => getStoredNumber(BEST_SPRINT_SCORE_KEY));

  const availableMeanings = MEANINGS.filter((m) =>
    meaningFilter === 'all' ? true : m.group === meaningFilter
  );

  // Генерация следующей карточки
  const pickNextCard = useCallback(() => {
    const voice: Voice =
      voiceFilter === 'mixed'
        ? Math.random() < 0.35
          ? 'passive'
          : 'active'
        : voiceFilter;

    const subjPool =
      voice === 'passive' ? SUBJECTS : SUBJECTS.filter((s) => !s.passiveOnly);
    const subj =
      manualSubj !== 'random' && subjPool.some((s) => s.id === manualSubj)
        ? subjPool.find((s) => s.id === manualSubj)!
        : subjPool[Math.floor(Math.random() * subjPool.length)];

    const mPool =
      availableMeanings.length > 0 ? availableMeanings : MEANINGS;
    const meaning =
      manualMeaning !== 'random' && mPool.some((m) => m.id === manualMeaning)
        ? mPool.find((m) => m.id === manualMeaning)!
        : mPool[Math.floor(Math.random() * mPool.length)];

    const verbPool = VERBS.slice(0, 30);
    const verb =
      selectedVerb !== 'random'
        ? VERBS.find((v) => v.v1 === selectedVerb) || verbPool[0]
        : verbPool[Math.floor(Math.random() * verbPool.length)];

    const next = generate(subj, meaning, verb, voice);
    setCurrentItem(next);
    setInputVal('');
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, [voiceFilter, manualSubj, manualMeaning, availableMeanings, selectedVerb]);

  // Перегенерация при смене фильтров
  useEffect(() => {
    pickNextCard();
  }, [selectedVerb, meaningFilter, voiceFilter, manualSubj, manualMeaning]);

  // Таймер спринта
  useEffect(() => {
    if (!sprintRunning) return;
    if (timeLeft <= 0) {
      setSprintRunning(false);
      setSprintFinished(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sprintRunning, timeLeft]);

  const startSprint = () => {
    setIsSprint(true);
    setSprintRunning(true);
    setSprintFinished(false);
    setTimeLeft(60);
    setSprintScore(0);
    setCombo(0);
    pickNextCard();
  };

  const stopSprint = () => {
    setIsSprint(false);
    setSprintRunning(false);
    setSprintFinished(false);
    pickNextCard();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    const ex = generatedToExercise(currentItem, `GRID-${Date.now()}`);
    const checkRes = check(inputVal, ex);
    setResult(checkRes);

    recordAttempt({
      exerciseId: `GRID-${currentItem.subjectInfo.id}-${currentItem.meaningInfo.id}-${currentItem.voice}`,
      answer: inputVal,
      verdict: checkRes.verdict,
    });

    if (checkRes.verdict === 'exact' || (isSprint && checkRes.verdict === 'near')) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > bestCombo) {
        setBestCombo(nextCombo);
        try {
          localStorage.setItem(BEST_COMBO_KEY, String(nextCombo));
        } catch {
          // ignore
        }
      }
      if (sprintRunning) {
        const nextScore = sprintScore + 1;
        setSprintScore(nextScore);
        if (nextScore > bestSprint) {
          setBestSprint(nextScore);
          try {
            localStorage.setItem(BEST_SPRINT_SCORE_KEY, String(nextScore));
          } catch {
            // ignore
          }
        }
        // В спринте при верном ответе сразу переключаем на следующую карточку
        setTimeout(() => pickNextCard(), 250);
      }
    } else if (checkRes.verdict === 'wrong') {
      setCombo(0);
    }
  };

  const fullVerbName = currentItem.verbInfo.particle
    ? `${currentItem.verbInfo.v1} ${currentItem.verbInfo.particle}`
    : currentItem.verbInfo.v1;

  return (
    <div className="p-4 flex flex-col gap-4 pt-safe pb-24 max-w-2xl mx-auto w-full">
      {/* Шапка */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Назад к тренировке"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Главный × Смысл
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Матрица сборки предложений без ИИ (Lesson 2 / HW1–HW30)
            </p>
          </div>
        </div>

        {/* Кнопка Спринта */}
        {!sprintRunning ? (
          <button
            type="button"
            onClick={startSprint}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 min-h-[38px]"
          >
            <span>⚡ Спринт 60с</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopSprint}
            className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs min-h-[38px]"
          >
            Стоп
          </button>
        )}
      </header>

      {/* Полоса статистики комбо и спринта */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-800">
          <div className="text-[10px] uppercase font-semibold text-gray-400">Серия (Комбо)</div>
          <div className="text-base font-black text-red-600 dark:text-red-400">🔥 {combo}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-800">
          <div className="text-[10px] uppercase font-semibold text-gray-400">Рекорд комбо</div>
          <div className="text-base font-black text-gray-900 dark:text-white">🏆 {bestCombo}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-800">
          <div className="text-[10px] uppercase font-semibold text-gray-400">
            {sprintRunning ? 'Таймер' : 'Рекорд спринта'}
          </div>
          <div
            className={`text-base font-black font-mono ${
              sprintRunning && timeLeft <= 10
                ? 'text-red-600 animate-pulse'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {sprintRunning ? `⏱ ${timeLeft}с (${sprintScore})` : `⚡ ${bestSprint}`}
          </div>
        </div>
      </div>

      {/* Панель настроек генератора */}
      {!sprintRunning && (
        <section className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Выбор глагола */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Глагол (Действие)
              </label>
              <select
                value={selectedVerb}
                onChange={(e) => setSelectedVerb(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="random">🎲 Случайный глагол (30)</option>
                {VERBS.slice(0, 30).map((v) => (
                  <option key={v.v1} value={v.v1}>
                    {v.particle ? `${v.v1} ${v.particle}` : v.v1} — {v.ru}
                  </option>
                ))}
              </select>
            </div>

            {/* Набор смыслов */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Набор смыслов
              </label>
              <div className="grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-gray-900 p-1 rounded-xl">
                {(
                  [
                    { id: 'modals', label: 'Модальные' },
                    { id: 'aspects', label: 'Аспекты' },
                    { id: 'all', label: 'Всё' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMeaningFilter(tab.id);
                      setManualMeaning('random');
                    }}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      meaningFilter === tab.id
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Залог */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Залог
              </label>
              <div className="grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-gray-900 p-1 rounded-xl">
                {(
                  [
                    { id: 'active', label: 'Актив' },
                    { id: 'passive', label: 'Пассив' },
                    { id: 'mixed', label: 'Смешанно' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setVoiceFilter(tab.id);
                      setManualSubj('random');
                    }}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      voiceFilter === tab.id
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Точечный выбор Ведущего и Смысла */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-gray-200/70 dark:border-gray-800">
            <div>
              <label className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                Кто ГЛАВНЫЙ (1 — Ведущий)
              </label>
              <select
                value={manualSubj}
                onChange={(e) => setManualSubj(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="random">🎲 Случайный Ведущий</option>
                {SUBJECTS.filter((s) => (voiceFilter === 'active' ? !s.passiveOnly : true)).map(
                  (s) => (
                    <option key={s.id} value={s.id}>
                      {s.ru} ({s.en})
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-red-600 dark:text-red-400 block mb-1">
                Смысл / Код (0 — Ключ)
              </label>
              <select
                value={manualMeaning}
                onChange={(e) => setManualMeaning(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="random">🎲 Случайный Смысл</option>
                {availableMeanings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Итог спринта */}
      {sprintFinished && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-3 animate-fadeIn">
          <div className="text-3xl">🏁</div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Спринт завершён! Ваш счёт: {sprintScore}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Лучший результат за 60 секунд: <b>{bestSprint}</b> · Лучшее комбо: <b>{bestCombo}</b>
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={startSprint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
            >
              Ещё раз 60с ⚡
            </button>
            <button
              type="button"
              onClick={stopSprint}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs"
            >
              В обычный режим
            </button>
          </div>
        </div>
      )}

      {/* Основная карточка задания «Главный × Смысл» */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        {/* Верхняя строка бейджей залога и редкой формы */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              currentItem.voice === 'passive'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {currentItem.voice === 'passive'
              ? 'Пассив: Ведущий не действует (be + V3)'
              : 'Актив: Ведущий действует сам'}
          </span>

          {currentItem.isRarePassive && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              ⚠️ Редкая форма (HW29/30)
            </span>
          )}
        </div>

        {/* Большие бейджи: Ведущий (синий) × Смысл (красный) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500/80 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              1 · Кто ГЛАВНЫЙ (Ведущий)
            </span>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {currentItem.subjectInfo.ru}
            </div>
            <div className="text-xs font-mono text-blue-600/80 dark:text-blue-400">
              ({currentItem.subjectInfo.en})
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-500/80 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
              0 · Смысл и Форма
            </span>
            <div className="text-xl font-black text-red-700 dark:text-red-300">
              {currentItem.meaningInfo.label}
            </div>
            {currentItem.meaningInfo.ctx && (
              <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                маркер: {currentItem.meaningInfo.ctx}
              </div>
            )}
          </div>
        </div>

        {/* Глагол действия */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            2 · Действие (глагол):
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
            {fullVerbName} <span className="font-sans font-normal text-gray-500">({currentItem.verbInfo.ru})</span>
          </span>
        </div>

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Собери английское предложение..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-gray-100 min-h-touch focus:ring-2 focus:ring-red-500 focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={pickNextCard}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs min-h-touch transition-colors"
            >
              Пропустить ↻
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-touch shadow-sm transition-all disabled:opacity-50"
            >
              Проверить
            </button>
          </div>
        </form>

        {/* Результат проверки */}
        {result && (
          <div
            className={`p-4 rounded-xl border space-y-2.5 animate-fadeIn ${
              result.verdict === 'exact'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : result.verdict === 'near'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {result.verdict === 'exact'
                  ? '✓ Точно в цель!'
                  : result.verdict === 'near'
                  ? '! Почти верно (проверь мелочь):'
                  : '✕ Ошибка в формуле. Эталон:'}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-gray-900/70">
                код: {currentItem.code}
              </span>
            </div>

            <div className="bg-white/90 dark:bg-gray-900/90 p-3 rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-x-auto">
              <Formula slots={currentItem.formula} showPositions showHiddenCode size="sm" />
            </div>

            <button
              type="button"
              onClick={pickNextCard}
              className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs min-h-touch shadow-xs"
            >
              Следующая комбинация →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

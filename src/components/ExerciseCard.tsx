import React, { useState, useEffect, useRef } from 'react';
import type { Exercise, Aspect, Tense } from '../types';
import { check, type CheckResult, type DiffToken } from '../lib/check';
import { aiCheck, aiExplain, type AiCheckResult, type AiExplainResult } from '../lib/ai';
import { Timeline, type TimelineKind } from './Timeline';
import { Formula } from './Formula';

export interface ExerciseCardProps {
  exercise: Exercise;
  onResult: (verdict: 'exact' | 'near' | 'wrong', answer: string) => void;
  onAskAi?: (question: string, context?: { exercise: Exercise; answer: string }) => void;
  hideNextButton?: boolean;
  className?: string;
}

function getTimelineKind(aspect: Aspect, tense: Tense): TimelineKind | null {
  if (aspect === 'dela') return tense === 'past' ? 'dela_past' : 'dela';
  if (aspect === 'sostoyanie') return tense === 'past' ? 'sostoyanie_past' : 'sostoyanie';
  if (aspect === 'rezultat') return 'rezultat';
  if (aspect === 'imeyu_pravo') return 'imeyu_pravo';
  return null;
}

function normRu(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"«»()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onResult,
  onAskAi,
  hideNextButton = false,
  className = '',
}) => {
  const [inputVal, setInputVal] = useState('');
  const [hintStep, setHintStep] = useState<number>(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCheckData, setAiCheckData] = useState<AiCheckResult | null>(null);
  const [aiExplainData, setAiExplainData] = useState<AiExplainResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEnToRu = exercise.type === 'translate_en_ru';

  // Сброс состояния при смене задания
  useEffect(() => {
    setInputVal('');
    setHintStep(0);
    setResult(null);
    setShowTimeline(false);
    setAiLoading(false);
    setAiError(null);
    setAiCheckData(null);
    setAiExplainData(null);
    if (!hideNextButton) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [exercise.id, hideNextButton]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setAiError(null);
    setAiCheckData(null);
    setAiExplainData(null);

    if (isEnToRu) {
      // Для translate_en_ru: если совпало с эталонным русским переводом — сразу exact, иначе проверяем через ИИ
      if (normRu(inputVal) === normRu(exercise.ru)) {
        setResult({ verdict: 'exact', matched: exercise.ru });
        if (hideNextButton) onResult('exact', inputVal);
        return;
      }
      setAiLoading(true);
      try {
        const res = await aiCheck(exercise, inputVal);
        setAiCheckData(res);
        const verdict = res.ok ? 'exact' : 'wrong';
        setResult({ verdict, matched: exercise.ru });
        if (hideNextButton) onResult(verdict, inputVal);
      } catch (err: any) {
        setAiError(err.message || 'Не удалось проверить через ИИ');
        // Если ИИ недоступен, показываем эталон в режиме near для самопроверки
        setResult({ verdict: 'near', matched: exercise.ru });
      } finally {
        setAiLoading(false);
      }
      return;
    }

    const checkRes = check(inputVal, exercise);
    setResult(checkRes);
    if (hideNextButton) {
      onResult(checkRes.verdict, inputVal);
    }
  };

  const handleWhyAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      if (result && result.verdict !== 'exact' && inputVal.trim()) {
        const res = await aiCheck(exercise, inputVal);
        setAiCheckData(res);
      } else {
        const res = await aiExplain(exercise);
        setAiExplainData(res);
      }
      if (onAskAi) {
        onAskAi(
          `Разбор задания "${exercise.ru}"`,
          { exercise, answer: inputVal }
        );
      }
    } catch (err: any) {
      setAiError(err.message || 'Ошибка обращения к ИИ');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptNear = () => {
    onResult('exact', inputVal);
    if (hideNextButton) {
      setResult({ verdict: 'exact', matched: exercise.en[0] });
    }
  };

  const handleRetryNear = () => {
    setResult(null);
    setAiCheckData(null);
    setAiExplainData(null);
    setAiError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNext = () => {
    if (hideNextButton) {
      setResult(null);
      setInputVal('');
      setAiCheckData(null);
      setAiExplainData(null);
      setAiError(null);
      return;
    }
    if (result) {
      onResult(result.verdict, inputVal);
    }
  };

  const timelineKind = getTimelineKind(exercise.aspect, exercise.tense);

  // Формирование текста задания
  const isGrid = exercise.type === 'grid_build' && exercise.grid;
  const verbText =
    exercise.formula?.find((s) => s.kind === 'verb' || s.pos === 2)?.text || 'ask';

  const promptText = isGrid
    ? `${exercise.grid?.subject} + ${exercise.grid?.meaning} (${verbText})`
    : isEnToRu
    ? exercise.en[0]
    : exercise.ru;

  return (
    <div
      className={`flex flex-col gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-all ${className}`}
    >
      {/* Шапка карточки: Бейджи и кнопка таймлайна */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {exercise.hw}
          </span>
          <span className="px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            {exercise.topics[0] || 'грамматика'}
          </span>
          <span className="px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            {exercise.aspect}
          </span>
          {exercise.voice === 'passive' && (
            <span className="px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              пассив
            </span>
          )}
        </div>

        {timelineKind && (
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 min-h-[36px] px-2 flex items-center gap-1"
          >
            <span>{showTimeline ? 'Скрыть таймлайн' : 'Таймлайн'}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showTimeline ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Выпадающий таймлайн аспекта */}
      {showTimeline && timelineKind && (
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
          <Timeline kind={timelineKind} label={`Аспект: ${exercise.aspect}`} />
        </div>
      )}

      {/* Текст задания */}
      <div className="py-2 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
          {isGrid
            ? 'Собери предложение:'
            : isEnToRu
            ? 'Переведи на русский:'
            : 'Переведи на английский:'}
        </span>
        <div className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
          {promptText}
        </div>

        {/* Очерёдность действий (HW33 Past Perfect) */}
        {exercise.events && (
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-900 dark:text-indigo-200">
            <span className="font-bold">
              Порядок событий: {exercise.events.order.map((n) => `${n}️⃣`).join(' → ')}
            </span>
            {exercise.events.note && (
              <span className="text-indigo-700 dark:text-indigo-300">({exercise.events.note})</span>
            )}
          </div>
        )}
      </div>

      {/* Подсказки по шагам */}
      {hintStep > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs flex flex-col gap-1.5 animate-fadeIn">
          {hintStep >= 1 && (
            <div>
              <span className="font-semibold text-amber-800 dark:text-amber-300">Ключ / Код: </span>
              <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                {exercise.code}
              </span>
            </div>
          )}
          {hintStep >= 2 && exercise.literal && (
            <div>
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                Дословный алгоритм:{' '}
              </span>
              <span className="text-gray-800 dark:text-gray-200 italic">{exercise.literal}</span>
            </div>
          )}
          {hintStep >= 3 && (
            <div>
              <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                Схема слотов:
              </span>
              <div className="flex flex-wrap gap-1">
                {exercise.formula?.map((slot, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded font-mono text-[11px] bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 text-gray-700 dark:text-gray-300"
                  >
                    pos {slot.pos}: {slot.kind}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Форма ввода */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={(result !== null && result.verdict === 'exact') || aiLoading}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              isEnToRu ? 'Введи перевод по-русски...' : 'Введи перевод по-английски...'
            }
            className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-base text-gray-900 dark:text-gray-100 min-h-touch focus:ring-2 focus:ring-red-500 focus:outline-none transition-all pr-12"
          />
        </div>

        {/* Кнопки действий: Проверить / Подсказка */}
        {!result && (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setHintStep((prev) => Math.min(prev + 1, 3))}
              disabled={hintStep >= 3}
              className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl min-h-touch flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <span>💡 Подсказка</span>
              {hintStep > 0 && <span>({hintStep}/3)</span>}
            </button>

            <button
              type="submit"
              disabled={!inputVal.trim() || aiLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl min-h-touch shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none ml-auto"
            >
              {aiLoading ? 'Проверка ИИ...' : 'Проверить'}
            </button>
          </div>
        )}
      </form>

      {/* Блок результата */}
      {result && (
        <div className="flex flex-col gap-3 pt-2">
          {/* Exact */}
          {result.verdict === 'exact' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Отлично! Ответ верный.</span>
              </div>

              {isEnToRu && (
                <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-gray-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                  <span className="font-semibold">Эталон RU: </span>
                  {exercise.ru}
                </div>
              )}

              {/* Эталон: Formula методики или текст */}
              {exercise.formula && exercise.formula.length > 0 ? (
                <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 overflow-x-auto">
                  <Formula slots={exercise.formula} showPositions showHiddenCode size="sm" />
                </div>
              ) : (
                <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-gray-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 font-mono">
                  {result.matched || exercise.en[0]}
                </div>
              )}

              {/* Оповещение об исправлении прошлой ошибки ученика из pptx */}
              {exercise.myPastAnswer && exercise.myPastAnswerOk === false && (
                <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/30 p-2 rounded-lg">
                  Раньше ты писал: <span className="line-through">{exercise.myPastAnswer}</span> → теперь верно ✓
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleWhyAi}
                  disabled={aiLoading}
                  className="flex-1 py-2 bg-white/90 dark:bg-gray-900/90 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-semibold text-xs rounded-xl min-h-touch hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{aiLoading ? 'Разбор ИИ...' : '✨ Почему так? (ИИ)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl min-h-touch shadow-sm transition-all"
                >
                  {hideNextButton ? 'Сбросить' : 'Дальше →'}
                </button>
              </div>
            </div>
          )}

          {/* Near */}
          {result.verdict === 'near' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                  !
                </span>
                <span>
                  {isEnToRu
                    ? 'Сверь свой перевод с эталоном:'
                    : 'Почти верно! Проверь мелкую деталь:'}
                </span>
              </div>

              {isEnToRu ? (
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-amber-200 dark:border-amber-900/60 text-sm">
                  <span className="font-semibold">Эталон: </span>
                  {exercise.ru}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-amber-200 dark:border-amber-900/60 flex flex-wrap gap-1.5 text-sm font-mono">
                  {result.diff?.map((token: DiffToken, i: number) => {
                    if (token.type === 'same') {
                      return (
                        <span key={i} className="text-gray-800 dark:text-gray-200">
                          {token.text}
                        </span>
                      );
                    }
                    if (token.type === 'extra') {
                      return (
                        <span
                          key={i}
                          className="bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 line-through px-1 rounded"
                          title="Лишнее слово"
                        >
                          {token.text}
                        </span>
                      );
                    }
                    if (token.type === 'missing') {
                      return (
                        <span
                          key={i}
                          className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 underline font-semibold px-1 rounded"
                          title="Пропущено слово"
                        >
                          +{token.text}
                        </span>
                      );
                    }
                    if (token.type === 'replaced') {
                      return (
                        <span
                          key={i}
                          className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1 rounded flex items-center gap-1"
                        >
                          <span className="line-through text-red-600 dark:text-red-400">{token.text}</span>
                          <span>→</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {token.expected}
                          </span>
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleAcceptNear}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl min-h-touch shadow-sm transition-all"
                >
                  Засчитать ответ
                </button>
                <button
                  type="button"
                  onClick={handleRetryNear}
                  className="flex-1 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs rounded-xl min-h-touch hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Исправить
                </button>
                <button
                  type="button"
                  onClick={handleWhyAi}
                  disabled={aiLoading}
                  className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl min-h-touch hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{aiLoading ? 'Разбор ИИ...' : '✨ Почему так? (ИИ)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Wrong */}
          {result.verdict === 'wrong' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700 dark:text-red-400">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  ✕
                </span>
                <span>Не совпало. Правильный эталон:</span>
              </div>

              {isEnToRu && (
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
                  {exercise.ru}
                </div>
              )}

              {/* Эталон: Formula методики или текст */}
              {exercise.formula && exercise.formula.length > 0 ? (
                <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-red-200 dark:border-red-900 overflow-x-auto">
                  <Formula slots={exercise.formula} showPositions showHiddenCode size="sm" />
                </div>
              ) : (
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-lg border border-red-200 dark:border-red-900 font-mono">
                  {result.matched || exercise.en[0]}
                </div>
              )}

              {/* Пословный diff */}
              {result.diff && result.diff.length > 0 && (
                <div className="p-2 rounded bg-white/50 dark:bg-gray-900/50 flex flex-wrap gap-1 text-xs font-mono">
                  {result.diff.map((token, i) => {
                    if (token.type === 'same') {
                      return <span key={i} className="text-gray-600 dark:text-gray-400">{token.text}</span>;
                    }
                    if (token.type === 'extra') {
                      return (
                        <span key={i} className="text-red-600 dark:text-red-400 line-through">
                          {token.text}
                        </span>
                      );
                    }
                    if (token.type === 'missing') {
                      return (
                        <span key={i} className="text-emerald-600 dark:text-emerald-400 underline font-bold">
                          +{token.text}
                        </span>
                      );
                    }
                    if (token.type === 'replaced') {
                      return (
                        <span key={i} className="text-red-600 dark:text-red-400">
                          {token.text} → <b className="text-emerald-600 dark:text-emerald-400">{token.expected}</b>
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Пояснение ошибки ученика из pptx, если есть */}
              {exercise.myPastAnswerNote && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-900/40 p-2 rounded">
                  💡 Примечание: {exercise.myPastAnswerNote}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleWhyAi}
                  disabled={aiLoading}
                  className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl min-h-touch hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{aiLoading ? 'Разбор ИИ...' : '✨ Почему так? (ИИ)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl min-h-touch shadow-sm transition-all"
                >
                  {hideNextButton ? 'Ещё раз' : 'Дальше →'}
                </button>
              </div>
            </div>
          )}

          {/* Блок разбора от ИИ (шторка/карточка) */}
          {aiError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 animate-fadeIn">
              ⚠️ {aiError}
            </div>
          )}

          {aiCheckData && (
            <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 font-bold">
                <span>✨ Разбор ошибки (ИИ-тьютор)</span>
                {aiCheckData.errorType && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono">
                    {aiCheckData.errorType}
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{aiCheckData.explanation}</p>
              {aiCheckData.corrected && (
                <div className="pt-1">
                  <span className="font-semibold">Правильно: </span>
                  <span className="font-mono font-bold">{aiCheckData.corrected}</span>
                </div>
              )}
              {aiCheckData.formula && aiCheckData.formula.length > 0 && (
                <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900 overflow-x-auto">
                  <Formula slots={aiCheckData.formula} showPositions showHiddenCode size="sm" />
                </div>
              )}
            </div>
          )}

          {aiExplainData && (
            <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2 animate-fadeIn">
              <div className="font-bold">✨ Почему так устроен эталон (ИИ-тьютор):</div>
              <p className="leading-relaxed">{aiExplainData.explanation}</p>
              {aiExplainData.literal && (
                <div className="italic text-indigo-800 dark:text-indigo-300">
                  Дословно: «{aiExplainData.literal}»
                </div>
              )}
              {aiExplainData.formula && aiExplainData.formula.length > 0 && (
                <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900 overflow-x-auto">
                  <Formula slots={aiExplainData.formula} showPositions showHiddenCode size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

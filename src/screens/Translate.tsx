import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataset } from '../data';
import type { Exercise } from '../types';
import { ExerciseCard } from '../components/ExerciseCard';
import {
  getAttempts,
  recordAttempt,
  getExerciseStatus,
  isMistake,
} from '../lib/progress';

export const Translate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hwFilter = searchParams.get('hw');
  const topicFilter = searchParams.get('topic');
  const isMistakesMode = searchParams.get('mode') === 'mistakes';

  // Очередь заданий на текущую сессию
  const [sessionQueue, setSessionQueue] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalInitial, setTotalInitial] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Фильтрация и формирование пула заданий
  const matchedExercises = useMemo(() => {
    const attempts = getAttempts();

    return dataset.exercises.filter((ex) => {
      if (isMistakesMode) {
        return isMistake(ex, attempts);
      }
      if (hwFilter && hwFilter !== 'all' && ex.hw !== hwFilter) {
        return false;
      }
      if (topicFilter && topicFilter !== 'all' && !ex.topics.includes(topicFilter as any)) {
        return false;
      }
      return true;
    });
  }, [hwFilter, topicFilter, isMistakesMode]);

  // Старт новой сессии из 10 заданий: сначала learning, потом new, в конце known
  const startSession = useCallback(() => {
    const attempts = getAttempts();

    const learning: Exercise[] = [];
    const newEx: Exercise[] = [];
    const known: Exercise[] = [];

    for (const ex of matchedExercises) {
      const status = getExerciseStatus(ex.id, attempts);
      if (status === 'learning') learning.push(ex);
      else if (status === 'new') newEx.push(ex);
      else known.push(ex);
    }

    // Собираем до 10 заданий в порядке приоритета
    const prioritized = [...learning, ...newEx, ...known];
    const initialSession = prioritized.slice(0, 10);

    setSessionQueue(initialSession);
    setCurrentIndex(0);
    setTotalInitial(initialSession.length);
    setCorrectCount(0);
    setIsFinished(false);
    setInitialized(true);
  }, [matchedExercises]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const currentExercise = sessionQueue[currentIndex];

  const handleResult = (verdict: 'exact' | 'near' | 'wrong', answer: string) => {
    if (!currentExercise) return;

    // Запись попытки в прогресс
    recordAttempt({
      exerciseId: currentExercise.id,
      answer,
      verdict,
    });

    if (verdict === 'exact') {
      setCorrectCount((prev) => prev + 1);
    } else {
      // При wrong (или unaccepted near) задание возвращается в конец сессии
      setSessionQueue((prev) => [...prev, currentExercise]);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionQueue.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleAskAi = (question: string) => {
    // В будущей задаче T7 здесь будет открытие шторки ИИ-помощника
    alert(`Запрос к ИИ (задача T7):\n${question}`);
  };

  if (!initialized) {
    return (
      <div className="p-4 pt-safe flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-gray-500 animate-pulse">Загрузка сессии...</div>
      </div>
    );
  }

  // Пустой пул заданий
  if (matchedExercises.length === 0) {
    return (
      <div className="p-4 flex flex-col gap-4 pt-safe">
        <header className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
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
              {isMistakesMode ? 'Мои ошибки' : 'Тренировка'}
            </h1>
          </div>
        </header>

        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3 my-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
            ✓
          </div>
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">
            {isMistakesMode ? 'Ошибок не найдено!' : 'Нет заданий по фильтру'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            {isMistakesMode
              ? 'Все задания решены верно или ошибок ещё не совершено. Отличная работа!'
              : 'Попробуй выбрать другую тему или урок на главном экране.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl min-h-touch transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // Экран завершения сессии
  if (isFinished) {
    const accuracy = totalInitial > 0 ? Math.round((correctCount / totalInitial) * 100) : 0;
    return (
      <div className="p-4 flex flex-col gap-5 pt-safe">
        <header className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Назад"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Сессия завершена</h1>
        </header>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 text-center flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🎉</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Отличная тренировка!</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Все запланированные задания пройдены и сохранены в прогресс.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount} / {totalInitial}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">С первого раза</div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {accuracy}%
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Точность</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs mt-3">
            <button
              onClick={startSession}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl min-h-touch shadow-sm transition-all"
            >
              Начать ещё 10 заданий
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl min-h-touch hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Расчёт прогресса сессии
  const progressPercent =
    totalInitial > 0 ? Math.min(100, Math.round(((currentIndex) / totalInitial) * 100)) : 0;

  return (
    <div className="p-4 flex flex-col gap-4 pt-safe">
      {/* Шапка тренировки */}
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
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {isMistakesMode ? 'Мои ошибки' : 'Перевод RU → EN'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hwFilter && `Урок ${hwFilter}`}
              {topicFilter && ` · Тема: ${topicFilter}`}
              {!hwFilter && !topicFilter && !isMistakesMode && 'Тренировка грамматики'}
            </p>
          </div>
        </div>

        {/* Счётчик */}
        <div className="text-right">
          <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">
            {currentIndex + 1} / {totalInitial}
          </span>
          {sessionQueue.length > totalInitial && (
            <span className="text-[10px] text-red-500 block">
              (+{sessionQueue.length - totalInitial} на повтор)
            </span>
          )}
        </div>
      </header>

      {/* Полоса прогресса сессии */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-600 dark:bg-red-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Карточка задания */}
      {currentExercise && (
        <ExerciseCard
          exercise={currentExercise}
          onResult={handleResult}
          onAskAi={handleAskAi}
        />
      )}
    </div>
  );
};

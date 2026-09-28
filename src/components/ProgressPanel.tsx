import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../types';
import { dataset } from '../data';
import { getProgressSummary, type ProgressSummary } from '../lib/progress';

export interface ProgressPanelProps {
  exercises?: Exercise[];
  className?: string;
}

const TOPIC_NAMES: Record<string, string> = {
  modals: 'Модальные (can/could/will/would...)',
  dela: 'Дела (do/does/did, скрытый код)',
  sostoyanie: 'Состояние (am/is/are/was/were + ing)',
  rezultat: 'Результат (have/has/had + V3)',
  imeyu_pravo: 'Имею право (have been + ing)',
  passive: 'Пассив (be + V3)',
  modal_passive: 'Модальный пассив',
  who_questions: 'Вопросы WHO (к Ведущему vs объекту)',
  negation: 'Отрицание (nobody/never)',
  have_possession: 'Владение (have/has)',
  conditionals: 'Условные (If / When)',
  there_is: 'There is / There are',
  complex_object: 'Complex object',
  must_have_to: 'Must / Have to',
  been_to_in: 'Been to / Been in',
  past_perfect: 'Past Perfect',
  future_perfect: 'Future Perfect',
  whose: 'Whose',
  mixed: 'Смешанные задания',
};

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  exercises = dataset.exercises,
  className = '',
}) => {
  const [summary, setSummary] = useState<ProgressSummary>(() => getProgressSummary(exercises));

  useEffect(() => {
    setSummary(getProgressSummary(exercises));
  }, [exercises]);

  const totalExercises = exercises.length;
  const overallPercent =
    totalExercises > 0 ? Math.round((summary.solvedCount / totalExercises) * 100) : 0;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Верхний блок показателей: Серия, Решено, Ошибки */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {/* Серия дней */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col justify-center items-center">
          <div className="text-xl">🔥</div>
          <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
            {summary.streakDays}
          </div>
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {summary.streakDays === 1 ? 'день серии' : 'дней серии'}
          </div>
        </div>

        {/* Решено всего */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/60 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col justify-center items-center">
          <div className="text-xl">✓</div>
          <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
            {summary.solvedCount}
          </div>
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            из {totalExercises} ({overallPercent}%)
          </div>
        </div>

        {/* Мои ошибки (ссылка в режим ошибок) */}
        <Link
          to="/translate?mode=mistakes"
          className="p-3 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100/60 dark:from-red-950/40 dark:to-rose-950/20 border border-red-200 dark:border-red-900/40 flex flex-col justify-center items-center hover:shadow-md transition-all active:scale-[0.98] min-h-touch"
        >
          <div className="text-xl">⚠️</div>
          <div className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">
            {summary.mistakesCount}
          </div>
          <div className="text-[11px] font-medium text-red-700 dark:text-red-300">
            Мои ошибки →
          </div>
        </Link>
      </div>

      {/* Прогресс по темам */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Прогресс по темам методики
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Решено: {summary.solvedCount} / {totalExercises}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {summary.topicStats.map((item) => {
            const label = TOPIC_NAMES[item.topic] || item.topic;
            return (
              <div key={item.topic} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[280px]">
                    {label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                    {item.solved}/{item.total} ({item.percent}%)
                  </span>
                </div>
                {/* Горизонтальная полоса прогресса */}
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-red-600 dark:bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

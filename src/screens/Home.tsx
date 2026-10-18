import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dataset } from '../data';
import type { Topic } from '../types';

const TOPIC_LABELS: Record<string, string> = {
  all: 'Все темы',
  modals: 'Модальные (can/could/will/would/should/must)',
  dela: 'Дела (do/does/did, скрытый код)',
  sostoyanie: 'Состояние (am/is/are/was/were + ing)',
  rezultat: 'Результат (have/has/had + V3)',
  imeyu_pravo: 'Имею право (have been + ing)',
  passive: 'Пассив (be + V3)',
  who_questions: 'Вопросы Who (к Ведущему vs к объекту)',
  negation: 'Отрицание (nobody/never/anybody)',
  have_possession: 'Have/has (владение)',
  conditionals: 'Условия (if/when)',
  there_is: 'There is/are',
  complex_object: 'Complex object',
  must_have_to: 'Must / Have to',
  been_to_in: 'Been to / in',
  past_perfect: 'Past Perfect',
  future_perfect: 'Future Perfect',
  whose: 'Whose',
  mixed: 'Смешанные темы',
};

export const Home: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<string>('all');

  const filteredExercises = useMemo(() => {
    return dataset.exercises.filter((ex) => {
      const matchTopic = selectedTopic === 'all' || ex.topics.includes(selectedTopic as Topic);
      const matchLesson = selectedLesson === 'all' || ex.hw === selectedLesson;
      return matchTopic && matchLesson;
    });
  }, [selectedTopic, selectedLesson]);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTopic !== 'all') params.set('topic', selectedTopic);
    if (selectedLesson !== 'all') params.set('hw', selectedLesson);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [selectedTopic, selectedLesson]);

  return (
    <div className="p-4 flex flex-col gap-5 pt-safe max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
            0
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              English Algorithm
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Тренажёр грамматики · Жандос Адетбеков
            </p>
          </div>
        </div>
      </header>

      {/* Mode tiles grid */}
      <section aria-label="Режимы тренировки">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
          Режимы тренировки
        </h2>
        <div className="cq-modes-grid gap-3">
          <Link
            to={`/translate${filterQuery}`}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-900/50 hover:shadow-md transition-all active:scale-[0.98] min-h-touch"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              RU
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Перевод RU→EN
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Основной режим ({filteredExercises.length})
              </span>
            </div>
          </Link>

          <Link
            to={`/formula${filterQuery}`}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900/50 hover:shadow-md transition-all active:scale-[0.98] min-h-touch"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-sm">
              1-0-2
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Конструктор формулы
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Сборка по слотам</span>
            </div>
          </Link>

          <Link
            to="/grid"
            className="flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/50 hover:shadow-md transition-all active:scale-[0.98] min-h-touch"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              ✕
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Главный × Смысл
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Сетка Lesson 2</span>
            </div>
          </Link>

          <Link
            to="/translate?mode=mistakes"
            className="flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-200 dark:border-purple-900/50 hover:shadow-md transition-all active:scale-[0.98] min-h-touch"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
              !
            </div>
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                Мои ошибки
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Разбор ответов</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Filter Section */}
      <section
        aria-label="Фильтры"
        className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Фильтр: Тема / Урок
          </h2>
          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
            {filteredExercises.length} заданий
          </span>
        </div>

        <div className="cq-grid-2 gap-3">
          {/* Topic select */}
          <div className="min-w-0">
            <label htmlFor="topic-filter" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Тема
            </label>
            <select
              id="topic-filter"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full min-w-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs min-h-touch text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">Все темы</option>
              {Object.entries(TOPIC_LABELS)
                .filter(([k]) => k !== 'all')
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </div>

          {/* Lesson select */}
          <div className="min-w-0">
            <label htmlFor="lesson-filter" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Урок (HW)
            </label>
            <select
              id="lesson-filter"
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full min-w-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs min-h-touch text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">Все уроки</option>
              {dataset.lessons.map((lesson) => (
                <option key={lesson.hw} value={lesson.hw}>
                  {lesson.hw}: {lesson.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedTopic !== 'all' || selectedLesson !== 'all') && (
          <div className="flex gap-2 pt-1">
            <Link
              to={`/translate${filterQuery}`}
              className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl text-center min-h-touch flex items-center justify-center shadow-xs transition-all"
            >
              Тренировать перевод ({filteredExercises.length}) →
            </Link>
            <Link
              to={`/formula${filterQuery}`}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center min-h-touch flex items-center justify-center shadow-xs transition-all"
            >
              Формула →
            </Link>
          </div>
        )}
      </section>

      {/* Dataset quick info */}
      <section className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Загружен датасет: {dataset.exercises.length} заданий, {dataset.lessons.length} уроков
        (версия {dataset.version})
      </section>
    </div>
  );
};

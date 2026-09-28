import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Translate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMistakesMode = searchParams.get('mode') === 'mistakes';

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
            {isMistakesMode ? 'Мои ошибки' : 'Перевод RU → EN'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isMistakesMode ? 'Работа над ошибками ученика' : 'Основной режим тренировки'}
          </p>
        </div>
      </header>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3 my-auto">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold">
          {isMistakesMode ? '!' : 'RU'}
        </div>
        <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">
          {isMistakesMode ? 'Экран «Мои ошибки»' : 'Экран «Перевод RU→EN»'}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          Заглушка каркаса PWA (задача T3). Полная логика ввода, проверки и разбора ответов
          подключается в задаче T4.
        </p>
      </div>
    </div>
  );
};

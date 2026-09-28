import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Formula: React.FC = () => {
  const navigate = useNavigate();

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
            Конструктор формулы
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Сборка предложения по позициям методики
          </p>
        </div>
      </header>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3 my-auto">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
          1-0-2
        </div>
        <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">
          Экран «Конструктор формулы»
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          Заглушка каркаса PWA (задача T3). Интерактивные цветные плашки слотов формулы подключаются в задаче T5.
        </p>
      </div>
    </div>
  );
};

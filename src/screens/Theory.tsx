import React from 'react';

export const Theory: React.FC = () => {
  return (
    <div className="p-4 flex flex-col gap-4 pt-safe">
      <header className="border-b border-gray-200 dark:border-gray-800 pb-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Теория</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Справочник методики English Algorithm
        </p>
      </header>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3 my-auto">
        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center text-xl font-bold">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">Экран «Теория»</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          Заглушка каркаса PWA (задача T3). Карточки правил, SVG-таймлайны и темы подключаются
          в задаче T2.
        </p>
      </div>
    </div>
  );
};

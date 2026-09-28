import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export const Layout: React.FC = () => {
  const location = useLocation();

  // Highlight 'Тренировка' when on root or sub-training routes (/translate, /formula, /grid)
  const isTrainingActive =
    location.pathname === '/' ||
    location.pathname === '/translate' ||
    location.pathname === '/formula' ||
    location.pathname === '/grid';

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-950 flex justify-center text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-[480px] min-h-screen bg-white dark:bg-gray-900 shadow-lg flex flex-col relative border-x border-gray-200 dark:border-gray-800">
        {/* Main scrollable view */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom Tab Bar */}
        <nav
          aria-label="Основная навигация"
          className="fixed bottom-0 w-full max-w-[480px] bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 z-50 pb-safe"
        >
          <div className="grid grid-cols-4 h-16">
            <NavLink
              to="/"
              end
              className={() =>
                `flex flex-col items-center justify-center min-h-touch py-1 transition-colors ${
                  isTrainingActive
                    ? 'text-red-600 dark:text-red-500 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-xs">Тренировка</span>
            </NavLink>

            <NavLink
              to="/theory"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-touch py-1 transition-colors ${
                  isActive
                    ? 'text-red-600 dark:text-red-500 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xs">Теория</span>
            </NavLink>

            <NavLink
              to="/ai"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-touch py-1 transition-colors ${
                  isActive
                    ? 'text-red-600 dark:text-red-500 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs">ИИ</span>
            </NavLink>

            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-touch py-1 transition-colors ${
                  isActive
                    ? 'text-red-600 dark:text-red-500 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-xs">Я</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
};

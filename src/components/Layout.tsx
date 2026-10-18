import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';

type ViewOverride = 'auto' | 'desktop' | 'mobile';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  const [DetectedDeviceLabel, setDetectedDeviceLabel] = useState<'ПК' | 'Смартфон'>('ПК');
  const [viewOverride, setViewOverride] = useState<ViewOverride>('auto');

  useEffect(() => {
    const checkViewport = () => {
      const wide = window.innerWidth >= 768;
      setIsDesktopViewport(wide);

      const ua = navigator.userAgent || '';
      const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      setDetectedDeviceLabel(!isMobileUa && wide ? 'ПК' : 'Смартфон');
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const isDesktopMode =
    viewOverride === 'desktop' ? true : viewOverride === 'mobile' ? false : isDesktopViewport;

  // Highlight 'Тренировка' when on root or sub-training routes (/translate, /formula, /grid)
  const isTrainingActive =
    location.pathname === '/' ||
    location.pathname === '/translate' ||
    location.pathname === '/formula' ||
    location.pathname === '/grid';

  // Если включён режим смартфона (автоматически на телефоне или выбран превью-режим на ПК)
  if (!isDesktopMode) {
    return (
      <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-950 flex flex-col items-center text-gray-900 dark:text-gray-100">
        {/* На реальном широком экране показываем тонкую панель возврата в режим ПК */}
        {isDesktopViewport && (
          <div className="w-full max-w-[480px] flex items-center justify-between px-3 py-1.5 text-[11px] bg-gray-200/80 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-x border-gray-300 dark:border-gray-800">
            <span>📱 Предпросмотр смартфона (480px)</span>
            <button
              type="button"
              onClick={() => setViewOverride('auto')}
              className="font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Вернуть режим ПК →
            </button>
          </div>
        )}

        <div className="w-full max-w-[480px] min-h-screen bg-white dark:bg-gray-900 shadow-lg flex flex-col relative border-x border-gray-200 dark:border-gray-800">
          {/* Main scrollable view */}
          <main className="app-content-container flex-1 pb-20 overflow-y-auto">
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
  }

  // Десктопная версия (ПК / широкий экран >= 768px)
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex">
      {/* Боковая панель навигации (Sidebar) */}
      <aside className="w-64 lg:w-72 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Логотип и статус устройства */}
          <div className="space-y-2.5 pb-4 border-b border-gray-200 dark:border-gray-800">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
                0
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                  English Algorithm
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Методика Жандоса Адетбекова
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                <span>💻</span>
                <span>Открыто на {DetectedDeviceLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => setViewOverride('mobile')}
                className="text-[11px] text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Переключить в компактный мобильный вид (480px)"
              >
                📱 Вид телефона
              </button>
            </div>
          </div>

          {/* Основные разделы */}
          <nav aria-label="Навигация ПК" className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Разделы
            </div>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Главная и фильтр</span>
            </NavLink>

            <NavLink
              to="/theory"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span>Теория и схемы</span>
            </NavLink>

            <NavLink
              to="/ai"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>ИИ-Лаборатория</span>
            </NavLink>

            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Я и Настройки</span>
            </NavLink>
          </nav>

          {/* Быстрый переход по тренажёрам */}
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Тренажёры
            </div>

            <NavLink
              to="/translate"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <span className="w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                RU
              </span>
              <span>Перевод RU → EN</span>
            </NavLink>

            <NavLink
              to="/formula"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                1-0
              </span>
              <span>Конструктор формулы</span>
            </NavLink>

            <NavLink
              to="/grid"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                }`
              }
            >
              <span className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                ✕
              </span>
              <span>Главный × Смысл</span>
            </NavLink>
          </div>
        </div>

        {/* Шпаргалка по цветам формулы в подвале сайдбара */}
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2 mt-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Формула предложения
          </div>
          <div className="flex flex-wrap gap-1 text-[10px] font-bold">
            <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#15803d' }}>
              -1 Вопрос
            </span>
            <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#dc2626' }}>
              0 Код
            </span>
            <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#2563eb' }}>
              1 Ведущий
            </span>
            <span className="px-1.5 py-0.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
              2 Действие
            </span>
            <span className="px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#f97316' }}>
              3 Объект
            </span>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            Утверждение: <strong className="text-gray-800 dark:text-gray-200">1 → 0 → 2 → 3</strong>
            <br />
            Вопрос: <strong className="text-gray-800 dark:text-gray-200">-1 → 0 → 1 → 2 → 3</strong>
          </div>
        </div>
      </aside>

      {/* Основная рабочая область для ПК */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-8">
        <div className="app-content-container max-w-5xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xs border border-gray-200 dark:border-gray-800 min-h-[calc(100vh-4rem)] p-2 lg:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Topic, Exercise, WritingTask } from '../types';
import {
  aiGenerate,
  aiEssay,
  getStoredAiExercises,
  deleteStoredAiExercise,
  clearStoredAiExercises,
} from '../lib/ai';
import { getSettings, type AppSettings } from '../lib/settings';
import { recordAttempt } from '../lib/progress';
import { AiSettings } from '../components/AiSettings';
import { ExerciseCard } from '../components/ExerciseCard';
import rawWritingData from '../data/writing.json';

const writingTasks: WritingTask[] = rawWritingData as WritingTask[];

const TOPIC_LABELS: Record<Topic, string> = {
  passive: 'Пассивный залог (be + V3)',
  who_questions: 'Вопросы WHO (к Ведущему / объекту)',
  dela: 'Дела (do / does / did, скрытый код)',
  sostoyanie: 'Состояние (am / is / are / was / were + ing)',
  rezultat: 'Результат (have / has / had + V3)',
  imeyu_pravo: 'Имею право (have / has been + ing, стаж)',
  modals: 'Модальные коды (can, could, will, would...)',
  modal_passive: 'Модальный пассив (can be invited...)',
  negation: 'Одно отрицание (nobody, never, anybody...)',
  have_possession: 'Обладание (have got / do you have)',
  conditionals: 'Условия (If / When + Present -> Will)',
  there_is: 'There is / There are',
  complex_object: 'Сложное дополнение (want him to...)',
  must_have_to: 'Must / Have to',
  been_to_in: 'Been to / Been in',
  past_perfect: 'Предпрошедшее (had done, очерёдность)',
  future_perfect: 'Будущее совершённое (will have done)',
  whose: 'Whose (Чей)',
  mixed: 'Смешанная практика (All in one)',
};

const TOPICS_LIST: Topic[] = Object.keys(TOPIC_LABELS) as Topic[];

export const AiLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'similar' | 'writing'>('similar');
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);

  // --- Вкладка 1: Похожие задания ---
  const [selectedTopic, setSelectedTopic] = useState<Topic>('passive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);
  const [aiExercises, setAiExercises] = useState<Exercise[]>(getStoredAiExercises);

  // --- Вкладка 2: Письмо (Writing) ---
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    writingTasks[0]?.id || ''
  );
  const currentTask = useMemo(
    () => writingTasks.find((t) => t.id === selectedTaskId) || writingTasks[0],
    [selectedTaskId]
  );
  const [essayText, setEssayText] = useState<string>('');
  const [isCheckingEssay, setIsCheckingEssay] = useState(false);
  const [essayResult, setEssayResult] = useState<any>(null);
  const [essayError, setEssayError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Загрузка черновика эссе из localStorage при смене задания
  useEffect(() => {
    if (!currentTask) return;
    const draftKey = `ea_draft_${currentTask.id}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setEssayText(saved);
    } else {
      setEssayText('');
    }
    setEssayResult(null);
    setEssayError(null);
    setSelectedQuote(null);
    setShowImproved(false);
  }, [currentTask?.id]);

  // Автосохранение черновика
  const handleEssayChange = (text: string) => {
    setEssayText(text);
    if (currentTask) {
      localStorage.setItem(`ea_draft_${currentTask.id}`, text);
    }
  };

  // Проверка доступности ИИ при монтировании
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const pingUrl =
          settings.aiMode === 'dev'
            ? '/api/ai/models'
            : settings.aiMode === 'proxy'
            ? `${(import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/+$/, '') || ''}/models`
            : 'https://openrouter.ai/api/v1/models';

        const headers: Record<string, string> = {};
        if (settings.aiMode === 'proxy' && settings.accessCode) {
          headers['X-Access-Code'] = settings.accessCode;
        } else if (settings.aiMode === 'byok' && settings.openrouterKey) {
          headers['Authorization'] = `Bearer ${settings.openrouterKey}`;
        }

        const res = await fetch(pingUrl, {
          method: 'GET',
          headers: Object.keys(headers).length ? headers : undefined,
        });
        setIsAiAvailable(res.ok);
      } catch {
        setIsAiAvailable(false);
      }
    };
    checkAvailability();
  }, [settings.aiMode, settings.accessCode, settings.openrouterKey]);

  // Генерация 5 заданий
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationMsg(null);
    try {
      const res = await aiGenerate(selectedTopic, 5);
      setAiExercises(getStoredAiExercises());
      setGenerationMsg(
        `Сгенерировано: ${res.rawCount}, успешно прошли валидацию: ${res.valid.length}, отброшено: ${res.dropped}`
      );
    } catch (err: any) {
      setGenerationMsg(`Ошибка генерации: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Удаление сгенерированного задания
  const handleDeleteExercise = (id: string) => {
    deleteStoredAiExercise(id);
    setAiExercises(getStoredAiExercises());
  };

  // Очистка всех заданий
  const handleClearAllExercises = () => {
    if (window.confirm('Удалить все сгенерированные задания?')) {
      clearStoredAiExercises();
      setAiExercises([]);
    }
  };

  // Загрузка прошлого черновика ученика (из writing.json)
  const handleLoadPastDraft = () => {
    if (currentTask?.myPastDraft) {
      handleEssayChange(currentTask.myPastDraft);
    }
  };

  // Проверка эссе
  const handleCheckEssay = async () => {
    if (!currentTask || !essayText.trim()) return;
    setIsCheckingEssay(true);
    setEssayError(null);
    setEssayResult(null);
    setSelectedQuote(null);
    try {
      const res = await aiEssay(currentTask, essayText);
      setEssayResult(res);
    } catch (err: any) {
      setEssayError(err.message || 'Ошибка проверки эссе');
    } finally {
      setIsCheckingEssay(false);
    }
  };

  // Подсчёт слов в реальном времени
  const liveWordCount = useMemo(() => {
    return essayText.trim().split(/\s+/).filter(Boolean).length;
  }, [essayText]);

  // Подсветка цитаты в эссе
  const renderHighlightedEssay = () => {
    if (!selectedQuote || !essayText.includes(selectedQuote)) {
      return <div className="whitespace-pre-wrap">{essayText}</div>;
    }
    const parts = essayText.split(selectedQuote);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark className="bg-amber-300 dark:bg-amber-600/80 text-black dark:text-white px-1 py-0.5 rounded font-semibold transition-all">
                {selectedQuote}
              </mark>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col gap-4 pb-20 max-w-4xl mx-auto w-full">
      {/* Шапка экрана с текущим статусом ИИ */}
      <header className="flex flex-col gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>ИИ-Лаборатория</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 whitespace-nowrap">
                OpenRouter
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Генерация заданий, проверка по формуле и разбор письменных работ
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{showSettings ? 'Скрыть настройки' : 'Настройки модели'}</span>
          </button>
        </div>

        {/* Индикатор модели и статуса */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-500">Режим:</span>
            <span className="uppercase font-mono text-[11px] text-red-600 dark:text-red-400">
              {settings.aiMode}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 truncate max-w-xs"
            title={settings.primaryModel}
          >
            <span className="font-semibold text-gray-500">Модель:</span>
            <span className="font-mono text-[11px] truncate">{settings.primaryModel}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <span
              className={`w-2 h-2 rounded-full ${
                isAiAvailable === true
                  ? 'bg-green-500 animate-pulse'
                  : isAiAvailable === false
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {isAiAvailable === true
                ? 'ИИ доступен'
                : isAiAvailable === false
                ? 'ИИ недоступен'
                : 'Проверка связи...'}
            </span>
          </div>
        </div>

        {/* Выдвижная панель настроек моделей */}
        {showSettings && (
          <div className="mt-2 animate-fadeIn">
            <AiSettings
              onSettingsChanged={(newSettings) => setSettings(newSettings)}
            />
          </div>
        )}

        {/* Инструкция по подключению ИИ (Dev / Прокси T9 / Свой ключ) */}
        <details className="mt-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
          <summary className="px-3 py-2 cursor-pointer font-medium text-gray-700 dark:text-gray-200 flex items-center justify-between select-none hover:text-gray-900 dark:hover:text-white">
            <span>Как подключить ИИ? (Прокси T9 / Свой ключ / Dev)</span>
            <span className="text-[11px] text-gray-400">инструкция</span>
          </summary>
          <div className="px-3 pb-3 pt-1.5 space-y-2.5 text-gray-600 dark:text-gray-300 border-t border-gray-200/70 dark:border-gray-700/70">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                1. Прокси T9 <span className="font-normal text-gray-500">(для учеников курса)</span>
              </p>
              <p className="mt-0.5 leading-relaxed">
                Самый простой вариант, если преподаватель выдал вам код. Откройте «Настройки модели» → выберите{' '}
                <strong>Прокси T9</strong> → введите свой <strong>код доступа</strong>. Личный API-ключ не нужен,
                запросы идут через защищённый сервер.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                2. Свой ключ <span className="font-normal text-gray-500">(для самостоятельной работы)</span>
              </p>
              <p className="mt-0.5 leading-relaxed">
                Создайте бесплатный ключ на{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 underline hover:no-underline"
                >
                  openrouter.ai/keys
                </a>{' '}
                (начинается с <code className="text-[11px]">sk-or-v1-...</code>). Откройте «Настройки модели» → выберите{' '}
                <strong>Свой ключ</strong> → вставьте его. Ключ хранится только локально в вашем браузере.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                3. Dev (Vite) <span className="font-normal text-gray-500">(только для разработки)</span>
              </p>
              <p className="mt-0.5 leading-relaxed">
                Используется программистом при локальном запуске проекта на компьютере (
                <code className="text-[11px]">npm run dev</code>). На опубликованном сайте этот режим не работает.
              </p>
            </div>

            {!showSettings && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Открыть настройки модели
              </button>
            )}
          </div>
        </details>
      </header>

      {/* Переключатель вкладок */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('similar')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'similar'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Похожие задания
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('writing')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'writing'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Письмо (Writing)
        </button>
      </div>

      {/* ================= ВКЛАДКА 1: ПОХОЖИЕ ЗАДАНИЯ ================= */}
      {activeTab === 'similar' && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
              Выберите тему для генерации 5 похожих заданий:
            </label>
            <div className="cq-row gap-2.5">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value as Topic)}
                className="flex-1 min-w-0 max-w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {TOPICS_LIST.map((topic) => (
                  <option key={topic} value={topic}>
                    {TOPIC_LABELS[topic]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Генерация...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>Сгенерировать 5</span>
                  </>
                )}
              </button>
            </div>

            {generationMsg && (
              <div className="text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                {generationMsg}
              </div>
            )}
          </div>

          {/* Список сохранённых / сгенерированных заданий */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Сгенерированные задания ({aiExercises.length})</span>
            </h2>
            {aiExercises.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllExercises}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Очистить все
              </button>
            )}
          </div>

          {aiExercises.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400">
              Пока нет сгенерированных заданий. Выберите тему выше и нажмите «Сгенерировать 5».
            </div>
          ) : (
            <div className="space-y-4">
              {aiExercises.map((ex) => (
                <div key={ex.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(ex.id)}
                    className="absolute top-3 right-3 z-10 text-gray-400 hover:text-red-500 p-1.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 transition-colors"
                    title="Удалить сгенерированное задание"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <ExerciseCard
                    exercise={ex}
                    hideNextButton
                    onResult={(verdict, answer) =>
                      recordAttempt({ exerciseId: ex.id, answer, verdict })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= ВКЛАДКА 2: ПИСЬМО (WRITING) ================= */}
      {activeTab === 'writing' && currentTask && (
        <section className="space-y-4">
          {/* Выбор задания */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Письменная работа:
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {writingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.hw}: {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Карточка темы */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs space-y-2">
              <div className="font-semibold text-gray-900 dark:text-white">
                {currentTask.prompt}
              </div>

              {/* Чеклист требований */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-gray-500">Требования:</span>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
                  {currentTask.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Шаблон структуры */}
              {currentTask.template && (
                <div className="space-y-1 pt-1 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-500">
                    Рекомендуемая структура:
                  </span>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    {currentTask.template.map((line, i) => (
                      <p key={i} className="text-[11px]">
                        • {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопка загрузки прошлого черновика */}
              {currentTask.myPastDraft && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadPastDraft}
                    className="px-3 py-1.5 text-xs rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span>Загрузить мой старый черновик из презентации</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Область ввода эссе */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gray-700 dark:text-gray-300">
                Текст вашего эссе:
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono px-2 py-0.5 rounded-md ${
                    liveWordCount >= 120 && liveWordCount <= 160
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Слов: {liveWordCount}
                </span>
                <span className="text-gray-400 text-[11px]">(цель: 120–150)</span>
              </div>
            </div>

            {/* Если выбрана цитата ошибки, показываем подсвеченное превью */}
            {selectedQuote && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-semibold mb-2">
                  <span>Подсветка ошибки в тексте:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    className="text-amber-600 hover:text-amber-900 text-[11px]"
                  >
                    Закрыть подсветку ✕
                  </button>
                </div>
                {renderHighlightedEssay()}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={8}
              value={essayText}
              onChange={(e) => handleEssayChange(e.target.value)}
              placeholder="Write your essay here in English..."
              className="w-full p-3 text-xs leading-relaxed rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-sans"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCheckEssay}
                disabled={isCheckingEssay || !essayText.trim()}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isCheckingEssay ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Анализирую эссе...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Проверить эссе (ИИ)</span>
                  </>
                )}
              </button>
            </div>

            {essayError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {essayError}
              </div>
            )}
          </div>

          {/* Результаты проверки эссе */}
          {essayResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Сводка и чек-лист требований */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Чек-лист требований</span>
                  <span className="text-xs font-normal text-gray-500">
                    Слов по анализу: {essayResult.wordCount}
                  </span>
                </h3>

                <div className="space-y-2">
                  {essayResult.meetsRequirements.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border flex items-start gap-2.5 text-xs bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700"
                    >
                      <span
                        className={`text-base leading-none ${
                          r.ok ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {r.ok ? '✓' : '✗'}
                      </span>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {r.req}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">{r.comment}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {essayResult.tenseConsistency && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                    <span className="font-semibold">Согласованность времён: </span>
                    {essayResult.tenseConsistency}
                  </div>
                )}

                {essayResult.summary && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-semibold">Итог тьютора: </span>
                    {essayResult.summary}
                  </div>
                )}
              </div>

              {/* Список ошибок (цитата -> исправление -> правило) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Найденные ошибки ({essayResult.errors?.length || 0})</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Нажмите на цитату для подсветки в тексте
                  </span>
                </h3>

                {essayResult.errors && essayResult.errors.length === 0 ? (
                  <div className="text-xs text-green-600 dark:text-green-400 py-3 text-center">
                    Ошибок не обнаружено! Отличная работа.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {essayResult.errors?.map((err: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedQuote(err.quote)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedQuote === err.quote
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-300'
                        } text-xs space-y-1`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="line-through text-red-600 dark:text-red-400 font-medium font-mono">
                            «{err.quote}»
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono">
                            {err.type || 'error'}
                          </span>
                        </div>

                        <div className="font-semibold text-green-700 dark:text-green-400 font-mono">
                          → {err.fix}
                        </div>

                        <div className="text-gray-600 dark:text-gray-400 text-[11px] pt-0.5">
                          {err.rule}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Улучшенная версия (аккордеон) */}
              {essayResult.improved && (
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowImproved(!showImproved)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <span>Улучшенная версия от тьютора</span>
                    <span className="text-gray-400">{showImproved ? '▲ Свернуть' : '▼ Показать'}</span>
                  </button>

                  {showImproved && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {essayResult.improved}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(essayResult.improved);
                            alert('Скопировано в буфер обмена');
                          }}
                          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-[11px] transition-colors"
                        >
                          Копировать текст
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

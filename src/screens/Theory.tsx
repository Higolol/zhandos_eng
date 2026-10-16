import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TheoryCard, Topic } from '../types';
import rawTheory from '../data/theory.json';
import { Formula } from '../components/Formula';
import { Timeline, type TimelineKind } from '../components/Timeline';

const theoryCards: TheoryCard[] = rawTheory as TheoryCard[];

const TOPIC_LABELS: Record<string, string> = {
  all: 'Все разделы',
  dela: 'Дела (do/does/did)',
  sostoyanie: 'Состояние (be + ing)',
  rezultat: 'Результат (have + V3)',
  imeyu_pravo: 'Имею право (have been + ing)',
  modals: 'Модальные коды',
  passive: 'Пассив (be + V3)',
  modal_passive: 'Модальный пассив',
  who_questions: 'Вопросы Who / Whose',
  negation: 'Одно отрицание',
  have_possession: 'Обладание (have)',
  conditionals: 'Условия (If / When)',
  there_is: 'There is / are',
  complex_object: 'Сложное дополнение',
  must_have_to: 'Must / Have to',
  been_to_in: 'Been to / in',
  past_perfect: 'Предпрошедшее (had + V3)',
  future_perfect: 'Будущее совершённое',
  whose: 'Whose (Чей)',
};

const TAG_STYLES: Record<string, { color: string; bg: string; label?: string }> = {
  '-1': { color: '#15803d', bg: 'rgba(21, 128, 61, 0.12)', label: '-1' },
  '0': { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', label: '0' },
  '1': { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', label: '1' },
  '2': { color: 'var(--slot-verb, #111827)', bg: 'rgba(107, 114, 128, 0.14)', label: '2' },
  '3': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', label: '3' },
  ctx: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
  been: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  v3: { color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  ing: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.10)' },
};

/**
 * Рендерит строку теории с инлайн-разметкой [[pos:text]]
 */
function renderMarkedLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[([^:\]]+):([^\]]+)\]\]/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(line.slice(lastIdx, match.index));
    }
    const tag = match[1].trim();
    const text = match[2];
    const style = TAG_STYLES[tag] || TAG_STYLES['ctx'];

    parts.push(
      <span
        key={`tag-${k++}`}
        className="inline-flex items-baseline gap-1 px-1.5 py-0.5 mx-0.5 rounded-md font-bold font-mono text-[0.92em]"
        style={{ color: style.color, backgroundColor: style.bg }}
      >
        <span>{text}</span>
        {style.label && (
          <sub className="text-[9px] opacity-75 font-sans font-black">{style.label}</sub>
        )}
      </span>
    );
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < line.length) {
    parts.push(line.slice(lastIdx));
  }

  return parts;
}

function getCardTimeline(card: TheoryCard): TimelineKind | null {
  if (card.id.includes('past') && card.topics.includes('dela')) return 'dela_past';
  if (card.id.includes('past') && card.topics.includes('sostoyanie')) return 'sostoyanie_past';
  if (card.topics.includes('imeyu_pravo')) return 'imeyu_pravo';
  if (card.topics.includes('rezultat')) return 'rezultat';
  if (card.topics.includes('sostoyanie')) return 'sostoyanie';
  if (card.topics.includes('dela')) return 'dela';
  return null;
}

export const Theory: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(theoryCards[0]?.id || null);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    for (const c of theoryCards) {
      for (const t of c.topics) set.add(t);
    }
    return ['all', ...Array.from(set)];
  }, []);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return theoryCards.filter((card) => {
      const matchTopic =
        selectedTopic === 'all' || card.topics.includes(selectedTopic as Topic);
      if (!matchTopic) return false;
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.body.some((b) => b.toLowerCase().includes(q)) ||
        card.examples.some(
          (ex) => ex.en.toLowerCase().includes(q) || ex.ru.toLowerCase().includes(q)
        )
      );
    });
  }, [selectedTopic, searchQuery]);

  return (
    <div className="p-4 flex flex-col gap-4 pt-safe pb-24 max-w-3xl mx-auto w-full">
      <header className="border-b border-gray-200 dark:border-gray-800 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Теория и Схемы
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Справочник методики «English Algorithm» ({theoryCards.length} карточек)
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold">
            [-1] [0] [1] [2] [3]
          </span>
        </div>

        {/* Поиск и фильтр по теме */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по правилу, коду или примеру..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {availableTopics.map((t) => (
              <option key={t} value={t}>
                {TOPIC_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Легенда цветов методики */}
      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Цвета формулы:</span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#15803d' }}>
          -1 Вопрос
        </span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#dc2626' }}>
          0 Код
        </span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#2563eb' }}>
          1 Ведущий
        </span>
        <span className="px-2 py-0.5 rounded font-bold bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
          2 Действие
        </span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#f97316' }}>
          3 Объект
        </span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#7c3aed' }}>
          be / been / being
        </span>
        <span className="px-2 py-0.5 rounded font-bold text-white" style={{ backgroundColor: '#0891b2' }}>
          V3 (сделанный)
        </span>
      </div>

      {/* Список карточек теории */}
      <div className="space-y-3">
        {filteredCards.map((card) => {
          const isOpen = expandedId === card.id;
          const timelineKind = getCardTimeline(card);
          const primaryTopic = card.topics[0] || 'dela';

          return (
            <article
              key={card.id}
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : card.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {card.topics.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      >
                        {TOPIC_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {card.title}
                  </h2>
                </div>
                <span className="text-gray-400 text-xs mt-1">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  {/* Таймлайн аспекта */}
                  {timelineKind && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
                      <Timeline kind={timelineKind} />
                    </div>
                  )}

                  {/* Правила с инлайн-разметкой */}
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {card.body.map((paragraph, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">•</span>
                        <div className="flex-1">{renderMarkedLine(paragraph)}</div>
                      </li>
                    ))}
                  </ul>

                  {/* Примеры с компонентом Formula */}
                  {card.examples && card.examples.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Примеры по формуле:
                      </h3>
                      {card.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-2"
                        >
                          <div className="overflow-x-auto pb-1">
                            {ex.formula && ex.formula.length > 0 ? (
                              <Formula
                                slots={ex.formula}
                                showPositions
                                showHiddenCode
                                size="sm"
                              />
                            ) : (
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{ex.en}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                            <span className="font-medium">{ex.ru}</span>
                            {ex.literal && (
                              <span className="italic text-gray-500 dark:text-gray-400">
                                Дословно: «{ex.literal}»
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Кнопка перехода к тренировке темы */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/translate?topic=${primaryTopic}`)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all min-h-[38px]"
                    >
                      Тренировать эту тему →
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

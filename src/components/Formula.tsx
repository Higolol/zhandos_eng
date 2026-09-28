import React from 'react';
import { Slot, SlotKind, COLORS } from '../types';
import { baseForm } from '../lib/verbs';

export interface FormulaProps {
  /** Массив слотов предложения в порядке следования */
  slots: Slot[];
  /** Отображать ли под словами разметку позиций (-1, 0, 1, 2, 3) и подписи */
  showPositions?: boolean;
  /** Раскладывать ли скрытый код (helped -> [did] help, plays -> [does] play) */
  showHiddenCode?: boolean;
  /** Размер отображения: sm, md (по умолчанию), lg */
  size?: 'sm' | 'md' | 'lg';
  /** Дополнительные CSS-классы контейнера */
  className?: string;
  /** Интерактивный режим (кликабельные плашки) */
  interactive?: boolean;
  /** Коллбэк клика по слоту */
  onSlotClick?: (slot: Slot, index: number) => void;
}

const POSITION_TITLES: Record<string, string> = {
  '-1': 'Вопрос',
  '0': 'Код',
  '1': 'Ведущий',
  '2': 'Действие',
  '3': 'Объект',
  'ctx': 'Обстоятельство'
};

const POSITION_COLORS: Record<string, string> = {
  '-1': '#15803d',
  '0': '#dc2626',
  '1': '#2563eb',
  '2': 'var(--slot-verb, #111827)',
  '3': '#f97316',
  'ctx': '#6b7280'
};

/**
 * Получает цвет текста для слота.
 * Для verb и to используется CSS-переменная темы (--slot-verb),
 * для остальных — официальная палитра COLORS методики.
 */
function getSlotColor(kind: SlotKind): string {
  if (kind === 'verb' || kind === 'to') {
    return 'var(--slot-verb, #111827)';
  }
  return COLORS[kind] || 'var(--slot-verb, #111827)';
}

/**
 * Рендерит текстовое содержимое слота с учётом методики:
 * - kind: 'ing' -> основа цвета verb, суффикс 'ing' красным
 * - showHiddenCode + hiddenCode -> [код в пунктирной рамке] + базовая форма
 */
const SlotWord: React.FC<{
  slot: Slot;
  showHiddenCode?: boolean;
  size: 'sm' | 'md' | 'lg';
}> = ({ slot, showHiddenCode }) => {
  const { text, kind, hiddenCode } = slot;

  // 1. Раскрытие скрытого кода (helped -> [did] help, plays -> [does] play)
  if (showHiddenCode && hiddenCode) {
    const base = baseForm(text, hiddenCode);
    return (
      <span className="inline-flex items-center gap-1.5 font-bold tracking-tight">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded border border-dashed border-red-500 text-red-600 dark:text-red-400 font-mono text-[0.8em] font-black bg-red-50 dark:bg-red-950/40 select-none shadow-xs"
          title={`Скрытый код [${hiddenCode}] методики`}
        >
          [{hiddenCode}]
        </span>
        <span style={{ color: 'var(--slot-verb, #111827)' }}>
          {base}
        </span>
      </span>
    );
  }

  // 2. Аспект Состояние / V-ing: основа чёрная/светлая, суффикс 'ing' ярко-красный
  if (kind === 'ing') {
    const lower = text.toLowerCase();
    const ingIndex = lower.lastIndexOf('ing');

    if (ingIndex !== -1 && ingIndex === text.length - 3) {
      const stem = text.slice(0, ingIndex);
      const suffix = text.slice(ingIndex);
      return (
        <span className="font-bold tracking-tight">
          <span style={{ color: 'var(--slot-verb, #111827)' }}>{stem}</span>
          <span className="text-red-600 dark:text-red-500 font-extrabold">{suffix}</span>
        </span>
      );
    }
  }

  // 3. Стандартный цвет слота из палитры методики
  const textColor = getSlotColor(kind);
  return (
    <span
      className="font-bold tracking-tight transition-colors"
      style={{ color: textColor }}
    >
      {text}
    </span>
  );
};

/**
 * Компонент формулы предложения по методике English Algorithm (Жандос Адетбеков).
 * Поддерживает подсветку позиций (-1 0 1 2 3), раскрытие скрытого кода,
 * правильные методические цвета слотов и доступность.
 */
export const Formula: React.FC<FormulaProps> = ({
  slots,
  showPositions = false,
  showHiddenCode = false,
  size = 'md',
  className = '',
  interactive = false,
  onSlotClick
}) => {
  if (!slots || slots.length === 0) {
    return null;
  }

  // Полное предложение для скринридеров
  const fullSentence = slots.map((s) => s.text).join(' ');

  // Классы размеров
  const sizeClasses = {
    sm: {
      container: 'gap-x-2 gap-y-2',
      word: 'text-sm sm:text-base',
      number: 'text-[11px] leading-tight',
      label: 'text-[9px] leading-tight tracking-tighter'
    },
    md: {
      container: 'gap-x-3 gap-y-3',
      word: 'text-base sm:text-lg',
      number: 'text-xs leading-tight',
      label: 'text-[10px] leading-tight tracking-tight'
    },
    lg: {
      container: 'gap-x-4 gap-y-4',
      word: 'text-xl sm:text-2xl',
      number: 'text-sm leading-tight font-bold',
      label: 'text-xs leading-tight font-medium'
    }
  }[size];

  return (
    <div
      role="text"
      aria-label={fullSentence}
      className={`inline-flex flex-wrap items-end ${sizeClasses.container} select-text ${className}`}
    >
      {slots.map((slot, index) => {
        const posKey = String(slot.pos);
        const posColor = POSITION_COLORS[posKey] || '#6b7280';
        const posTitle = POSITION_TITLES[posKey] || '';
        const isCtx = slot.pos === 'ctx';

        return (
          <div
            key={`${slot.text}-${slot.pos}-${index}`}
            aria-hidden="true"
            onClick={() => onSlotClick?.(slot, index)}
            className={`flex flex-col items-center justify-end text-center ${
              interactive
                ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all'
                : ''
            }`}
          >
            {/* Верхний ряд: слово с раскраской методики */}
            <div className={`pb-1 ${sizeClasses.word}`}>
              <SlotWord slot={slot} showHiddenCode={showHiddenCode} size={size} />
            </div>

            {/* Нижний ряд: позиция и название по схеме 02 */}
            {showPositions && (
              <div className="w-full flex flex-col items-center">
                {/* Тонкая линия-разделитель */}
                <div
                  className="w-full min-w-[24px] h-[1.5px] rounded-full mb-1 transition-colors"
                  style={{ backgroundColor: posColor, opacity: 0.6 }}
                />

                {/* Номер позиции (-1, 0, 1, 2, 3). У ctx номера нет */}
                {!isCtx && (
                  <span
                    className={`font-black ${sizeClasses.number}`}
                    style={{ color: posColor }}
                  >
                    {slot.pos}
                  </span>
                )}

                {/* Подпись позиции (Вопрос / Код / Ведущий / Действие / Объект) */}
                {posTitle && (
                  <span
                    className={`font-semibold uppercase tracking-wider ${sizeClasses.label}`}
                    style={{ color: posColor }}
                  >
                    {isCtx ? 'обст.' : posTitle}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

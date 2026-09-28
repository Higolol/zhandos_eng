import React from 'react';

export type TimelineKind =
  | 'dela'
  | 'dela_past'
  | 'sostoyanie'
  | 'sostoyanie_past'
  | 'rezultat'
  | 'imeyu_pravo';

export interface TimelineProps {
  kind: TimelineKind;
  label?: string;
  className?: string;
}

/**
 * Векторный таймлайн аспектов времени по методике English Algorithm (Жандос Адетбеков).
 * Поддерживает 6 видов: dela, dela_past, sostoyanie, sostoyanie_past, rezultat, imeyu_pravo.
 * Адаптирован к светлой и тёмной теме через currentColor и CSS-классы Tailwind.
 */
export const Timeline: React.FC<TimelineProps> = ({ kind, label, className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {label && (
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide">
          {label}
        </div>
      )}
      <svg
        viewBox="0 0 360 90"
        className="w-full h-[90px] max-w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Таймлайн: ${kind}`}
      >
        <defs>
          {/* Стрелка для основной оси */}
          <marker
            id="timeline-axis-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-gray-400 dark:fill-gray-500" />
          </marker>

          {/* Стрелка для Результата (Past -> Now) */}
          <marker
            id="timeline-red-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
          </marker>
        </defs>

        {/* Основная горизонтальная ось времени */}
        <line
          x1="25"
          y1="52"
          x2="335"
          y2="52"
          strokeWidth="2"
          markerEnd="url(#timeline-axis-arrow)"
          className="stroke-gray-400 dark:stroke-gray-500"
        />

        {/* Засечка и подпись Now (x = 240) */}
        <line
          x1="240"
          y1="38"
          x2="240"
          y2="58"
          strokeWidth="2"
          className="stroke-gray-600 dark:stroke-gray-300"
        />
        <text
          x="240"
          y="74"
          textAnchor="middle"
          className="fill-gray-800 dark:fill-gray-200 text-[12px] font-semibold tracking-wide"
        >
          Now
        </text>

        {/* 1. Дела (настоящее регулярное): красные косые штрихи вокруг Now + 'every day' */}
        {kind === 'dela' && (
          <g>
            {/* 4 косых красных штриха //// через ось около Now */}
            <line x1="214" y1="62" x2="226" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="228" y1="62" x2="240" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="242" y1="62" x2="254" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="256" y1="62" x2="268" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <text
              x="241"
              y="26"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              every day
            </text>
          </g>
        )}

        {/* 2. Дела в прошлом: штрихи слева от Now + 'last week' */}
        {kind === 'dela_past' && (
          <g>
            {/* Засечка в прошлом */}
            <line x1="110" y1="44" x2="110" y2="56" strokeWidth="1.5" className="stroke-gray-400 dark:stroke-gray-500" />
            {/* 4 косых красных штриха слева от Now */}
            <line x1="90" y1="62" x2="102" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="104" y1="62" x2="116" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="118" y1="62" x2="130" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="132" y1="62" x2="144" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <text
              x="117"
              y="74"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              last week
            </text>
          </g>
        )}

        {/* 3. Состояние (в моменте сейчас): красная точка на Now + 'right now' */}
        {kind === 'sostoyanie' && (
          <g>
            <circle cx="240" cy="52" r="6" fill="#dc2626" className="drop-shadow-sm" />
            <text
              x="240"
              y="26"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              right now
            </text>
          </g>
        )}

        {/* 4. Состояние в прошлом: красная точка левее Now + 'at 10 am' */}
        {kind === 'sostoyanie_past' && (
          <g>
            {/* Точка левее Now */}
            <circle cx="115" cy="52" r="6" fill="#dc2626" className="drop-shadow-sm" />
            <line x1="115" y1="52" x2="115" y2="60" strokeWidth="1.5" className="stroke-gray-400 dark:stroke-gray-500" />
            <text
              x="115"
              y="74"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              at 10 am
            </text>
          </g>
        )}

        {/* 5. Результат: дуга со штриховкой из прошлого со стрелкой в Now (Past -> Now) */}
        {kind === 'rezultat' && (
          <g>
            {/* Метка Past */}
            <text
              x="75"
              y="74"
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400 text-[11px]"
            >
              Past
            </text>
            {/* Дуга из прошлого с приземлением стрелки на Now */}
            <path
              d="M 85 52 Q 160 12 238 48"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              markerEnd="url(#timeline-red-arrow)"
            />
            {/* Штрихи под дугой */}
            <line x1="115" y1="46" x2="125" y2="34" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="135" y1="40" x2="145" y2="27" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="155" y1="36" x2="165" y2="24" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="175" y1="36" x2="185" y2="25" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="195" y1="40" x2="205" y2="30" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.75" />
            <text
              x="160"
              y="18"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              Past → Now
            </text>
          </g>
        )}

        {/* 6. Имею право: отрезок из прошлого со стрелкой до Now + 'since 2022 / for 3 years' */}
        {kind === 'imeyu_pravo' && (
          <g>
            {/* Засечка старта в прошлом */}
            <line x1="75" y1="32" x2="75" y2="54" stroke="#dc2626" strokeWidth="2" />
            <text
              x="75"
              y="74"
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400 text-[11px]"
            >
              Past
            </text>
            {/* Отрезок со стрелкой до засечки Now */}
            <line
              x1="75"
              y1="40"
              x2="236"
              y2="40"
              stroke="#dc2626"
              strokeWidth="2.5"
              markerEnd="url(#timeline-red-arrow)"
            />
            {/* Подписи периода */}
            <text
              x="155"
              y="24"
              textAnchor="middle"
              className="fill-red-600 dark:fill-red-400 text-[11px] font-bold"
            >
              since 2022 / for 3 years
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

import React from 'react';
import { Timeline, TimelineKind } from './Timeline';

export const TimelineDemo: React.FC = () => {
  const kinds: { kind: TimelineKind; title: string; subtitle: string }[] = [
    {
      kind: 'dela',
      title: 'Дела (настоящее регулярное)',
      subtitle: 'I clean my room every day (/// вокруг Now)',
    },
    {
      kind: 'dela_past',
      title: 'Дела (прошедшее регулярное)',
      subtitle: 'I cleaned my room last week (/// слева от Now)',
    },
    {
      kind: 'sostoyanie',
      title: 'Состояние (в моменте сейчас)',
      subtitle: 'I am cleaning my room right now (точка на Now)',
    },
    {
      kind: 'sostoyanie_past',
      title: 'Состояние (в моменте в прошлом)',
      subtitle: 'I was cleaning my room at 10 am (точка левее Now)',
    },
    {
      kind: 'rezultat',
      title: 'Результат (сделанное к моменту)',
      subtitle: 'I have cleaned my room (дуга Past → Now)',
    },
    {
      kind: 'imeyu_pravo',
      title: 'Имею право (длится до сейчас)',
      subtitle: 'I have been working since 2022 / for 3 years (отрезок со стрелкой в Now)',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Векторные таймлайны методики
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Все 6 видов временных шкал English Algorithm
        </p>
      </div>

      <div className="space-y-4">
        {kinds.map(({ kind, title, subtitle }) => (
          <div
            key={kind}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            <Timeline kind={kind} />
          </div>
        ))}
      </div>
    </div>
  );
};

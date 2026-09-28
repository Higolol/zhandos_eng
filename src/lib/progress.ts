import type { Attempt, Exercise, Topic } from '../types';

const STORAGE_KEY = 'ea_trainer_attempts';
const MAX_ATTEMPTS = 5000;

export type ExerciseStatus = 'new' | 'learning' | 'known';

export interface TopicStat {
  topic: Topic | string;
  total: number;
  solved: number;
  percent: number;
}

export interface ProgressSummary {
  totalAttempts: number;
  streakDays: number;
  solvedCount: number;
  learningCount: number;
  newCount: number;
  mistakesCount: number;
  topicStats: TopicStat[];
}

const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback to memory
  }
  return memoryStore.get(key) ?? null;
}

function setStorageItem(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {
    // fallback to memory
  }
  memoryStore.set(key, val);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // fallback to memory
  }
  memoryStore.delete(key);
}

/**
 * Получить все попытки из localStorage (не более 5000)
 */
export function getAttempts(): Attempt[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to read attempts from localStorage:', err);
    return [];
  }
}

/**
 * Сохранить попытку в localStorage
 */
export function recordAttempt(
  data: Omit<Attempt, 'at'> & { at?: number }
): Attempt {
  const attempt: Attempt = {
    exerciseId: data.exerciseId,
    at: data.at ?? Date.now(),
    answer: data.answer,
    verdict: data.verdict,
  };

  try {
    const list = getAttempts();
    list.push(attempt);
    const trimmed = list.length > MAX_ATTEMPTS ? list.slice(list.length - MAX_ATTEMPTS) : list;
    setStorageItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to record attempt to localStorage:', err);
  }

  return attempt;
}

/**
 * Сбросить историю попыток (для тестов/настроек)
 */
export function clearProgress(): void {
  try {
    removeStorageItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear progress:', err);
  }
}

/**
 * Попытки конкретного задания
 */
export function getExerciseAttempts(
  exerciseId: string,
  cachedAttempts?: Attempt[]
): Attempt[] {
  const all = cachedAttempts ?? getAttempts();
  return all.filter((a) => a.exerciseId === exerciseId);
}

/**
 * Статус задания: new | learning | known
 * known = последние 2 попытки exact или ai_ok
 */
export function getExerciseStatus(
  exerciseId: string,
  cachedAttempts?: Attempt[]
): ExerciseStatus {
  const attempts = getExerciseAttempts(exerciseId, cachedAttempts);
  if (attempts.length === 0) return 'new';

  if (attempts.length >= 2) {
    const lastTwo = attempts.slice(-2);
    const bothOk = lastTwo.every(
      (a) => a.verdict === 'exact' || a.verdict === 'ai_ok'
    );
    if (bothOk) return 'known';
  }

  return 'learning';
}

/**
 * Проверка, относится ли задание к категории «Мои ошибки»:
 * последняя попытка wrong/near/ai_wrong, ЛИБО myPastAnswerOk === false и ещё ни разу не решено верно
 */
export function isMistake(
  exercise: Exercise,
  cachedAttempts?: Attempt[]
): boolean {
  const attempts = getExerciseAttempts(exercise.id, cachedAttempts);
  if (attempts.length > 0) {
    const latest = attempts[attempts.length - 1];
    return ['wrong', 'near', 'ai_wrong'].includes(latest.verdict);
  }
  return exercise.myPastAnswerOk === false;
}

/**
 * Список ID заданий из «Мои ошибки»
 */
export function getMistakeExerciseIds(
  allExercises: Exercise[],
  cachedAttempts?: Attempt[]
): string[] {
  const attempts = cachedAttempts ?? getAttempts();
  const latestByEx = new Map<string, Attempt>();
  for (const a of attempts) {
    const prev = latestByEx.get(a.exerciseId);
    if (!prev || a.at >= prev.at) {
      latestByEx.set(a.exerciseId, a);
    }
  }

  const result: string[] = [];
  for (const ex of allExercises) {
    const latest = latestByEx.get(ex.id);
    if (latest) {
      if (['wrong', 'near', 'ai_wrong'].includes(latest.verdict)) {
        result.push(ex.id);
      }
    } else if (ex.myPastAnswerOk === false) {
      result.push(ex.id);
    }
  }

  return result;
}

/**
 * Расчёт непрерывной серии дней практики (streak)
 */
export function getStreakDays(cachedAttempts?: Attempt[]): number {
  const attempts = cachedAttempts ?? getAttempts();
  if (attempts.length === 0) return 0;

  const days = new Set<string>();
  for (const a of attempts) {
    const d = new Date(a.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.add(key);
  }

  const now = new Date();
  const getDayKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const todayKey = getDayKey(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getDayKey(yesterday);

  let currentCursor = now;
  if (!days.has(todayKey)) {
    if (!days.has(yesterdayKey)) {
      return 0;
    }
    currentCursor = yesterday;
  }

  let streak = 0;
  while (true) {
    const key = getDayKey(currentCursor);
    if (days.has(key)) {
      streak++;
      currentCursor = new Date(currentCursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Статистика по темам: сколько решено верно, общий процент
 */
export function getTopicStats(
  allExercises: Exercise[],
  cachedAttempts?: Attempt[]
): TopicStat[] {
  const attempts = cachedAttempts ?? getAttempts();

  const latestByEx = new Map<string, Attempt>();
  for (const a of attempts) {
    const prev = latestByEx.get(a.exerciseId);
    if (!prev || a.at >= prev.at) {
      latestByEx.set(a.exerciseId, a);
    }
  }

  const topicTotals = new Map<string, number>();
  const topicSolved = new Map<string, number>();

  for (const ex of allExercises) {
    const mainTopic = ex.topics[0] || 'other';
    topicTotals.set(mainTopic, (topicTotals.get(mainTopic) || 0) + 1);

    const latest = latestByEx.get(ex.id);
    if (latest && (latest.verdict === 'exact' || latest.verdict === 'ai_ok')) {
      topicSolved.set(mainTopic, (topicSolved.get(mainTopic) || 0) + 1);
    }
  }

  const stats: TopicStat[] = [];
  for (const [topic, total] of topicTotals.entries()) {
    const solved = topicSolved.get(topic) || 0;
    const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
    stats.push({ topic, total, solved, percent });
  }

  return stats.sort((a, b) => b.total - a.total);
}

/**
 * Полная сводка прогресса
 */
export function getProgressSummary(allExercises: Exercise[]): ProgressSummary {
  const attempts = getAttempts();

  let knownCount = 0;
  let learningCount = 0;
  let newCount = 0;

  const attemptsByEx = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!attemptsByEx.has(a.exerciseId)) attemptsByEx.set(a.exerciseId, []);
    attemptsByEx.get(a.exerciseId)!.push(a);
  }

  for (const ex of allExercises) {
    const list = attemptsByEx.get(ex.id) || [];
    if (list.length === 0) {
      newCount++;
    } else if (list.length >= 2) {
      const lastTwo = list.slice(-2);
      if (lastTwo.every((a) => a.verdict === 'exact' || a.verdict === 'ai_ok')) {
        knownCount++;
      } else {
        learningCount++;
      }
    } else {
      learningCount++;
    }
  }

  const mistakesCount = getMistakeExerciseIds(allExercises, attempts).length;
  const streakDays = getStreakDays(attempts);
  const topicStats = getTopicStats(allExercises, attempts);

  return {
    totalAttempts: attempts.length,
    streakDays,
    solvedCount: knownCount,
    learningCount,
    newCount,
    mistakesCount,
    topicStats,
  };
}

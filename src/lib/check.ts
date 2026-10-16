import type { Exercise, SlotKind } from '../types';

export const CODE_WORDS = new Set([
  'do',
  'does',
  'did',
  'am',
  'is',
  'are',
  'was',
  'were',
  'have',
  'has',
  'had',
  'will',
  'would',
  'can',
  'could',
  'should',
  'must',
  'shall',
  'be',
  'been',
  'being',
  'not',
  'never',
  'no',
]);

export const PROTECTED_SLOT_KINDS = new Set<SlotKind>([
  'verb',
  'v3',
  'ing',
  'been',
  'to',
  'code',
  'neg',
  'question',
]);

export type DiffKind = 'same' | 'missing' | 'extra' | 'replaced';

export interface DiffToken {
  type: DiffKind;
  text: string;
  expected?: string;
}

export interface CheckResult {
  verdict: 'exact' | 'near' | 'wrong';
  matched?: string;
  diff?: DiffToken[];
}

const NEG_QUESTION_PRON_RE =
  /\b(do|does|did|am|is|are|was|were|have|has|had|will|would|can|could|should|must|shall) not (i|you|he|she|it|we|they|there)\b/g;

/**
 * Нормализация строки в набор эквивалентных вариантов:
 * 1. Нижний регистр, trim, апострофы ’‘ → ', убираются скобки ученика и пунктуация .,!?;:"«»
 * 2. Раскрытие однозначных сокращений: won't, can't/cannot, shan't, n't, 'm, 're, 've, 'll
 * 3. whom ≡ who
 * 4. Двусмысленные 's (is/has) и 'd (would/had): порождаются все комбинации + исходный вид для притяжательных
 * 5. Стяжение в отрицательном вопросе с Ведущим-местоимением: AUX not PRON → AUX PRON not
 */
export function normalizeToVariants(raw: string): string[] {
  let s = (raw || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[.,!?;:"«»]/g, ' ');

  const fixes: [string, string][] = [
    ["won't", 'will not'],
    ["can't", 'can not'],
    ['cannot', 'can not'],
    ["shan't", 'shall not'],
    ["n't", ' not'],
    ["i'm", 'i am'],
    ["'m", ' am'],
    ["'re", ' are'],
    ["'ve", ' have'],
    ["'ll", ' will'],
  ];

  for (const [from, to] of fixes) {
    s = s.split(from).join(to);
  }

  // whom ≡ who
  s = s.replace(/\bwhom\b/g, 'who');

  let variants = [s];

  if (s.includes("'s")) {
    const next: string[] = [];
    for (const v of variants) {
      next.push(v); // исходный вариант (для притяжательных people's, yesterday's)
      next.push(v.split("'s").join(' is'));
      next.push(v.split("'s").join(' has'));
    }
    variants = next;
  }

  if (variants.some((v) => v.includes("'d"))) {
    const next: string[] = [];
    for (const v of variants) {
      next.push(v.split("'d").join(' would'));
      next.push(v.split("'d").join(' had'));
      next.push(v);
    }
    variants = next;
  }

  return Array.from(
    new Set(
      variants
        .map((v) =>
          v
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .join(' ')
            .replace(NEG_QUESTION_PRON_RE, '$1 $2 not')
        )
        .filter(Boolean)
    )
  );
}

/**
 * Символьное расстояние Левенштейна (для опечаток внутри слова и проверки пробелов, e.g. everyday vs every day)
 */
export function charLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Пословное выравнивание (diff) между фактическими и эталонными словами
 */
export function computeWordDiff(
  actualWords: string[],
  expectedWords: string[]
): { dist: number; tokens: DiffToken[] } {
  const m = actualWords.length;
  const n = expectedWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (actualWords[i - 1] === expectedWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const rawOps: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && actualWords[i - 1] === expectedWords[j - 1]) {
      rawOps.push({ type: 'same', text: actualWords[i - 1] });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      rawOps.push({ type: 'replaced', text: actualWords[i - 1], expected: expectedWords[j - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      rawOps.push({ type: 'extra', text: actualWords[i - 1] });
      i--;
    } else {
      rawOps.push({ type: 'missing', text: expectedWords[j - 1] });
      j--;
    }
  }

  rawOps.reverse();
  return { dist: dp[m][n], tokens: rawOps };
}

/**
 * Собирает множество защищённых слов эталона (коды + слоты verb/v3/ing/been/to/code/neg/question),
 * отличие в которых всегда даёт wrong, а не near.
 */
function getProtectedWords(ex: Exercise): Set<string> {
  const protectedWords = new Set<string>(CODE_WORDS);
  for (const slot of ex.formula || []) {
    if (PROTECTED_SLOT_KINDS.has(slot.kind)) {
      for (const variant of normalizeToVariants(slot.text)) {
        for (const w of variant.split(' ')) {
          if (w) protectedWords.add(w);
        }
      }
    }
  }
  return protectedWords;
}

/**
 * Локальная проверка ответа пользователя
 */
export function check(answer: string, ex: Exercise): CheckResult {
  const studentVariants = normalizeToVariants(answer);

  if (!studentVariants.length) {
    const fallbackTarget = ex.en[0] || '';
    const targetWords = fallbackTarget
      .toLowerCase()
      .replace(/[.,!?;:"«»]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      verdict: 'wrong',
      matched: fallbackTarget,
      diff: targetWords.map((w) => ({ type: 'missing', text: w })),
    };
  }

  // 1. Точное совпадение (exact)
  for (let idx = 0; idx < ex.en.length; idx++) {
    const rawEn = ex.en[idx];
    const enVariants = normalizeToVariants(rawEn);

    for (const sVar of studentVariants) {
      for (const eVar of enVariants) {
        if (sVar === eVar) {
          const words = sVar.split(' ');
          return {
            verdict: 'exact',
            matched: rawEn,
            diff: words.map((w) => ({ type: 'same', text: w })),
          };
        }
      }
    }
  }

  // 2. Ближайший вариант (near vs wrong)
  const protectedWords = getProtectedWords(ex);
  let bestDist = Infinity;
  let bestCharDist = Infinity;
  let bestMatched = ex.en[0];
  let bestTokens: DiffToken[] = [];
  let bestProtectedTouched = false;

  for (let idx = 0; idx < ex.en.length; idx++) {
    const rawEn = ex.en[idx];
    const enVariants = normalizeToVariants(rawEn);

    for (const sVar of studentVariants) {
      const sWords = sVar.split(' ');

      for (const eVar of enVariants) {
        const eWords = eVar.split(' ');
        const { dist, tokens } = computeWordDiff(sWords, eWords);
        const charD = charLevenshtein(sVar, eVar);

        let protectedTouched = false;
        for (const t of tokens) {
          if (t.type === 'same') continue;
          if (t.type === 'missing' && t.text && protectedWords.has(t.text)) {
            protectedTouched = true;
          } else if (t.type === 'replaced') {
            if ((t.expected && protectedWords.has(t.expected)) || (t.text && protectedWords.has(t.text))) {
              protectedTouched = true;
            }
          } else if (t.type === 'extra' && t.text && protectedWords.has(t.text)) {
            protectedTouched = true;
          }
        }

        if (dist < bestDist || (dist === bestDist && charD < bestCharDist)) {
          bestDist = dist;
          bestCharDist = charD;
          bestMatched = rawEn;
          bestTokens = tokens;
          bestProtectedTouched = protectedTouched;
        }
      }
    }
  }

  // near: пословное расстояние <= 1 ИЛИ опечатка слитно/раздельно (charDist <= 1),
  // и НЕ затронуты защищённые слоты формулы (verb/v3/ing/been/to/code/neg/question)
  if (!bestProtectedTouched && (bestDist <= 1 || bestCharDist <= 1)) {
    return {
      verdict: 'near',
      matched: bestMatched,
      diff: bestTokens,
    };
  }

  return {
    verdict: 'wrong',
    matched: bestMatched,
    diff: bestTokens,
  };
}

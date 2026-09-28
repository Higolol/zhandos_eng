/**
 * Словарь глаголов методики English Algorithm.
 * Используется компонентом Formula (T5) и генератором режима «Главный × Смысл» (T6).
 */

export interface Verb {
  ru: string;
  v1: string;
  s: string;
  v2: string;
  v3: string;
  ing: string;
  particle?: string; // для фразовых глаголов (wake up -> particle: 'up', talk to -> particle: 'to')
}

export const VERBS: Verb[] = [
  // Базовые глаголы курса из спецификации T6
  { ru: 'спрашивать', v1: 'ask', s: 'asks', v2: 'asked', v3: 'asked', ing: 'asking' },
  { ru: 'звонить / звать', v1: 'call', s: 'calls', v2: 'called', v3: 'called', ing: 'calling' },
  { ru: 'помогать', v1: 'help', s: 'helps', v2: 'helped', v3: 'helped', ing: 'helping' },
  { ru: 'обучать / преподавать', v1: 'teach', s: 'teaches', v2: 'taught', v3: 'taught', ing: 'teaching' },
  { ru: 'помнить', v1: 'remember', s: 'remembers', v2: 'remembered', v3: 'remembered', ing: 'remembering' },
  { ru: 'знать', v1: 'know', s: 'knows', v2: 'knew', v3: 'known', ing: 'knowing' },
  { ru: 'приглашать', v1: 'invite', s: 'invites', v2: 'invited', v3: 'invited', ing: 'inviting' },
  { ru: 'платить', v1: 'pay', s: 'pays', v2: 'paid', v3: 'paid', ing: 'paying' },
  { ru: 'чистить / убирать', v1: 'clean', s: 'cleans', v2: 'cleaned', v3: 'cleaned', ing: 'cleaning' },
  { ru: 'мыть', v1: 'wash', s: 'washes', v2: 'washed', v3: 'washed', ing: 'washing' },
  { ru: 'отправлять', v1: 'send', s: 'sends', v2: 'sent', v3: 'sent', ing: 'sending' },
  { ru: 'показывать', v1: 'show', s: 'shows', v2: 'showed', v3: 'shown', ing: 'showing' },
  { ru: 'грабить', v1: 'rob', s: 'robs', v2: 'robbed', v3: 'robbed', ing: 'robbing' },
  { ru: 'наводить порядок', v1: 'tidy', s: 'tidies', v2: 'tidied', v3: 'tidied', ing: 'tidying' },
  { ru: 'наказывать', v1: 'punish', s: 'punishes', v2: 'punished', v3: 'punished', ing: 'punishing' },
  { ru: 'увольнять', v1: 'fire', s: 'fires', v2: 'fired', v3: 'fired', ing: 'firing' },
  { ru: 'будить', v1: 'wake', particle: 'up', s: 'wakes', v2: 'woke', v3: 'woken', ing: 'waking' },
  { ru: 'удивлять', v1: 'surprise', s: 'surprises', v2: 'surprised', v3: 'surprised', ing: 'surprising' },
  { ru: 'разговаривать с', v1: 'talk', particle: 'to', s: 'talks', v2: 'talked', v3: 'talked', ing: 'talking' },
  { ru: 'рассказывать / сказать', v1: 'tell', s: 'tells', v2: 'told', v3: 'told', ing: 'telling' },
  { ru: 'давать', v1: 'give', s: 'gives', v2: 'gave', v3: 'given', ing: 'giving' },
  { ru: 'видеть', v1: 'see', s: 'sees', v2: 'saw', v3: 'seen', ing: 'seeing' },
  { ru: 'есть', v1: 'eat', s: 'eats', v2: 'ate', v3: 'eaten', ing: 'eating' },
  { ru: 'водить', v1: 'drive', s: 'drives', v2: 'drove', v3: 'driven', ing: 'driving' },
  { ru: 'смотреть', v1: 'watch', s: 'watches', v2: 'watched', v3: 'watched', ing: 'watching' },
  { ru: 'играть', v1: 'play', s: 'plays', v2: 'played', v3: 'played', ing: 'playing' },
  { ru: 'летать', v1: 'fly', s: 'flies', v2: 'flew', v3: 'flown', ing: 'flying' },
  { ru: 'готовить', v1: 'cook', s: 'cooks', v2: 'cooked', v3: 'cooked', ing: 'cooking' },
  { ru: 'подавать (документы)', v1: 'submit', s: 'submits', v2: 'submitted', v3: 'submitted', ing: 'submitting' },
  { ru: 'штрафовать', v1: 'fine', s: 'fines', v2: 'fined', v3: 'fined', ing: 'fining' },

  // Дополнительные глаголы из датасета курса
  { ru: 'находить', v1: 'find', s: 'finds', v2: 'found', v3: 'found', ing: 'finding' },
  { ru: 'идти / ехать', v1: 'go', s: 'goes', v2: 'went', v3: 'gone', ing: 'going' },
  { ru: 'иметь', v1: 'have', s: 'has', v2: 'had', v3: 'had', ing: 'having' },
  { ru: 'нравиться / любить', v1: 'like', s: 'likes', v2: 'liked', v3: 'liked', ing: 'liking' },
  { ru: 'нуждаться', v1: 'need', s: 'needs', v2: 'needed', v3: 'needed', ing: 'needing' },
  { ru: 'рисовать / красить', v1: 'paint', s: 'paints', v2: 'painted', v3: 'painted', ing: 'painting' },
  { ru: 'читать', v1: 'read', s: 'reads', v2: 'read', v3: 'read', ing: 'reading' },
  { ru: 'ругать', v1: 'scold', s: 'scolds', v2: 'scolded', v3: 'scolded', ing: 'scolding' },
  { ru: 'думать', v1: 'think', s: 'thinks', v2: 'thought', v3: 'thought', ing: 'thinking' },
  { ru: 'настраивать', v1: 'tune', s: 'tunes', v2: 'tuned', v3: 'tuned', ing: 'tuning' },
  { ru: 'понимать', v1: 'understand', s: 'understands', v2: 'understood', v3: 'understood', ing: 'understanding' },
  { ru: 'посещать', v1: 'visit', s: 'visits', v2: 'visited', v3: 'visited', ing: 'visiting' },
  { ru: 'хотеть', v1: 'want', s: 'wants', v2: 'wanted', v3: 'wanted', ing: 'wanting' },
  { ru: 'писать', v1: 'write', s: 'writes', v2: 'wrote', v3: 'written', ing: 'writing' },
  { ru: 'чистить (зубы)', v1: 'brush', s: 'brushes', v2: 'brushed', v3: 'brushed', ing: 'brushing' },
  { ru: 'обсуждать', v1: 'discuss', s: 'discusses', v2: 'discussed', v3: 'discussed', ing: 'discussing' },
  { ru: 'выходить на пенсию', v1: 'retire', s: 'retires', v2: 'retired', v3: 'retired', ing: 'retiring' },
  { ru: 'работать', v1: 'work', s: 'works', v2: 'worked', v3: 'worked', ing: 'working' },
  { ru: 'жить', v1: 'live', s: 'lives', v2: 'lived', v3: 'lived', ing: 'living' },
  { ru: 'начинать', v1: 'start', s: 'starts', v2: 'started', v3: 'started', ing: 'starting' },
  { ru: 'проводить', v1: 'conduct', s: 'conducts', v2: 'conducted', v3: 'conducted', ing: 'conducting' },
  { ru: 'оставаться', v1: 'stay', s: 'stays', v2: 'stayed', v3: 'stayed', ing: 'staying' },
  { ru: 'делать / создавать', v1: 'make', s: 'makes', v2: 'made', v3: 'made', ing: 'making' },
  { ru: 'закрывать', v1: 'close', s: 'closes', v2: 'closed', v3: 'closed', ing: 'closing' },
  { ru: 'проверять', v1: 'check', s: 'checks', v2: 'checked', v3: 'checked', ing: 'checking' },
  { ru: 'обещать', v1: 'promise', s: 'promises', v2: 'promised', v3: 'promised', ing: 'promising' }
];

// Карты быстрого поиска по формам
const V1_MAP = new Map<string, Verb>();
const V2_MAP = new Map<string, Verb>();
const S_MAP = new Map<string, Verb>();

for (const verb of VERBS) {
  V1_MAP.set(verb.v1.toLowerCase(), verb);
  V2_MAP.set(verb.v2.toLowerCase(), verb);
  S_MAP.set(verb.s.toLowerCase(), verb);
}

/** Неправильные прошедшие формы (V2 -> V1) */
const IRREGULAR_V2: Record<string, string> = {
  went: 'go',
  saw: 'see',
  found: 'find',
  taught: 'teach',
  knew: 'know',
  had: 'have',
  read: 'read',
  wrote: 'write',
  thought: 'think',
  understood: 'understand',
  gave: 'give',
  ate: 'eat',
  drove: 'drive',
  flew: 'fly',
  made: 'make',
  told: 'tell',
  woke: 'wake',
  paid: 'pay',
  sent: 'send',
  met: 'meet',
  took: 'take',
  became: 'become',
  felt: 'feel',
  built: 'build',
  bought: 'buy',
  came: 'come',
  got: 'get',
  left: 'leave',
  lost: 'lose',
  spoke: 'speak',
  spent: 'spend',
  stood: 'stand',
  won: 'win'
};

/**
 * Находит инфинитив (базовую форму V1) по слову и скрытому коду.
 * Если скрытый код не указан, пытается определить по окончанию или словарю.
 */
export function baseForm(word: string, hiddenCode?: 'do' | 'does' | 'did'): string {
  const clean = word.trim().toLowerCase();

  // Для скрытого кода 'did'
  if (hiddenCode === 'did') {
    if (IRREGULAR_V2[clean]) return IRREGULAR_V2[clean];
    const fromDict = V2_MAP.get(clean);
    if (fromDict) return fromDict.v1;

    // Регулярные правила отсечения -ed
    if (clean.endsWith('ied') && clean.length > 4) {
      return clean.slice(0, -3) + 'y'; // studied -> study, tidied -> tidy
    }
    if (clean.endsWith('ed')) {
      const stem = clean.slice(0, -2);
      // Удвоенная согласная (submitted -> submit, robbed -> rob)
      if (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
        return stem.slice(0, -1);
      }
      // Глаголы на -e (liked -> like, invited -> invite, closed -> close)
      if (V1_MAP.has(stem + 'e')) return stem + 'e';
      return stem;
    }
  }

  // Для скрытого кода 'does'
  if (hiddenCode === 'does') {
    if (clean === 'has') return 'have';
    if (clean === 'does') return 'do';
    if (clean === 'goes') return 'go';
    const fromDict = S_MAP.get(clean);
    if (fromDict) return fromDict.v1;

    // Регулярные правила отсечения -s/-es/-ies
    if (clean.endsWith('ies') && clean.length > 4) {
      return clean.slice(0, -3) + 'y'; // flies -> fly, tidies -> tidy
    }
    if (clean.endsWith('es')) {
      const stem = clean.slice(0, -2);
      if (V1_MAP.has(stem)) return stem;
      if (V1_MAP.has(clean.slice(0, -1))) return clean.slice(0, -1);
      return stem;
    }
    if (clean.endsWith('s')) {
      return clean.slice(0, -1);
    }
  }

  // Для 'do' или если слово уже в V1
  if (V1_MAP.has(clean)) return clean;

  return clean;
}

export interface VerbDecomposition {
  code: 'do' | 'does' | 'did';
  base: string;
  affix: string;
  isIrregular: boolean;
  original: string;
}

/**
 * Раскладывает глагол со скрытым кодом на составные части:
 * helped -> { code: 'did', base: 'help', affix: 'ed', isIrregular: false, original: 'helped' }
 * plays  -> { code: 'does', base: 'play', affix: 's', isIrregular: false, original: 'plays' }
 * went   -> { code: 'did', base: 'go', affix: '', isIrregular: true, original: 'went' }
 */
export function decomposeVerb(word: string, hiddenCode?: 'do' | 'does' | 'did'): VerbDecomposition {
  const clean = word.trim();
  const lower = clean.toLowerCase();
  const code = hiddenCode || (lower.endsWith('ed') || IRREGULAR_V2[lower] ? 'did' : lower.endsWith('s') ? 'does' : 'do');
  const base = baseForm(clean, code);

  let isIrregular = false;
  let affix = '';

  if (code === 'did') {
    if (IRREGULAR_V2[lower] || (V2_MAP.has(lower) && V2_MAP.get(lower)!.v1 !== lower.replace(/ed$/, ''))) {
      isIrregular = true;
      affix = '';
    } else if (lower.endsWith('ied')) {
      affix = 'ied';
    } else if (lower.endsWith('ed')) {
      affix = 'ed';
    }
  } else if (code === 'does') {
    if (lower === 'has') {
      isIrregular = true;
      affix = '';
    } else if (lower.endsWith('ies')) {
      affix = 'ies';
    } else if (lower.endsWith('es')) {
      affix = 'es';
    } else if (lower.endsWith('s')) {
      affix = 's';
    }
  }

  return {
    code,
    base,
    affix,
    isIrregular,
    original: clean
  };
}

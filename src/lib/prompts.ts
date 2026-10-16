// Системные промпты и контракты для модуля ИИ (English Algorithm)
import type { Exercise, Slot, Topic, Aspect, Tense, Voice, Form, WritingTask } from '../types';

export const METHOD = `Ты — тьютор авторской методики «English Algorithm» (Жандос Адетбеков). Объясняй ТОЛЬКО в её терминах, по-русски, коротко.
Формула: [-1 Вопрос] [0 Код] [1 Ведущий] [2 Действие] [3 Объект]. В утверждении порядок 1-0-2-3, в вопросе -1-0-1-2-3.
Ведущий определяет код: I/you/we/they → do, am/are, have, were; he/she/it → does, is, has, was. Модальные коды (can, could, will, would, should, must) одинаковы для всех, после них — голый глагол (или be/have).
Скрытый код: в утверждении Дел код прячется в глагол: They did help → They helped (-ed = did), He does play → He plays (-s = does).
Аспекты: Дела (do/does/did/will + чёрный глагол; регулярно, факт); Состояние (am/is/are/was/were + ing; «являюсь …-щим», в моменте); Результат (have/has/had + V3; «имею сделанным», к моменту); Имею право (have/has been + ing; стаж, since/for, How long).
Залог: «Ведущий действует» (актив) / «Ведущий не действует» (пассив: код be + V3; is being V3; has been V3; can be V3). Дословно: «Когда является окно закрытым?».
Одно отрицание в предложении: Nobody/Nothing/Never + утвердительный код; в вопросе/отрицании — anybody/anything/ever.
Вопрос к Ведущему (Who helped you?) — прямой порядок, Who на месте Ведущего; вопрос к объекту (Who did you help?) — -1 0 1 2, предлог в конце (Who will you talk to?).
If/When/Until + настоящее время (без will), will — во второй части.
Английские названия времён можно давать только в скобках.`;

export type AiErrorType =
  | 'code'
  | 'vedushchiy_code_mismatch'
  | 'action_form'
  | 'hidden_code'
  | 'word_order'
  | 'double_negation'
  | 'aspect_choice'
  | 'voice'
  | 'preposition'
  | 'article'
  | 'vocabulary'
  | 'spelling'
  | 'other';

export interface AiCheckResult {
  ok: boolean;
  corrected: string;
  errorType?: AiErrorType;
  explanation: string;
  formula: Slot[];
}

export interface AiExplainResult {
  explanation: string;
  literal: string;
  formula: Slot[];
}

export interface GeneratedExerciseItem {
  ru: string;
  en: string[];
  formula: Slot[];
  literal?: string;
  aspect: Aspect;
  tense: Tense;
  voice: Voice;
  form: Form;
  code: string;
}

export interface AiGenerateResult {
  items: GeneratedExerciseItem[];
}

export interface EssayRequirementCheck {
  req: string;
  ok: boolean;
  comment: string;
}

export interface EssayErrorItem {
  quote: string;
  fix: string;
  rule: string;
  type: AiErrorType;
}

export interface AiEssayResult {
  wordCount: number;
  meetsRequirements: EssayRequirementCheck[];
  errors: EssayErrorItem[];
  tenseConsistency: string;
  improved: string;
  summary: string;
}

/**
 * Промпт для проверки ответа (check)
 */
export function buildCheckPrompt(
  ex: Pick<Exercise, 'ru' | 'en' | 'aspect' | 'tense' | 'voice' | 'form' | 'code'>,
  answer: string
): string {
  const referenceList = ex.en.map((s, i) => `  ${i + 1}. "${s}"`).join('\n');
  return `${METHOD}

ЗАДАЧА: Проверь ответ ученика на русское предложение по методике English Algorithm.

Контекст задания:
- Русская фраза: "${ex.ru}"
- Эталонные варианты ответа:
${referenceList}
- Ответ ученика: "${answer}"
- Грамматика задания: аспект=${ex.aspect}, залог=${ex.voice}, форма=${ex.form}, код="${ex.code}"

Правила проверки:
1. Если ответ ученика грамматически корректен на английском языке и передаёт точный смысл русской фразы (даже если использованы допустимые синонимы или порядок слов, не совпадающий до буквы с эталоном):
   - ok: true
   - corrected: ответ ученика (с исправлением пунктуации при необходимости)
   - explanation: краткое подтверждение (до 2 предложений) в терминах методики (принят ИИ).
2. Если в ответе ученика есть ошибка:
   - ok: false
   - corrected: грамматически безупречный английский вариант
   - errorType: выбери наиболее подходящий тип:
     "code" (неверный код: did вместо was, have вместо has и т.п.)
     "vedushchiy_code_mismatch" (код не согласуется с Ведущим: he do, they is)
     "action_form" (неверная форма глагола после кода: can goes, have did)
     "hidden_code" (ошибка в скрытом коде Дел: plays вместо played, did played)
     "word_order" (нарушен порядок [-1][0][1][2][3])
     "double_negation" (двойное отрицание: nobody didn't)
     "aspect_choice" (неверный аспект: Состояние вместо Дел и т.д.)
     "voice" (Ведущий действует / не действует: актив вместо пассива)
     "preposition" (предлог)
     "article" (артикль a/an/the)
     "vocabulary" (неподходящее слово)
     "spelling" (опечатка/орфография)
     "other" (другое)
   - explanation: понятное объяснение ошибки строго в терминах методики (не более 3 предложений). Упоминай: Ведущий (1), Код (0), Действие (2), Объект (3), скрытый код, аспект или залог.
3. Поле "formula": полный пословный разбор предложения "corrected".
   Каждый слот: { "pos": -1|0|1|2|3|"ctx", "kind": "question"|"code"|"subject"|"verb"|"ing"|"v3"|"been"|"to"|"object"|"ctx"|"neg", "text": string, "hiddenCode"?: "do"|"does"|"did" }.
   ВАЖНЫЕ ПРАВИЛА ДЛЯ СЛОТОВ:
   - Слово "be", "been", "being" ОБЯЗАТЕЛЬНО имеет kind: "been".
   - Скрытый код (played -> hiddenCode: "did", plays -> hiddenCode: "does") указывается только для kind: "verb".
   - Сумма текстов всех слотов formula (через пробел) должна в точности соответствовать словам предложения corrected.

ОТВЕТЬ СТРОГО В ФОРМАТЕ JSON (без текста до и после, без markdown-блоков):
{
  "ok": false,
  "corrected": "When was this letter sent?",
  "errorType": "code",
  "explanation": "Ведущий «this letter» не действует (пассив), поэтому нужен код was + V3 (sent), а не активный код did.",
  "formula": [
    {"pos": -1, "kind": "question", "text": "When"},
    {"pos": 0, "kind": "code", "text": "was"},
    {"pos": 1, "kind": "subject", "text": "this letter"},
    {"pos": 2, "kind": "v3", "text": "sent"}
  ]
}`;
}

/**
 * Промпт для объяснения эталона (explain / «Почему так?»)
 */
export function buildExplainPrompt(ex: Exercise): string {
  return `${METHOD}

ЗАДАЧА: Дай методическое объяснение эталонного предложения «Почему так?» по методике English Algorithm.

Задание:
- Русская фраза: "${ex.ru}"
- Эталон: "${ex.en[0]}"
- Код: "${ex.code}", аспект: ${ex.aspect}, залог: ${ex.voice}, форма: ${ex.form}
- Дословный перевод: "${ex.literal || ''}"

Требования:
1. explanation: объяснение структуры предложения (до 3 предложений) строго в терминах методики: почему именно такой код, позиция Ведущего, форма действия.
2. literal: дословный алгоритмический перевод на русский (например: «Когда является это письмо отправленным?» или «Они имеют сделанным отчет к 5 часам»).
3. formula: пословный разбор эталона ${ex.en[0]} на слоты методики.
   Каждый слот: { "pos": -1|0|1|2|3|"ctx", "kind": "question"|"code"|"subject"|"verb"|"ing"|"v3"|"been"|"to"|"object"|"ctx"|"neg", "text": string, "hiddenCode"?: "do"|"does"|"did" }.
   ВАЖНО: слово "be", "been", "being" ВСЕГДА имеет kind: "been".

ОТВЕТЬ СТРОГО В ФОРМАТЕ JSON:
{
  "explanation": "В вопросе к обстоятельству порядок -1 0 1 2. Для пассивного действия в прошлом код was выходит на позицию 0 перед Ведущим.",
  "literal": "Когда было это письмо отправленным?",
  "formula": [
    {"pos": -1, "kind": "question", "text": "When"},
    {"pos": 0, "kind": "code", "text": "was"},
    {"pos": 1, "kind": "subject", "text": "this letter"},
    {"pos": 2, "kind": "v3", "text": "sent"}
  ]
}`;
}

/**
 * Промпт для генерации похожих заданий (generate)
 */
export function buildGeneratePrompt(
  topic: Topic,
  examples: Exercise[],
  n = 5
): string {
  const examplesText = examples
    .map(
      (e, i) => `Пример ${i + 1}:
  ru: "${e.ru}"
  en: ${JSON.stringify(e.en)}
  aspect: "${e.aspect}", tense: "${e.tense}", voice: "${e.voice}", form: "${e.form}", code: "${e.code}"
  literal: "${e.literal || ''}"
  formula: ${JSON.stringify(e.formula)}`
    )
    .join('\n\n');

  return `${METHOD}

ЗАДАЧА: Сгенерируй ${n} новых тренировочных упражнений по теме "${topic}" в строгом соответствии со структурой методики English Algorithm.

Вот реальные эталонные примеры из датасета по этой теме:
${examplesText}

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ВАЛИДАЦИИ:
1. "ru": понятная русская фраза для перевода (можно с подсказками в скобках, например "(регулярно)" или "(вчера)").
2. "en": массив допустимых переводов на английский (минимум 1). en[0] — основной эталон.
3. en[0] ОБЯЗАТЕЛЬНО заканчивается точкой "." или знаком вопроса "?" (если form: yes_no_question, wh_question, who_subject или who_object — строго "?").
4. Если предложение начинается с придаточного (If, When, Until, Before, After, As soon as...), после него ОБЯЗАТЕЛЬНА запятая (например: "If he comes, we will start.").
5. "formula": пословный разбор первого эталона en[0].
   - Текст слотов formula при склейке через пробел ДОЛЖЕН БЫТЬ В ТОЧНОСТИ РАВЕН словам en[0] (без знаков препинания).
   - "pos" может быть только: -1, 0, 1, 2, 3, "ctx".
   - "kind" может быть только: "question", "code", "subject", "verb", "ing", "v3", "been", "to", "object", "ctx", "neg".
   - Слово "be", "been", "being" ОБЯЗАТЕЛЬНО имеет kind: "been".
   - Если залог voice: "passive", в formula обязательно должен быть слот с kind: "v3".
   - В вопросе к Ведущему (form: "who_subject", например "Who broke the window?" или "Who was fired?") слово "Who"/"What" пишется в formula ТОЛЬКО ОДИН РАЗ (не дублируй его и в pos -1, и в pos 1!).
6. Допустимые значения enum:
   - aspect: "dela" | "sostoyanie" | "rezultat" | "imeyu_pravo" | "modal" | "none"
   - tense: "past" | "present" | "future" | "none"
   - voice: "active" | "passive"
   - form: "affirmative" | "negative" | "yes_no_question" | "wh_question" | "who_subject" | "who_object"
7. "code": точный код предложения (например: "did", "is", "have been", "can", "will be", "was").

ОТВЕТЬ СТРОГО В ФОРМАТЕ JSON:
{
  "items": [
    {
      "ru": "Где была отремонтирована машина?",
      "en": ["Where was the car repaired?"],
      "formula": [
        {"pos": -1, "kind": "question", "text": "Where"},
        {"pos": 0, "kind": "code", "text": "was"},
        {"pos": 1, "kind": "subject", "text": "the car"},
        {"pos": 2, "kind": "v3", "text": "repaired"}
      ],
      "literal": "Где являлась машина отремонтированной?",
      "aspect": "dela",
      "tense": "past",
      "voice": "passive",
      "form": "wh_question",
      "code": "was"
    }
  ]
}`;
}

/**
 * Промпт для проверки эссе / письменной работы (essay)
 */
export function buildEssayPrompt(task: WritingTask, text: string): string {
  const reqs = task.requirements.map((r, i) => `  ${i + 1}. ${r}`).join('\n');
  const tmpl = task.template ? task.template.map((t, i) => `  ${i + 1}. ${t}`).join('\n') : 'Стандартная структура';
  const computedWordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return `${METHOD}

ЗАДАЧА: Проверь письменную работу ученика (эссе) по методике English Algorithm.

Тема: "${task.title}" (Урок: ${task.hw})
Задание: "${task.prompt}"
Требования к работе:
${reqs}
Шаблон/структура:
${tmpl}

Текст ученика (всего ${computedWordCount} слов):
"""
${text}
"""

ИНСТРУКЦИЯ ПО ПРОВЕРКЕ:
1. wordCount: верни число ${computedWordCount} (подсчитано автоматически).
2. meetsRequirements: проверь каждое требование из списка выше. Для каждого: req (текст требования), ok (выполнено ли), comment (короткий комментарий на русском).
3. errors: выдели 5–7 главных грамматических и методических ошибок в тексте (коды do/does/did, am/is/are, have/has, скрытый код, V3, пассив, модальные коды, неправильные глаголы). Сразу переходи к JSON без долгих рассуждений.
   Для каждой ошибки:
   - quote: ТОЧНАЯ короткая цитата из текста ученика (2–5 слов, как написана у него).
   - fix: правильный исправленный вариант этой фразы.
   - rule: объяснение ошибки в терминах методики (Ведущий, Код, Действие, скрытый код, аспект; 1 предложение).
   - type: "code"|"vedushchiy_code_mismatch"|"action_form"|"hidden_code"|"word_order"|"double_negation"|"aspect_choice"|"voice"|"preposition"|"article"|"vocabulary"|"spelling"|"other".
4. tenseConsistency: краткий анализ согласованности времён и аспектов (1–2 предложения).
5. improved: сжатая улучшенная версия эссе (100–130 слов) без ошибок.
6. summary: общее резюме (2 предложения): сильные стороны и точка роста ученика.

КРИТИЧЕСКИ ВАЖНО: Сразу начинай ответ с открывающей фигурной скобки '{' и заканчивай '}'. Никаких предварительных рассуждений, никакого текста до или после JSON.
ОТВЕТЬ СТРОГО В ФОРМАТЕ JSON:
{
  "wordCount": 135,
  "meetsRequirements": [
    { "req": "120–150 words", "ok": true, "comment": "Объём соблюдён (135 слов)." }
  ],
  "errors": [
    {
      "quote": "cat leaved",
      "fix": "cat lived",
      "rule": "Неправильный глагол: в утверждении Дел в прошлом глагол live правильный (lived), а не leaved.",
      "type": "action_form"
    }
  ],
  "tenseConsistency": "В основной части последовательно используется прошедшее время (Дела), но местами проскакивает настоящее.",
  "improved": "Полный текст улучшенной версии...",
  "summary": "Отличная живая история! Основная точка роста — внимательность к формам неправильных глаголов и кодам в пассиве."
}`;
}

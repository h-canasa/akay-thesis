import { APPROVED_PRACTICE_QUESTIONS, PRACTICE_CATEGORY } from './practiceQuestions.js';

export const QUESTIONS_PER_PRACTICE = 5;

export const PRACTICE_DISTRIBUTION = Object.freeze([
  [PRACTICE_CATEGORY.GRAMMAR, 2],
  [PRACTICE_CATEGORY.SPELLING, 2],
  [PRACTICE_CATEGORY.PUNCTUATION, 1],
]);

function shuffled(items, random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [next[index], next[other]] = [next[other], next[index]];
  }
  return next;
}

// Balanced 2 Gramatika, 2 Baybay, 1 Bantas per attempt. Keep a shuffled
// per-category deck, refilling when exhausted and avoiding immediately
// previous questions whenever the available pool makes that possible.
export function createPracticeSession(previous = null, {
  bank = APPROVED_PRACTICE_QUESTIONS,
  random = Math.random,
} = {}) {
  const questions = [];
  const nextDecks = {};
  const previousIds = new Set(previous?.questions.map((item) => item.id) ?? []);
  const chosenIds = new Set();

  for (const [category, count] of PRACTICE_DISTRIBUTION) {
    const pool = bank.filter((item) => item.category === category && item.approved);
    if (pool.length < count) {
      throw new Error(`Not enough approved practice questions in ${category}.`);
    }

    const byId = new Map(pool.map((item) => [item.id, item]));
    const previousDeck = (previous?.decks?.[category] ?? [])
      .filter((id) => byId.has(id) && !chosenIds.has(id));
    const queue = previous ? [...previousDeck] : shuffled(pool.map((item) => item.id), random);
    const selected = [];

    while (selected.length < count) {
      if (!queue.length) {
        const fresh = shuffled(
          pool.map((item) => item.id).filter(
            (id) => !chosenIds.has(id) && !selected.includes(id) && !previousIds.has(id),
          ),
          random,
        );
        if (!fresh.length) {
          fresh.push(...shuffled(
            pool.map((item) => item.id).filter(
              (id) => !chosenIds.has(id) && !selected.includes(id),
            ),
            random,
          ));
        }
        queue.push(...fresh);
      }
      const id = queue.shift();
      if (id && !chosenIds.has(id) && !selected.includes(id)) {
        selected.push(id);
        chosenIds.add(id);
        questions.push(byId.get(id));
      }
    }
    nextDecks[category] = queue;
  }

  return {
    questions: shuffled(questions, random),
    decks: nextDecks,
  };
}

// Normalize only typography/spacing, not capitalization, missing punctuation,
// missing words, or hyphens: those are often exactly what a question tests.
export function normalizePracticeAnswer(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

export function gradePracticeSession(questions, answers) {
  const items = questions.map((question) => {
    const answer = answers[question.id] ?? '';
    const normalized = normalizePracticeAnswer(answer);
    const accepted = [question.correct, ...question.accepted]
      .map(normalizePracticeAnswer);
    return {
      question,
      answer,
      correct: normalized !== '' && accepted.includes(normalized),
    };
  });
  const correctCount = items.filter((item) => item.correct).length;
  return {
    items,
    correctCount,
    total: items.length,
    percent: items.length ? Math.round(correctCount / items.length * 100) : 0,
  };
}

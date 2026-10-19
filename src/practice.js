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


// This is an answer-key comparison, not a grammar diagnosis. Align word and
// punctuation tokens so a student can see *all* changes from an accepted
// answer, including unrelated words changed accidentally.
const COMPARE_TOKEN_PATTERN = /[\p{L}\p{M}\p{N}]+(?:[-'][\p{L}\p{M}\p{N}]+)*|[^\s]/gu;
const MAX_COMPARE_TOKENS = 120;

export function comparePracticeAnswer(answer, reference) {
  const actual = normalizePracticeAnswer(answer).match(COMPARE_TOKEN_PATTERN) ?? [];
  const expected = normalizePracticeAnswer(reference).match(COMPARE_TOKEN_PATTERN) ?? [];
  if (actual.length > MAX_COMPARE_TOKENS || expected.length > MAX_COMPARE_TOKENS) {
    return { distance: Number.POSITIVE_INFINITY, changes: [], truncated: true };
  }

  const rows = actual.length;
  const cols = expected.length;
  const distances = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let i = rows; i >= 0; i -= 1) distances[i][cols] = rows - i;
  for (let j = cols; j >= 0; j -= 1) distances[rows][j] = cols - j;

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      distances[i][j] = actual[i] === expected[j]
        ? distances[i + 1][j + 1]
        : 1 + Math.min(
          distances[i + 1][j + 1], // replacement
          distances[i + 1][j],     // extra token
          distances[i][j + 1],     // missing token
        );
    }
  }

  const changes = [];
  let i = 0;
  let j = 0;
  while (i < rows || j < cols) {
    if (i < rows && j < cols && actual[i] === expected[j]) {
      i += 1;
      j += 1;
    } else if (
      i < rows && j < cols
      && distances[i][j] === 1 + distances[i + 1][j + 1]
    ) {
      changes.push({ kind: 'changed', actual: actual[i], expected: expected[j] });
      i += 1;
      j += 1;
    } else if (i < rows && distances[i][j] === 1 + distances[i + 1][j]) {
      changes.push({ kind: 'extra', actual: actual[i], expected: null });
      i += 1;
    } else {
      changes.push({ kind: 'missing', actual: null, expected: expected[j] });
      j += 1;
    }
  }

  return { distance: distances[0][0], changes, truncated: false };
}

export function gradePracticeSession(questions, answers) {
  const items = questions.map((question) => {
    const answer = answers[question.id] ?? '';
    const normalized = normalizePracticeAnswer(answer);
    const accepted = [question.correct, ...question.accepted]
      .map(normalizePracticeAnswer);
    const correct = normalized !== '' && accepted.includes(normalized);
    // Compare against whichever accepted answer is closest, so permitted
    // comma variants aren't incorrectly listed as extra mistakes.
    const comparisons = accepted.map((reference) => ({
      reference,
      ...comparePracticeAnswer(normalized, reference),
    }));
    comparisons.sort((a, b) => a.distance - b.distance);
    const closest = comparisons[0];

    return {
      question,
      answer,
      correct,
      comparisonReference: closest.reference,
      differences: correct || !normalized ? [] : closest.changes,
      comparisonTruncated: !correct && Boolean(normalized) && closest.truncated,
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

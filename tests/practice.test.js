import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_QUESTIONS, APPROVED_PRACTICE_QUESTIONS, PRACTICE_CATEGORY } from '../src/practiceQuestions.js';
import {
  QUESTIONS_PER_PRACTICE,
  PRACTICE_DISTRIBUTION,
  createPracticeSession,
  gradePracticeSession,
  normalizePracticeAnswer,
} from '../src/practice.js';

const counts = (questions) => Object.fromEntries(
  Object.values(PRACTICE_CATEGORY).map((category) => [
    category, questions.filter((question) => question.category === category).length,
  ]),
);

// Deterministic sequence for repeatable shuffle tests.
function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('preserves all fifty supplied IDs and includes twelve additional practice items', () => {
  assert.equal(PRACTICE_QUESTIONS.length, 62);
  assert.equal(new Set(PRACTICE_QUESTIONS.map((item) => item.id)).size, 62);
  for (let id = 1; id <= 50; id += 1) {
    const code = `MX${String(id).padStart(2, '0')}`;
    assert.ok(PRACTICE_QUESTIONS.some((item) => item.id === code), code);
  }
  for (let id = 1; id <= 12; id += 1) {
    const code = `AX${String(id).padStart(2, '0')}`;
    assert.ok(PRACTICE_QUESTIONS.some((item) => item.id === code), code);
  }
});

test('question-bank entries have valid references and explicit correction explanations', () => {
  for (const item of PRACTICE_QUESTIONS) {
    assert.ok(item.incorrect.trim(), item.id);
    assert.ok(item.correct.trim(), item.id);
    assert.notEqual(item.correct, item.incorrect, item.id);
    assert.ok(item.explanation.trim(), item.id);
    assert.ok(Object.values(PRACTICE_CATEGORY).includes(item.category), item.id);
    assert.ok(!item.accepted.includes(item.incorrect), item.id);
    assert.ok(!item.accepted.includes(item.correct), item.id);
  }
});

test('two uncertain ka-Pilipino items remain preserved but excluded until expert review', () => {
  assert.equal(APPROVED_PRACTICE_QUESTIONS.length, 60);
  assert.deepEqual(
    PRACTICE_QUESTIONS.filter((item) => !item.approved).map((item) => item.id),
    ['MX22', 'MX23'],
  );
  assert.ok(PRACTICE_QUESTIONS.find((item) => item.id === 'MX22').reviewReason);
});

test('each session draws five unique items balanced 2 grammar, 2 spelling, 1 punctuation', () => {
  let previous = null;
  const rng = seededRandom();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const session = createPracticeSession(previous, { random: rng });
    assert.equal(session.questions.length, QUESTIONS_PER_PRACTICE);
    assert.equal(new Set(session.questions.map((item) => item.id)).size, 5);
    assert.deepEqual(counts(session.questions), {
      [PRACTICE_CATEGORY.SPELLING]: 2,
      [PRACTICE_CATEGORY.GRAMMAR]: 2,
      [PRACTICE_CATEGORY.PUNCTUATION]: 1,
    });
    assert.equal(PRACTICE_DISTRIBUTION.reduce((total, [, count]) => total + count, 0), 5);
    if (previous) {
      const previousIds = new Set(previous.questions.map((item) => item.id));
      const repeated = session.questions.filter((item) => previousIds.has(item.id));
      assert.equal(repeated.length, 0, 'No immediately repeated practice item');
    }
    previous = session;
  }
});

test('different seeds produce different initial random sets', () => {
  const a = createPracticeSession(null, { random: seededRandom(123) });
  const b = createPracticeSession(null, { random: seededRandom(456) });
  assert.notDeepEqual(a.questions.map((item) => item.id), b.questions.map((item) => item.id));
});

test('correct answers use a key, not the live essay checker or weighted scoring', () => {
  const questions = [
    PRACTICE_QUESTIONS.find((item) => item.id === 'MX01'),
    PRACTICE_QUESTIONS.find((item) => item.id === 'MX24'),
    PRACTICE_QUESTIONS.find((item) => item.id === 'MX45'),
    PRACTICE_QUESTIONS.find((item) => item.id === 'MX47'),
    PRACTICE_QUESTIONS.find((item) => item.id === 'AX08'),
  ];
  const answers = {
    MX01: questions[0].correct,
    MX24: questions[1].correct,
    MX45: questions[2].incorrect,
    MX47: 'Bumili ako ng mangga, saging at ubas.',
    AX08: '   ',
  };
  const result = gradePracticeSession(questions, answers);
  assert.equal(result.correctCount, 3);
  assert.equal(result.total, 5);
  assert.equal(result.percent, 60);
  assert.deepEqual(result.items.map((item) => item.correct), [true, true, false, true, false]);
});

test('normalization accepts harmless whitespace while preserving assessed punctuation and capitalization', () => {
  const item = PRACTICE_QUESTIONS.find((question) => question.id === 'MX38');
  assert.equal(normalizePracticeAnswer('  Bumili   ako ng gulay sa palengke .  '), item.correct);
  assert.equal(gradePracticeSession([item], { MX38: 'Bumili   ako ng gulay sa palengke .' }).percent, 100);
  assert.equal(gradePracticeSession([item], { MX38: 'bumili ako ng gulay sa palengke.' }).percent, 0);
  assert.equal(gradePracticeSession([item], { MX38: 'Bumili ako ng gulay sa palengke' }).percent, 0);
});

test('valid comma variations are accepted in list questions', () => {
  for (const id of ['MX35', 'MX47', 'MX48', 'MX49', 'MX50', 'AX10']) {
    const item = PRACTICE_QUESTIONS.find((question) => question.id === id);
    assert.ok(item.accepted.length >= 1, id);
    for (const accepted of item.accepted) {
      assert.equal(gradePracticeSession([item], { [id]: accepted }).percent, 100, id);
    }
  }
});

test('no answer receives zero points and scoring gracefully handles empty sets', () => {
  const session = createPracticeSession(null, { random: seededRandom(20) });
  assert.equal(gradePracticeSession(session.questions, {}).percent, 0);
  assert.equal(gradePracticeSession([], {}).percent, 0);
});

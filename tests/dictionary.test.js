import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/checker.js';
import {
  isKnownFilipinoWord,
  findJoinedWordSuggestion,
  findRepeatedLetterSuggestion,
  findDictionaryAdvisories,
} from '../src/dictionary/checkWords.js';

test('recognizes common Filipino vocabulary and common derived forms', () => {
  assert.equal(isKnownFilipinoWord('isang'), true);
  assert.equal(isKnownFilipinoWord('sirena'), true);
  assert.equal(isKnownFilipinoWord('nag-aaral'), true);
  assert.equal(isKnownFilipinoWord('maganda'), true);
  assert.equal(isKnownFilipinoWord('isangsirena'), false);
});

test('suggests inserting a space when two known words are joined', () => {
  assert.equal(findJoinedWordSuggestion('isangsirena'), 'isang sirena');
  assert.equal(findJoinedWordSuggestion('Isangsirena'), 'Isang sirena');
  assert.equal(findJoinedWordSuggestion('sirena'), null);
});

test('suggests removing doubled letter for a possible typo', () => {
  assert.equal(findRepeatedLetterSuggestion('magandaa'), 'maganda');
  assert.equal(findRepeatedLetterSuggestion('Magandaa'), 'Maganda');
});

test('adds unknown words as advisories without inventing a correction', () => {
  const issues = findDictionaryAdvisories('Ako ay zxqvblork.');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].original, 'zxqvblork');
  assert.equal(issues[0].replacement, null);
  assert.equal(issues[0].advisory, true);
  assert.equal(issues[0].ruleId, 'B8');
});

test('does not mark unfamiliar proper names as spelling errors', () => {
  const issues = findDictionaryAdvisories('Si Xyqblork ay narito.');
  assert.ok(!issues.some((issue) => issue.original === 'Xyqblork'));
});

test('detects joined words but does not deduct points on uncertain findings', () => {
  const correct = analyzeText('Ako ay isang sirena.');
  const joined = analyzeText('Ako ay isangsirena.');
  const issue = joined.issues.find((entry) => entry.original === 'isangsirena');

  assert.ok(issue);
  assert.equal(issue.replacement, 'isang sirena');
  assert.equal(issue.advisory, true);
  assert.equal(joined.advisoryCount, 1);
  assert.equal(joined.counts.Baybay, correct.counts.Baybay);
  assert.equal(joined.categoryScores.Baybay, correct.categoryScores.Baybay);
  assert.equal(joined.score, correct.score);
});

test('known deterministic spelling rules remain grade-bearing', () => {
  const result = analyzeText('Nuon pa man, kelangan naming magaral.');
  assert.ok(result.issues.some((issue) => issue.ruleId === 'B2' && issue.original === 'Nuon' && !issue.advisory));
  assert.ok(result.issues.some((issue) => issue.ruleId === 'B2' && issue.original === 'kelangan' && !issue.advisory));
  assert.ok(result.issues.some((issue) => issue.ruleId === 'B3' && issue.original === 'magaral' && !issue.advisory));
  assert.equal(result.counts.Baybay, 3);
  assert.equal(result.categoryScores.Baybay, 64);
});

test('advisories never replace overlapping deterministic highlights', () => {
  const result = analyzeText('mangga saging at ubas');
  const issues = result.issues;
  assert.ok(issues.some((issue) => issue.ruleId === 'P4'));
  for (let index = 0; index < issues.length; index += 1) {
    for (let next = index + 1; next < issues.length; next += 1) {
      if (issues[index].start === issues[index].end || issues[next].start === issues[next].end) continue;
      assert.ok(issues[index].end <= issues[next].start || issues[next].end <= issues[index].start);
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/checker.js';
import { findNgNangIssues } from '../src/rules/ngNang.js';

function checkSingle(sentence, expectedWrong, expectedCorrection) {
  const issues = findNgNangIssues(sentence);
  assert.equal(issues.length, 1, sentence);
  assert.equal(issues[0].ruleId, 'G7');
  assert.equal(issues[0].category, 'Gramatika');
  assert.equal(issues[0].original, expectedWrong);
  assert.equal(issues[0].replacement, expectedCorrection);
  assert.equal(sentence.slice(issues[0].start, issues[0].end), expectedWrong);
  assert.equal(
    sentence.slice(0, issues[0].start) + issues[0].replacement + sentence.slice(issues[0].end),
    sentence.replace(expectedWrong, expectedCorrection),
  );
}

test('G7 manner of an action: ng becomes nang', () => {
  checkSingle('Nag-aral siya ng mabuti.', 'ng', 'nang');
  checkSingle('Tumakbo siya ng mabilis.', 'ng', 'nang');
  checkSingle('Sumulat siya ng maayos.', 'ng', 'nang');
});

test('G7 object of a verb: nang becomes ng', () => {
  checkSingle('Kumain ako nang tinapay.', 'nang', 'ng');
  checkSingle('Bumili siya nang sorbetes.', 'nang', 'ng');
  checkSingle('Uminom siya nang tubig.', 'nang', 'ng');
});

test('G7 nominal possession/relationship: nang becomes ng', () => {
  checkSingle('Bahay nang kaibigan ko.', 'nang', 'ng');
  checkSingle('Pinuno nang grupo.', 'nang', 'ng');
});

test('G7 repeated action: ng becomes nang', () => {
  checkSingle('Takbo ng takbo ang bata.', 'ng', 'nang');
  checkSingle('Iyak ng iyak ang sanggol.', 'ng', 'nang');
});

test('G7 purpose / upang: ng becomes nang only in specific collocations', () => {
  checkSingle('Nag-aral siya ng makapasa.', 'ng', 'nang');
  checkSingle('Naghanda kami ng makauwi.', 'ng', 'nang');
});

test('G7 handles capitalization and multiple independent clauses', () => {
  checkSingle('NAG-ARAL SIYA NG MABUTI.', 'NG', 'NANG');
  const text = 'Sumulat siya ng maayos. Bumili siya nang tinapay.';
  const issues = findNgNangIssues(text);
  assert.equal(issues.length, 2);
  assert.equal(issues[0].replacement, 'nang');
  assert.equal(issues[1].replacement, 'ng');
  assert.equal(text.slice(issues[1].start, issues[1].end), 'nang');
});

test('G7 leaves correct and ambiguous ng/nang usage alone', () => {
  const sentences = [
    'Bumili siya ng tinapay.',
    'Kumain siya ng sorbetes.',
    'Bahay ng kaibigan ko.',
    'Tumakbo siya nang mabilis.',
    'Nag-aral siya nang mabuti.',
    'Takbo nang takbo ang bata.',
    'Nang dumating siya, umalis kami.',
    'Nag-aral siya nang makapasa.',
    'Naghahanap siya ng maayos na paraan.',
    'Sumulat siya ng maayos na liham.',
    'Bumili siya ng mabilis na sasakyan.',
    'Kumain siya nang dumating ang guro.',
    'Kumain kami ng marami.',
    'Ang lapis ng guro ay bago.',
  ];
  for (const sentence of sentences) {
    assert.deepEqual(findNgNangIssues(sentence), [], sentence);
  }
});

test('G7 does not infer syntax across newline boundaries or unfamiliar words', () => {
  assert.deepEqual(findNgNangIssues('Sumulat siya\nng maayos.'), []);
  assert.deepEqual(findNgNangIssues('Nagsalita siya ng napakaganda.'), []);
  assert.deepEqual(findNgNangIssues('Bumili siya nang kagamitan.'), []);
});

test('G7 issues count once in Gramatika and preserve weighted scoring', () => {
  const incorrect = analyzeText('Nag-aral siya ng mabuti.');
  const correct = analyzeText('Nag-aral siya nang mabuti.');
  assert.equal(incorrect.issues.filter((issue) => issue.ruleId === 'G7').length, 1);
  assert.equal(correct.issues.filter((issue) => issue.ruleId === 'G7').length, 0);
  assert.equal(incorrect.counts.Gramatika, correct.counts.Gramatika + 1);
  assert.equal(incorrect.categoryScores.Gramatika, correct.categoryScores.Gramatika - 12);
  assert.equal(incorrect.score, correct.score - 6);
});

test('G7 findings appear in post-submit analysis but do not change advisory counts', () => {
  const analysis = analyzeText('Kumain ako nang tinapay.');
  const issue = analysis.issues.find((entry) => entry.ruleId === 'G7');
  assert.ok(issue);
  assert.equal(issue.advisory, undefined);
  assert.equal(issue.original, 'nang');
  assert.equal(issue.replacement, 'ng');
});

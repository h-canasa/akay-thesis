import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/checker.js';

test('detects rin/din rule from the specification example', () => {
  const result = analyzeText('Kumain rin ako.');
  const issue = result.issues.find((item) => item.ruleId === 'G1');
  assert.equal(issue?.replacement, 'din');
});

test('detects raw/daw rule from the specification example', () => {
  const result = analyzeText('Pupunta daw siya.');
  const issue = result.issues.find((item) => item.ruleId === 'G2');
  assert.equal(issue?.replacement, 'raw');
});

test('detects common spelling correction', () => {
  const result = analyzeText('Kelangan ko ito.');
  const issue = result.issues.find((item) => item.ruleId === 'B2');
  assert.equal(issue?.replacement, 'Kailangan');
});

test('detects hyphen rule for nag-aaral', () => {
  const result = analyzeText('nagaaral ako.');
  const issue = result.issues.find((item) => item.ruleId === 'B3');
  assert.equal(issue?.replacement, 'nag-aaral');
});

test('detects capitalization without flagging unfinished current line punctuation', () => {
  const result = analyzeText('bumili ako ng mangga');
  assert.ok(result.issues.some((item) => item.ruleId === 'P1'));
  assert.ok(!result.issues.some((item) => item.ruleId === 'P3'));
});

test('flags missing ending punctuation after the user starts a new line', () => {
  const result = analyzeText('Bumili ako ng mangga\nSusunod na linya.');
  const issue = result.issues.find((item) => item.ruleId === 'P3');
  assert.equal(issue?.replacement, '.');
});

test('detects comma-separated list example', () => {
  const result = analyzeText('Bumili ako ng mangga saging at ubas.');
  const issue = result.issues.find((item) => item.ruleId === 'P4');
  assert.equal(issue?.replacement, 'mangga, saging, at ubas');
});

test('distinguishes diyan and riyan usage', () => {
  const afterVowel = analyzeText('Pumunta ka diyan.');
  const riyanIssue = afterVowel.issues.find((item) => item.ruleId === 'G6');
  assert.equal(riyanIssue?.replacement, 'riyan');

  const afterConsonant = analyzeText('Tumigil riyan.');
  const diyanIssue = afterConsonant.issues.find((item) => item.ruleId === 'G6');
  assert.equal(diyanIssue?.replacement, 'diyan');

  const afterY = analyzeText('Maghintay diyan.');
  const afterYIssue = afterY.issues.find((item) => item.ruleId === 'G6');
  assert.equal(afterYIssue?.replacement, 'riyan');

  const sentenceInitial = analyzeText('Riyan ka muna.');
  const sentenceInitialIssue = sentenceInitial.issues.find((item) => item.ruleId === 'G6');
  assert.equal(sentenceInitialIssue?.replacement, 'Diyan');
});

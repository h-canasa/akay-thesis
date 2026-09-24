import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, normalizeEditorText } from '../src/checker.js';

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

test('normalizes pasted text and still detects issues', () => {
  const pasted = [
    'Ang Aking Buhay Bilang Mag-aaral\r\n',
    'Araw araw akong pumapasok mula lunes hanggang biyernes.\u00a0',
    'Nuon pa man, kelangan naming magaral nang mabuti.\r\n',
    'Sumama din ako at kumain rin kami. Pupunta daw sila.\r\n',
  ].join('');

  const normalized = normalizeEditorText(pasted);
  assert.ok(!normalized.includes('\r'));
  assert.ok(!normalized.includes('\u00a0'));

  const result = analyzeText(normalized);
  const replacements = result.issues.map((item) => item.replacement.toLowerCase());

  assert.ok(replacements.includes('araw-araw'));
  assert.ok(replacements.includes('noon'));
  assert.ok(replacements.includes('kailangan'));
  assert.ok(replacements.includes('mag-aral'));
  assert.ok(replacements.includes('lunes'));
  assert.ok(replacements.includes('biyernes'));
  assert.ok(result.issues.some((item) => item.ruleId === 'G1'));
  assert.ok(result.issues.some((item) => item.ruleId === 'G2'));
});

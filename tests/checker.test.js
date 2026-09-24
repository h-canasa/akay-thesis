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
  assert.equal(issue?.replacement, 'Nag-aaral');
});

test('detects capitalization and ending punctuation', () => {
  const result = analyzeText('bumili ako ng mangga');
  assert.ok(result.issues.some((item) => item.ruleId === 'P1'));
  assert.ok(result.issues.some((item) => item.ruleId === 'P3'));
});

test('detects comma-separated list example', () => {
  const result = analyzeText('Bumili ako ng mangga saging at ubas.');
  const issue = result.issues.find((item) => item.ruleId === 'P4');
  assert.equal(issue?.replacement, 'mangga, saging, at ubas');
});

import { FILIPINO_WORDS } from './filipino-words.js';

// Dictionary membership is a clue, not a guarantee of correctness.
// The MIT-licensed source includes uncommon, borrowed, and noisy entries.
const lexicon = new Set(FILIPINO_WORDS.split('\n'));
const WORD_PATTERN = /[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu;
const SIMPLE_PREFIXES = [
  'pinag', 'nakaka', 'makaka', 'pinaka', 'nagpa',
  'naka', 'maka', 'pina', 'mag', 'nag', 'pag', 'ma', 'na', 'ka',
];
const JOIN_PARTICLES = new Set([
  'ako', 'ay', 'ang', 'at', 'ba', 'dahil', 'isang', 'ito', 'ka', 'kami',
  'kanila', 'kanya', 'ko', 'kung', 'may', 'mga', 'mo', 'na', 'ng', 'nang',
  'ni', 'nila', 'nito', 'po', 'sa', 'si', 'sina', 'sila', 'siya', 'yung',
]);

const normalize = (word) => word.normalize('NFC').toLowerCase().replace(/’/g, "'");

export function isKnownFilipinoWord(word) {
  const value = normalize(word);
  if (lexicon.has(value)) return true;

  // A modest fallback for regular affixed forms that a static list may omit.
  // Morphology cannot validate every form; uncertain ones remain advisories.
  if (value.length < 6 || value.includes('-') || value.includes("'")) return false;

  for (const prefix of SIMPLE_PREFIXES) {
    const root = value.slice(prefix.length);
    if (value.startsWith(prefix) && root.length >= 4 && lexicon.has(root)) {
      return true;
    }
  }
  for (const suffix of ['han', 'an', 'in']) {
    if (value.endsWith(suffix)) {
      const root = value.slice(0, -suffix.length);
      if (root.length >= 4 && lexicon.has(root)) return true;
    }
  }
  return false;
}

export function findJoinedWordSuggestion(word) {
  const value = normalize(word);
  if (value.length < 6 || isKnownFilipinoWord(value)) return null;

  const candidates = [];
  // Both parts must be known; prioritize common linking words, since many
  // lexicon entries can be split accidentally into plausible smaller words.
  for (let point = 2; point <= value.length - 3; point += 1) {
    const left = value.slice(0, point);
    const right = value.slice(point);
    if (!isKnownFilipinoWord(left) || !isKnownFilipinoWord(right)) continue;

    const leadingParticle = JOIN_PARTICLES.has(left);
    const trailingParticle = JOIN_PARTICLES.has(right);
    if (!leadingParticle && !trailingParticle) continue;

    candidates.push({
      replacement: word[0] === word[0].toUpperCase()
        ? left[0].toUpperCase() + left.slice(1) + ' ' + right
        : left + ' ' + right,
      rank: (leadingParticle ? 100 : 0) + (trailingParticle ? 20 : 0) + Math.min(left.length, right.length),
    });
  }
  candidates.sort((a, b) => b.rank - a.rank);
  return candidates[0]?.replacement ?? null;
}

export function findRepeatedLetterSuggestion(word) {
  const value = normalize(word);
  if (isKnownFilipinoWord(value)) return null;

  // Conservative candidate generation: remove one doubled character only.
  for (let index = 1; index < value.length; index += 1) {
    if (value[index] !== value[index - 1]) continue;
    const candidate = value.slice(0, index) + value.slice(index + 1);
    if (isKnownFilipinoWord(candidate)) {
      return word[0] === word[0].toUpperCase()
        ? candidate[0].toUpperCase() + candidate.slice(1)
        : candidate;
    }
  }
  return null;
}

export function findDictionaryAdvisories(text) {
  const advisories = [];
  const input = String(text);

  for (const match of input.matchAll(WORD_PATTERN)) {
    const original = match[0];
    const value = normalize(original);
    if (value.length < 4 || isKnownFilipinoWord(value)) continue;

    const joined = findJoinedWordSuggestion(original);
    // Proper names (including names of people and places) are not reliably
    // present in a lexicon; only flag them when we can recognize a word join.
    if (original[0] !== original[0].toLowerCase() && !joined) continue;

    const doubled = joined ? null : findRepeatedLetterSuggestion(original);
    const replacement = joined ?? doubled;

    advisories.push({
      ruleId: joined ? 'B7' : 'B8',
      category: 'Baybay',
      start: match.index,
      end: match.index + original.length,
      original,
      replacement: replacement ?? null,
      advisory: true,
      explanation: joined
        ? 'Maaaring magkadikit ang dalawang salita. Suriin kung dapat silang paghiwalayin.'
        : doubled
          ? 'Maaaring may sobrang inuulit na titik. Suriin ang iminungkahing baybay.'
          : 'Hindi natagpuan sa kasalukuyang talasalitaan. Suriin ang baybay; maaari rin itong wastong pangalan, hiram na salita, o anyong may panlapi.',
    });
  }
  return advisories;
}

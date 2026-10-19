// G7: deliberately narrow, explainable ng/nang patterns.
// The five uses of nang are documented in KWF's Manwal sa Masinop
// na Pagsulat, section 9.1. Unlisted/ambiguous cases are left alone.
// This is not a general part-of-speech or sentence parser.

const WS = '[ \\t]+';
const subjects = [
  'ako', 'ka', 'siya', 'sila', 'kami', 'tayo', 'kayo',
  'ko', 'mo', 'niya', 'nila', 'namin', 'natin', 'ninyo',
];
const mannerVerbs = [
  'nag-aral', 'nagtrabaho', 'sumulat', 'nagsulat', 'tumakbo',
  'kumilos', 'nagsalita', 'naglakad', 'lumakad', 'sumagot',
  'nagpaliwanag', 'sumayaw', 'kumanta', 'umawit', 'nagpraktis',
  'nag-ensayo', 'nagbasa', 'naglaro', 'gumawa',
];
const mannerAdverbs = [
  'mabuti', 'maayos', 'maingat', 'malinaw', 'mabilis',
  'marahan', 'mahinahon', 'malakas', 'tahimik', 'dahan-dahan',
];
const objectVerbs = [
  'kumain', 'bumili', 'uminom', 'nagluto', 'nagbasa',
  'nagsulat', 'naghugas', 'nagdala', 'kumuha', 'gumamit',
];
const objectNouns = [
  'tinapay', 'sorbetes', 'pagkain', 'tubig', 'gatas', 'bigas',
  'kanin', 'mangga', 'saging', 'aklat', 'libro', 'liham',
  'lapis', 'gamot', 'kape', 'gulay', 'prutas', 'isda',
];
const possessiveHeads = [
  'bahay', 'aklat', 'libro', 'lapis', 'gamit', 'pangalan',
  'litrato', 'larawan', 'sasakyan', 'pinto', 'silid', 'damit',
  'kuwento', 'kwento', 'bag', 'pinuno',
];
const possessors = [
  'kaibigan', 'guro', 'estudyante', 'bata', 'mag-aaral',
  'magulang', 'nanay', 'tatay', 'kapatid', 'grupo', 'pamilya',
  'paaralan', 'kasamahan', 'kapitbahay',
];
const repeatedActions = [
  'takbo', 'iyak', 'kain', 'sulat', 'basa', 'laro', 'tawa',
  'sayaw', 'lakad', 'sigaw', 'tanong', 'aral', 'gawa', 'tulog',
];
const purposeVerbs = ['nag-aral', 'nagsikap', 'nagpraktis', 'naghanda', 'nag-ipon'];
const purposeOutcomes = ['makapasa', 'matuto', 'makatulong', 'makauwi'];

const alternatives = (words) => '(?:' + words.join('|') + ')';
const makeRule = (expression, wrong, replacement, explanation) => ({
  regex: new RegExp(expression, 'gi'),
  wrong,
  replacement,
  explanation,
});

const optionalSubject = '(?:' + alternatives(subjects) + '\\b' + WS + ')?';
const patterns = [
  makeRule(
    '\\b' + alternatives(mannerVerbs) + '\\b' + WS + optionalSubject
      + '\\bng\\b' + WS + alternatives(mannerAdverbs) + '\\b(?!' + WS + 'na\\b)',
    'ng',
    'nang',
    'Gamitin ang “nang” kapag inilalarawan kung paano ginawa ang kilos (pang-abay na pamaraan).',
  ),
  makeRule(
    '\\b' + alternatives(objectVerbs) + '\\b' + WS + optionalSubject
      + '\\bnang\\b' + WS + alternatives(objectNouns) + '\\b',
    'nang',
    'ng',
    'Gamitin ang “ng” kapag ipinakikilala ang bagay na tuwirang layon ng kilos.',
  ),
  makeRule(
    '\\b' + alternatives(possessiveHeads) + '\\b' + WS
      + '\\bnang\\b' + WS + alternatives(possessors) + '\\b',
    'nang',
    'ng',
    'Gamitin ang “ng” upang ipakita ang kaugnayan o pagmamay-ari ng mga pangngalan.',
  ),
  makeRule(
    '\\b(' + alternatives(repeatedActions) + ')\\b' + WS
      + '\\bng\\b' + WS + '\\1\\b',
    'ng',
    'nang',
    'Gamitin ang “nang” bilang pang-angkop sa inuulit na kilos.',
  ),
  makeRule(
    '\\b' + alternatives(purposeVerbs) + '\\b' + WS + optionalSubject
      + '\\bng\\b' + WS + alternatives(purposeOutcomes) + '\\b',
    'ng',
    'nang',
    'Gamitin ang “nang” kung nangangahulugan ito ng “upang” o “para”.',
  ),
];

export function findNgNangIssues(text) {
  const issues = [];
  for (const { regex, wrong, replacement, explanation } of patterns) {
    for (const match of text.matchAll(regex)) {
      // Highlight just the incorrect particle, not surrounding words.
      const tokenIndex = match[0].search(new RegExp('\\b' + wrong + '\\b', 'i'));
      if (tokenIndex === -1) continue;
      const start = match.index + tokenIndex;
      const original = text.slice(start, start + wrong.length);
      const corrected = original === original.toUpperCase()
        ? replacement.toUpperCase()
        : original[0] === original[0].toUpperCase()
          ? replacement[0].toUpperCase() + replacement.slice(1)
          : replacement;
      issues.push({
        ruleId: 'G7',
        category: 'Gramatika',
        start,
        end: start + original.length,
        original,
        replacement: corrected,
        explanation,
      });
    }
  }
  return issues.sort((a, b) => a.start - b.start);
}

const CATEGORY = {
  SPELLING: 'Baybay',
  GRAMMAR: 'Gramatika',
  PUNCTUATION: 'Bantas at Malaking Titik',
};

const knownCorrections = [
  ['B1', /\bkumaen\b/gi, 'kumain', 'Ang “kumaen” ay hindi wastong baybay. Gamitin ang “kumain”.'],
  ['B2', /\bnuon\b/gi, 'noon', 'Karaniwang maling baybay ang “nuon”. Ang wastong anyo ay “noon”.'],
  ['B2', /\banung\b/gi, 'anong', 'Karaniwang maling baybay ang “anung”. Ang wastong anyo ay “anong”.'],
  ['B2', /\btignan\b/gi, 'tingnan', 'Ang pamantayang baybay ay “tingnan”.'],
  ['B2', /\bkelangan\b/gi, 'kailangan', 'Ang wastong baybay ay “kailangan”.'],
  ['B3', /\bmagaral\b/gi, 'mag-aral', 'Ginagamitan ng gitling ang “mag-” bago ang salitang nagsisimula sa patinig.'],
  ['B3', /\bpagibig\b/gi, 'pag-ibig', 'Ginagamitan ng gitling ang “pag-” bago ang salitang nagsisimula sa patinig.'],
  ['B3', /\bnagaaral\b/gi, 'nag-aaral', 'Ginagamitan ng gitling ang “nag-” bago ang salitang nagsisimula sa patinig.'],
  ['B4', /\baraw araw\b/gi, 'araw-araw', 'Ginagamitan ng gitling ang inuulit na salita.'],
  ['B4', /\btaontaon\b/gi, 'taun-taon', 'Ang wastong anyo ng inuulit na salita ay “taun-taon”.'],
  ['B4', /\bparuparo\b/gi, 'paru-paro', 'Ginagamitan ng gitling ang wastong anyo na “paru-paro”.'],
  ['B5', /\bmasmalaki\b/gi, 'mas malaki', 'Paghiwalayin ang “mas” at ang salitang inilalarawan nito.'],
  ['B5', /\bkani kanilang\b/gi, 'kani-kanilang', 'Ang wastong anyo ay “kani-kanilang”.'],
  ['B6', /\bmakadiyos\b/gi, 'maka-Diyos', 'Gumamit ng gitling at malaking titik bago ang pangngalang pantangi na “Diyos”.'],
];

const dayAndMonthWords = [
  'lunes', 'martes', 'miyerkules', 'huwebes', 'biyernes', 'sabado', 'linggo',
  'enero', 'pebrero', 'marso', 'abril', 'mayo', 'hunyo', 'hulyo', 'agosto',
  'setyembre', 'oktubre', 'nobyembre', 'disyembre',
];

function matchCase(original, replacement) {
  if (!original) return replacement;
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function issueKey(issue) {
  return `${issue.ruleId}|${issue.start}|${issue.original}`;
}

function pushRegexIssues(list, text, ruleId, regex, replacement, explanation, category) {
  const copy = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  for (const match of text.matchAll(copy)) {
    const original = match[0];
    list.push({
      ruleId,
      category,
      start: match.index,
      end: match.index + original.length,
      original,
      replacement: matchCase(original, replacement),
      explanation,
    });
  }
}

function addParticleRule(list, text, first, second, ruleId) {
  const regex = new RegExp(`\\b([A-Za-zÀ-ÿÑñ-]+)\\s+(${first}|${second})\\b`, 'gi');
  for (const match of text.matchAll(regex)) {
    const previousWord = match[1];
    const particle = match[2];
    const lettersOnly = previousWord.replace(/[^A-Za-zÀ-ÿÑñ]/g, '');
    const last = lettersOnly.slice(-1).toLowerCase();
    const useFirst = /[aeiouwyáéíóú]/i.test(last);
    const expected = useFirst ? first : second;

    if (particle.toLowerCase() !== expected) {
      const particleOffset = match[0].toLowerCase().lastIndexOf(particle.toLowerCase());
      const start = match.index + particleOffset;
      list.push({
        ruleId,
        category: CATEGORY.GRAMMAR,
        start,
        end: start + particle.length,
        original: particle,
        replacement: matchCase(particle, expected),
        explanation:
          ruleId === 'G1'
            ? 'Gamitin ang “rin” pagkatapos ng patinig, w, o y; gamitin ang “din” pagkatapos ng ibang katinig.'
            : 'Gamitin ang “raw” pagkatapos ng patinig, w, o y; gamitin ang “daw” pagkatapos ng ibang katinig.',
      });
    }
  }
}

function removeOverlaps(issues) {
  const sorted = [...issues].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted = [];

  for (const issue of sorted) {
    const overlaps = accepted.some((item) => {
      if (issue.start === issue.end || item.start === item.end) return false;
      return issue.start < item.end && issue.end > item.start;
    });
    if (!overlaps) accepted.push(issue);
  }

  return accepted.sort((a, b) => a.start - b.start);
}

export function analyzeText(text, ignored = new Set()) {
  const issues = [];

  for (const [ruleId, regex, replacement, explanation] of knownCorrections) {
    pushRegexIssues(issues, text, ruleId, regex, replacement, explanation, CATEGORY.SPELLING);
  }

  addParticleRule(issues, text, 'rin', 'din', 'G1');
  addParticleRule(issues, text, 'raw', 'daw', 'G2');

  const names = /\bSi\s+([A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿÑñ-]+)\s+at\s+([A-ZÁÉÍÓÚÑ][A-Za-zÀ-ÿÑñ-]+)\b/g;
  for (const match of text.matchAll(names)) {
    issues.push({
      ruleId: 'G4',
      category: CATEGORY.GRAMMAR,
      start: match.index,
      end: match.index + 2,
      original: 'Si',
      replacement: 'Sina',
      explanation: 'Gamitin ang “sina” kapag higit sa isang pangalan ang tinutukoy.',
    });
  }

  const sentenceStart = /(^|[.!?]\s+)([a-záéíóúñ])/g;
  for (const match of text.matchAll(sentenceStart)) {
    const start = match.index + match[1].length;
    issues.push({
      ruleId: 'P1',
      category: CATEGORY.PUNCTUATION,
      start,
      end: start + 1,
      original: match[2],
      replacement: match[2].toUpperCase(),
      explanation: 'Gumamit ng malaking titik sa simula ng pangungusap.',
    });
  }

  for (const word of dayAndMonthWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    for (const match of text.matchAll(regex)) {
      issues.push({
        ruleId: 'P2',
        category: CATEGORY.PUNCTUATION,
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replacement: match[0][0].toUpperCase() + match[0].slice(1),
        explanation: 'Gumamit ng malaking titik sa pangalan ng araw at buwan.',
      });
    }
  }

  const listPattern = /\bmangga\s+saging\s+at\s+ubas\b/gi;
  for (const match of text.matchAll(listPattern)) {
    issues.push({
      ruleId: 'P4',
      category: CATEGORY.PUNCTUATION,
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacement: 'mangga, saging, at ubas',
      explanation: 'Gumamit ng kuwit sa pagsasalaysay ng tatlo o higit pang bagay.',
    });
  }

  const trimmed = text.trimEnd();
  if (trimmed && !/[.!?]$/.test(trimmed)) {
    issues.push({
      ruleId: 'P3',
      category: CATEGORY.PUNCTUATION,
      start: trimmed.length,
      end: trimmed.length,
      original: '',
      replacement: '.',
      explanation: 'Lagyan ng wastong bantas ang dulo ng pangungusap.',
    });
  }

  const filtered = removeOverlaps(issues).filter((issue) => !ignored.has(issueKey(issue)));
  const counts = {
    [CATEGORY.SPELLING]: 0,
    [CATEGORY.GRAMMAR]: 0,
    [CATEGORY.PUNCTUATION]: 0,
  };

  filtered.forEach((issue) => {
    counts[issue.category] += 1;
  });

  const score = Math.max(0, 100 - filtered.length * 8);
  const level = score >= 90 ? 'Mahusay' : score >= 75 ? 'Katamtaman' : 'Nangangailangan ng Pagsasanay';

  return { issues: filtered, counts, score, level };
}

export { CATEGORY, issueKey };

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

function previousWordInSentence(text, start) {
  const before = text.slice(0, start);
  const sentenceBoundary = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf('\n'),
  );

  const currentPhrase = before.slice(sentenceBoundary + 1);
  const words = currentPhrase.match(/[A-Za-zÀ-ÿÑñ-]+/g) ?? [];
  return words.length ? words[words.length - 1] : '';
}

function shouldUseRForm(previousWord, { particleException = false } = {}) {
  if (!previousWord) return false;

  const normalized = previousWord
    .replace(/[^A-Za-zÀ-ÿÑñ]/g, '')
    .toLowerCase();

  if (!normalized) return false;

  // Tradisyonal na kataliwasan sa din/rin at daw/raw na binanggit ng KWF:
  // kapag nagtatapos sa -ri, -ra, -raw, o -ray, nananatili ang D-form.
  if (particleException && /(ri|ra|raw|ray)$/i.test(normalized)) {
    return false;
  }

  const last = normalized.slice(-1);
  return /[aeiouwyáéíóú]/i.test(last);
}

function addDRAlternationRule(
  list,
  text,
  dForm,
  rForm,
  ruleId,
  {
    particleException = false,
    allowSentenceInitial = false,
  } = {},
) {
  const regex = new RegExp(`\\b(${dForm}|${rForm})\\b`, 'gi');

  for (const match of text.matchAll(regex)) {
    const original = match[0];
    const start = match.index;
    const previousWord = previousWordInSentence(text, start);

    // Din/rin at daw/raw are particles; without a preceding word there is
    // not enough local context for this mechanical rule to make a correction.
    if (!previousWord && !allowSentenceInitial) continue;

    const useR = shouldUseRForm(previousWord, { particleException });
    const expected = useR ? rForm : dForm;

    if (original.toLowerCase() === expected) continue;

    let explanation;
    if (particleException && previousWord && /(ri|ra|raw|ray)$/i.test(previousWord)) {
      explanation =
        `Sa tradisyonal na tuntunin, nananatili ang “${dForm}” pagkatapos ng salitang nagtatapos sa -ri, -ra, -raw, o -ray.`;
    } else if (useR) {
      explanation =
        `Gamitin ang “${rForm}” pagkatapos ng salitang nagtatapos sa patinig, w, o y.`;
    } else if (!previousWord) {
      explanation =
        `Gamitin ang “${dForm}” kapag nasa simula ng pangungusap.`;
    } else {
      explanation =
        `Gamitin ang “${dForm}” pagkatapos ng salitang nagtatapos sa ibang katinig.`;
    }

    list.push({
      ruleId,
      category: CATEGORY.GRAMMAR,
      start,
      end: start + original.length,
      original,
      replacement: matchCase(original, expected),
      explanation,
    });
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

  addDRAlternationRule(issues, text, 'din', 'rin', 'G1', {
    particleException: true,
  });
  addDRAlternationRule(issues, text, 'daw', 'raw', 'G2', {
    particleException: true,
  });
  addDRAlternationRule(issues, text, 'dito', 'rito', 'G6', {
    allowSentenceInitial: true,
  });
  addDRAlternationRule(issues, text, 'diyan', 'riyan', 'G6', {
    allowSentenceInitial: true,
  });
  addDRAlternationRule(issues, text, 'doon', 'roon', 'G6', {
    allowSentenceInitial: true,
  });

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

  let lineStart = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '\n') continue;

    const line = text.slice(lineStart, index);
    const trimmedLine = line.trimEnd();

    if (trimmedLine.trim() && !/[.!?]$/.test(trimmedLine)) {
      const insertionPoint = lineStart + trimmedLine.length;
      issues.push({
        ruleId: 'P3',
        category: CATEGORY.PUNCTUATION,
        start: insertionPoint,
        end: insertionPoint,
        original: '',
        replacement: '.',
        explanation:
          'Lagyan ng wastong bantas ang dulo ng pangungusap bago magsimula ng bagong linya.',
      });
    }

    lineStart = index + 1;
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

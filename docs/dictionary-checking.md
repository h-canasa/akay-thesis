# Hybrid Filipino spelling checker — prototype scope

Akay combines its **deterministic rules** with an **offline dictionary layer**. The dictionary is a spelling reference, not a source of truth for all Filipino language varieties.

## Vocabulary source and license

- Derived from [Austin Zuniga's Filipino word list](https://github.com/AustinZuniga/Filipino-wordlist) (MIT license, copyright 2018 Earl Austin Avila Zuniga).
- The list is lowercased, Unicode-NFC normalized, deduplicated, and filtered to word-like entries. See `src/dictionary/filipino-words.js` and `docs/licenses/filipino-wordlist-MIT.txt`.
- **134,695 cleaned entries** are bundled directly with Akay. Some source entries contain typos, names, borrowed vocabulary, and inflected forms; the resulting list is not independently verified.
- No student text is sent to an external service or API for these checks.

## Algorithm

1. Run existing rule-based grammar, spelling, and punctuation checks. Keep those rule matches as the **grade-bearing** issues.
2. Tokenize the essay into words, including Filipino accented letters, internal hyphens, and apostrophes.
3. Check whether each word is present in the lexicon. As a limited fallback, recognize selected prefix and suffix constructions with recognized roots.
4. For an unfamiliar word, test for two recognized words accidentally joined together, prioritizing common connectors: `isangsirena → isang sirena`.
5. Otherwise, try conservative duplicate-letter removal: `magandaa → maganda`. If neither produces an appropriate candidate, mark the word `Walang tiyak na pagwawasto`.
6. Avoid showing suggestions for unrecognized capitalized proper names without recognizable joined-word splits.
7. Do not display a dictionary advisory over an already highlighted rule-based error; show existing deterministic rules first.

## Scoring policy

**Dictionary-only results are advisory and never deduct points.** A purple dotted underline identifies a `Posibleng isyu`; its correction card explicitly says it is not included in the grade. Existing deterministic checks retain the 12-point-per-counted-issue category deduction and overall weighted average:

```text
Overall = round((Baybay * 1.0 + Gramatika * 1.5 + Bantas * 0.5) / 3.0)
```

The main live editor may accept a suggested separation or double-letter correction, or hide an advisory with `Huwag Pansinin`. An unknown word with no specific candidate **does not offer Tanggapin**, to prevent accidental replacement by generic placeholder text.

Essay Exam Mode remains completely feedback-free until `Ipasa ang Sanaysay`, and submitted essay and score remain frozen while students inspect the contextual Mungkahi cards.

## Limitations relevant to thesis methodology

- A lexicon mismatch is **not evidence of incorrect spelling**. Rare, regional, technical, borrowed, derived, and newly coined words may be legitimate.
- Lexicon membership is **not evidence of correctness**, either; the source list contains unverified forms. Some misspellings may be accepted by it.
- Affix handling is intentionally shallow and does not replace a complete Filipino morphological analyzer.
- Word splitting can produce incorrect suggestions in ambiguous cases.
- Where a word spans an existing rule-based highlight (such as a capitalization correction at the beginning of a sentence), the rule takes priority and the dictionary advisory is not shown for that same span.
- The score is a measure of **detected rule violations**, not a general assessment of essay meaning, coherence, structure, or writing proficiency.
- Formal pre-/post-test studies should validate accuracy with manually annotated essays and distinguish advisories from countable errors. A human rater may be necessary.

## Developer check

Run `npm test` for deterministic rules and dictionary regressions and `npm run build` for bundling checks.

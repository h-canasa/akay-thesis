# Akay Mock Test (formative practice)

## Question bank

- Student-contributed questions: **MX01–MX50** (50).
- Akay additions: **AX01–AX12** (12).
- Active practice questions: **60**; MX22 and MX23 are preserved in the source list but intentionally disabled until a Filipino-language reviewer confirms the meaning and corrected form of ka-Pilipino and ka-Amerikana in context.
- Category balance per attempt: **2 Gramatika, 2 Baybay, 1 Bantas at Malaking Titik**.
- The app selects unique questions by a shuffled deck for each category. It tries not to repeat questions from the immediately preceding attempt even when reshuffling a depleted deck.

The bank is in `src/practiceQuestions.js`, and selection/grading algorithms are in `src/practice.js`. Original IDs were kept to trace student submissions. The additional IDs have the AX prefix.

## Practice behavior

- The student sees **one incorrect sentence at a time**, with a blank rewriting field.
- The flow is **strictly linear**: Question 1 → 2 → 3 → 4 → 5. The student must write a non-blank answer to enable Susunod/Ipasa. There is no Back or Skip action, and earlier answers cannot be revisited within an attempt.
- **No suggestions, accepted answers, or performance score** are shown before the student submits the fifth item.
- After submitting, students see their **correct answer count out of five**, percentage, and expandable reviews of **all five** sentences. Each review shows the incorrect source sentence, the student's response, the reference correction, accepted alternatives where provided, **all token-level differences against the closest accepted answer**, and a Filipino explanation of the original issue.
- Clicking `Subukan Muli` draws a new randomized set.
- This feature is **practice only**, separate from Essay Exam Mode. It keeps answers in client memory only: refresh/navigation clears progress. It does not collect research scores.

## Scoring policy

Practice grading **does not call Akay's essay checker**. Each item is worth one point based on a curated correction key.

```text
Practice score = round((correct answers / 5) × 100)
```

The code normalizes harmless whitespace, spaces before punctuation, and typographic quote characters, **but retains capitalization, wording, hyphenation, and terminal punctuation** because those are essential targets in the question bank.

For list-punctuation questions (MX35, MX47–MX50, AX10), both a comma with and without the optional serial comma are accepted. Other correct paraphrases or regional variants not explicitly encoded may still be marked incorrect; that is an acknowledged limitation of deterministic exact-key grading, not a claim that the student's Filipino is wrong.

### Unplanned student edits and feedback

The **answer key grades the entire rewritten sentence**, not only the original error. A student who corrects `daw → raw` but changes `Pupunta → Papunta` or `namin → ninyo` will not receive full credit. Previously, the feedback described only the prewritten error and hid the additional changes.

The results page now aligns the student's response against the **nearest acceptable reference answer** and lists differences individually. Example for MX29:

- Prompt: `Pupunta daw si Ana sa bahay namin.`
- Reference: `Pupunta raw si Ana sa bahay namin.`
- Student answer: `Papunta raw si Ana sa bahay ninyo.`
- Differences shown: `Papunta → Pupunta` and `ninyo → namin`.

This is an **answer-key comparison**, not a Filipino linguistic analysis. It can find deviations, including extra words, missing words, capitalization, and punctuation, but it cannot reliably explain *why* every alternative is linguistically incorrect. The canned rule explanation is therefore explicitly labeled **Paliwanag sa orihinal na isyu** and shown separately from additional differences.

Very long responses are capped for token-level comparison so that pathological input cannot stall the browser. Students' textbox length is limited to 500 characters.

### Review findings

MX22 and MX23 were held back because the terms and meaning are unclear enough that automatically marking students wrong could be unfair. They should be reviewed by a Filipino-language expert before reactivation. Several questions intentionally focus on informal abbreviations versus standard essay conventions (MX01–MX04), so the instruction asks students to rewrite the sentence in standard Filipino.

The source bank should undergo a quick language-expert review (including acceptability of alternative forms, grammar, and punctuation) before being used for formal evaluation. No practice score should be conflated with the pre-test/post-test essay's weighted writing-quality score.

## Maintenance

When adding a new question, provide a unique ID, category, incorrect sentence, corrected sentence, and explanation. Add accepted alternatives with `accepted: []`. If the answer is not linguistically verified, set `approved: false` with a reason. Run `npm test` and `npm run build` before deploying.

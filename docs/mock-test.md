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
- They can go forward and back; a blank item can be skipped and is graded incorrect.
- **No suggestions, accepted answers, or performance score** are shown before the student submits the fifth item.
- After submitting, students see their **correct answer count out of five**, percentage, and expandable reviews of **all five** sentences. Each review shows the incorrect source sentence, the student's response, the reference correction, accepted alternatives where provided, and a Filipino explanation.
- Clicking `Subukan Muli` draws a new randomized set.
- This feature is **practice only**, separate from Essay Exam Mode. It keeps answers in client memory only: refresh/navigation clears progress. It does not collect research scores.

## Scoring policy

Practice grading **does not call Akay's essay checker**. Each item is worth one point based on a curated correction key.

```text
Practice score = round((correct answers / 5) × 100)
```

The code normalizes harmless whitespace, spaces before punctuation, and typographic quote characters, **but retains capitalization, wording, hyphenation, and terminal punctuation** because those are essential targets in the question bank.

For list-punctuation questions (MX47–MX50, AX10), both a comma with and without the optional serial comma are accepted. Other correct paraphrases or regional variants not explicitly encoded may still be marked incorrect; that is an acknowledged limitation of deterministic exact-key grading, not a claim that the student's Filipino is wrong.

### Review findings

MX22 and MX23 were held back because the terms and meaning are unclear enough that automatically marking students wrong could be unfair. They should be reviewed by a Filipino-language expert before reactivation. Several questions intentionally focus on informal abbreviations versus standard essay conventions (MX01–MX04), so the instruction asks students to rewrite the sentence in standard Filipino.

The source bank should undergo a quick language-expert review (including acceptability of alternative forms, grammar, and punctuation) before being used for formal evaluation. No practice score should be conflated with the pre-test/post-test essay's weighted writing-quality score.

## Maintenance

When adding a new question, provide a unique ID, category, incorrect sentence, corrected sentence, and explanation. Add accepted alternatives with `accepted: []`. If the answer is not linguistically verified, set `approved: false` with a reason. Run `npm test` and `npm run build` before deploying.

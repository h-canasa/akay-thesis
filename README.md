# Akay

Live demo: https://h-canasa.github.io/akay-thesis/

**Kaagapay sa Wastong Pagsulat**

Akay is a thesis prototype for a Filipino writing checker and practice web app. Version 1 focuses on a lightweight, browser-based demo with no accounts and no persistent storage.

## Version 1 scope

- Homepage with the writing editor
- Rule-based Filipino spelling, punctuation/capitalization, and selected grammar checks
- Suggested correction + short Filipino explanation
- Accept / ignore actions
- Writing score and error counts
- Weighted overall score: Gramatika 1.5, Baybay 1.0, Bantas at Malaking Titik 0.5
- Essay Exam Mode: unassisted Filipino essay writing with scores, highlights, and corrections shown only after submission
- Separate Test Mode with suggestions disabled
- GitHub Pages deployment

The first implementation intentionally prioritizes deterministic rules that can be demonstrated reliably. POS-dependent rules such as broad **ng/nang** and **may/mayroon** analysis are deferred until a later NLP/POS-capable iteration.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The Vite base path is configured for the GitHub Pages project URL `/akay-thesis/`.

## Research prototype note

Test Mode is currently session-only. Answers are not uploaded or persisted. This keeps the first thesis prototype simple and removes the need for accounts or a database.

## Essay Exam Mode

Open `#/exam` to write a Filipino essay without live highlighting, suggestions, or a score. The editor analyzes the essay **only when the student clicks “Ipasa ang Sanaysay”**. Results show the submitted text, quality score, category scores, and detected-issue highlights. Students can click or keyboard-select a highlighted issue to view its suggestion and explanation in the same contextual Mungkahi card used by the main editor. Only one suggestion appears at a time, with a close button; there is no long list of all suggestions. The submission and score remain fixed during review. A new attempt starts with an empty essay.

The category scores each start at 100, subtract 12 points for each active, non-overlapping detected issue in that category, and cannot fall below 0. The overall score is a rounded weighted average:

```text
Overall = round((1.0 × Baybay + 1.5 × Gramatika + 0.5 × Bantas) / 3.0)
```

The label thresholds remain Mahusay (90–100), Katamtaman (75–89), and Nangangailangan ng Pagsasanay (0–74). The score measures only mistakes covered by the current rule-based checker; it does not evaluate essay organization, reasoning, or content quality. Overlapping issues are still deduplicated by the existing checker, and dismissed suggestions still affect the live editor's issue count.

Essay Exam responses and results are in-memory only: they are **not** saved across refreshes or navigation and are not collected in a researcher dashboard. For pre-test/post-test research, students/researchers must record results separately until persistence is implemented.

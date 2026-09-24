# Akay

**Kaagapay sa Wastong Pagsulat**

Akay is a thesis prototype for a Filipino writing checker and practice web app. Version 1 focuses on a lightweight, browser-based demo with no accounts and no persistent storage.

## Version 1 scope

- Homepage with the writing editor
- Rule-based Filipino spelling, punctuation/capitalization, and selected grammar checks
- Suggested correction + short Filipino explanation
- Accept / ignore actions
- Writing score and error counts
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

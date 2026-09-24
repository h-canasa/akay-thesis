import React, { useEffect, useMemo, useState } from 'react';
import { analyzeText, CATEGORY, issueKey } from './checker.js';

const starterText = 'Kumain rin ako ng mangga saging at ubas';

function Logo() {
  return (
    <a className="brand" href="#/" aria-label="Akay home">
      <img
        className="brand-logo"
        src={`${import.meta.env.BASE_URL}akay-logo-clean.webp`}
        alt="Akay — Kaagapay sa Wastong Pagsulat"
      />
    </a>
  );
}

function Header({ page }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />

        <nav className="nav-actions" aria-label="Pangunahing nabigasyon">
          <a className={`nav-link ${page === 'editor' ? 'active' : ''}`} href="#/">
            Home
          </a>
          <a className={`nav-link ${page === 'test' ? 'active' : ''}`} href="#/test">
            Test Mode
          </a>
        </nav>

        <img
          className="header-art-image"
          src={`${import.meta.env.BASE_URL}akay-header-art.webp`}
          alt=""
          aria-hidden="true"
        />
      </div>
    </header>
  );
}

function HighlightedText({ text, issues }) {
  if (!text) return <p className="empty-preview">Wala pang tekstong susuriin.</p>;

  const chunks = [];
  let cursor = 0;

  issues.forEach((issue, index) => {
    if (issue.start > cursor) {
      chunks.push(
        <React.Fragment key={`text-${index}`}>
          {text.slice(cursor, issue.start)}
        </React.Fragment>,
      );
    }

    if (issue.start === issue.end) {
      chunks.push(
        <span
          className="issue-marker insertion"
          key={`issue-${index}`}
          title={issue.explanation}
        >
          •
        </span>,
      );
    } else {
      const type =
        issue.category === CATEGORY.GRAMMAR
          ? 'grammar'
          : issue.category === CATEGORY.SPELLING
            ? 'spelling'
            : 'punctuation';

      chunks.push(
        <mark
          className={`issue-marker ${type}`}
          key={`issue-${index}`}
          title={issue.explanation}
        >
          {text.slice(issue.start, issue.end)}
        </mark>,
      );
    }

    cursor = Math.max(cursor, issue.end);
  });

  if (cursor < text.length) {
    chunks.push(<React.Fragment key="tail">{text.slice(cursor)}</React.Fragment>);
  }

  return <p className="review-text">{chunks}</p>;
}

function SuggestionPanel({ analysis, onAccept, onIgnore }) {
  const issues = analysis?.issues ?? [];

  return (
    <aside className="suggestions-card">
      <div className="panel-heading">
        <div className="heading-with-icon">
          <span className="panel-icon" aria-hidden="true">💡</span>
          <h2>Mga Mungkahi</h2>
        </div>
        <span className="count-badge">{analysis ? issues.length : 0}</span>
      </div>

      {!analysis ? (
        <div className="empty-suggestions">
          <div className="empty-suggestions-icon">✓</div>
          <strong>Handa ang Akay.</strong>
          <p>I-click ang “Suriin ang Teksto” para makita rito ang mga mungkahi.</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-suggestions success">
          <div className="empty-suggestions-icon">✓</div>
          <strong>Walang nakitang isyu.</strong>
          <p>Walang mungkahi sa kasalukuyang saklaw ng Version 1 checker.</p>
        </div>
      ) : (
        <div className="suggestion-list">
          {issues.map((issue, index) => (
            <article
              className={`suggestion suggestion-${issue.category === CATEGORY.PUNCTUATION ? 'punctuation' : issue.category === CATEGORY.GRAMMAR ? 'grammar' : 'spelling'}`}
              key={`${issue.ruleId}-${issue.start}-${index}`}
            >
              <div className="suggestion-topline">
                <span className="rule-tag">{issue.ruleId}</span>
                <span>{issue.category}</span>
              </div>

              <div className="correction">
                <span className="wrong">{issue.original || '∅'}</span>
                <span aria-hidden="true">→</span>
                <strong>{issue.replacement}</strong>
              </div>

              <p>{issue.explanation}</p>

              <div className="suggestion-actions">
                <button
                  className="button button-small button-primary"
                  onClick={() => onAccept(issue)}
                >
                  Tanggapin
                </button>
                <button
                  className="button button-small button-ghost"
                  onClick={() => onIgnore(issue)}
                >
                  Huwag Pansinin
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function QualityPanel({ analysis }) {
  const score = analysis?.score;
  const counts = analysis?.counts ?? {
    [CATEGORY.SPELLING]: 0,
    [CATEGORY.GRAMMAR]: 0,
    [CATEGORY.PUNCTUATION]: 0,
  };

  const rows = [
    ['Baybay', counts[CATEGORY.SPELLING]],
    ['Gramatika', counts[CATEGORY.GRAMMAR]],
    ['Bantas at Malaking Titik', counts[CATEGORY.PUNCTUATION]],
  ];

  return (
    <section className="quality-card">
      <div className="panel-heading quality-heading">
        <div className="heading-with-icon">
          <span className="bars-icon" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2>Kalidad ng Pagsulat</h2>
        </div>
      </div>

      <div className="quality-content">
        <div
          className={`score-ring ${!analysis ? 'score-ring-idle' : ''}`}
          style={{ '--score': `${(score ?? 0) * 3.6}deg` }}
        >
          <div>
            <strong>{analysis ? `${score}%` : '—'}</strong>
            <span>{analysis ? analysis.level : 'Hindi pa nasusuri'}</span>
          </div>
        </div>

        <div className="quality-rows">
          {rows.map(([label, count]) => (
            <div className="quality-row" key={label}>
              <span>{label}</span>
              <div className="quality-line">
                <i className={count > 0 ? 'has-issue' : ''} />
              </div>
              <strong>{analysis ? `${count} isyu` : '—'}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorPage() {
  const [text, setText] = useState(starterText);
  const [analysis, setAnalysis] = useState(null);
  const [ignored, setIgnored] = useState(new Set());
  const [editing, setEditing] = useState(true);

  const runCheck = () => {
    const next = analyzeText(text);
    setIgnored(new Set());
    setAnalysis(next);
    setEditing(false);
  };

  const startEditing = () => {
    setEditing(true);
  };

  const updateText = (value) => {
    setText(value);
    setAnalysis(null);
    setIgnored(new Set());
    setEditing(true);
  };

  const clearText = () => {
    setText('');
    setAnalysis(null);
    setIgnored(new Set());
    setEditing(true);
  };

  const acceptIssue = (issue) => {
    const nextText =
      text.slice(0, issue.start) + issue.replacement + text.slice(issue.end);
    setText(nextText);
    setIgnored(new Set());
    setAnalysis(analyzeText(nextText));
    setEditing(false);
  };

  const ignoreIssue = (issue) => {
    const nextIgnored = new Set(ignored);
    nextIgnored.add(issueKey(issue));
    setIgnored(nextIgnored);
    setAnalysis(analyzeText(text, nextIgnored));
  };

  return (
    <>
      <Header page="editor" />

      <main className="page-shell">
        <section className="hero">
          <h1>Mas mahusay na pagsulat sa Filipino</h1>
          <p>
            Suriin ang iyong teksto at tumanggap ng malinaw na mungkahi para sa
            mas wastong pagsulat.
          </p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-main">
            <section className="editor-card" aria-label="Writing editor">
              <div className="editor-toolbar">
                <div className="heading-with-icon">
                  <span className="document-icon" aria-hidden="true">▤</span>
                  <h2>Isulat ang iyong teksto</h2>
                </div>

                <div className="toolbar-actions">
                  {analysis && !editing && (
                    <button className="button button-ghost" onClick={startEditing}>
                      I-edit
                    </button>
                  )}
                  <button
                    className="button button-primary"
                    onClick={runCheck}
                    disabled={!text.trim()}
                  >
                    ✦ Suriin ang Teksto
                  </button>
                  <button
                    className="button button-ghost"
                    onClick={clearText}
                    disabled={!text}
                  >
                    Linisin
                  </button>
                </div>
              </div>

              <div className="editor-surface">
                {analysis && !editing ? (
                  <div
                    className="review-surface"
                    role="button"
                    tabIndex={0}
                    onClick={startEditing}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        startEditing();
                      }
                    }}
                    aria-label="I-edit ang sinuring teksto"
                  >
                    <HighlightedText text={text} issues={analysis.issues} />
                  </div>
                ) : (
                  <textarea
                    autoFocus={false}
                    value={text}
                    onChange={(event) => updateText(event.target.value)}
                    placeholder="Magsimulang magsulat dito..."
                    spellCheck="false"
                    aria-label="Tekstong susuriin"
                  />
                )}

                <span className="character-count">{text.length}/2,000</span>
              </div>
            </section>

            <QualityPanel analysis={analysis} />
          </div>

          <div className="dashboard-side">
            <SuggestionPanel
              analysis={analysis}
              onAccept={acceptIssue}
              onIgnore={ignoreIssue}
            />

            <a className="test-cta" href="#/test">
              <span className="test-cta-icon" aria-hidden="true">▤</span>
              <span>
                <strong>Subukan ang Test Mode</strong>
                <small>
                  Magsanay nang walang mungkahi habang nagsusulat.
                </small>
              </span>
              <span className="test-cta-arrow" aria-hidden="true">›</span>
            </a>
          </div>
        </section>

        <p className="scope-note">
          Version 1: deterministic na tuntunin muna; hindi pa kasama ang malawakang
          POS-based na pagsusuri para sa <em>ng/nang</em> at <em>may/mayroon</em>.
        </p>
      </main>

      <Footer />
    </>
  );
}

const testItems = [
  {
    title: 'Tanong 1',
    prompt: 'Isulat muli nang wasto ang pangungusap:',
    source: 'bumili ako ng mangga saging at ubas',
  },
  {
    title: 'Tanong 2',
    prompt: 'Isulat muli nang wasto ang pangungusap:',
    source: 'Kumain rin ako',
  },
  {
    title: 'Tanong 3',
    prompt: 'Isulat muli nang wasto ang pangungusap:',
    source: 'nagaaral ako tuwing lunes',
  },
];

function TestPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(testItems.length).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const item = testItems[index];
  const progress = Math.round(((index + 1) / testItems.length) * 100);

  const saveAnswer = (value) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };

  const next = () => {
    if (index < testItems.length - 1) {
      setIndex(index + 1);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <>
        <Header page="test" />
        <main className="page-shell test-shell">
          <section className="completion-card">
            <div className="completion-icon">✓</div>
            <h1>Tapos na ang demo test.</h1>
            <p>
              Session-only ang mga sagot sa prototype na ito at hindi iniimbak sa
              database.
            </p>
            <button
              className="button button-primary"
              onClick={() => {
                setIndex(0);
                setAnswers(Array(testItems.length).fill(''));
                setSubmitted(false);
              }}
            >
              Subukan Muli
            </button>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header page="test" />

      <main className="page-shell test-shell">
        <section className="test-hero">
          <h1>Test Mode</h1>
          <p>Sumagot nang walang mungkahi habang nagsusulat.</p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        <section className="test-card">
          <div className="test-meta">
            <strong>{item.title} ng {testItems.length}</strong>
            <span>{progress}%</span>
          </div>

          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="test-question">
            <h2>Paksa sa Pagsulat</h2>
            <blockquote>
              <span>{item.prompt}</span>
              <strong>{item.source}</strong>
            </blockquote>
          </div>

          <label htmlFor="test-answer">Isulat ang iyong sagot</label>
          <textarea
            id="test-answer"
            value={answers[index]}
            onChange={(event) => saveAnswer(event.target.value)}
            placeholder="Isulat dito ang iyong sagot..."
            spellCheck="false"
          />

          <div className="test-actions">
            <button
              className="button button-ghost"
              disabled={index === 0}
              onClick={() => setIndex(Math.max(0, index - 1))}
            >
              Nakaraan
            </button>
            <button
              className="button button-primary"
              disabled={!answers[index].trim()}
              onClick={next}
            >
              {index === testItems.length - 1 ? 'Ipasa' : 'Susunod'}
            </button>
          </div>
        </section>

        <p className="test-disclaimer">
          Walang awtomatikong mungkahi o pagwawasto sa Test Mode.
        </p>
      </main>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer>
      <span>Akay</span>
      <span>Kaagapay sa Wastong Pagsulat</span>
      <span>Thesis Prototype · Version 1</span>
    </footer>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const page = useMemo(
    () => (hash.startsWith('#/test') ? 'test' : 'editor'),
    [hash],
  );

  return page === 'test' ? <TestPage /> : <EditorPage />;
}

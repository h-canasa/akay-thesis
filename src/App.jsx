import React, { useEffect, useMemo, useState } from 'react';
import { analyzeText, CATEGORY, issueKey } from './checker.js';

const starterText = 'Kumain rin ako ng mangga saging at ubas';

function Logo() {
  return (
    <a className="brand" href="#/" aria-label="Akay home">
      <img
        src={`${import.meta.env.BASE_URL}akay-logo.png`}
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
            Editor
          </a>
          <a className={`nav-link ${page === 'test' ? 'active' : ''}`} href="#/test">
            Test Mode
          </a>
        </nav>

        <div className="header-art" aria-hidden="true">
          <span className="header-sun" />
          <span className="mountain mountain-back" />
          <span className="mountain mountain-front" />
          <span className="flag-wave flag-blue" />
          <span className="flag-wave flag-yellow" />
          <span className="flag-wave flag-red" />
        </div>
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
      chunks.push(<React.Fragment key={`text-${index}`}>{text.slice(cursor, issue.start)}</React.Fragment>);
    }

    if (issue.start === issue.end) {
      chunks.push(
        <span className="issue-marker insertion" key={`issue-${index}`} title={issue.explanation}>•</span>,
      );
    } else {
      chunks.push(
        <mark
          className={`issue-marker ${issue.category === CATEGORY.GRAMMAR ? 'grammar' : issue.category === CATEGORY.SPELLING ? 'spelling' : 'punctuation'}`}
          key={`issue-${index}`}
          title={issue.explanation}
        >
          {text.slice(issue.start, issue.end)}
        </mark>,
      );
    }
    cursor = Math.max(cursor, issue.end);
  });

  if (cursor < text.length) chunks.push(<React.Fragment key="tail">{text.slice(cursor)}</React.Fragment>);
  return <p className="preview-text">{chunks}</p>;
}

function EditorPage() {
  const [text, setText] = useState(starterText);
  const [analysis, setAnalysis] = useState(null);
  const [ignored, setIgnored] = useState(new Set());

  const runCheck = () => {
    setIgnored(new Set());
    setAnalysis(analyzeText(text));
  };

  const acceptIssue = (issue) => {
    const nextText = text.slice(0, issue.start) + issue.replacement + text.slice(issue.end);
    setText(nextText);
    setIgnored(new Set());
    setAnalysis(analyzeText(nextText));
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
          <span className="eyebrow">Filipino Writing Checker</span>
          <h1>Sumulat nang may kumpiyansa.</h1>
          <p>
            I-type o i-paste ang iyong teksto. Tutulungan ka ng Akay na makita ang mga
            posibleng pagkakamali at maunawaan kung paano ito itatama.
          </p>
        </section>

        <section className="workspace" aria-label="Writing editor">
          <div className="editor-card">
            <div className="card-heading">
              <div>
                <h2>Iyong Teksto</h2>
                <p>Filipino</p>
              </div>
              <span className="character-count">{text.length} karakter</span>
            </div>

            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setAnalysis(null);
                setIgnored(new Set());
              }}
              placeholder="Magsimulang magsulat dito..."
              spellCheck="false"
              aria-label="Tekstong susuriin"
            />

            <div className="editor-footer">
              <span className="helper">Walang account o cloud storage sa Version 1.</span>
              <button className="button button-primary" onClick={runCheck} disabled={!text.trim()}>
                Suriin ang Teksto
              </button>
            </div>
          </div>

          {analysis && (
            <aside className="results-card" aria-live="polite">
              <div className="score-row">
                <div>
                  <span className="label">Kalidad ng Pagsulat</span>
                  <strong className="score">{analysis.score}%</strong>
                  <span className="level">{analysis.level}</span>
                </div>
                <div className="score-ring" style={{ '--score': `${analysis.score * 3.6}deg` }}>
                  <span>{analysis.score}</span>
                </div>
              </div>

              <div className="counts">
                <div><span>Baybay</span><strong>{analysis.counts[CATEGORY.SPELLING]}</strong></div>
                <div><span>Gramatika</span><strong>{analysis.counts[CATEGORY.GRAMMAR]}</strong></div>
                <div><span>Bantas / Malaking Titik</span><strong>{analysis.counts[CATEGORY.PUNCTUATION]}</strong></div>
              </div>
            </aside>
          )}
        </section>

        {analysis && (
          <section className="analysis-grid">
            <div className="preview-card">
              <div className="card-heading">
                <div>
                  <h2>Sinuring Teksto</h2>
                  <p>Naka-highlight ang mga bahaging may mungkahi.</p>
                </div>
              </div>
              <HighlightedText text={text} issues={analysis.issues} />
            </div>

            <div className="suggestions-card">
              <div className="card-heading">
                <div>
                  <h2>Mga Mungkahi</h2>
                  <p>{analysis.issues.length} natitirang mungkahi</p>
                </div>
              </div>

              {analysis.issues.length === 0 ? (
                <div className="success-state">
                  <span>✓</span>
                  <div>
                    <strong>Walang nakitang isyu sa saklaw ng Version 1.</strong>
                    <p>Maaaring mayroon pa ring mga kontekstuwal na tuntuning hindi sakop ng kasalukuyang checker.</p>
                  </div>
                </div>
              ) : (
                <div className="suggestion-list">
                  {analysis.issues.map((issue, index) => (
                    <article className="suggestion" key={`${issue.ruleId}-${issue.start}-${index}`}>
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
                        <button className="button button-small button-primary" onClick={() => acceptIssue(issue)}>
                          Tanggapin
                        </button>
                        <button className="button button-small button-ghost" onClick={() => ignoreIssue(issue)}>
                          Huwag Pansinin
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="scope-note">
          <strong>Saklaw ng prototype:</strong>
          <span>
            Ang unang bersyon ay nakatuon sa mga deterministic na tuntunin. Ang malawakang POS-based na
            pagsusuri para sa <em>ng/nang</em> at <em>may/mayroon</em> ay nakalaan sa susunod na yugto.
          </span>
        </section>
      </main>
      <Footer />
    </>
  );
}

const testItems = [
  {
    title: 'Aytem 1',
    prompt: 'Isulat muli nang wasto ang pangungusap:',
    source: 'bumili ako ng mangga saging at ubas',
  },
  {
    title: 'Aytem 2',
    prompt: 'Isulat muli nang wasto ang pangungusap:',
    source: 'Kumain rin ako',
  },
  {
    title: 'Aytem 3',
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
            <span className="eyebrow">Test Mode</span>
            <h1>Tapos na ang demo test.</h1>
            <p>
              Ang mga sagot ay nanatili lamang sa kasalukuyang browser session at hindi ipinadala o
              isinave sa database.
            </p>
            <button className="button button-primary" onClick={() => { setIndex(0); setAnswers(Array(testItems.length).fill('')); setSubmitted(false); }}>
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
        <section className="test-intro">
          <span className="eyebrow">Test Mode</span>
          <h1>Pagsasanay sa Wastong Pagsulat</h1>
          <p>Walang mungkahi o awtomatikong pagwawasto habang sumasagot.</p>
        </section>

        <section className="test-card">
          <div className="test-meta">
            <span>{item.title} ng {testItems.length}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>

          <div className="test-question">
            <p>{item.prompt}</p>
            <blockquote>{item.source}</blockquote>
          </div>

          <label htmlFor="test-answer">Iyong Sagot</label>
          <textarea
            id="test-answer"
            value={answers[index]}
            onChange={(event) => saveAnswer(event.target.value)}
            placeholder="Isulat ang iyong sagot dito..."
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
            <button className="button button-primary" disabled={!answers[index].trim()} onClick={next}>
              {index === testItems.length - 1 ? 'Ipasa' : 'Susunod'}
            </button>
          </div>
        </section>

        <p className="test-disclaimer">
          Prototype lamang: walang account, admin scoring, o permanenteng storage sa kasalukuyang bersyon.
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

  const page = useMemo(() => (hash.startsWith('#/test') ? 'test' : 'editor'), [hash]);
  return page === 'test' ? <TestPage /> : <EditorPage />;
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeText, CATEGORY, issueKey, normalizeEditorText } from './checker.js';

const starterText = 'Kumain rin ako ng mangga saging at ubas';

function Logo() {
  return (
    <a className="brand" href="#/" aria-label="Akay home">
      <img
        className="brand-logo"
        src={`${import.meta.env.BASE_URL}akay-logo-v2.webp?rev=2`}
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
          <a className={`nav-link ${page === 'tools' ? 'active' : ''}`} href="#/tools">
            Mga Instrumento
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

function HighlightedText({ text, issues, onIssueClick }) {
  if (!text) return null;

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
          onPointerDown={(event) => {
            if (!onIssueClick) return;
            event.preventDefault();
            event.stopPropagation();
            onIssueClick(issue);
          }}
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
          onPointerDown={(event) => {
            if (!onIssueClick) return;
            event.preventDefault();
            event.stopPropagation();
            onIssueClick(issue);
          }}
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

function QualityPanel({ analysis, compact = false }) {
  const score = analysis?.score ?? 0;
  const counts = analysis?.counts ?? {
    [CATEGORY.SPELLING]: 0,
    [CATEGORY.GRAMMAR]: 0,
    [CATEGORY.PUNCTUATION]: 0,
  };

  const rows = [
    {
      label: 'Baybay',
      type: 'spelling',
      value: analysis ? Math.max(0, 100 - counts[CATEGORY.SPELLING] * 12) : 0,
    },
    {
      label: 'Gramatika',
      type: 'grammar',
      value: analysis ? Math.max(0, 100 - counts[CATEGORY.GRAMMAR] * 12) : 0,
    },
    {
      label: 'Bantas at Malaking Titik',
      type: 'punctuation',
      value: analysis ? Math.max(0, 100 - counts[CATEGORY.PUNCTUATION] * 12) : 0,
    },
  ];

  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedRows, setAnimatedRows] = useState([0, 0, 0]);

  useEffect(() => {
    setAnimatedScore(0);
    setAnimatedRows([0, 0, 0]);

    if (!analysis) return undefined;

    const timer = window.setTimeout(() => {
      setAnimatedScore(score);
      setAnimatedRows(rows.map((row) => row.value));
    }, 60);

    return () => window.clearTimeout(timer);
  }, [
    analysis,
    score,
    counts[CATEGORY.SPELLING],
    counts[CATEGORY.GRAMMAR],
    counts[CATEGORY.PUNCTUATION],
  ]);

  return (
    <section className={`quality-card ${compact ? 'quality-card-compact' : ''}`}>
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
          style={{ '--ring-progress': `${animatedScore * 3.6}deg` }}
        >
          <div>
            <strong>{analysis ? `${score}%` : '—'}</strong>
            <span>{analysis ? analysis.level : 'Hindi pa nasusuri'}</span>
          </div>
        </div>

        <div className="quality-rows">
          {rows.map((row, index) => (
            <div className="quality-row" key={row.label}>
              <span>{row.label}</span>
              <div className="quality-line">
                <i
                  className={`quality-fill ${row.type}`}
                  style={{ '--fill': `${animatedRows[index]}%` }}
                />
              </div>
              <strong>{analysis ? `${row.value}%` : '—'}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorPage() {
  const editorInputRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const [text, setText] = useState(starterText);
  const [ignored, setIgnored] = useState(new Set());
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  const analysis = useMemo(
    () => (text.trim() ? analyzeText(text, ignored) : null),
    [text, ignored],
  );

  const selectedIssue = analysis?.issues.find(
    (issue) => issueKey(issue) === selectedIssueId,
  ) ?? null;

  useEffect(() => {
    const input = editorInputRef.current;
    const layer = highlightLayerRef.current;
    if (!input || !layer) return undefined;

    const syncGeometry = () => {
      const scrollbarWidth = Math.max(0, input.offsetWidth - input.clientWidth);
      layer.style.right = `${scrollbarWidth}px`;
      layer.scrollTop = input.scrollTop;
      layer.scrollLeft = input.scrollLeft;
    };

    syncGeometry();
    const frame = window.requestAnimationFrame(syncGeometry);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncGeometry)
        : null;

    observer?.observe(input);
    window.addEventListener('resize', syncGeometry);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', syncGeometry);
    };
  }, [text]);

  const updateText = (value) => {
    const normalized = normalizeEditorText(value).slice(0, 2000);
    setText(normalized);
    setIgnored(new Set());
    setSelectedIssueId(null);
  };

  const pasteIntoEditor = (event) => {
    const pasted = event.clipboardData?.getData('text/plain');
    if (typeof pasted !== 'string') return;

    event.preventDefault();

    const input = event.currentTarget;
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? start;
    const normalizedPaste = normalizeEditorText(pasted);
    const available = Math.max(0, 2000 - (text.length - (end - start)));
    const inserted = normalizedPaste.slice(0, available);
    const nextText = text.slice(0, start) + inserted + text.slice(end);

    updateText(nextText);

    const caret = start + inserted.length;
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(caret, caret);
      const layer = highlightLayerRef.current;
      if (layer) {
        const scrollbarWidth = Math.max(0, input.offsetWidth - input.clientWidth);
        layer.style.right = `${scrollbarWidth}px`;
        layer.scrollTop = input.scrollTop;
        layer.scrollLeft = input.scrollLeft;
      }
    });
  };

  const clearText = () => {
    setText('');
    setIgnored(new Set());
    setSelectedIssueId(null);
  };

  const selectIssue = (issue) => {
    setSelectedIssueId(issueKey(issue));
  };

  const acceptIssue = (issue) => {
    const nextText =
      text.slice(0, issue.start) + issue.replacement + text.slice(issue.end);
    setText(nextText);
    setIgnored(new Set());
    setSelectedIssueId(null);
  };

  const ignoreIssue = (issue) => {
    const nextIgnored = new Set(ignored);
    nextIgnored.add(issueKey(issue));
    setIgnored(nextIgnored);
    setSelectedIssueId(null);
  };

  return (
    <>
      <Header page="editor" />

      <main className="page-shell">
        <section className="hero">
          <h1>Mas mahusay na pagsulat sa Filipino</h1>
          <p>
            Mag-type o mag-paste ng teksto. Awtomatikong iho-highlight ng Akay ang
            mga posibleng isyu habang nagsusulat ka.
          </p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        <section className="editor-workspace">
          <div className="editor-main-column">
            <section className="editor-card" aria-label="Writing editor">
              <div className="editor-toolbar">
                <div className="heading-with-icon">
                  <span className="document-icon" aria-hidden="true">▤</span>
                  <h2>Isulat ang iyong teksto</h2>
                </div>

                <div className="toolbar-actions">
                  <span className="live-status">
                    <i aria-hidden="true" />
                    Sinusuri habang nagsusulat
                  </span>
                  <button
                    className="button button-ghost"
                    onClick={clearText}
                    disabled={!text}
                  >
                    Burahin
                  </button>
                </div>
              </div>

                {selectedIssue && (
                  <div
                    className="context-suggestion context-inline"
                    aria-live="polite"
                  >
                    <div className="context-suggestion-heading">
                      <div>
                        <span>Mungkahi · {selectedIssue.category}</span>
                        <strong>
                          {selectedIssue.original || '∅'} <b aria-hidden="true">→</b>{' '}
                          {selectedIssue.replacement}
                        </strong>
                      </div>
                      <button
                        className="context-close"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedIssueId(null);
                        }}
                        aria-label="Isara ang mungkahi"
                      >
                        ×
                      </button>
                    </div>

                    <p>{selectedIssue.explanation}</p>

                    <div className="suggestion-actions">
                      <button
                        className="button button-small button-primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          acceptIssue(selectedIssue);
                        }}
                      >
                        Tanggapin
                      </button>
                      <button
                        className="button button-small button-ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          ignoreIssue(selectedIssue);
                        }}
                      >
                        Huwag Pansinin
                      </button>
                    </div>
                  </div>
                )}

              <div className="editor-surface live-editor-surface">
                <div
                  ref={highlightLayerRef}
                  className="highlight-layer"
                  aria-hidden="true"
                >
                  <HighlightedText
                    text={text}
                    issues={analysis?.issues ?? []}
                    onIssueClick={selectIssue}
                  />
                </div>

                <textarea
                  ref={editorInputRef}
                  className="live-editor-input"
                  value={text}
                  onChange={(event) => updateText(event.target.value)}
                  onPaste={pasteIntoEditor}
                  onClick={() => setSelectedIssueId(null)}
                  onScroll={(event) => {
                    const layer = highlightLayerRef.current;
                    if (layer) {
                      layer.scrollTop = event.currentTarget.scrollTop;
                      layer.scrollLeft = event.currentTarget.scrollLeft;
                    }
                  }}
                  placeholder="Magsimulang magsulat dito..."
                  spellCheck="false"
                  aria-label="Tekstong susuriin"
                />

                <span className="character-count">{text.length}/2,000</span>

              </div>
            </section>

            <p className="editor-tip">
              Pindutin ang naka-highlight na salita o bahagi ng pangungusap upang
              makita ang paliwanag at mungkahing pagwawasto.
            </p>
          </div>

          <aside className="editor-sidebar">
            <QualityPanel analysis={analysis} compact />

            <a className="test-cta" href="#/tools">
              <span className="test-cta-icon" aria-hidden="true">✦</span>
              <span>
                <strong>Mga Instrumento sa Pagsulat</strong>
                <small>Rewrite / Tone Assistant at English–Filipino Helper.</small>
              </span>
              <span className="test-cta-arrow" aria-hidden="true">›</span>
            </a>

            <a className="test-cta" href="#/test">
              <span className="test-cta-icon" aria-hidden="true">▤</span>
              <span>
                <strong>Subukan ang Test Mode</strong>
                <small>Magsanay nang walang mungkahi habang nagsusulat.</small>
              </span>
              <span className="test-cta-arrow" aria-hidden="true">›</span>
            </a>
          </aside>
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

const toneProfiles = {
  pormal: {
    label: 'Pormal',
    replacements: [
      [/\\bgusto ko\\b/gi, 'nais ko'],
      [/\\bpero\\b/gi, 'ngunit'],
      [/\\bkasi\\b/gi, 'sapagkat'],
      [/\\bpara\\b/gi, 'upang'],
      [/\\bdapat nating\\b/gi, 'nararapat nating'],
    ],
  },
  akademiko: {
    label: 'Akademiko',
    replacements: [
      [/\\bsa tingin ko\\b/gi, 'batay sa pagsusuri'],
      [/\\bpero\\b/gi, 'gayunpaman'],
      [/\\bkasi\\b/gi, 'sapagkat'],
      [/\\bpara\\b/gi, 'upang'],
      [/\\bmahalaga\\b/gi, 'mahalagang salik'],
    ],
  },
  payak: {
    label: 'Payak',
    replacements: [
      [/\\bnararapat\\b/gi, 'dapat'],
      [/\\bgayunpaman\\b/gi, 'pero'],
      [/\\bsapagkat\\b/gi, 'dahil'],
      [/\\bnagnanais\\b/gi, 'gusto'],
    ],
  },
};

const helperEntries = [
  { english: 'environment', filipino: 'kapaligiran', tip: 'Gamitin kapag tumutukoy sa kalikasan o mga bagay na nakapaligid sa isang lugar.' },
  { english: 'community', filipino: 'pamayanan / komunidad', tip: 'Mas katutubong Filipino ang “pamayanan”; karaniwan ding ginagamit ang “komunidad”.' },
  { english: 'responsibility', filipino: 'pananagutan', tip: 'Ang “pananagutan” ay ang obligasyong tuparin o panagutan ang isang gawain.' },
  { english: 'education', filipino: 'edukasyon / pag-aaral', tip: 'Gamitin ang “pag-aaral” kung tumutukoy sa proseso ng pagkatuto.' },
  { english: 'improve', filipino: 'pagbutihin', tip: 'Halimbawa: “Pagbutihin ang paraan ng pagsulat.”' },
  { english: 'support', filipino: 'suporta / pagtulong', tip: 'Maaaring gamitin ang “pagtulong” kung nais ng mas payak na Filipino.' },
  { english: 'student', filipino: 'mag-aaral', tip: 'Mas pormal at Filipino ang “mag-aaral” kaysa “estudyante”.' },
  { english: 'teacher', filipino: 'guro', tip: 'Karaniwang katumbas ng “teacher” sa Filipino.' },
  { english: 'writing', filipino: 'pagsulat', tip: 'Gamitin sa konteksto ng kasanayan o proseso ng pagsusulat.' },
  { english: 'important', filipino: 'mahalaga', tip: 'Halimbawa: “Mahalaga ang wastong paggamit ng wika.”' },
];

function rewriteWithTone(text, tone) {
  if (!text.trim()) return '';
  const profile = toneProfiles[tone];
  let output = text.trim();

  profile.replacements.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });

  if (!/[.!?]$/.test(output)) output += '.';
  return output[0].toUpperCase() + output.slice(1);
}

function ToolsPage() {
  const [tone, setTone] = useState('pormal');
  const [rewriteInput, setRewriteInput] = useState('Dapat nating alagaan ang kapaligiran para sa susunod na henerasyon.');
  const [rewriteOutput, setRewriteOutput] = useState('');
  const [helperQuery, setHelperQuery] = useState('');

  const helperResult = helperEntries.find((entry) =>
    entry.english.includes(helperQuery.trim().toLowerCase()),
  );

  const runRewrite = () => {
    setRewriteOutput(rewriteWithTone(rewriteInput, tone));
  };

  return (
    <>
      <Header page="tools" />

      <main className="page-shell tools-shell">
        <section className="tools-hero">
          <h1>Mga Instrumento sa Pagsulat</h1>
          <p>Mga simpleng pantulong para sa tono, salin, at paggamit ng salita.</p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        <section className="tools-grid">
          <article className="tool-card">
            <div className="tool-card-heading">
              <div>
                <span className="tool-kicker">Rewrite / Tone Assistant</span>
                <h2>Pumili ng tono</h2>
              </div>
              <select value={tone} onChange={(event) => setTone(event.target.value)}>
                {Object.entries(toneProfiles).map(([value, profile]) => (
                  <option value={value} key={value}>{profile.label}</option>
                ))}
              </select>
            </div>

            <label htmlFor="rewrite-input">Pangungusap</label>
            <textarea
              id="rewrite-input"
              value={rewriteInput}
              onChange={(event) => setRewriteInput(event.target.value)}
              placeholder="Maglagay ng pangungusap..."
            />

            <div className="tool-actions">
              <span>Rule-based prototype lamang; hindi generative AI.</span>
              <button className="button button-primary" onClick={runRewrite} disabled={!rewriteInput.trim()}>
                Gumawa ng Alternatibo
              </button>
            </div>

            <div className="tool-output" aria-live="polite">
              <span>Alternatibong bersyon</span>
              <p>{rewriteOutput || 'Lalabas dito ang alternatibong bersyon.'}</p>
            </div>
          </article>

          <article className="tool-card">
            <div className="tool-card-heading">
              <div>
                <span className="tool-kicker">English–Filipino Helper / Insights</span>
                <h2>Hanapin ang katumbas na salita</h2>
              </div>
            </div>

            <label htmlFor="helper-query">English word</label>
            <input
              id="helper-query"
              className="tool-input"
              value={helperQuery}
              onChange={(event) => setHelperQuery(event.target.value)}
              placeholder="Hal. environment"
            />

            <div className="helper-result" aria-live="polite">
              {!helperQuery.trim() ? (
                <p>Subukan ang: environment, community, student, teacher, writing.</p>
              ) : helperResult ? (
                <>
                  <span>{helperResult.english}</span>
                  <strong>{helperResult.filipino}</strong>
                  <p>{helperResult.tip}</p>
                </>
              ) : (
                <p>Wala pa sa prototype dictionary ang salitang ito.</p>
              )}
            </div>
          </article>
        </section>
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
      <span>Mga Proponent: Aira · Angela · Kharl</span>
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

  const page = useMemo(() => {
    if (hash.startsWith('#/test')) return 'test';
    if (hash.startsWith('#/tools')) return 'tools';
    return 'editor';
  }, [hash]);

  if (page === 'test') return <TestPage />;
  if (page === 'tools') return <ToolsPage />;
  return <EditorPage />;
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeText, CATEGORY, issueKey, normalizeEditorText } from './checker.js';
import { APPROVED_PRACTICE_QUESTIONS } from './practiceQuestions.js';
import { createPracticeSession, gradePracticeSession, QUESTIONS_PER_PRACTICE } from './practice.js';

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
          <a className={`nav-link ${page === 'exam' ? 'active' : ''}`} href="#/exam">
            Essay Exam
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

function HighlightedText({ text, issues, onIssueClick, keyboardAccessible = false, selectedIssueId = null }) {
  if (!text) return null;

  const chunks = [];
  let cursor = 0;

  const handleIssueKeyDown = (event, issue) => {
    if (!keyboardAccessible || !onIssueClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      onIssueClick(issue);
    }
  };

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
          className={`issue-marker insertion${selectedIssueId === issueKey(issue) ? ' issue-marker-selected' : ''}`}
          key={`issue-${index}`}
          title={issue.explanation}
          role={keyboardAccessible && onIssueClick ? 'button' : undefined}
          tabIndex={keyboardAccessible && onIssueClick ? 0 : undefined}
          aria-label={keyboardAccessible && onIssueClick ? `Mungkahi: magdagdag ng ${issue.replacement}` : undefined}
          onKeyDown={(event) => handleIssueKeyDown(event, issue)}
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
      const type = issue.advisory
        ? 'advisory'
        : issue.category === CATEGORY.GRAMMAR
          ? 'grammar'
          : issue.category === CATEGORY.SPELLING
            ? 'spelling'
            : 'punctuation';

      chunks.push(
        <mark
          className={`issue-marker ${type}${selectedIssueId === issueKey(issue) ? ' issue-marker-selected' : ''}`}
          key={`issue-${index}`}
          title={issue.explanation}
          role={keyboardAccessible && onIssueClick ? 'button' : undefined}
          tabIndex={keyboardAccessible && onIssueClick ? 0 : undefined}
          aria-label={keyboardAccessible && onIssueClick ? (issue.replacement
            ? `Mungkahi: ${issue.original} patungong ${issue.replacement}`
            : `Posibleng isyu sa baybay: ${issue.original}`) : undefined}
          onKeyDown={(event) => handleIssueKeyDown(event, issue)}
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

function ContextSuggestion({ issue, onClose, onAccept, onIgnore }) {
  if (!issue) return null;

  return (
    <div className="context-suggestion context-inline" aria-live="polite">
      <div className="context-suggestion-heading">
        <div>
          <span>Mungkahi · {issue.category}{issue.advisory ? ' · Para sa pagsusuri' : ''}</span>
          <strong>
            {issue.original || '∅'}
            {issue.replacement ? (
              <> <b aria-hidden="true">→</b> {issue.replacement}</>
            ) : (
              <span className="context-no-correction"> · Walang tiyak na pagwawasto</span>
            )}
          </strong>
        </div>
        <button
          type="button"
          className="context-close"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Isara ang mungkahi"
        >
          ×
        </button>
      </div>

      <p>{issue.explanation}</p>
      {issue.advisory && (
        <p className="context-advisory-note">
          Posibleng isyu lamang ito. Hindi ito ibinabawas sa marka.
        </p>
      )}

      {(onAccept || onIgnore) && (
        <div className="suggestion-actions">
          {onAccept && issue.replacement && (
            <button
              type="button"
              className="button button-small button-primary"
              onClick={(event) => {
                event.stopPropagation();
                onAccept(issue);
              }}
            >
              Tanggapin
            </button>
          )}
          {onIgnore && (
            <button
              type="button"
              className="button button-small button-ghost"
              onClick={(event) => {
                event.stopPropagation();
                onIgnore(issue);
              }}
            >
              Huwag Pansinin
            </button>
          )}
        </div>
      )}
    </div>
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
      value: analysis?.categoryScores[CATEGORY.SPELLING] ?? 0,
    },
    {
      label: 'Gramatika',
      type: 'grammar',
      value: analysis?.categoryScores[CATEGORY.GRAMMAR] ?? 0,
    },
    {
      label: 'Bantas at Malaking Titik',
      type: 'punctuation',
      value: analysis?.categoryScores[CATEGORY.PUNCTUATION] ?? 0,
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
      {analysis?.advisoryCount > 0 && (
        <p className="quality-advisory-note">
          {analysis.advisoryCount} posibleng isyu sa talasalitaan · hindi kasama sa marka.
        </p>
      )}
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

              <ContextSuggestion
                issue={selectedIssue}
                onClose={() => setSelectedIssueId(null)}
                onAccept={acceptIssue}
                onIgnore={ignoreIssue}
              />

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

            <a className="test-cta" href="#/exam">
              <span className="test-cta-icon" aria-hidden="true">✎</span>
              <span>
                <strong>Essay Exam Mode</strong>
                <small>Sumulat nang walang live na marka o mungkahi. Tingnan ang resulta pagkatapos ng Ipasa.</small>
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

// Essay Exam is a separate, unassisted writing session. There is deliberately
// no analyzeText call until the student submits. Results are immutable snapshots
// for the current session, so reviewing corrections cannot change the grade.
const MAX_ESSAY_LENGTH = 10000;

function EssayExamPage() {
  const [draft, setDraft] = useState('');
  const [submission, setSubmission] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const resultHeadingRef = useRef(null);

  const selectedIssue = submission?.analysis.issues.find(
    (issue) => issueKey(issue) === selectedIssueId,
  ) ?? null;

  useEffect(() => {
    if (submission) resultHeadingRef.current?.focus();
  }, [submission]);

  const submitEssay = (event) => {
    event.preventDefault();
    const essay = normalizeEditorText(draft).slice(0, MAX_ESSAY_LENGTH);
    if (!essay.trim() || submission) return;
    setSubmission({ essay, analysis: analyzeText(essay) });
  };

  const startNewEssay = () => {
    setDraft('');
    setSubmission(null);
    setSelectedIssueId(null);
  };

  return (
    <>
      <Header page="exam" />
      <main className="page-shell test-shell exam-shell">
        <section className="test-hero">
          <h1>{submission ? 'Resulta ng Essay Exam' : 'Essay Exam Mode'}</h1>
          <p>
            {submission
              ? 'Narito ang marka at mga mungkahi para sa iyong ipinasa na sanaysay.'
              : 'Sumulat ng sanaysay sa Filipino. Walang markang, highlight, o mungkahing ipapakita habang nagsusulat.'}
          </p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        {!submission ? (
          <form className="test-card exam-card" onSubmit={submitEssay}>
            <div className="test-question">
              <h2>Panuto</h2>
              <blockquote>
                <strong>Sumulat ng isang sanaysay sa Filipino.</strong>
                <span>Maaari kang pumili ng sariling paksa o sundin ang paksang ibinigay ng iyong guro.</span>
              </blockquote>
            </div>

            <label htmlFor="exam-essay">Iyong sanaysay</label>
            <textarea
              id="exam-essay"
              className="exam-textarea"
              value={draft}
              onChange={(event) => setDraft(normalizeEditorText(event.target.value).slice(0, MAX_ESSAY_LENGTH))}
              maxLength={MAX_ESSAY_LENGTH}
              rows={14}
              placeholder="Isulat dito ang iyong sanaysay..."
              spellCheck={false}
              required
            />

            <div className="exam-actions">
              <span className="exam-character-count">{draft.length.toLocaleString('en-US')} / {MAX_ESSAY_LENGTH.toLocaleString('en-US')} karakter</span>
              <button className="button button-primary" type="submit" disabled={!draft.trim()}>
                Ipasa ang Sanaysay
              </button>
            </div>
            <p className="exam-session-note">
              Lalabas lamang ang marka at mga mungkahi pagkatapos mong ipasa ang sanaysay.
              Sa kasalukuyang bersiyon, hindi sine-save ang iyong sagot pagkatapos isara o i-refresh ang pahina.
            </p>
          </form>
        ) : (
          <div className="exam-results" aria-live="polite">
            <h2 ref={resultHeadingRef} tabIndex={-1} className="exam-result-heading">Iyong Resulta</h2>
            <QualityPanel analysis={submission.analysis} />
            <p className="exam-weight-note">
              Timbang ng marka: Gramatika 1.5 · Baybay 1.0 · Bantas at Malaking Titik 0.5.
              Ang kabuuang marka ay ang weighted average ng tatlong kategorya.
            </p>
            <section className="test-card exam-review-card" aria-label="Ipinasa na sanaysay">
              <h2>Sinuring Sanaysay</h2>
              <p className="exam-review-note">
                {submission.analysis.issues.length > 0
                  ? 'Pindutin ang naka-highlight na bahagi upang makita ang mungkahi. Hindi na mababago ang ipinasa mong sanaysay at marka.'
                  : 'Walang nakitang isyu sa kasalukuyang saklaw ng Akay checker. Hindi na mababago ang ipinasa mong sanaysay at marka.'}
              </p>
              {submission.analysis.advisoryCount > 0 && (
                <p className="exam-advisory-note">
                  {submission.analysis.advisoryCount} posibleng isyu sa talasalitaan ang hindi isinama sa marka.
                </p>
              )}
              <ContextSuggestion
                issue={selectedIssue}
                onClose={() => setSelectedIssueId(null)}
              />
              <div className="exam-reviewed-essay">
                <HighlightedText
                  text={submission.essay}
                  issues={submission.analysis.issues}
                  onIssueClick={(issue) => setSelectedIssueId(issueKey(issue))}
                  keyboardAccessible
                  selectedIssueId={selectedIssueId}
                />
              </div>
            </section>
            <div className="exam-actions exam-restart">
              <button className="button button-primary" type="button" onClick={startNewEssay}>
                Sumulat ng Panibagong Sanaysay
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function TestPage() {
  const [practice, setPractice] = useState(() => createPracticeSession());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const resultHeadingRef = useRef(null);

  const item = practice.questions[index];
  const answeredCount = practice.questions.filter((question) => answers[question.id]?.trim()).length;
  const progress = Math.round(((index + 1) / QUESTIONS_PER_PRACTICE) * 100);
  const review = useMemo(
    () => (submitted ? gradePracticeSession(practice.questions, answers) : null),
    [submitted, practice, answers],
  );

  useEffect(() => {
    if (submitted) resultHeadingRef.current?.focus();
  }, [submitted]);

  const saveAnswer = (value) => {
    setAnswers((previous) => ({ ...previous, [item.id]: value }));
  };

  const next = () => {
    if (index < QUESTIONS_PER_PRACTICE - 1) {
      setIndex((previous) => previous + 1);
    } else {
      setSubmitted(true);
    }
  };

  const tryAgain = () => {
    setPractice((previous) => createPracticeSession(previous));
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (review) {
    return (
      <>
        <Header page="test" />
        <main className="page-shell test-shell">
          <section className="test-hero">
            <h1 ref={resultHeadingRef} tabIndex={-1}>Resulta ng Mock Test</h1>
            <p>Balikan ang iyong mga sagot at pag-aralan ang mga tamang pagwawasto.</p>
            <span className="hero-accent" aria-hidden="true" />
          </section>

          <section className="test-card practice-score-card" aria-label="Kabuuang resulta" aria-live="polite">
            <span className="practice-eyebrow">Natapos mo ang pagsasanay!</span>
            <div className="practice-score-number">{review.correctCount}<span> / {review.total}</span></div>
            <strong>{review.percent}% · {review.correctCount} tamang sagot</strong>
            <p>
              Ang marka rito ay batay sa tamang sagot sa limang tanong, hindi sa weighted essay score.
            </p>
          </section>

          <section className="practice-review" aria-label="Pagsusuri ng mga sagot">
            <div className="practice-review-heading">
              <h2>Pagsusuri ng mga Sagot</h2>
              <span>{review.total - review.correctCount} kailangang balikan</span>
            </div>

            {review.items.map(({ question, answer, correct }, questionIndex) => (
              <details
                className={`practice-review-item ${correct ? 'practice-review-correct' : 'practice-review-incorrect'}`}
                key={question.id}
                open={!correct}
              >
                <summary>
                  <span aria-hidden="true" className="practice-result-symbol">{correct ? '✓' : '×'}</span>
                  <span className="practice-review-summary">
                    <strong>Tanong {questionIndex + 1} · {question.category}</strong>
                    <small>{question.id} · {correct ? 'Tama' : 'Balikan ang sagot'}</small>
                  </span>
                  <span className="practice-review-expand">Tingnan ang paliwanag</span>
                </summary>
                <div className="practice-review-body">
                  <div className="practice-review-field">
                    <span>Maling pangungusap</span>
                    <p>{question.incorrect}</p>
                  </div>
                  <div className="practice-review-field">
                    <span>Iyong sagot</span>
                    <p>{answer.trim() || 'Walang sagot'}</p>
                  </div>
                  <div className="practice-review-field">
                    <span>Tamang pangungusap</span>
                    <p><strong>{question.correct}</strong></p>
                  </div>
                  {question.accepted.length > 0 && (
                    <div className="practice-review-field">
                      <span>Tinatanggap ding sagot</span>
                      <p>{question.accepted.join(' / ')}</p>
                    </div>
                  )}
                  <p className="practice-review-explanation">
                    <strong>Paliwanag: </strong>{question.explanation}
                  </p>
                </div>
              </details>
            ))}
          </section>

          <div className="test-actions practice-retry">
            <button className="button button-primary" type="button" onClick={tryAgain}>
              Subukan Muli · Bagong 5 Tanong
            </button>
          </div>
          <p className="test-disclaimer">
            Para sa pagsasanay lamang. Hindi iniimbak ang mga sagot at marka kapag ini-refresh o iniwan ang pahina.
          </p>
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
          <h1>Mock Test Mode</h1>
          <p>
            Limang random na tanong mula sa {APPROVED_PRACTICE_QUESTIONS.length} na sinuring
            practice questions. Walang mungkahi o marka hanggang sa huling Ipasa.
          </p>
          <span className="hero-accent" aria-hidden="true" />
        </section>

        <section className="test-card practice-card">
          <div className="test-meta">
            <strong>Tanong {index + 1} ng {QUESTIONS_PER_PRACTICE}</strong>
            <span>{answeredCount} / {QUESTIONS_PER_PRACTICE} nasagutan</span>
          </div>

          <div className="progress-track" aria-label={`Tanong ${index + 1} ng ${QUESTIONS_PER_PRACTICE}`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="test-question">
            <h2>Isulat muli nang wasto ang pangungusap:</h2>
            <blockquote>
              <strong>{item.incorrect}</strong>
            </blockquote>
          </div>

          <label htmlFor="test-answer">Iyong sagot</label>
          <textarea
            id="test-answer"
            key={item.id}
            value={answers[item.id] ?? ''}
            onChange={(event) => saveAnswer(event.target.value)}
            placeholder="Isulat ang buong tamang pangungusap..."
            spellCheck={false}
            rows={4}
          />

          <div className="test-actions">
            <button
              type="button"
              className="button button-ghost"
              disabled={index === 0}
              onClick={() => setIndex((previous) => previous - 1)}
            >
              Nakaraan
            </button>
            <button type="button" className="button button-primary" onClick={next}>
              {index === QUESTIONS_PER_PRACTICE - 1
                ? 'Ipasa ang mga Sagot'
                : answers[item.id]?.trim() ? 'Susunod' : 'Laktawan'}
            </button>
          </div>
        </section>

        <p className="test-disclaimer">
          2 Gramatika · 2 Baybay · 1 Bantas at Malaking Titik sa bawat pagtatangka.
          Pagkatapos ng Ipasa, makikita ang marka, mga tamang sagot, at paliwanag.
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
    if (hash.startsWith('#/exam')) return 'exam';
    if (hash.startsWith('#/test')) return 'test';
    if (hash.startsWith('#/tools')) return 'tools';
    return 'editor';
  }, [hash]);

  if (page === 'exam') return <EssayExamPage />;
  if (page === 'test') return <TestPage />;
  if (page === 'tools') return <ToolsPage />;
  return <EditorPage />;
}

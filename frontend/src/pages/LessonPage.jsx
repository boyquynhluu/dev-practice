import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { saveProgress } from '../api/progress.js';
import { LEVELS, TRACKS, getLesson, getSolution, listLessons, runOnServer } from '../api/tracks.js';
import { useThemeName } from '../App.jsx';
import BackendOffline from '../components/BackendOffline.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import Markdown from '../components/Markdown.jsx';
import OutputPanel from '../components/OutputPanel.jsx';
import Quiz from '../components/Quiz.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useProgress } from '../hooks/useProgress.js';
import { runInSandbox } from '../lib/runInSandbox.js';
import { statusIcon } from './TrackPage.jsx';

const TABS = [
  ['theory', 'Lý thuyết'],
  ['quiz', 'Câu hỏi'],
  ['hints', 'Gợi ý'],
  ['tests', 'Test'],
  ['solution', 'Lời giải'],
];

function Hints({ hints }) {
  const [shown, setShown] = useState(0);
  if (!hints?.length) return <p className="muted">Không có gợi ý.</p>;
  return (
    <div>
      <ol className="hints">{hints.slice(0, shown).map((h) => <li key={h}><Markdown source={h} /></li>)}</ol>
      {shown < hints.length
        ? <button type="button" className="btn" onClick={() => setShown(shown + 1)}>Xem gợi ý {shown + 1}/{hints.length}</button>
        : <p className="muted small">Đã xem hết gợi ý.</p>}
    </div>
  );
}

function Solution({ track, id, language, dark, passed, onUse }) {
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);
  const reveal = () => getSolution(track, id).then(setCode, setError);
  if (error) return <p className="bad">{error.message}</p>;
  if (code === null) {
    return (
      <div className="callout">
        <p>{passed ? 'Bạn đã qua hết test. Xem lời giải mẫu để so sánh cách làm.' : 'Bạn nên tự làm cho đến khi qua test rồi mới xem lời giải. Xem sớm thì mất cơ hội luyện tập.'}</p>
        <button type="button" className={`btn ${passed ? 'primary' : ''}`} onClick={reveal}>Hiện lời giải</button>
      </div>
    );
  }
  return (
    <div>
      <div className="readonly-editor"><CodeEditor value={code} language={language} readOnly dark={dark} height="auto" /></div>
      <button type="button" className="btn" onClick={() => onUse(code)}>Chép lời giải vào editor</button>
    </div>
  );
}

export const isQuizOnly = (l) => l.quizOnly ?? !l.tests?.trim();

function Pager({ track, lesson, siblings }) {
  const idx = siblings.findIndex((s) => s.id === lesson.id);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  return (
    <div className="pager">
      {prev ? <Link to={`/lesson/${track}/${prev.id}`}>← {prev.title}</Link> : <span />}
      {next && <Link to={`/lesson/${track}/${next.id}`}>{next.title} →</Link>}
    </div>
  );
}

/** Bài chỉ có lý thuyết + quiz (chủ đề hạ tầng/kiến trúc khó chấm bằng code): đúng hết quiz là hoàn thành. */
function QuizLesson({ track, lesson, siblings }) {
  const t = TRACKS[track];
  const progress = useProgress();
  const saved = progress[lesson.id];
  const level = LEVELS.find((l) => l.id === lesson.level);
  const onResult = useCallback(
    (passed, total) => saveProgress(lesson.id, { track, passed, total }),
    [lesson.id, track],
  );
  return (
    <main className="page quiz-lesson">
      <Link to={`/track/${track}`} className="muted small">← {t.name}</Link>
      <h1>{statusIcon(saved)} {lesson.title}</h1>
      <p className="small">
        <span className={`chip lv-${lesson.level}`}>{level?.name}</span> <span className="chip">{lesson.topic}</span>{' '}
        <span className="chip">Lý thuyết + quiz</span>
        {saved?.attempts > 0 && <span className="muted"> · {saved.attempts} lần làm · lần gần nhất đúng {saved.passed}/{saved.total}</span>}
        {saved?.status === 'DONE' && <span className="ok"> · ✔ Đã hoàn thành</span>}
      </p>
      <article className="markdown-card"><Markdown source={lesson.theory} /></article>
      <h2>Câu hỏi ({lesson.quiz?.length ?? 0})</h2>
      <p className="muted small">Trả lời đúng hết các câu thì bài được đánh dấu ✔.</p>
      <Quiz key={lesson.id} items={lesson.quiz} onResult={onResult} />
      {lesson.hints?.length > 0 && (
        <>
          <h2>Thực hành thêm</h2>
          <Hints hints={lesson.hints} />
        </>
      )}
      <Pager track={track} lesson={lesson} siblings={siblings} />
    </main>
  );
}

function LessonWorkspace({ track, lesson, siblings }) {
  const t = TRACKS[track];
  const dark = useThemeName() === 'dark';
  const progress = useProgress();
  const saved = progress[lesson.id];
  const [tab, setTab] = useState('theory');
  const [outTab, setOutTab] = useState('result');
  const [code, setCode] = useState(() => saved?.code ?? lesson.starter);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(null);
  const previewHost = useRef(null);
  const lastSaved = useRef(saved?.code ?? lesson.starter);
  const codeRef = useRef(code);
  codeRef.current = code;

  // code đã lưu trên server tới muộn (sau syncProgress): nạp vào nếu người học chưa gõ gì
  useEffect(() => {
    if (saved?.code && codeRef.current === lesson.starter && saved.code !== lesson.starter) {
      lastSaved.current = saved.code;
      setCode(saved.code);
    }
  }, [saved?.code, lesson.starter]);

  // tự lưu nháp sau 1.2s không gõ
  useEffect(() => {
    if (code === lastSaved.current) return undefined;
    const timer = setTimeout(() => {
      lastSaved.current = code;
      saveProgress(lesson.id, { track, code });
    }, 1200);
    return () => clearTimeout(timer);
  }, [code, lesson.id, track]);

  const run = useCallback(async (mode) => {
    if (running) return;
    const current = codeRef.current;
    setRunning(mode);
    setOutTab(t.local && mode === 'run' ? 'preview' : 'result');
    let r;
    try {
      r = t.local
        ? await runInSandbox({ code: current, tests: lesson.tests, mode, host: previewHost.current })
        : await runOnServer(track, { lessonId: lesson.id, code: current, mode });
    } catch (e) {
      r = { compiled: true, diagnostics: [], tests: [], networkError: e.status === 0 ? `${e.message}. Hãy khởi động ${t.runsIn}.` : e.message };
    }
    const passed = (r.tests ?? []).filter((x) => x.pass).length;
    const total = (r.tests ?? []).length;
    setResult({ ...r, mode, passed, total });
    setRunning(null);
    if (mode === 'test' && !r.networkError) {
      lastSaved.current = current;
      saveProgress(lesson.id, { track, code: current, passed: r.compiled === false ? 0 : passed, total: r.compiled === false ? Math.max(total, 1) : total });
    }
  }, [running, t.local, t.runsIn, lesson.tests, lesson.id, track]);

  const onRun = useCallback(() => run('run'), [run]);
  const onTest = useCallback(() => run('test'), [run]);
  const resetCode = () => {
    if (window.confirm('Khôi phục code khởi đầu? Code hiện tại sẽ mất.')) setCode(lesson.starter);
  };

  const level = LEVELS.find((l) => l.id === lesson.level);
  const done = saved?.status === 'DONE';

  return (
    <div className="workspace">
      <section className="pane left">
        <div className="lesson-head">
          <Link to={`/track/${track}`} className="muted small">← {t.name}</Link>
          <h1>{statusIcon(saved)} {lesson.title}</h1>
          <p className="small">
            <span className={`chip lv-${lesson.level}`}>{level?.name}</span> <span className="chip">{lesson.topic}</span>
            {saved?.attempts > 0 && <span className="muted"> · {saved.attempts} lần chấm · lần gần nhất {saved.passed}/{saved.total}</span>}
          </p>
        </div>
        <div className="tabs">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
              {label}{k === 'quiz' && lesson.quiz?.length ? ` (${lesson.quiz.length})` : ''}{k === 'hints' && lesson.hints?.length ? ` (${lesson.hints.length})` : ''}
            </button>
          ))}
        </div>
        <div className="tab-body">
          {tab === 'theory' && <Markdown source={lesson.theory} />}
          {tab === 'quiz' && <Quiz items={lesson.quiz} />}
          {tab === 'hints' && <Hints hints={lesson.hints} />}
          {tab === 'tests' && (
            <div>
              <p className="muted small">Bộ test dùng để chấm. Đọc để biết chính xác đề yêu cầu gì; đừng sửa tên hàm/class mà test gọi.</p>
              <div className="readonly-editor"><CodeEditor value={lesson.tests} language={lesson.language} readOnly dark={dark} height="auto" /></div>
            </div>
          )}
          {tab === 'solution' && <Solution key={lesson.id} track={track} id={lesson.id} language={lesson.language} dark={dark} passed={done} onUse={setCode} />}
        </div>
        <Pager track={track} lesson={lesson} siblings={siblings} />
      </section>

      <section className="pane right">
        <div className="toolbar">
          <span className="muted small">{t.language === 'javascript' ? 'JavaScript / JSX' : t.language === 'java' ? 'Java 21' : 'Python 3'}</span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={resetCode} title="Khôi phục code khởi đầu">↺ Reset</button>
          <button type="button" className="btn" onClick={onRun} disabled={!!running} title="Shift+Enter">▶ Chạy</button>
          <button type="button" className="btn primary" onClick={onTest} disabled={!!running} title="Ctrl+Enter">✔ Chạy test</button>
        </div>
        <div className="editor-wrap">
          <CodeEditor value={code} onChange={setCode} language={lesson.language} onRun={onRun} onTest={onTest} dark={dark} />
        </div>
        <div className="out-wrap">
          <div className="tabs small-tabs">
            <button type="button" className={outTab === 'result' ? 'active' : ''} onClick={() => setOutTab('result')}>Kết quả</button>
            {t.local && <button type="button" className={outTab === 'preview' ? 'active' : ''} onClick={() => setOutTab('preview')}>Preview</button>}
            {done && <span className="done-badge">✔ Đã hoàn thành</span>}
          </div>
          <div className={outTab === 'result' ? '' : 'hidden'}><OutputPanel result={result} running={running} mode={running} /></div>
          {t.local && <div ref={previewHost} className={`preview-host ${outTab === 'preview' ? '' : 'hidden'}`} />}
        </div>
      </section>
    </div>
  );
}

export default function LessonPage() {
  const { track, id } = useParams();
  const lesson = useAsync(() => getLesson(track, id), [track, id]);
  const list = useAsync(() => listLessons(track), [track]);
  if (!TRACKS[track]) return <main className="page"><h1>Không có lộ trình “{track}”</h1></main>;
  if (lesson.loading) return <main className="page"><p className="muted">Đang tải bài…</p></main>;
  if (lesson.error) {
    return (
      <main className="page">
        {lesson.error.status === 0 ? <BackendOffline track={track} onRetry={lesson.reload} /> : <p className="bad">{lesson.error.message}</p>}
      </main>
    );
  }
  if (isQuizOnly(lesson.data)) return <QuizLesson key={`${track}/${id}`} track={track} lesson={lesson.data} siblings={list.data ?? []} />;
  return <LessonWorkspace key={`${track}/${id}`} track={track} lesson={lesson.data} siblings={list.data ?? []} />;
}

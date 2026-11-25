import { Link, useParams } from 'react-router-dom';
import { LEVELS, TRACKS, listLessons } from '../api/tracks.js';
import BackendOffline from '../components/BackendOffline.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useProgress } from '../hooks/useProgress.js';

export function statusIcon(p) {
  if (p?.status === 'DONE') return <span className="st done" title="Hoàn thành">✔</span>;
  if (p?.attempts > 0 || p?.code) return <span className="st doing" title={`Đang làm · ${p.passed ?? 0}/${p.total ?? 0} test`}>◐</span>;
  return <span className="st todo" title="Chưa làm">○</span>;
}

export default function TrackPage() {
  const { track } = useParams();
  const t = TRACKS[track];
  const { data, error, loading, reload } = useAsync(() => listLessons(track), [track]);
  const progress = useProgress();
  if (!t) return <main className="page"><h1>Không có lộ trình “{track}”</h1></main>;

  return (
    <main className="page">
      <h1>{t.icon} {t.name}</h1>
      <p className="muted">{t.subtitle} · chấm tại {t.runsIn}</p>
      {loading && <p className="muted">Đang tải…</p>}
      {error && <BackendOffline track={track} onRetry={reload} />}
      {data && LEVELS.map((lv) => {
        const items = data.filter((l) => l.level === lv.id);
        if (!items.length) return null;
        const done = items.filter((l) => progress[l.id]?.status === 'DONE').length;
        return (
          <section key={lv.id} className="level-block">
            <h2><span className={`chip lv-${lv.id}`}>{lv.name}</span> {lv.desc} <span className="muted small">{done}/{items.length}</span></h2>
            <ol className="lesson-list">
              {items.map((l) => (
                <li key={l.id}>
                  <Link to={`/lesson/${track}/${l.id}`} className="lesson-row">
                    {statusIcon(progress[l.id])}
                    <span className="lesson-no">{l.id}</span>
                    <span className="lesson-title">{l.title}{l.quizOnly && <span className="chip quiz-chip">quiz</span>}</span>
                    <span className="lesson-topic">{l.topic}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </main>
  );
}

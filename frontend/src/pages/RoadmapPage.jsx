import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROADMAP_STATUS, listRoadmap, resetRoadmap, updateRoadmapDay } from '../api/roadmap.js';
import { TRACKS, listLessons } from '../api/tracks.js';
import { useAsync } from '../hooks/useAsync.js';

const GROUP_COLOR = {
  Backend: 'var(--core)',
  Database: 'var(--intermediate)',
  Architecture: 'var(--advanced)',
  'System Design': 'var(--ok)',
  Messaging: 'var(--warn-border)',
  DevOps: 'var(--accent)',
  Engineering: 'var(--muted)',
};
const STATUS_NAME = Object.fromEntries(ROADMAP_STATUS.map((s) => [s.id, s.name]));

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fmtMinutes = (min) => (min >= 60 ? `${Math.floor(min / 60)} giờ ${min % 60 ? `${min % 60} phút` : ''}` : `${min} phút`);

const isOverdue = (d, today) => d.plannedDate < today && d.status !== 'DONE';

function DayRow({ d, today, lessonTitles, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const current = draft ?? {
    actualMinutes: d.actualMinutes ?? '',
    selfRating: d.selfRating ?? '',
    note: d.note ?? '',
  };

  async function save(patch) {
    const next = { ...current, ...patch };
    setSaving(true);
    setError(null);
    try {
      const saved = await updateRoadmapDay(d.day, {
        status: patch.status ?? d.status,
        actualMinutes: next.actualMinutes === '' ? null : Number(next.actualMinutes),
        selfRating: next.selfRating === '' ? null : Number(next.selfRating),
        note: next.note || null,
      });
      onSaved(saved);
      setDraft(null);
    } catch (e) {
      setError(e.fieldErrors ? Object.values(e.fieldErrors).join(' · ') : e.message);
    } finally {
      setSaving(false);
    }
  }

  const cls = ['rm-row', `rm-${d.status.toLowerCase()}`];
  if (d.plannedDate === today) cls.push('rm-today');
  else if (isOverdue(d, today)) cls.push('rm-overdue');

  return (
    <li id={`day-${d.day}`} className={cls.join(' ')}>
      <div className="rm-main">
        <span className="rm-day">#{d.day}</span>
        <span className="rm-date">
          {fmtDate(d.plannedDate)}
          {d.plannedDate === today && <b className="rm-flag">Hôm nay</b>}
          {d.plannedDate !== today && isOverdue(d, today) && <b className="rm-flag late">Trễ</b>}
        </span>
        <span className="rm-topic">
          <span className="chip rm-group" style={{ color: GROUP_COLOR[d.group] }}>{d.group}</span>
          <b>{d.tech}</b> · {d.topic}
          <span className="muted small"> · {d.method} · {d.plannedMinutes}′</span>
          {d.lessons[0] && (
            <Link className="rm-learn small" to={`/lesson/java/${d.lessons[0]}`} title={lessonTitles[d.lessons[0]] ?? d.lessons[0]}>📘 Học</Link>
          )}
        </span>
        <select
          className={`rm-status st-${d.status.toLowerCase()}`}
          value={d.status}
          disabled={saving}
          onChange={(e) => save({ status: e.target.value })}
          aria-label={`Trạng thái buổi ${d.day}`}
        >
          {ROADMAP_STATUS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="button" className="icon-btn rm-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Ghi chú & tự đánh giá">
          {open ? '▴' : '▾'}
        </button>
      </div>

      {!open && (d.actualMinutes != null || d.selfRating != null || d.note) && (
        <p className="rm-summary muted small">
          {d.actualMinutes != null && <span>⏱ {d.actualMinutes} phút</span>}
          {d.selfRating != null && <span>{'★'.repeat(d.selfRating)}{'☆'.repeat(5 - d.selfRating)}</span>}
          {d.note && <span className="rm-note-preview">📝 {d.note}</span>}
        </p>
      )}

      {open && (
        <div className="rm-detail">
          {d.lessons.length > 0 && (
            <p className="small">
              Bài luyện liên quan:{' '}
              {d.lessons.map((id, i) => (
                <span key={id}>
                  {i > 0 && ', '}
                  <Link to={`/lesson/java/${id}`}>{id}{lessonTitles[id] ? ` — ${lessonTitles[id]}` : ''}</Link>
                </span>
              ))}
            </p>
          )}
          <div className="rm-fields">
            <label>
              Phút thực tế
              <input
                type="number" min="0" max="1440" inputMode="numeric"
                value={current.actualMinutes}
                onChange={(e) => setDraft({ ...current, actualMinutes: e.target.value })}
              />
            </label>
            <label>
              Tự đánh giá
              <select value={current.selfRating} onChange={(e) => setDraft({ ...current, selfRating: e.target.value })}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {'★'.repeat(n)}</option>)}
              </select>
            </label>
            <label className="rm-note">
              Ghi chú / link code
              <textarea
                rows={3} maxLength={2000}
                value={current.note}
                placeholder="Điều rút ra, link GitHub…"
                onChange={(e) => setDraft({ ...current, note: e.target.value })}
              />
            </label>
          </div>
          <div className="rm-actions">
            <button type="button" className="btn primary" disabled={saving || !draft} onClick={() => save({})}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
            {draft && <button type="button" className="btn" onClick={() => setDraft(null)}>Huỷ</button>}
            {d.updatedAt && <span className="muted small">Cập nhật {new Date(d.updatedAt).toLocaleString('vi-VN')}</span>}
          </div>
        </div>
      )}
      {error && <p className="bad small rm-error">{error}</p>}
    </li>
  );
}

export default function RoadmapPage() {
  const { data, error, loading, reload } = useAsync(listRoadmap, []);
  const lessons = useAsync(() => listLessons('java'), []);
  const [overrides, setOverrides] = useState({});
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  const today = localToday();

  const days = useMemo(() => (data ?? []).map((d) => overrides[d.day] ?? d), [data, overrides]);
  const lessonTitles = useMemo(() => Object.fromEntries((lessons.data ?? []).map((l) => [l.id, l.title])), [lessons.data]);
  const groups = useMemo(() => [...new Set(days.map((d) => d.group))], [days]);

  if (loading && !data) return <main className="page"><p className="muted">Đang tải…</p></main>;
  if (error && !data) {
    return (
      <main className="page">
        <h1>🗺 Roadmap Backend 84 ngày</h1>
        <div className="callout warn">
          <p><b>Chưa kết nối được {TRACKS.java.runsIn}.</b> Roadmap và tiến độ học được lưu ở backend-java. Mở terminal ở thư mục <code>dev-practice</code> rồi chạy:</p>
          <pre>{TRACKS.java.startCmd}</pre>
          <button type="button" className="btn" onClick={reload}>Thử lại</button>
        </div>
      </main>
    );
  }

  const done = days.filter((d) => d.status === 'DONE').length;
  const doing = days.filter((d) => d.status === 'IN_PROGRESS').length;
  const minutes = days.reduce((s, d) => s + (d.actualMinutes ?? 0), 0);
  const rated = days.filter((d) => d.selfRating != null);
  const avgRating = rated.length ? (rated.reduce((s, d) => s + d.selfRating, 0) / rated.length).toFixed(1) : '—';
  const overdue = days.filter((d) => isOverdue(d, today)).length;
  const todayDay = days.find((d) => d.plannedDate === today);
  const nextDay = todayDay ?? days.find((d) => d.status !== 'DONE');

  const visible = days.filter((d) => (!group || d.group === group)
    && (!status || (status === 'OVERDUE' ? isOverdue(d, today) : d.status === status)));
  const weeks = [...new Set(days.map((d) => d.week))];

  const onSaved = (saved) => setOverrides((o) => ({ ...o, [saved.day]: saved }));
  const jumpTo = (day) => document.getElementById(`day-${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <main className="page">
      <h1>🗺 Roadmap Backend 84 ngày</h1>
      <p className="muted">
        12 tuần · {groups.length} nhóm · Java, Spring, Database, Kiến trúc, System Design, Messaging, DevOps, Engineering.
        Mỗi ngày: <b>học 15 phút, code 35 phút, ghi chú 10 phút</b>.
      </p>

      <section className="rm-stats">
        <div className="rm-stat"><span className="rm-num">{done}/{days.length}</span><span className="muted small">Hoàn thành</span></div>
        <div className="rm-stat"><span className="rm-num">{days.length ? Math.round((done / days.length) * 100) : 0}%</span><span className="muted small">Tiến độ</span></div>
        <div className="rm-stat"><span className="rm-num">{doing}</span><span className="muted small">Đang học</span></div>
        <div className="rm-stat"><span className="rm-num">{fmtMinutes(minutes)}</span><span className="muted small">Thời gian đã học</span></div>
        <div className="rm-stat"><span className="rm-num">{avgRating}</span><span className="muted small">Tự đánh giá TB</span></div>
        <div className="rm-stat"><span className={`rm-num ${overdue ? 'bad' : ''}`}>{overdue}</span><span className="muted small">Buổi trễ hạn</span></div>
      </section>
      <div className="progress-bar"><span style={{ width: `${days.length ? (done / days.length) * 100 : 0}%` }} /></div>

      {nextDay && (
        <div className="callout rm-next">
          <span>
            {todayDay ? 'Hôm nay' : 'Buổi tiếp theo'}: <b>#{nextDay.day} {nextDay.tech}</b> · {nextDay.topic}
            <span className="muted"> ({STATUS_NAME[nextDay.status]})</span>
          </span>
          <button type="button" className="btn" onClick={() => { setGroup(''); setStatus(''); setTimeout(() => jumpTo(nextDay.day)); }}>Đi tới</button>
        </div>
      )}

      <div className="rm-filters">
        <label>
          Nhóm
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Tất cả</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {ROADMAP_STATUS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="OVERDUE">Trễ hạn</option>
          </select>
        </label>
        <span className="muted small">{visible.length} buổi</span>
      </div>

      {weeks.map((w) => {
        const all = days.filter((d) => d.week === w);
        const items = visible.filter((d) => d.week === w);
        if (!items.length) return null;
        const wDone = all.filter((d) => d.status === 'DONE').length;
        return (
          <section key={w} className="level-block">
            <h2>
              <span className="chip">Tuần {w}</span>
              <span className="muted small">{fmtDate(all[0].plannedDate)} → {fmtDate(all[all.length - 1].plannedDate)}</span>
              <span className="small">{wDone}/{all.length}</span>
              <span className="progress-bar rm-week-bar"><span style={{ width: `${(wDone / all.length) * 100}%` }} /></span>
            </h2>
            <ol className="lesson-list rm-list">
              {items.map((d) => <DayRow key={d.day} d={d} today={today} lessonTitles={lessonTitles} onSaved={onSaved} />)}
            </ol>
          </section>
        );
      })}

      <p className="muted small rm-footer">
        Kế hoạch lấy từ <code>docs/java/Backend_84_Day_Learning_Roadmap.xlsx</code>. Tiến độ lưu ở backend-java (H2).
        {' '}
        <button
          type="button"
          className="link danger"
          onClick={async () => {
            if (!window.confirm('Xoá toàn bộ trạng thái, ghi chú và tự đánh giá của roadmap?')) return;
            await resetRoadmap();
            setOverrides({});
            reload();
          }}
        >
          Xoá tiến độ roadmap
        </button>
      </p>
    </main>
  );
}

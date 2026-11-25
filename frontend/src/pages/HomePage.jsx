import { Link } from 'react-router-dom';
import { resetProgress } from '../api/progress.js';
import { LEVELS, TRACKS, listLessons } from '../api/tracks.js';
import { useAsync } from '../hooks/useAsync.js';
import { useProgress } from '../hooks/useProgress.js';

function TrackCard({ track }) {
  const t = TRACKS[track];
  const { data, error, loading } = useAsync(() => listLessons(track), [track]);
  const progress = useProgress();
  const done = (data ?? []).filter((l) => progress[l.id]?.status === 'DONE').length;
  const total = data?.length ?? 0;
  const next = (data ?? []).find((l) => progress[l.id]?.status !== 'DONE');
  return (
    <div className="track-card">
      <div className="track-head">
        <span className="track-icon">{t.icon}</span>
        <div>
          <h2>{t.name}</h2>
          <p className="muted">{t.subtitle}</p>
        </div>
      </div>
      {loading && <p className="muted">Đang tải…</p>}
      {error && <p className="bad small">Backend chưa chạy ({t.runsIn}). Mở trang để xem cách khởi động.</p>}
      {data && (
        <>
          <div className="progress-bar"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
          <p className="small">{done}/{total} bài hoàn thành</p>
          <div className="level-chips">
            {LEVELS.map((lv) => (
              <span key={lv.id} className={`chip lv-${lv.id}`}>
                {lv.name}: {data.filter((l) => l.level === lv.id && progress[l.id]?.status === 'DONE').length}/{data.filter((l) => l.level === lv.id).length}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="track-actions">
        <Link className="btn" to={`/track/${track}`}>Xem lộ trình</Link>
        {next && <Link className="btn primary" to={`/lesson/${track}/${next.id}`}>Học tiếp: {next.title}</Link>}
      </div>
      <p className="muted small">Chấm bài tại: {t.runsIn}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Học lý thuyết → làm bài → chấm tự động</h1>
        <p>
          Mỗi bài gồm phần <b>lý thuyết</b> ngắn, <b>câu hỏi nhanh</b> và một <b>bài tập có test</b>. Bạn viết code ngay trên web.
          Bài Frontend chạy trong trình duyệt, còn bài Java và Python được gửi lên backend để biên dịch, chạy và chấm.
        </p>
      </section>
      <section className="track-grid">
        {Object.keys(TRACKS).map((k) => <TrackCard key={k} track={k} />)}
      </section>
      <section className="callout rm-next">
        <span>🗺 <b>Roadmap Backend 84 ngày</b>: Java 21, Spring, MySQL, Redis, Kafka, Docker, AWS, DDD, System Design… Theo dõi trạng thái, phút học, ghi chú và tự đánh giá từng buổi.</span>
        <Link className="btn primary" to="/roadmap">Mở roadmap</Link>
      </section>
      <section className="guide">
        <h2>Cách học hiệu quả</h2>
        <ol>
          <li><b>Đọc lý thuyết</b> và làm phần câu hỏi nhanh. Câu nào sai thì đọc lại phần giải thích.</li>
          <li><b>Đọc tab Test</b> để biết đề yêu cầu chính xác điều gì. Test chính là đặc tả của bài.</li>
          <li>Tự viết code trước, <b>Chạy test</b> (Ctrl+Enter) nhiều lần, đọc kỹ thông báo <i>Mong đợi / Nhận được</i>.</li>
          <li>Bí quá thì mở <b>Gợi ý</b> từng cái một. Chỉ xem <b>Lời giải</b> sau khi đã qua test, để so sánh cách làm.</li>
          <li>Qua hết test thì bài được đánh dấu ✔. Code của bạn được lưu tự động, quay lại lúc nào cũng còn.</li>
        </ol>
        <p className="muted small">
          Tiến độ lưu ở backend-java (H2, thư mục <code>backend-java/data</code>). Khi backend tắt thì tạm lưu trong trình duyệt và tự đồng bộ ở lần sau.
          {' '}
          <button
            type="button"
            className="link danger"
            onClick={() => window.confirm('Xoá toàn bộ tiến độ và code đã lưu?') && resetProgress()}
          >
            Xoá toàn bộ tiến độ
          </button>
        </p>
      </section>
    </main>
  );
}

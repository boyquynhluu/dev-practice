import { TRACKS } from '../api/tracks.js';

export default function BackendOffline({ track, onRetry }) {
  const t = TRACKS[track];
  return (
    <div className="callout warn">
      <p><b>Chưa kết nối được {t.runsIn}.</b> Bài {t.name} cần backend để tải đề và chấm code. Mở terminal ở thư mục <code>dev-practice</code> rồi chạy:</p>
      <pre>{t.startCmd}</pre>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}

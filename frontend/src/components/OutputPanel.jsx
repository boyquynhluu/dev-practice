function Diagnostics({ items }) {
  return (
    <div className="diag">
      <p className="out-title bad">✘ Lỗi biên dịch / cú pháp</p>
      {items.map((d, i) => (
        <pre key={i} className="diag-item">
          {d.file}{d.line ? `:${d.line}` : ''}{d.column ? `:${d.column}` : ''} — {d.message}
        </pre>
      ))}
      <p className="muted small">Lỗi ở file <code>Tests.java</code>/<code>tests</code> thường do bạn đổi tên hoặc chữ ký hàm mà bộ test gọi.</p>
    </div>
  );
}

function TestList({ result }) {
  const { tests, passed, total } = result;
  const all = total > 0 && passed === total;
  return (
    <div>
      <p className={`out-title ${all ? 'ok' : 'bad'}`}>
        {all ? '🎉 Qua hết' : '✘ Chưa qua hết'}: {passed}/{total} test
        <span className="muted small"> · {result.timeMs} ms</span>
      </p>
      <div className="progress-bar"><span style={{ width: `${total ? (passed / total) * 100 : 0}%` }} /></div>
      <ul className="test-list">
        {tests.map((t, i) => (
          <li key={i} className={t.pass ? 'pass' : 'fail'}>
            <span className="test-icon">{t.pass ? '✔' : '✘'}</span>
            <span className="test-name">{t.name}</span>
            <span className="muted small">{t.ms} ms</span>
            {!t.pass && t.message && <pre className="test-msg">{t.message}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OutputPanel({ result, running, mode }) {
  if (running) return <div className="output"><p className="muted">⏳ {mode === 'test' ? 'Đang chấm…' : 'Đang chạy…'}</p></div>;
  if (!result) {
    return (
      <div className="output">
        <p className="muted">Bấm <b>Chạy test</b> (Ctrl+Enter) để chấm, hoặc <b>Chạy</b> (Shift+Enter) để thực thi code.</p>
      </div>
    );
  }
  const stdout = [result.stdout, ...(result.logs ?? []).map((l) => (l.level === 'log' || l.level === 'info' ? l.text : `[${l.level}] ${l.text}`))]
    .filter(Boolean).join('\n');
  return (
    <div className="output">
      {result.networkError && <p className="out-title bad">⚠ {result.networkError}</p>}
      {result.compiled === false && <Diagnostics items={result.diagnostics} />}
      {result.compiled !== false && result.mode === 'test' && <TestList result={result} />}
      {result.compiled !== false && result.mode === 'run' && (
        <p className="out-title ok">▶ Đã chạy xong <span className="muted small">· {result.timeMs} ms</span></p>
      )}
      {result.error && <pre className="out-error">{result.error}</pre>}
      {stdout && (
        <>
          <p className="out-sub">Output</p>
          <pre className="stdout">{stdout}</pre>
        </>
      )}
      {result.stderr && (
        <>
          <p className="out-sub">stderr</p>
          <pre className="stderr">{result.stderr}</pre>
        </>
      )}
    </div>
  );
}

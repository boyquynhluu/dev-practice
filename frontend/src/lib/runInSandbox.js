// Tạo iframe mới cho mỗi lần chạy, gửi code vào, chờ kết quả.
let counter = 0;

export function runInSandbox({ code, tests, mode, host, timeoutMs = 20000 }) {
  return new Promise((resolve) => {
    const runId = ++counter;
    const frame = document.createElement('iframe');
    frame.src = '/sandbox.html';
    frame.title = 'Preview';
    frame.className = 'sandbox-frame';
    host.replaceChildren(frame);
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve(result);
    };
    const onMessage = (ev) => {
      if (ev.source !== frame.contentWindow) return;
      if (ev.data?.type === 'ready') frame.contentWindow.postMessage({ type: 'run', runId, code, tests, mode }, '*');
      if (ev.data?.type === 'result' && ev.data.runId === runId) finish({ ...ev.data, stdout: '', stderr: '' });
    };
    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => {
      host.replaceChildren(); // huỷ iframe đang treo
      finish({ compiled: true, diagnostics: [], tests: [], logs: [], timedOut: true, error: `Quá thời gian ${timeoutMs / 1000}s, đã dừng` });
    }, timeoutMs);
  });
}

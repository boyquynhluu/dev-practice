// Chạy trong iframe sandbox.html. Giao tiếp với trang cha bằng postMessage.
import { execute } from './runtime.js';

window.addEventListener('message', async (ev) => {
  if (ev.source !== window.parent || ev.data?.type !== 'run') return;
  const { runId, code, tests, mode } = ev.data;
  const start = performance.now();
  let result;
  try {
    result = await execute({ code, tests, mode });
  } catch (e) {
    result = { compiled: true, diagnostics: [], tests: [], logs: [], error: `Lỗi máy chấm: ${e?.message ?? e}` };
  }
  window.parent.postMessage({ type: 'result', runId, timeMs: Math.round(performance.now() - start), ...result }, '*');
});

window.parent.postMessage({ type: 'ready' }, '*');

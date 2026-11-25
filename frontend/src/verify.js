// Trang /verify.html: chạy lời giải và code khởi đầu của mọi bài FE để kiểm tra bộ đề.
import { FE_LESSONS } from './lib/feLessons.js';
import { runInSandbox } from './lib/runInSandbox.js';

const out = document.getElementById('out');
const host = document.createElement('div');
document.body.appendChild(host);

const lines = [];
let problems = 0;
for (const l of FE_LESSONS) {
  for (const kind of ['solution', 'starter']) {
    const r = await runInSandbox({ code: l[kind], tests: l.tests, mode: 'test', host });
    const passed = r.tests.filter((t) => t.pass).length;
    const total = r.tests.length;
    let bad = '';
    if (r.compiled === false) bad = `LỖI CÚ PHÁP ${JSON.stringify(r.diagnostics)}`;
    else if (kind === 'solution' && (total === 0 || passed !== total)) bad = `FAIL ${JSON.stringify(r.tests.filter((t) => !t.pass))} ${r.error ?? ''}`;
    else if (kind === 'starter' && total > 0 && passed === total) bad = 'starter đã qua hết';
    else if (kind === 'starter' && total === 0) bad = `starter không chạy được test: ${r.error}`;
    if (bad) problems++;
    lines.push(`${bad ? '✘' : 'ok'} ${l.id} ${kind} ${passed}/${total} ${r.timeMs ?? ''}ms ${bad}`);
    out.textContent = lines.join('\n');
  }
}
out.textContent = `${lines.join('\n')}\n\n${problems ? `CÓ ${problems} VẤN ĐỀ` : 'TẤT CẢ OK'} (${FE_LESSONS.length} bài)`;
document.title = problems ? 'VERIFY FAIL' : 'VERIFY OK';

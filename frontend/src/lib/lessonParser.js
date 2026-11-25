// Đọc file .lesson — cùng định dạng với backend-java (LessonParser) và backend-python (lessons.py).
export function parseLesson(source, fileName = '') {
  const sections = {};
  let cur = null;
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('%%% ')) {
      cur = line.slice(4).trim();
      sections[cur] = [];
    } else if (cur) {
      sections[cur].push(line);
    }
  }
  const text = (k) => {
    const body = (sections[k] ?? []).join('\n').trim();
    return body ? `${body}\n` : '';
  };
  const meta = {};
  for (const l of sections.meta ?? []) {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  if (!meta.id || !meta.title) throw new Error(`${fileName}: thiếu meta id/title`);
  return {
    id: meta.id,
    title: meta.title,
    level: meta.level ?? 'core',
    topic: meta.topic ?? '',
    order: Number(meta.order ?? 0),
    language: 'javascript',
    theory: text('theory'),
    quiz: parseQuiz(sections.quiz ?? []),
    hints: (sections.hints ?? []).filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()),
    starter: text('starter'),
    tests: text('tests'),
    solution: text('solution'),
  };
}

function parseQuiz(lines) {
  const out = [];
  let q = null;
  for (const l of [...lines, '? ']) {
    if (l.startsWith('? ')) {
      if (q?.question) out.push(q);
      q = { question: l.slice(2).trim(), options: [], answer: -1, explain: '' };
    } else if (q && (l.startsWith('* ') || l.startsWith('- '))) {
      if (l.startsWith('* ')) q.answer = q.options.length;
      q.options.push(l.slice(2).trim());
    } else if (q && l.startsWith('> ')) {
      q.explain = `${q.explain} ${l.slice(2).trim()}`.trim();
    }
  }
  return out;
}

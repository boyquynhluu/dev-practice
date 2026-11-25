import { marked } from 'marked';
import { useMemo } from 'react';

marked.setOptions({ gfm: true, breaks: false });

// Nội dung lý thuyết là file trong repo (không phải input người dùng) nên render HTML trực tiếp.
export default function Markdown({ source }) {
  const html = useMemo(() => marked.parse(source ?? ''), [source]);
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

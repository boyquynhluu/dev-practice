import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';

const LANGS = {
  java: () => java(),
  python: () => python(),
  javascript: () => javascript({ jsx: true }),
};

export default function CodeEditor({ value, onChange, language, onRun, onTest, readOnly = false, height = '100%', dark }) {
  const extensions = useMemo(() => {
    const keys = keymap.of([
      { key: 'Mod-Enter', preventDefault: true, run: () => (onTest?.(), true) },
      { key: 'Shift-Enter', preventDefault: true, run: () => (onRun?.(), true) },
    ]);
    return [LANGS[language]?.() ?? [], keys];
  }, [language, onRun, onTest]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      editable={!readOnly}
      theme={dark ? 'dark' : 'light'}
      height={height}
      basicSetup={{ tabSize: 4, foldGutter: true, highlightActiveLine: !readOnly }}
      className="code-editor"
    />
  );
}

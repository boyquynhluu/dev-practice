// Bộ chạy code FE: biên dịch JSX bằng Babel, chạy code + test, trả kết quả.
// Dùng trong iframe sandbox.html (mỗi lần chạy một iframe mới để không dính trạng thái cũ).
import * as Babel from '@babel/standalone';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const TEST_TIMEOUT_MS = 5000;
const LOOP_LIMIT_MS = 3000;

// ---------- chặn vòng lặp vô hạn ----------
let guardDeadline = Infinity;
let guardCount = 0;
function __guard() {
  if ((++guardCount & 1023) === 0 && Date.now() > guardDeadline) {
    guardDeadline = Infinity;
    throw new Error(`Vòng lặp chạy quá ${LOOP_LIMIT_MS / 1000}s, có thể là vòng lặp vô hạn`);
  }
}
function armGuard() {
  guardDeadline = Date.now() + LOOP_LIMIT_MS;
}

Babel.registerPlugin('loop-guard', ({ types: t }) => ({
  visitor: {
    'WhileStatement|ForStatement|DoWhileStatement|ForInStatement|ForOfStatement'(path) {
      const call = t.expressionStatement(t.callExpression(t.identifier('__guard'), []));
      const body = path.get('body');
      if (body.isBlockStatement()) body.unshiftContainer('body', call);
      else body.replaceWith(t.blockStatement([call, body.node]));
    },
  },
}));

// Cho phép người học viết import/export như trong project thật: bỏ đi vì React đã có sẵn.
export function stripModuleSyntax(code) {
  return code
    .replace(/^\s*import\s+[^;]*?from\s+['"][^'"]+['"];?\s*$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^(\s*)export\s+default\s+(?=(async\s+)?function|class)/gm, '$1')
    .replace(/^(\s*)export\s+(?=(const|let|var|function|class|async)\b)/gm, '$1');
}

function compile(code, filename) {
  return Babel.transform(code, {
    filename,
    sourceType: 'script',
    presets: [['react', { runtime: 'classic' }]],
    plugins: ['loop-guard'],
    parserOpts: { allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true },
  }).code;
}

/** Lỗi cú pháp trong code người học -> diagnostic có dòng/cột. */
export function checkSyntax(code) {
  try {
    compile(stripModuleSyntax(code), 'solution.jsx');
    return null;
  } catch (e) {
    const loc = e.loc ?? {};
    return { file: 'solution.jsx', line: loc.line ?? 0, column: (loc.column ?? 0) + 1, message: String(e.message).split('\n')[0] };
  }
}

// ---------- expect ----------
function show(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
  if (v instanceof Element) return `<${v.tagName.toLowerCase()}>${v.textContent.slice(0, 60)}`;
  try {
    const s = JSON.stringify(v, (k, x) => (x === undefined ? '__undefined__' : x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : x));
    return s === undefined ? String(v) : s.replace(/"__undefined__"/g, 'undefined');
  } catch {
    return String(v);
  }
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Map && b instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k)));
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  const ka = Object.keys(a).filter((k) => a[k] !== undefined);
  const kb = Object.keys(b).filter((k) => b[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
}

class AssertionError extends Error {}

function makeMatchers(actual, negate) {
  const assert = (pass, msg) => {
    if (pass === negate) throw new AssertionError((negate ? 'Không mong đợi: ' : '') + msg);
  };
  const m = {
    toBe: (exp) => assert(Object.is(actual, exp), `Mong đợi: ${show(exp)}\nNhận được: ${show(actual)}`),
    toEqual: (exp) => assert(deepEqual(actual, exp), `Mong đợi: ${show(exp)}\nNhận được: ${show(actual)}`),
    toBeTruthy: () => assert(!!actual, `Mong đợi giá trị truthy, nhận ${show(actual)}`),
    toBeFalsy: () => assert(!actual, `Mong đợi giá trị falsy, nhận ${show(actual)}`),
    toBeNull: () => assert(actual === null, `Mong đợi null, nhận ${show(actual)}`),
    toBeUndefined: () => assert(actual === undefined, `Mong đợi undefined, nhận ${show(actual)}`),
    toBeDefined: () => assert(actual !== undefined, 'Mong đợi khác undefined'),
    toBeInstanceOf: (C) => assert(actual instanceof C, `Mong đợi instance của ${C.name}, nhận ${show(actual)}`),
    toContain: (x) => assert(actual != null && actual.includes(x), `Mong đợi ${show(actual)} chứa ${show(x)}`),
    toHaveLength: (n) => assert(actual != null && actual.length === n, `Mong đợi độ dài ${n}, nhận ${actual?.length}`),
    toBeGreaterThan: (n) => assert(actual > n, `Mong đợi > ${n}, nhận ${show(actual)}`),
    toBeLessThan: (n) => assert(actual < n, `Mong đợi < ${n}, nhận ${show(actual)}`),
    toBeCloseTo: (n, digits = 2) => assert(Math.abs(actual - n) < 10 ** -digits / 2, `Mong đợi ≈ ${n}, nhận ${show(actual)}`),
    toMatch: (re) => assert(typeof actual === 'string' && (re instanceof RegExp ? re.test(actual) : actual.includes(re)), `Mong đợi ${show(actual)} khớp ${re}`),
    toHaveBeenCalledTimes: (n) => assert(actual?.calls?.length === n, `Mong đợi được gọi ${n} lần, thực tế ${actual?.calls?.length}`),
    toThrow: (expected) => {
      let threw = false;
      let err;
      try {
        actual();
      } catch (e) {
        threw = true;
        err = e;
      }
      const okMsg = !expected || (expected instanceof RegExp ? expected.test(err?.message) : typeof expected === 'function' ? err instanceof expected : String(err?.message).includes(expected));
      assert(threw && okMsg, threw ? `Lỗi ném ra không khớp: ${err?.message}` : 'Mong đợi hàm ném lỗi nhưng không có lỗi nào');
    },
  };
  return m;
}

function expect(actual) {
  const m = makeMatchers(actual, false);
  m.not = makeMatchers(actual, true);
  m.rejects = {
    toThrow: async (expected) => {
      try {
        await actual;
      } catch (e) {
        if (expected && !String(e?.message).includes(expected)) throw new AssertionError(`Lỗi không khớp: ${e?.message}`);
        return;
      }
      throw new AssertionError('Mong đợi promise bị reject nhưng nó resolve');
    },
  };
  m.resolves = {
    toEqual: async (exp) => makeMatchers(await actual, false).toEqual(exp),
    toBe: async (exp) => makeMatchers(await actual, false).toBe(exp),
  };
  return m;
}

function fn(impl = () => undefined) {
  const mock = (...args) => {
    mock.calls.push(args);
    return impl(...args);
  };
  mock.calls = [];
  return mock;
}

// ---------- tiện ích DOM / React ----------
const roots = [];
const realFetch = globalThis.fetch;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Không dùng React.act (bản production của React 19 không có). Thay vào đó:
// render đồng bộ bằng flushSync, rồi chờ vài macrotask để effect và state update chạy xong.
async function settle(action) {
  if (action) await action();
  await sleep(0);
  await sleep(0);
}

async function render(element) {
  const container = document.createElement('div');
  document.getElementById('test-area').appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  await settle(() => flushSync(() => root.render(element)));
  return {
    container,
    rerender: (el) => settle(() => flushSync(() => root.render(el))),
    unmount: () => settle(() => root.unmount()),
  };
}

async function click(el) {
  if (!el) throw new AssertionError('click(): không tìm thấy phần tử');
  await settle(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

async function type(el, value) {
  if (!el) throw new AssertionError('type(): không tìm thấy phần tử');
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await settle(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

async function submit(form) {
  await settle(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

async function flush(ms = 0) {
  await settle(() => sleep(ms));
}

async function waitFor(check, timeout = 1500) {
  const end = Date.now() + timeout;
  for (;;) {
    try {
      return check();
    } catch (e) {
      if (Date.now() > end) throw e;
      await flush(20);
    }
  }
}

function all(selector, root = document.getElementById('test-area')) {
  return [...root.querySelectorAll(selector)];
}

function $(selector, root) {
  return all(selector, root)[0] ?? null;
}

function queryByText(text, root = document.getElementById('test-area')) {
  const match = (s) => (text instanceof RegExp ? text.test(s) : s === text);
  const els = [...root.querySelectorAll('*')].filter((e) => match(e.textContent.trim()));
  // phần tử sâu nhất có text khớp
  return els.find((e) => ![...e.children].some((c) => match(c.textContent.trim()))) ?? null;
}

function getByText(text, root) {
  const el = queryByText(text, root);
  if (!el) throw new AssertionError(`Không tìm thấy phần tử có text ${show(String(text))}`);
  return el;
}

function mockFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const r = await handler(String(url), opts);
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (r instanceof Error) throw r;
    const { status = 200, body = null, delay = 0 } = r ?? {};
    if (delay) {
      await new Promise((res, rej) => {
        const t = setTimeout(res, delay);
        opts.signal?.addEventListener('abort', () => {
          clearTimeout(t);
          rej(new DOMException('Aborted', 'AbortError'));
        });
      });
    }
    return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
  return calls;
}

// localStorage giả trong bộ nhớ: iframe cùng origin với app, không được đụng vào dữ liệu thật của app.
class MemoryStorage {
  #data = new Map();

  get length() { return this.#data.size; }

  key(i) { return [...this.#data.keys()][i] ?? null; }

  getItem(k) { return this.#data.has(String(k)) ? this.#data.get(String(k)) : null; }

  setItem(k, v) { this.#data.set(String(k), String(v)); }

  removeItem(k) { this.#data.delete(String(k)); }

  clear() { this.#data.clear(); }
}
const memoryLocal = new MemoryStorage();
const memorySession = new MemoryStorage();

async function cleanup() {
  for (const { root, container } of roots.splice(0)) {
    try {
      root.unmount();
    } catch {
      /* đã unmount */
    }
    container.remove();
  }
  document.getElementById('test-area').replaceChildren();
  globalThis.fetch = realFetch;
  memoryLocal.clear();
  memorySession.clear();
}

// ---------- chạy ----------
const HOOKS = ['useState', 'useEffect', 'useLayoutEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext',
  'createContext', 'memo', 'forwardRef', 'useSyncExternalStore', 'useId', 'useTransition', 'useDeferredValue', 'Fragment'];

function withTimeout(promise, ms, msg) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(t));
}

function describe(e) {
  if (e instanceof AssertionError) return e.message;
  const name = e?.name ?? 'Error';
  return `${name}: ${e?.message ?? String(e)}`;
}

/**
 * mode "test": chạy code + bộ test, trả {tests, error}
 * mode "run": chạy code, nếu có function App thì render vào #preview
 */
export async function execute({ code, tests = '', mode }) {
  const logs = [];
  const original = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  for (const level of Object.keys(original)) {
    console[level] = (...args) => {
      logs.push({ level, text: args.map((a) => (typeof a === 'string' ? a : show(a))).join(' ') });
      original[level](...args);
    };
  }
  const restore = () => Object.assign(console, original);

  const syntax = checkSyntax(code);
  if (syntax) {
    restore();
    return { compiled: false, diagnostics: [syntax], tests: [], logs, error: null };
  }

  const registered = [];
  const test = (name, body) => registered.push({ name, body });
  const helpers = { React, ReactDOM, test, expect, fn, render, click, type, submit, flush, sleep, waitFor, $, all, getByText, queryByText, mockFetch, __guard, localStorage: memoryLocal, sessionStorage: memorySession };
  const tail = mode === 'run'
    ? '\n;if (typeof App === "function") await __renderApp(App);'
    : '';
  let body;
  try {
    body = compile(`(async () => {\n${stripModuleSyntax(code)}\n;\n${mode === 'test' ? tests : ''}${tail}\n})()`, 'bundle.jsx');
  } catch (e) {
    restore();
    return { compiled: false, diagnostics: [{ file: 'tests', line: 0, column: 0, message: String(e.message).split('\n')[0] }], tests: [], logs, error: null };
  }
  const renderApp = async (App) => {
    const root = createRoot(document.getElementById('preview'));
    await settle(() => flushSync(() => root.render(React.createElement(App))));
  };
  const names = [...Object.keys(helpers), '__renderApp', ...HOOKS];
  const values = [...Object.values(helpers), renderApp, ...HOOKS.map((h) => React[h])];

  let error = null;
  const results = [];
  try {
    armGuard();
    // eslint-disable-next-line no-new-func
    await withTimeout(new Function(...names, `"use strict";\nreturn ${body}`)(...values), TEST_TIMEOUT_MS, 'Code chạy quá lâu khi khởi tạo');
  } catch (e) {
    error = `Lỗi khi chạy code: ${describe(e)}`;
  }
  if (mode === 'test' && !error) {
    for (const t of registered) {
      const start = performance.now();
      try {
        armGuard();
        await withTimeout(Promise.resolve().then(t.body), TEST_TIMEOUT_MS, `Quá thời gian ${TEST_TIMEOUT_MS / 1000}s (promise không bao giờ xong?)`);
        results.push({ name: t.name, pass: true, message: '', ms: Math.round(performance.now() - start) });
      } catch (e) {
        results.push({ name: t.name, pass: false, message: describe(e), ms: Math.round(performance.now() - start) });
      } finally {
        await cleanup();
      }
    }
  }
  restore();
  return { compiled: true, diagnostics: [], tests: results, logs, error };
}

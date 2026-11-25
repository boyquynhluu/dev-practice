// Tiến độ lưu ở backend-java (/api/progress). Backend tắt thì dùng localStorage, lần sau đồng bộ lên.
import { request } from './http.js';

const KEY = 'devpractice-progress-v1';
const listeners = new Set();
let cache = load();
let online = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* hết quota / private mode */
  }
  listeners.forEach((l) => l(cache));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAll() {
  return cache;
}

export function isOnline() {
  return online;
}

function mergeRemote(list) {
  for (const p of list) {
    const local = cache[p.lessonId];
    const remoteNewer = !local || (p.updatedAt ?? '') >= (local.updatedAt ?? '');
    cache[p.lessonId] = remoteNewer
      ? { ...local, ...p, status: local?.status === 'DONE' ? 'DONE' : p.status, pending: false }
      : local;
  }
}

export async function syncProgress() {
  try {
    const list = await request('GET', '/api/progress');
    online = true;
    mergeRemote(list);
    // đẩy những bản ghi lưu lúc offline
    for (const p of Object.values(cache).filter((x) => x.pending)) {
      await push(p.lessonId, { track: p.track, code: p.code, passed: p.pendingPassed, total: p.pendingTotal });
    }
  } catch {
    online = false;
  }
  persist();
  return cache;
}

async function push(lessonId, body) {
  const saved = await request('PUT', `/api/progress/${lessonId}`, body);
  cache[lessonId] = { ...cache[lessonId], ...saved, pending: false, pendingPassed: undefined, pendingTotal: undefined };
}

/** Ghi một lần chấm (passed/total) hoặc chỉ lưu nháp code. */
export async function saveProgress(lessonId, { track, code, passed, total }) {
  const now = new Date().toISOString();
  const prev = cache[lessonId] ?? { lessonId, track, status: 'IN_PROGRESS', attempts: 0, passed: 0, total: 0 };
  const graded = passed !== undefined;
  const next = { ...prev, track, updatedAt: now };
  if (code !== undefined) next.code = code;
  if (graded) {
    next.attempts = (prev.attempts ?? 0) + 1;
    next.passed = passed;
    next.total = total;
    if (total > 0 && passed === total && prev.status !== 'DONE') {
      next.status = 'DONE';
      next.completedAt = now;
    }
  }
  cache[lessonId] = next;
  persist();
  try {
    await push(lessonId, { track, code, passed, total });
    online = true;
  } catch {
    online = false;
    cache[lessonId] = { ...cache[lessonId], pending: true, pendingPassed: graded ? passed : cache[lessonId].pendingPassed, pendingTotal: graded ? total : cache[lessonId].pendingTotal };
  }
  persist();
}

export async function resetProgress() {
  cache = {};
  persist();
  try {
    await request('DELETE', '/api/progress');
  } catch {
    /* offline: chỉ xoá local */
  }
}

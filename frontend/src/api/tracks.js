import { FE_LESSONS } from '../lib/feLessons.js';
import { request } from './http.js';

export const TRACKS = {
  fe: {
    id: 'fe',
    name: 'Frontend',
    subtitle: 'JavaScript · DOM · React',
    language: 'javascript',
    icon: '⚛',
    runsIn: 'Trình duyệt (iframe)',
    local: true,
  },
  java: {
    id: 'java',
    name: 'Backend Java',
    subtitle: 'Core Java · Spring-style · Concurrency',
    language: 'java',
    icon: '☕',
    runsIn: 'backend-java :8081',
    base: '/api/java',
    startCmd: 'cd backend-java && mvn spring-boot:run',
  },
  python: {
    id: 'python',
    name: 'Backend Python',
    subtitle: 'Core Python · SQL · asyncio',
    language: 'python',
    icon: '🐍',
    runsIn: 'backend-python :8082',
    base: '/api/python',
    startCmd: 'cd backend-python && .venv\Scripts\python -m uvicorn app.main:app --port 8082',
  },
};

export const LEVELS = [
  { id: 'core', name: 'Core', desc: 'Nền tảng bắt buộc' },
  { id: 'intermediate', name: 'Intermediate', desc: 'Dùng hằng ngày khi đi làm' },
  { id: 'advanced', name: 'Advanced', desc: 'Hệ thống, hiệu năng, đồng thời' },
];

const summary = ({ id, title, level, topic, order }) => ({ id, title, level, topic, order });

export async function listLessons(track) {
  if (TRACKS[track].local) return FE_LESSONS.map(summary);
  return request('GET', `${TRACKS[track].base}/lessons`);
}

export async function getLesson(track, id) {
  if (TRACKS[track].local) {
    const l = FE_LESSONS.find((x) => x.id === id);
    if (!l) throw new Error(`Không có bài ${id}`);
    const { solution, ...rest } = l;
    return rest;
  }
  return request('GET', `${TRACKS[track].base}/lessons/${id}`);
}

export async function getSolution(track, id) {
  if (TRACKS[track].local) return FE_LESSONS.find((x) => x.id === id)?.solution ?? '';
  return (await request('GET', `${TRACKS[track].base}/lessons/${id}/solution`)).solution;
}

export async function runOnServer(track, { lessonId, code, mode }) {
  return request('POST', `${TRACKS[track].base}/run`, { lessonId, code, mode });
}

export async function health(track) {
  if (TRACKS[track].local) return { status: 'UP' };
  return request('GET', `${TRACKS[track].base}/health`);
}

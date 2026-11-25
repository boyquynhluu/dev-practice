// Lộ trình Backend 84 ngày — lưu ở backend-java (/api/roadmap).
import { request } from './http.js';

export const ROADMAP_STATUS = [
  { id: 'TODO', name: 'Chưa học' },
  { id: 'IN_PROGRESS', name: 'Đang học' },
  { id: 'DONE', name: 'Hoàn thành' },
];

export const listRoadmap = () => request('GET', '/api/roadmap');

/** Ghi đè phần theo dõi của một buổi: { status, actualMinutes, note, selfRating }. */
export const updateRoadmapDay = (day, body) => request('PUT', `/api/roadmap/${day}`, body);

export const resetRoadmap = () => request('DELETE', '/api/roadmap');

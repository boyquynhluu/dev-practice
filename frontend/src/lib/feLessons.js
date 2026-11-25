import { parseLesson } from './lessonParser.js';

const files = import.meta.glob('../lessons/*.lesson', { query: '?raw', import: 'default', eager: true });

export const FE_LESSONS = Object.entries(files)
  .map(([path, src]) => parseLesson(src, path))
  .sort((a, b) => a.order - b.order);

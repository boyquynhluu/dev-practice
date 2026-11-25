import { useSyncExternalStore } from 'react';
import { getAll, subscribe } from '../api/progress.js';

export function useProgress() {
  return useSyncExternalStore(subscribe, getAll);
}

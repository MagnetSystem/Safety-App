import AsyncStorage from '@react-native-async-storage/async-storage';
import { createComplaint, type CreateComplaintInput } from './complaintsService';

const KEY = 'pendingSos';

export interface PendingSos extends CreateComplaintInput {
  queuedAt: string;
}

async function readQueue(): Promise<PendingSos[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingSos[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(list: PendingSos[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

/** Called when an emergency alert can't reach the server (no connection). */
export async function queueSos(payload: CreateComplaintInput): Promise<void> {
  const list = await readQueue();
  list.push({ ...payload, queuedAt: new Date().toISOString() });
  await writeQueue(list);
}

export async function pendingSosCount(): Promise<number> {
  return (await readQueue()).length;
}

let flushing = false;

/**
 * Tries to submit every queued alert. Anything that still fails stays in the
 * queue for the next attempt. Returns how many were delivered. Guarded so
 * overlapping callers (app start + screen focus) can't double-send.
 */
export async function flushSos(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    return await doFlush();
  } finally {
    flushing = false;
  }
}

async function doFlush(): Promise<number> {
  const list = await readQueue();
  if (list.length === 0) return 0;

  const remaining: PendingSos[] = [];
  let sent = 0;
  for (const item of list) {
    try {
      const { queuedAt, ...payload } = item;
      void queuedAt;
      await createComplaint(payload);
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }
  await writeQueue(remaining);
  return sent;
}

import { getItem, setItem, deleteItem } from './storage';

const KEY = 'pendingGuardianCode';

/**
 * Holds a guardian invite code between opening a deep link and finishing sign-in/registration —
 * the link can land on someone with no session yet, and the code has to survive that detour.
 */
export const savePendingGuardianCode = (code: string) => setItem(KEY, code);
export const getPendingGuardianCode = () => getItem(KEY);
export const clearPendingGuardianCode = () => deleteItem(KEY);

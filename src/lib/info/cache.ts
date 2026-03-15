type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = store.get(key) as CacheEntry<T> | undefined;
  if (current && current.expiresAt > now) return current.value;

  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

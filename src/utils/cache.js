/**
 * In-memory cache utility (Redis-style semantics for the browser).
 *
 * Features:
 * - get / set / invalidate / invalidateByPrefix
 * - Optional TTL per entry (in seconds). Pass TTL = 0 or omit for indefinite.
 *
 * Usage:
 *   import cache from '../utils/cache';
 *   cache.set('clients:list:0:10', data, 300); // 5 min TTL
 *   cache.get('clients:list:0:10');             // data or null
 *   cache.invalidate('clients:list:0:10');
 *   cache.invalidateByPrefix('clients:');       // wipes all client keys
 */

const store = new Map();

const cache = {
  /**
   * Retrieve a cached value.
   * Returns null if missing or expired.
   */
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  /**
   * Store a value.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlSeconds=0]  0 = indefinite (no expiry)
   */
  set(key, value, ttlSeconds = 0) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    store.set(key, { value, expiresAt });
  },

  /**
   * Remove a single key.
   */
  invalidate(key) {
    store.delete(key);
  },

  /**
   * Remove all keys that start with the given prefix.
   * e.g. invalidateByPrefix('clients:') wipes all client cache entries.
   */
  invalidateByPrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  },

  /**
   * Check whether a key exists and is not expired.
   */
  has(key) {
    return this.get(key) !== null;
  },

  /**
   * Clear the entire cache (useful for logout).
   */
  clear() {
    store.clear();
  },
};

export default cache;

const cache = new Map();

export async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 240)}`);
    return { data, headers: res.headers, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

export async function cachedJson(key, ttlMs, loader) {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.value;
  const value = await loader();
  cache.set(key, { at: now, value });
  return value;
}

let lastRequestAt = 0;
let queue = Promise.resolve();

export function rateLimited(task, minGapMs = 6200) {
  const run = async () => {
    const wait = Math.max(0, minGapMs - (Date.now() - lastRequestAt));
    if (wait) await new Promise(r => setTimeout(r, wait));
    const out = await task();
    lastRequestAt = Date.now();
    return out;
  };
  queue = queue.then(run, run);
  return queue;
}

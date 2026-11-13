/** Tiny fetch helper for providers. Honours the adapter's AbortSignal; throws on non-2xx with a secret-free message. */
export async function httpJson<T = unknown>(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown; signal: AbortSignal },
): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: { "content-type": "application/json", ...init.headers },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`${new URL(url).host} responded ${res.status}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

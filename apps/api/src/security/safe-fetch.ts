import { env } from "../config/env.js";
import { guardUrl } from "./url-guard.js";

export interface SafeFetchResult {
  ok: boolean;
  status: number | null;
  finalUrl: string | null;
  headers: Record<string, string>;
  body: string | null;
  responseTimeMs: number;
  error: string | null;
}

export async function safeFetch(
  rawUrl: string,
  init: RequestInit & { readBody?: boolean } = {}
): Promise<SafeFetchResult> {
  const start = Date.now();
  let currentUrl = rawUrl;
  let hops = 0;
  let readBody = init.readBody ?? false;

  while (true) {
    const guard = await guardUrl(currentUrl);
    if (!guard.ok) {
      return {
        ok: false, status: null, finalUrl: null,
        headers: {}, body: null,
        responseTimeMs: Date.now() - start,
        error: `Blocked: ${guard.reason}`,
      };
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), env.WEB_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(guard.url.toString(), {
        ...init, redirect: "manual", signal: ctrl.signal,
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc || hops >= env.WEB_FETCH_MAX_REDIRECTS) {
          clearTimeout(timer);
          return {
            ok: false, status: res.status, finalUrl: currentUrl,
            headers: {}, body: null,
            responseTimeMs: Date.now() - start,
            error: loc ? "Too many redirects" : "Redirect without location",
          };
        }
        currentUrl = new URL(loc, currentUrl).toString();
        hops++;
        clearTimeout(timer);
        continue;
      }

      let body: string | null = null;
      if (readBody && res.body) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > env.WEB_FETCH_MAX_BYTES) {
            reader.cancel().catch(() => {});
            clearTimeout(timer);
            return {
              ok: false, status: res.status, finalUrl: currentUrl,
              headers: {}, body: null,
              responseTimeMs: Date.now() - start,
              error: "Response too large",
            };
          }
          chunks.push(value);
        }
        body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
      } else {
        // drain without buffering
        res.body?.cancel().catch(() => {});
      }
      clearTimeout(timer);
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k] = v; });
      return {
        ok: res.ok, status: res.status, finalUrl: currentUrl,
        headers, body,
        responseTimeMs: Date.now() - start,
        error: null,
      };
    } catch (err) {
      clearTimeout(timer);
      return {
        ok: false, status: null, finalUrl: currentUrl,
        headers: {}, body: null,
        responseTimeMs: Date.now() - start,
        error: err instanceof Error ? err.name + ": " + err.message : String(err),
      };
    }
  }
}
import { promises as dns } from "node:dns";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice(7);
      return isPrivateIp(v4);
    }
    return false;
  }
  return true;
}

export interface GuardResult { ok: true; url: URL; resolvedIp: string }
export interface GuardError { ok: false; reason: string }

export async function guardUrl(raw: string): Promise<GuardResult | GuardError> {
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, reason: "Invalid URL" }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http(s) allowed" };
  }
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) return { ok: false, reason: "Blocked hostname" };
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) return { ok: false, reason: "Private IP blocked" };
    return { ok: true, url, resolvedIp: hostname };
  }
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return { ok: false, reason: "DNS resolution failed" };
  }
  for (const a of addresses) {
    if (isPrivateIp(a.address)) return { ok: false, reason: "DNS resolves to private IP" };
  }
  return { ok: true, url, resolvedIp: addresses[0]?.address ?? "" };
}
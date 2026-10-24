import { describe, it, expect } from "vitest";
import { guardUrl } from "./url-guard.js";

describe("url guard", () => {
  it("rejects localhost", async () => {
    const r = await guardUrl("http://localhost:8080");
    expect(r.ok).toBe(false);
  });
  it("rejects private IPv4", async () => {
    const r = await guardUrl("http://10.0.0.1");
    expect(r.ok).toBe(false);
  });
  it("rejects 127.0.0.1", async () => {
    const r = await guardUrl("http://127.0.0.1/");
    expect(r.ok).toBe(false);
  });
  it("rejects metadata service", async () => {
    const r = await guardUrl("http://169.254.169.254/");
    expect(r.ok).toBe(false);
  });
  it("rejects file:// scheme", async () => {
    const r = await guardUrl("file:///etc/passwd");
    expect(r.ok).toBe(false);
  });
});
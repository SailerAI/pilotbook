import { describe, expect, it } from "vitest";
import { sanitizeSourceUrl } from "../src/core/sources.ts";

describe("sanitizeSourceUrl (BR-006)", () => {
  it("strips userinfo", () => {
    const result = sanitizeSourceUrl("https://user:hunter2@example.com/path");
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://example.com/path");
  });

  it("strips credential and signature query parameters", () => {
    const result = sanitizeSourceUrl(
      "https://example.com/doc?id=42&token=abc123&api_key=xyz&ok=keep",
    );
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://example.com/doc?id=42&ok=keep");
  });

  it("strips AWS-style presigned-URL signature parameters", () => {
    const result = sanitizeSourceUrl(
      "https://bucket.s3.amazonaws.com/file?X-Amz-Signature=deadbeef&X-Amz-Credential=abc&keep=1",
    );
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://bucket.s3.amazonaws.com/file?keep=1");
  });

  it("leaves a clean URL untouched", () => {
    const result = sanitizeSourceUrl("https://github.com/github/spec-kit");
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://github.com/github/spec-kit");
    expect(result.host).toBe("github.com");
  });

  it("reports ok: false for text that is not a URL", () => {
    const result = sanitizeSourceUrl("not a url at all");
    expect(result.ok).toBe(false);
    expect(result.url).toBeUndefined();
  });
});

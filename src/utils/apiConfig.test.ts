import { describe, expect, it } from "vitest";
import {
  resolveApiBaseUrl,
  resolveLegacyApiBaseUrl,
  resolvePublicBaseUrl,
} from "./apiConfig";

describe("apiConfig", () => {
  it("normalizes canonical base from legacy /api", () => {
    expect(resolveApiBaseUrl("/api")).toBe("/api/v1");
    expect(resolveApiBaseUrl("http://localhost:8080/api")).toBe("http://localhost:8080/api/v1");
  });

  it("keeps canonical base when /api/v1 is already configured", () => {
    expect(resolveApiBaseUrl("/api/v1")).toBe("/api/v1");
    expect(resolveApiBaseUrl("http://localhost:8080/api/v1")).toBe("http://localhost:8080/api/v1");
  });

  it("builds legacy base as controlled deprecated fallback", () => {
    expect(resolveLegacyApiBaseUrl("/api/v1")).toBe("/api");
    expect(resolveLegacyApiBaseUrl("http://localhost:8080/api/v1")).toBe("http://localhost:8080/api");
  });

  it("keeps public base outside API versioning", () => {
    expect(resolvePublicBaseUrl("/api/v1")).toBe("");
    expect(resolvePublicBaseUrl("http://localhost:8080/api/v1")).toBe("http://localhost:8080");
  });
});

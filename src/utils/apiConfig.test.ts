import { describe, expect, it } from "vitest";
import {
  resolveApiBaseUrl,
  resolvePublicBaseUrl,
} from "./apiConfig";

describe("apiConfig", () => {
  it("keeps canonical base when /api/v1 is already configured", () => {
    expect(resolveApiBaseUrl("/api/v1")).toBe("/api/v1");
    expect(resolveApiBaseUrl("http://localhost:8080/api/v1")).toBe("http://localhost:8080/api/v1");
  });

  it("adds the canonical prefix to an origin", () => {
    expect(resolveApiBaseUrl("http://localhost:8080")).toBe("http://localhost:8080/api/v1");
  });

  it("keeps public base outside API versioning", () => {
    expect(resolvePublicBaseUrl("/api/v1")).toBe("");
    expect(resolvePublicBaseUrl("http://localhost:8080/api/v1")).toBe("http://localhost:8080");
  });
});

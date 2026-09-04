import { describe, expect, it } from "vitest";
import { isPublicEndpoint } from "./PermissionService";

describe("PermissionService public endpoints", () => {
  it("keeps catalog reads public and operational reads private", () => {
    expect(isPublicEndpoint("/goatfarms/8", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats/summary", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats/ABC-01", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/goats/ABC-01/genealogies", "GET")).toBe(true);
    expect(isPublicEndpoint("/goatfarms/8/alerts", "GET")).toBe(false);
  });
});

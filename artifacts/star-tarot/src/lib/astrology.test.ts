import { describe, expect, it } from "vitest";
import { localTimeToUtc } from "./astrology";

describe("localTimeToUtc", () => {
  it("uses the New York winter offset", () => {
    expect(localTimeToUtc(2024, 1, 15, 12, 0, "America/New_York").toISOString()).toBe("2024-01-15T17:00:00.000Z");
  });

  it("uses the New York summer offset", () => {
    expect(localTimeToUtc(2024, 7, 15, 12, 0, "America/New_York").toISOString()).toBe("2024-07-15T16:00:00.000Z");
  });

  it("uses the daylight-saving offset after the spring transition", () => {
    expect(localTimeToUtc(2024, 3, 10, 3, 30, "America/New_York").toISOString()).toBe("2024-03-10T07:30:00.000Z");
  });
});

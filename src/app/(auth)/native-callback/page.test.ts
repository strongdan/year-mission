import { describe, expect, it } from "vitest";
import { isNativeShellHandoff } from "./page";

describe("native callback handoff", () => {
  it("recognizes only the explicit native-shell handoff marker", () => {
    expect(isNativeShellHandoff("native-shell")).toBe(true);
    expect(isNativeShellHandoff(null)).toBe(false);
    expect(isNativeShellHandoff("browser")).toBe(false);
  });
});

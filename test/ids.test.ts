import { describe, expect, it } from "vitest";
import { builtinTypes } from "../src/core/defaults.ts";
import { idPatternFor, nextId } from "../src/core/ids.ts";
import type { ParsedItem } from "../src/core/types.ts";

const story = builtinTypes().story!;

function bytes(chars: number[]): Uint8Array {
  return new Uint8Array(chars);
}

describe("nextId", () => {
  it("allocates a prefix plus 6 Crockford characters", () => {
    const id = nextId("story", story, [], () => bytes([10, 11, 12, 13, 14, 15]));
    expect(id).toBe("US-ABCDEF");
    expect(idPatternFor("US-", 3).test(id)).toBe(true);
  });

  it("skips an all-digit body so the id does not look like a padded number", () => {
    const draws = [bytes([0, 1, 2, 3, 4, 5]), bytes([10, 11, 12, 13, 14, 15])];
    let i = 0;
    const id = nextId("story", story, [], () => draws[i++]!);
    expect(id).toBe("US-ABCDEF");
  });

  it("retries when the id is already in the graph", () => {
    const taken = { type: "story", data: { id: "US-ABCDEF" } } as ParsedItem;
    const draws = [bytes([10, 11, 12, 13, 14, 15]), bytes([16, 17, 18, 19, 20, 21])];
    let i = 0;
    expect(nextId("story", story, [taken], () => draws[i++]!)).toBe("US-GHJKMN");
  });

  it("throws when every attempt is unusable", () => {
    expect(() => nextId("story", story, [], () => bytes([0, 1, 2, 3, 4, 5]))).toThrow(
      /could not allocate an id for story/,
    );
  });
});

describe("idPatternFor", () => {
  const pattern = idPatternFor("US-", 3);

  it("accepts legacy padded ids and new ids", () => {
    expect(pattern.test("US-001")).toBe(true);
    expect(pattern.test("US-K7M2QP")).toBe(true);
  });

  it("rejects the wrong pad, lowercase, and excluded letters", () => {
    expect(pattern.test("US-12")).toBe(false);
    expect(pattern.test("US-0012")).toBe(false);
    expect(pattern.test("US-k7m2qp")).toBe(false);
    expect(pattern.test("US-IIIIII")).toBe(false);
  });
});

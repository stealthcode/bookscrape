import { describe, expect, it } from "@jest/globals";
import { uniquePairs, parseCharacterNames, parseInteraction } from "./parse";

describe("parse", () => {
  describe("uniquePairs", () => {
    it("correctly pairs all elements without self-relations", () => {
      const result = uniquePairs(["a", "b", "c", "d"]);
      expect(result).toHaveLength(6);
      expect(result).toContainEqual({ name1: "a", name2: "b" });
      expect(result).toContainEqual({ name1: "a", name2: "c" });
      expect(result).toContainEqual({ name1: "a", name2: "d" });
      expect(result).not.toContainEqual({ name1: "a", name2: "a" });
      expect(result).toContainEqual({ name1: "b", name2: "c" });
      expect(result).toContainEqual({ name1: "b", name2: "d" });
      expect(result).not.toContainEqual({ name1: "b", name2: "b" });
      expect(result).toContainEqual({ name1: "c", name2: "d" });
      expect(result).not.toContainEqual({ name1: "c", name2: "c" });
      expect(result).not.toContainEqual({ name1: "d", name2: "d" });
    });
  });

  describe("parseCharacterNames", () => {
    it("strips quotes and separates by comma delimiter", () => {
      const results = parseCharacterNames('a\nb "title"\nc\n\nd');
      expect(results).toHaveLength(4);
      expect(results).toContain("a");
      expect(results).toContain('b "title"');
      expect(results).toContain("c");
      expect(results).toContain("d");
    });
  });

  describe("parseInteraction", () => {
    it("returns null if 'no interaction'", () => {
      const results = parseInteraction("no interaction");
      expect(results).toBeNull();
    });
    it("returns description if not 'no interaction'", () => {
      const description = "the characters have a tense conversation";
      const results = parseInteraction(description);
      expect(results).toEqual(description);
    });
  });
});

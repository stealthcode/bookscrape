import { saveCharacters } from "./graph";

describe("graph", () => {
  describe("saveCharacters", () => {
    it("saves characters from list of names", async () => {
      await saveCharacters(["Alice", "Bob", "Carol"]);
    });
  });
});

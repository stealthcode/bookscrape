import { configDotenv } from "dotenv";
import neo4j, { Driver } from "neo4j-driver";

import { GraphStore } from "./graph";

configDotenv();

let driver: Driver;
beforeAll(async () => {
  const driver = neo4j.driver(
    "neo4j://localhost",
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );
  await driver.verifyConnectivity();
});

afterAll(async () => {
  await driver.close();
});

const TEST_DATABASE = "bookscrape-test";
describe("graph", () => {
  describe("GraphStore", () => {
    it("savesCharacters", async () => {
      const graphStore = new GraphStore({
        database: TEST_DATABASE,
        replace: true,
      });
      try {
        await graphStore.saveCharacters(["Alice", "Bob", "Carol"]);
        const { records, summary } = await driver.executeQuery(
          `MATCH (c:CHARACTER) RETURN c.name AS name`,
          { database: TEST_DATABASE },
        );

        expect(records).toHaveLength(3);
        expect(records).toContainEqual("Alice");
        expect(records).toContainEqual("Bob");
        expect(records).toContainEqual("Carol");
      } finally {
        await graphStore.close();
      }
    });
  });
});

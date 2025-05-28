import { configDotenv } from "dotenv";
import neo4j, { Driver, Session } from "neo4j-driver";

import { GraphStore } from "./graph";

configDotenv();

let driver: Driver;
beforeAll(async () => {
  driver = neo4j.driver(
    "neo4j://localhost",
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );
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
      await query(async (graphStore) => {
        await graphStore.saveCharacters(["Alice", "Bob", "Carol"]);
        const { records } = await driver.executeQuery(
          `MATCH (c:CHARACTER) RETURN c.name AS name`,
          { database: TEST_DATABASE },
        );

        expect(records).toHaveLength(3);
        expect(records).toContainEqual("Alice");
        expect(records).toContainEqual("Bob");
        expect(records).toContainEqual("Carol");
      });
    });

    it("savesCharacters", async () => {
      await query(async (graphStore) => {
        await graphStore.saveInteractions([
          {
            name1: "Alice",
            name2: "Bob",
            chapter: 1,
            summary: "Strategized Alice's election campaign",
          },
          {
            name1: "Alice",
            name2: "Carol",
            chapter: 2,
            summary: "Debated in televized national broadcast",
          },
          {
            name1: "Bob",
            name2: "Carol",
            chapter: 3,
            summary: "Fired their strategist",
          },
        ]);
        const { records } = await driver.executeQuery(
          `MATCH (c:INTERACTION) RETURN c AS interaction`,
          { database: TEST_DATABASE },
        );

        expect(records).toHaveLength(3);
        expect(records).toContainEqual("Alice");
        expect(records).toContainEqual("Bob");
        expect(records).toContainEqual("Carol");
      });
    });
  });
});

const query = async (f: TestFunc) => {
  const graphStore = new GraphStore({
    database: TEST_DATABASE,
    replace: true,
  });
  await graphStore.initializeDatabase();
  try {
    await f(graphStore);
  } finally {
    await graphStore.close();
  }
};

type TestFunc = (graphStore: GraphStore) => Promise<void>;

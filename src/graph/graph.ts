import neo4j, { Driver, RecordShape } from "neo4j-driver";

export type ConnectionParams = {
  username?: string;
  password?: string;
  database?: string;
  replace?: boolean;
};
export class GraphStore {
  driver: Driver;

  constructor(params?: ConnectionParams) {
    this.driver = this.getDriver(params);
  }

  public async saveCharacters(names: string[]): Promise<RecordShape[]> {
    const session = this.driver.session();
    try {
      return session.executeWrite(async (tx) => {
        const result = await tx.run(
          `UNWIND $props AS map
         CREATE (n:Character)
         SET n = map`,
          {
            props: names.map((name) => ({ name })),
          },
        );
        return result.records.map((record) => record.toObject());
      });
    } finally {
      await session.close();
    }
  }

  public async saveInteractions(
    interactions: Interaction[],
  ): Promise<RecordShape[]> {
    const session = this.driver.session();
    try {
      return session.executeWrite(async (tx) => {
        const result = await tx.run(
          `UNWIND $interactions AS interactions
         MATCH (a:Character {name: i.name1}), (b:Character {name: i.name2})
         CREATE (a)-[:INTERACTED_WITH {chapter: i.chapter, summary: i.summary}]-(b),
         SET i = interactions`,
          {
            interactions,
          },
        );
        return result.records.map((record) => record.toObject());
      });
    } finally {
      await session.close();
    }
  }

  public async close(): Promise<void> {
    return this.driver.close();
  }

  getDriver = (params?: ConnectionParams): Driver => {
    const {
      username = process.env.NEO4J_USERNAME!,
      password = process.env.NEO4J_PASSWORD!,
      database = process.env.NEO4J_DATABASE!,
      replace = false,
    } = params || {};
    const driver = neo4j.driver(
      "neo4j://localhost",
      neo4j.auth.basic(username, password),
    );
    const session = driver.session({
      database: database,
    });
    try {
      session.executeWrite((tx) => {
        if (replace) {
          tx.run("CREATE DATABASE OR REPLACE $database", { database });
        } else {
          tx.run("CREATE DATABASE $database IF NOT EXISTS", { database });
        }
      });
    } catch (err) {
      console.log("Failed to create database", database, err);
      throw err;
    } finally {
      session.close();
    }
    return driver;
  };
}

type Interaction = {
  name1: string;
  name2: string;
  chapter: number;
  summary: string;
};

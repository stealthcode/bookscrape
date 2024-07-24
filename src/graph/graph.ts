import neo4j, { RecordShape } from "neo4j-driver";

const driver = neo4j.driver(
  "neo4j://localhost",
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
);

export const saveCharacters = async (
  names: string[],
): Promise<RecordShape[]> => {
  const session = driver.session();
  try {
    return await session.executeWrite(async (txc) => {
      const result = await txc.run(
        `UNWIND $props AS map
         CREATE (n:Character)
         SET n = map`,
        {
          props: names.map((name) => ({ name })),
        },
      );
      return result.records.map((record) => record.toObject());
    });
  } catch (err) {
    console.log("err", err);
    throw err;
  } finally {
    await driver.close();
  }
};

export const saveInteractions = async (
  interactions: Interaction[],
): Promise<RecordShape[]> => {
  const session = driver.session();
  try {
    return await session.executeWrite(async (txc) => {
      const result = await txc.run(
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
    await driver.close();
  }
};

type Interaction = {
  name1: string;
  name2: string;
  chapter: number;
  summary: string;
};

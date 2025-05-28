import { configDotenv } from "dotenv";

import {
  parseCharacterNames,
  parseInteraction,
  uniquePairs,
} from "./parse/parse";
import { promptForContinue } from "./ux/ux";
import { RetrievalChain } from "./retrieval/retrieval";
import { GraphStore } from "./graph/graph";
import { saveState } from "./state/state";
import { getStore } from "./store/store";
import { OpenAI } from "openai";

configDotenv();

async function main() {
  const contentTitle = process.env.ASSET_TITLE!;
  console.log(`Beginning process for ${contentTitle}`);
  const { state, store } = await getStore(contentTitle);
  const { sectionCount: chapterCount } = state;
  if (store === undefined) {
    return;
  }

  const api = new RetrievalChain(store);
  console.log("Pinecone store initialized with documents");
  if (promptForContinue() === false) {
    return null;
  }

  console.log("Retrieving character names");
  const characterNameAnswers = await api.invoke([
    "Give the names to at most 5 most important characters to the plot?",
    "Each name should be on a separate line.",
    "Example:\nAlice\nBob\nCarol\nDave\n",
  ]);
  console.log("Character names response:", characterNameAnswers);
  if (promptForContinue() === false) {
    return;
  }

  console.log("Retrieving character interactions per chapter");
  const characterNames = parseCharacterNames(characterNameAnswers);
  const characterPairs = uniquePairs(characterNames);
  const chapters = Array.from({ length: chapterCount }, (_, chapter) => 1);
  const batch = chapters.flatMap((chapter) =>
    characterPairs.map(async ({ name1, name2 }) => {
      const question = [
        `Write a summary of the interaction between ${name1} and ${name2} in chapter ${chapter}.`,
        "If they do not interact then say no interaction.",
        "Answer in at most 1 sentence.",
      ];
      return api.invoke(question).then((summary) => ({
        chapter,
        name1,
        name2,
        summary,
      }));
    }),
  );
  const interactions = (await Promise.all(batch)).flatMap((queryData) => {
    const interaction = parseInteraction(queryData.summary);
    return interaction === undefined ? [] : [queryData];
  });
  console.log("Character interactions:", interactions);
  if (promptForContinue() === false) {
    return;
  }
  // Store characters and their interactions in graph database
  saveState({
    ...state,
    retrievalResults: {
      characterNames,
      interactions,
    },
  });
  const graphStore = new GraphStore();
  try {
    await graphStore.saveCharacters(characterNames);
    await graphStore.saveInteractions(interactions);
    console.log("Information saved to Neo4j");
  } finally {
    await graphStore.close();
  }
  const openAI = new OpenAI();
  const r = await openAI.embeddings.create({
    input: "",
    model: "text-embedding-ada-002",
  });
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

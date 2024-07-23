import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

import { formatDocumentsAsString } from "langchain/util/document";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  parseCharacterNames,
  parseInteraction,
  uniquePairs,
} from "./parse/parse";
import { promptForContinue, promptOption } from "./ux/ux";
import { createNewIndex, useExistingIndex } from "./store/store";
import { getStateForTitle, StoreState } from "./state/state";
import { DateTime } from "luxon";

dotenv.config();

const chatAPI = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

async function main() {
  const contentTitle = process.env.ASSET_TITLE!;
  console.log(`Beginning process for ${contentTitle}`);
  const { state, store } = await getStore(contentTitle);
  const { sectionCount: chapterCount } = state;
  if (store === undefined) {
    return;
  }
  const retriever = store.asRetriever({ k: 4, searchType: "similarity" });

  console.log("Pinecone store initialized with documents");
  if (promptForContinue() === false) {
    return null;
  }

  const prompt = ChatPromptTemplate.fromTemplate<{
    context: string;
    question: string;
  }>(
    [
      "You are a narrative analyst answering quetions about a book.",
      "Use the following excerpts of retrieved context to answer the question.",
      "If you don't know the answer, just say that you don't know.",
      "Keep answer concise.",
      "Question: {question}",
      "Context: {context}",
      "Answer:",
    ].join("\n"),
  );

  const ragChain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    chatAPI,
    new StringOutputParser(),
  ]);

  console.log("Retrieving character names");
  const characterNameAnswers = await ragChain.invoke({
    question: [
      "Give the names to at most 5 most important characters to the plot?",
      "Each name should be on a separate line.",
      "Example:\nAlice\nBob\nCarol\nDave\n",
    ].join(" "),
  });
  console.log("Character names response:", characterNameAnswers);
  if (promptForContinue() === false) {
    return;
  }

  console.log("Retrieving character interactions per chapter");
  const characterNames = parseCharacterNames(characterNameAnswers);
  const characterPairs = uniquePairs(characterNames);
  const interactions = await Promise.all(
    Array.from({ length: chapterCount }, async (_, chapter) => {
      characterPairs.flatMap(async ([name1, name2]) => {
        const results = await ragChain.invoke({
          question: [
            `Write a summary of the interaction between ${name1} and ${name2} in chapter ${chapter}.`,
            "If they do not interact then say no interaction.",
            "Answer in at most 3 sentences.",
          ].join(" "),
        });
        const interaction = parseInteraction(results);
        if (interaction === undefined) {
          return [];
        }
        return [
          {
            chapter,
            name1,
            name2,
            interaction,
          },
        ];
      });
    }),
  );
  console.log("Character interactions:", interactions);
  if (promptForContinue() === false) {
    return;
  }

  // TODO: Store characters and their interactions in graph database
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

const getStore = async (
  contentTitle: string,
): Promise<{ state: StoreState; store: PineconeStore }> => {
  const states = getStateForTitle(contentTitle);
  console.log(`Existing states: ${states.length}`);
  const options = ["Create new index"].concat(
    states.slice(0, 5).map(formatStoreState),
  );
  const optionChoice = options.length === 1 ? 0 : promptOption(options);
  if (optionChoice === 0) {
    return createNewIndex(contentTitle, 500, 40, "gpt-4o-mini");
  }
  const state = states[optionChoice - 1];
  const store = await useExistingIndex(state.indexName);
  return { state, store };
};

const formatStoreState = ({
  dateCreated,
  chunkSize,
  indexName,
}: StoreState): string => {
  const dateDiff = DateTime.fromISO(dateCreated)
    .diffNow(["days", "hours", "minutes"])
    .toHuman({ unitDisplay: "narrow" });
  return `${dateDiff} ago ${chunkSize} chunkSize Index: ${indexName}`;
};

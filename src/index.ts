import dotenv from "dotenv";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

import { splitDoc } from "./doc/doc";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  parseCharacterNames,
  parseInteraction,
  uniquePairs,
} from "./parse/parse";
import { promptForContinue, promptOption } from "./ux/ux";
import { createNewIndex, useExistingIndex } from "./store/store";

dotenv.config();

const chatAPI = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

async function main() {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const indices = await pinecone.listIndexes();

  const storeOption = promptOption([
    "Use existing Pinecone data",
    "Build new Pinecone Index",
  ]);
  const retriever = await (storeOption === 0
    ? useExistingIndex()
    : createNewIndex());

  if (retriever === undefined) {
    return;
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

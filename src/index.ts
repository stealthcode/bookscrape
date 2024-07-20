import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

import { splitDoc } from "./doc/doc";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();

const embeddingAPI = new OpenAIEmbeddings({
  model: "gpt-4o-mini",
  stripNewLines: true,
  configuration: {},
  apiKey: process.env.OPENAI_API_KEY,
});
const chatAPI = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

async function main() {
  const splitDocs = await splitDoc(process.env.ASSET_FILE_PATH!);
  const store = await PineconeStore.fromDocuments(splitDocs, embeddingAPI, {
    onFailedAttempt: (err) => {
      console.log("An error occurred with the Pinecone Store", err);
    },
    maxConcurrency: 5,
  });
  const retriever = store.asRetriever({ k: 4, searchType: "similarity" });

  const prompt = ChatPromptTemplate.fromTemplate<{
    context: string;
    question: string;
  }>(
    [
      "You are a narrative analyst answering quetions about a book.",
      "Use the following pieces of retrieved context to answer the question.",
      "If you don't know the answer, just say that you don't know.",
      "Use three sentences maximum and keep the answer concise.",
      "Question: {question}",
      "Book contents: {context}",
      "Answer:",
    ].join(" "),
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

  const results = ragChain.invoke({
    question:
      "What are the names of the 5 most important characters to the plot?",
  });
  console.log("results", results);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

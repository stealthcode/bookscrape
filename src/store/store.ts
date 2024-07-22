import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { splitDoc } from "../doc/doc";
import { promptForContinue } from "../ux/ux";
import { readFileSync, writeFileSync } from "node:fs";
import os from "os";
import * as path from "node:path";

export const useExistingIndex = async () => {
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
  const store = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
    pineconeIndex,
  });
  return store.asRetriever({ k: 4, searchType: "similarity" });
};

export const createNewIndex = async () => {
  const { docs, chapterCount } = await splitDoc(process.env.ASSET_FILE_PATH!);
  console.log("Document chunks", docs.length);
  if (promptForContinue() === false) {
    return;
  }
  console.log("Storing documents in Pinecone");
  const embeddingAPI = new OpenAIEmbeddings({
    model: "gpt-4o-mini",
    stripNewLines: true,
  });
  const store = await PineconeStore.fromDocuments(docs, embeddingAPI, {
    onFailedAttempt: (err) => {
      console.log("An error occurred with the Pinecone Store", err);
    },
    maxConcurrency: 5,
    pineconeIndex,
  });
  save(chapterCount, pineconeIndex);
  console.log("Pinecone store initialized with documents", docs.length);
  if (promptForContinue() === false) {
    return;
  }

  return store.asRetriever({ k: 4, searchType: "similarity" });
};

const save = (chapterCount: number, pineconeIndex: string) => {
  const data = {
    chapterCount,
    pineconeIndex,
  };
  writeFileSync(saveFilePath, JSON.stringify(data), "utf8");
};

const load = (): { chapterCount: number; pineconeIndex: string } => {
  const fileContent = readFileSync(saveFilePath, "utf8");
  return JSON.parse(fileContent);
};

const saveFilePath = path.join(os.homedir(), ".bookscrape");

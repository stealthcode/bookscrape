import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { splitDoc } from "../doc/doc";
import { formatStoreState, promptForContinue, promptOption } from "../ux/ux";
import { saveState, getStateForTitle, StoreState } from "../state/state";
import { DateTime } from "luxon";

export const getStore = async (
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

export const useExistingIndex = async (
  indexName: string,
): Promise<PineconeStore> => {
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(indexName);
  return await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
    pineconeIndex,
  });
};

export const createNewIndex = async (
  contentTitle: string,
  chunkSize: number,
  chunkOverlap: number,
  modelName: string,
): Promise<{ state: StoreState; store: PineconeStore }> => {
  const filePath = process.env.ASSET_FILE_PATH!;
  const { docs, chapterCount } = await splitDoc(
    filePath,
    chunkSize,
    chunkOverlap,
  );
  const chunkCount = docs.length;
  console.log("Document chunk count", chunkCount);
  console.log("Storing documents in Pinecone");
  const dateCreated = DateTime.now().toISO();
  const indexName = `${contentTitle}-${dateCreated}`;
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(indexName);
  const embeddingAPI = new OpenAIEmbeddings({
    model: modelName,
    stripNewLines: true,
  });
  const store = await PineconeStore.fromDocuments(docs, embeddingAPI, {
    onFailedAttempt: (err) => {
      console.log("An error occurred with the Pinecone Store", err);
      throw err;
    },
    maxConcurrency: 5,
    pineconeIndex,
  });
  const state: StoreState = {
    contentTitle,
    sectionCount: chapterCount,
    chunkCount,
    chunkSize,
    chunkOverlap,
    modelName,
    indexName,
    dateCreated,
  };
  saveState(state);
  return {
    state,
    store: store,
  };
};

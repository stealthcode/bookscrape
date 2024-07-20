import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { splitDoc } from "./doc/doc";

dotenv.config();
const openAI = new OpenAIEmbeddings({
  model: "gpt-4o-mini",
  stripNewLines: true,
  configuration: {},
  apiKey: process.env.OPENAI_API_KEY,
});
async function main() {
  const splitDocs = await splitDoc(process.env.ASSET_FILE_PATH!);
  const store = new PineconeStore(openAI, {
    onFailedAttempt: (err) => {},
    maxConcurrency: 5,
  });
  // for each chunk:
  splitDocs.forEach(async (doc) => {
    // store each chunk to unique index
    // store.addDocuments([doc], { namespace: });
    // query plot points
    // query characters
  });

  // dedupe plot points based on similarity (query embedding and check distance)
  // serialize plot points
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

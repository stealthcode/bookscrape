import { TokenTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as fs from "node:fs";

export const splitDoc = async (fileName: string): Promise<Document[]> => {
  const rawData = fs.readFileSync(fileName);
  const text = rawData.toString();
  const chapters = text.split(/^CHAPTER [IVX]+\.$/m);

  // chunk document
  const textSplitter = new TokenTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
    encodingName: "gpt2",
  });
  const metadatas = Array.from({ length: chapters.length }, (_, i) => ({
    chapter: i,
  }));
  return textSplitter.createDocuments(chapters, metadatas);
};

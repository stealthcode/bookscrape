import { TokenTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as fs from "node:fs";

export const splitDoc = async (
  fileName: string,
  chunkSize: number,
  chunkOverlap: number,
): Promise<ExtractedData> => {
  const rawData = fs.readFileSync(fileName);
  const text = rawData.toString();
  const chapters = text
    .split(/^CHAPTER [IVX\d]+\.$/m)
    .filter((chapter) => chapter.trim() !== "");

  // chunk document
  const textSplitter = new TokenTextSplitter({
    chunkSize,
    chunkOverlap,
    encodingName: "gpt2",
  });
  const chapterCount = chapters.length;
  const metadatas = Array.from({ length: chapterCount }, (_, i) => ({
    chapter: i + 1,
  }));
  const docs = await textSplitter.createDocuments(chapters, metadatas);
  return {
    chapterCount,
    docs,
  };
};

type ExtractedData = {
  chapterCount: number;
  docs: Document[];
};

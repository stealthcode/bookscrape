import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

const chatAPI = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

export class RetrievalChain {
  ragChain: RunnableSequence<{ question: string }>;

  public constructor(store: PineconeStore) {
    const retriever = store.asRetriever({ k: 4, searchType: "similarity" });
    this.ragChain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      prompt,
      chatAPI,
      new StringOutputParser(),
    ]);
  }

  public async invoke(question: string | string[]): Promise<string> {
    if (Array.isArray(question)) {
      question = question.join(" ");
    }
    return await this.ragChain.invoke({
      question,
    });
  }
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

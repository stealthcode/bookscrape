import {
  getFromCache,
  isInCache,
  writeToCache,
} from "@/app/openai/fetchAnswerCache";
import { config } from "@/app/config";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "openai";
import { openai } from "@/app/openai/openai";

const ebookSystemPrompt = "You are helping the user create an ebook";

export interface Conversation {
  messages: ChatCompletionRequestMessage[];
}

export const getCompletion = async (
  conversation: Conversation,
  model: string = config.gptModel,
): Promise<CreateChatCompletionResponse> => {
  const response = await openai.createChatCompletion({
    model,
    messages: conversation.messages as any,
  });
  return response.data;
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const MAX_RETRY_ATTEMPTS = 3;
export const getCompletionWithRetry = async (
  conversation: Conversation,
  model: string = config.gptModel,
  attempt: number = 0,
): Promise<CreateChatCompletionResponse> => {
  try {
    return await getCompletion(conversation, model);
  } catch (err) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      console.log("Couldn't get completion, trying again... ERROR=", err);
      await sleep(500 * attempt * attempt); // exponential backoff
      return await getCompletionWithRetry(conversation, model, attempt + 1);
    } else {
      throw new Error(`Could not get completion after ${attempt} retries`);
    }
  }
};

export const fetchAnswer = async (
  question: string,
  model: string = config.gptModel,
  systemPrompt: string = ebookSystemPrompt,
): Promise<string> => {
  console.log("");
  console.log(
    `Fetching answer for question:\n\n---QUESTION---\n\t"${question}"`,
  );

  if (isInCache(systemPrompt, question, model)) {
    if (config.verboseFetch) {
      console.log(
        "Returning cached answer:\n\n---CACHED ANSWER---\n\t" +
          getFromCache(systemPrompt, question, model),
      );
    } else {
      console.log(
        `Returning cached answer:\n\n---CACHED ANSWER---\n\t${getFromCache(
          systemPrompt,
          question,
          model,
        ).substring(0, 80)}...`,
      );
    }
    return getFromCache(systemPrompt, question, model);
  }

  const conversation = getConverstionFromQuestion(question, systemPrompt);
  const response = await getCompletionWithRetry(conversation, model);
  const answer = getCompletionResponseText(response);

  writeToCache(systemPrompt, question, model, answer);

  if (config.verboseFetch) {
    console.log(
      `Got answer for question "${question.substring(
        0,
        80,
      )}...":\n\n---ANSWER---\n\t${answer}`,
    );
  } else {
    console.log(
      `Got answer for question "${question.substring(
        0,
        30,
      )}...":\n\n---ANSWER---\n\t${answer.substring(0, 80)}...`,
    );
  }
  return answer;
};

export const getConverstionFromQuestion = (
  question: string,
  systemPrompt: string = ebookSystemPrompt,
): Conversation => {
  return {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: question,
      },
    ],
  };
};

export const getCompletionResponseText = (
  completion: CreateChatCompletionResponse,
): string => {
  return (
    completion.choices[completion.choices.length - 1]?.message?.content || ""
  );
};

export const getStringifiedConversation = (
  conversation: Conversation,
  completion?: CreateChatCompletionResponse,
): string => {
  const conversationString = conversation.messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  if (completion) {
    const completionString = completion.choices
      .map((choice) => `${choice?.message?.role}: ${choice?.message?.content}`)
      .join("\n");

    return "CONVERSATION:\n" + conversationString + completionString + "\n";
  }

  return "CONVERSATION:\n" + conversationString + "\n";
};

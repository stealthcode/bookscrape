import fs from "fs";
import path from "path";
import os from "os";

// The cache reads from ~/.fetchAnswerCache.json on startup to warm the in-memory cache stored in fetchAnswerCache,
// and writes to this cache (and kicks off a write to the file) every time a completion is returned for a one-off answer.

const homeDir = os.homedir();
const fetchCacheFilePath = path.join(homeDir, ".fetchAnswerCache.json");

const createCacheFileIfItDoesNotExist = (filePath: string) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
  } catch (err) {
    try {
      fs.writeFileSync(filePath, "{}");
      console.log(`"${filePath}" created successfully.`);
    } catch (err) {
      console.error(`Error creating ${filePath}:`, err);
    }
  }
};

const readJsonFromFileSync = (file: string): any => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (err) {
    console.error("Error reading JSON data from the file:", err);
    return {};
  }
};

createCacheFileIfItDoesNotExist(fetchCacheFilePath);
const fetchAnswerCache = readJsonFromFileSync(fetchCacheFilePath) as Record<
  string,
  string
>;

const writeJsonToFile = (data: any, file: string) => {
  fs.writeFile(file, JSON.stringify(data, null, 2), (err: Error) => {
    if (err) {
      console.error("Error writing JSON data to the file:", err);
      return;
    }
  });
};

const getCacheKey = (systemPrompt: string, question: string, model: string) =>
  [systemPrompt, question, model].join(" | ");

export const isInCache = (
  systemPrompt: string,
  question: string,
  model: string,
) => {
  return getFromCache(systemPrompt, question, model) !== undefined;
};

export const getFromCache = (
  systemPrompt: string,
  question: string,
  model: string,
) => {
  return fetchAnswerCache[getCacheKey(systemPrompt, question, model)];
};

export const writeToCache = (
  systemPrompt: string,
  question: string,
  model: string,
  answer: string,
) => {
  fetchAnswerCache[getCacheKey(systemPrompt, question, model)] = answer;
  writeJsonToFile(fetchAnswerCache, fetchCacheFilePath);
};

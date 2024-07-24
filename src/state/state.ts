import { DateTime } from "luxon";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import os from "os";
import * as path from "node:path";

export const saveState = (state: StoreState) => {
  const data = loadAllState();
  data[state.contentTitle][state.dateCreated] = state;
  writeFileSync(saveFilePath, JSON.stringify(data), "utf8");
};

export const loadAllState = (): AppState => {
  if (existsSync(saveFilePath) === false) {
    return {};
  }
  const fileContent = readFileSync(saveFilePath, "utf8");
  const state = JSON.parse(fileContent);
  return state;
};

/** Returns a sorted list of state entries for a given title in descending order of datetime created
 */
export const getStateForTitle = (title: ContentTitle): StoreState[] => {
  const appState = loadAllState();
  return sortStates(appState[title]);
};

export const sortStates = (
  storeStates: Record<DateTimeISO, StoreState>,
): StoreState[] => {
  return Object.entries(storeStates || {})
    .sort(([dateTime1], [dateTime2]) =>
      DateTime.fromISO(dateTime1) < DateTime.fromISO(dateTime2) ? 1 : -1,
    )
    .map(([_, state]) => state);
};

const saveFilePath = path.join(os.homedir(), ".bookscrape");

export type StoreState = {
  contentTitle: ContentTitle;
  dateCreated: DateTimeISO;
  indexName: string;
  sectionCount: number;
  chunkSize: number;
  chunkOverlap: number;
  chunkCount: number;
  modelName: string;
  retrievalResults?: RetrievalResults;
};

export type RetrievalResults = {
  characterNames?: string[];
  interactions?: {
    name1: string;
    name2: string;
    chapter: number;
    summary: string;
  }[];
};

export type ContentTitle = string;

export type DateTimeISO = string;

export type AppState = Record<ContentTitle, Record<DateTimeISO, StoreState>>;

import { DateTime } from "luxon";
import fs from "node:fs";
import { StoreState } from "../state/state";

export const promptForContinue = (): boolean => {
  while (true) {
    console.log("Continue? [y/n]");
    const input = getChar();
    if (input === "y") {
      return true;
    }
    if (input === "n") {
      return false;
    }
  }
};

const getChar = () => {
  let buffer = Buffer.alloc(1);
  fs.readSync(0, buffer, 0, 1, null);
  return buffer.toString("utf8");
};

export const promptOption = (options: string[]): number => {
  while (true) {
    console.log("Please choose an option.");
    options.forEach((option, i) => console.log(`[${i}]`, option));
    const input = getChar();
    const parsed = Number.parseInt(input);
    if (Number.isInteger(parsed)) {
      if (parsed >= 0 && parsed < options.length) {
        return parsed;
      }
    }
  }
};

export const formatStoreState = ({
  dateCreated,
  chunkSize,
  indexName,
}: StoreState): string => {
  const dateDiff = DateTime.fromISO(dateCreated)
    .diffNow(["days", "hours", "minutes"])
    .toHuman({ unitDisplay: "narrow" });
  return `${dateDiff} ago ${chunkSize} chunkSize Index: ${indexName}`;
};

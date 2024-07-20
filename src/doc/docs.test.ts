import { describe, expect, it } from "@jest/globals";
import { splitDoc } from "./doc";
import dotenv from "dotenv";

dotenv.config();

describe("splitDoc", () => {
  it("should produce non-empty list of documents", async () => {
    const docs = await splitDoc(process.env.ASSET_FILE_PATH!);
    expect(docs.length).not.toBe(0);
    expect(docs).not.toEqual(undefined);
  });
});

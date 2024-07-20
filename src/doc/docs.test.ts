import { describe, expect, test } from "@jest/globals";
import { splitDoc } from "./doc";
import dotenv from "dotenv";

dotenv.config();

describe("splitDoc", () => {
  test("splitDoc", async () => {
    const docs = await splitDoc(process.env.ASSET_FILE_PATH!);
    docs.forEach((text) => {
      console.log(text.pageContent.slice(0, 50));
    });
  });
});

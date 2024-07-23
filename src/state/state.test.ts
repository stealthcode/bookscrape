import { DateTime } from "luxon";
import * as module from "./state";
import { StoreState } from "./state";

describe("state", () => {
  describe("sortStates", () => {
    it("sorts in desc order of date", () => {
      const state1 = getStateForDate(date1);
      const state2 = getStateForDate(date2);
      const state3 = getStateForDate(date3);
      const results = module.sortStates({
        [date2]: state2,
        [date1]: state1,
        [date3]: state3,
      });
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(state3);
      expect(results[1]).toBe(state2);
      expect(results[2]).toBe(state1);
    });
  });
});

const getStateForDate = (dateTime: string): StoreState => ({
  chunkSize: 500,
  chunkCount: 16,
  chunkOverlap: 50,
  contentTitle: "title",
  dateCreated: dateTime,
  indexName: `title-${dateTime}`,
  modelName: "gpt-4o-mini",
  sectionCount: 10,
});

const date1 = DateTime.fromObject({ year: 2024, month: 7, day: 1 }).toISO()!;
const date2 = DateTime.fromObject({ year: 2024, month: 7, day: 2 }).toISO()!;
const date3 = DateTime.fromObject({ year: 2024, month: 7, day: 3 }).toISO()!;

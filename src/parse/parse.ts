export const uniquePairs = (items: string[]): string[][] => {
  return items.flatMap((item1, i) =>
    items.slice(i + 1).map((item2) => {
      if (item1.startsWith(item2)) {
        return [];
      } else {
        return [item1, item2];
      }
    }),
  );
};

export const parseCharacterNames = (textResult: string): string[] => {
  return textResult.split("\n").filter((name) => name !== "");
};

export const parseInteraction = (textResult: string): string | null => {
  if (textResult === "no interaction") return null;
  return textResult;
};

export const uniquePairs = (items: string[]): Pair[] => {
  return items.flatMap((name1, i) =>
    items.slice(i + 1).map((name2) => ({ name1, name2 })),
  );
};

type Pair = { name1: string; name2: string };

export const parseCharacterNames = (textResult: string): string[] => {
  return textResult.split("\n").filter((name) => name !== "");
};

export const parseInteraction = (textResult: string): string | null => {
  if (textResult === "no interaction") return null;
  return textResult;
};

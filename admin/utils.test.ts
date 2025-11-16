import { parseTeachingWeeks } from "./utils";

describe("parseTeachingWeeks", () => {
  it("should return null if the string does not start with 'Teaching Wk'", () => {
    expect(parseTeachingWeeks("")).toBe(null);
  });

  it("should return [1, 2, 3] if the string is 'Teaching Wk1,2,3'", () => {
    expect(parseTeachingWeeks("Teaching Wk1,2,3")).toEqual([1, 2, 3]);
  });

  it("should return [1, 2, 3] if the string is 'Teaching Wk1-3'", () => {
    expect(parseTeachingWeeks("Teaching Wk1-3")).toEqual([1, 2, 3]);
  });

  it("should return [1, 2, 3, 4, 5, 6, 7] if the string is 'Teaching Wk1-3,4,5-7'", () => {
    expect(parseTeachingWeeks("Teaching Wk1-3,4,5-7")).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });
});

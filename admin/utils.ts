import { Day, Time, TypeSchema } from "./schema";
import { z } from "zod";

export type Timeslot = {
  day: Day;
  from: Time;
  to: Time;
  type: z.infer<typeof TypeSchema>;
  weeks: number[];
};

export function doesTimeslotOverlap(timeslot1: Timeslot, timeslot2: Timeslot) {
  if (timeslot1.day !== timeslot2.day) {
    return false;
  }
  const fromTime = timeslot1.from.hour * 60 + timeslot1.from.minute;
  const toTime = timeslot1.to.hour * 60 + timeslot1.to.minute;
  const otherFromTime = timeslot2.from.hour * 60 + timeslot2.from.minute;
  const otherToTime = timeslot2.to.hour * 60 + timeslot2.to.minute;
  if (fromTime > otherToTime || toTime < otherFromTime) {
    return false;
  }
  return true;
}

export function parseTeachingWeeks(str: string): number[] | null {
  // Check if string starts with "Teaching Wk"
  if (!str.startsWith("Teaching Wk")) {
    return null;
  }

  // Extract the part after "Teaching Wk"
  const weeksStr = str.substring("Teaching Wk".length);

  if (!weeksStr.trim()) {
    return null;
  }

  try {
    const result: number[] = [];

    // Split by comma to handle multiple ranges/individual weeks
    const parts = weeksStr.split(",");

    for (const part of parts) {
      const trimmedPart = part.trim();

      if (trimmedPart.includes("-")) {
        // Handle range (e.g., "1-9")
        const [startStr, endStr] = trimmedPart.split("-");
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);

        if (isNaN(start) || isNaN(end) || start > end || start < 1 || end < 1) {
          return null;
        }

        // Add all numbers in the range
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
      } else {
        // Handle individual week (e.g., "10")
        const week = parseInt(trimmedPart, 10);

        if (isNaN(week) || week < 1) {
          return null;
        }

        result.push(week);
      }
    }

    // Remove duplicates and sort
    return [...new Set(result)].sort((a, b) => a - b);
  } catch (error) {
    return null;
  }
}

export function binSearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}

export type TimeMinuteRange =
  | [null, number]
  | [number, number]
  | [number, null];

export function isMinuteInRange(minute: number, range: TimeMinuteRange) {
  if (range[0] === null && range[1] === null) {
    return true;
  }
  if (range[0] === null) {
    return minute <= range[1];
  }
  if (range[1] === null) {
    return minute >= range[0];
  }
  return minute >= range[0] && minute <= range[1];
}

/**
 * * Course is available as Unrestricted Elective
 * ~ Course is available as Broadening and Deepening Elective
 * ^ Self - Paced Course
 * # Course is available as General Education Prescribed Elective
 */
const courseFlags = ["*", "~", "^", "#"];

export function extractCourseNameAndFlags(name: string) {
  // Check from back to front for flags
  const flags = [];
  let firstFlagIndex = -1;
  for (let i = name.length - 1; i >= 0; i--) {
    const char = name[i];
    if (courseFlags.includes(char)) {
      firstFlagIndex = i;
      flags.push(char);
    } else {
      break;
    }
  }
  return {
    name: name.slice(0, firstFlagIndex),
    flags: {
      isAvailableUE: flags.includes("*"),
      isAvailableBD: flags.includes("~"),
      isSelfPaced: flags.includes("^"),
      isAvailableGEPE: flags.includes("#"),
    },
  };
}

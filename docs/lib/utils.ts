import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(
  seconds: number,
  numberOfParts: number = 0
): string {
  if (seconds < 0) {
    throw "0s";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days.toFixed(0)}d`);
  if (hours > 0) parts.push(`${hours.toFixed(0)}h`);
  if (minutes > 0) parts.push(`${minutes.toFixed(0)}m`);
  if (secs > 0) parts.push(`${secs.toFixed(0)}s`);

  if (parts.length === 0) {
    return "0s";
  }
  if (numberOfParts > 0) {
    return parts.slice(0, numberOfParts).join(" ");
  }
  return parts.join(" ");
}

import { createIdGenerator } from "ai";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const fileIdGenerator = createIdGenerator({ prefix: "file" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeError(error: unknown) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error == null) return new Error("unknown error (error is null)");
  try {
    return new Error(JSON.stringify(error));
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return new Error(String(error));
  }
}

export function safeErrorString(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error == null) return "unknown error (error is null)";
  try {
    return JSON.stringify(error);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(error);
  }
}

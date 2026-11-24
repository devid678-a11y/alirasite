import fs from "node:fs/promises";
import path from "node:path";

export type Submission = Record<string, unknown>;

export async function loadSubmissions(): Promise<Submission[]> {
  const filePath = path.join(process.cwd(), "src", "data", "submissions.json");
  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as Submission[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw error;
  }
}

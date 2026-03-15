import { promises as fs } from "fs";
import path from "path";

export function localDbFilePath() {
  return path.join(process.cwd(), ".local", "biometric_entries.json");
}

export async function ensureLocalDbDir() {
  const dir = path.dirname(localDbFilePath());
  await fs.mkdir(dir, { recursive: true });
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFileAtomic<T>(filePath: string, data: T) {
  await ensureLocalDbDir();
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

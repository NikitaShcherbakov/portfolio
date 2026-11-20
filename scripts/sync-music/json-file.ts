import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type * as z from 'zod/mini';

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function createInvalidFileError(filePath: string, cause: unknown): Error {
  return new Error(`${filePath} is not valid: delete it or run with --force.`, {
    cause,
  });
}

async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }

    throw error;
  }
}

function parseJson(text: string, filePath: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw createInvalidFileError(filePath, error);
  }
}

export async function readJsonFile<T>(
  filePath: string,
  schema: z.ZodMiniType<T>
): Promise<T | undefined> {
  const text = await readOptionalFile(filePath);

  if (text === undefined) {
    return undefined;
  }

  const result = schema.safeParse(parseJson(text, filePath));

  if (!result.success) {
    throw createInvalidFileError(filePath, result.error);
  }

  return result.data;
}

export async function writeJsonFile(
  filePath: string,
  value: unknown
): Promise<void> {
  const tempPath = `${filePath}.${String(process.pid)}.tmp`;

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tempPath, filePath);
}

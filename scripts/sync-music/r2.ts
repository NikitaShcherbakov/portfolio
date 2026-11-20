import { readFile } from 'node:fs/promises';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { audioCacheControl, audioKeyPrefix } from './config.ts';
import type { LocalTrack } from './files.ts';
import type { Report } from './report.ts';

const deleteBatchSize = 1000;

type R2Bucket = { client: S3Client; bucket: string };

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing: add it to .env.local.`);
  }

  return value;
}

function createR2Bucket(): R2Bucket {
  const accountId = getRequiredEnv('R2_ACCOUNT_ID');

  return {
    bucket: getRequiredEnv('R2_BUCKET'),
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
  };
}

async function listAudioKeys({
  client,
  bucket,
}: R2Bucket): Promise<Set<string>> {
  const keys = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: audioKeyPrefix,
        ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
      })
    );

    for (const object of page.Contents ?? []) {
      if (object.Key) keys.add(object.Key);
    }

    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

async function uploadTrack(
  { client, bucket }: R2Bucket,
  track: LocalTrack
): Promise<void> {
  console.info(`Uploading ${track.audioKey}`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: track.audioKey,
      Body: await readFile(track.filePath),
      ContentType: 'audio/mpeg',
      CacheControl: audioCacheControl,
    })
  );
}

async function deleteKeys(
  { client, bucket }: R2Bucket,
  keys: readonly string[]
): Promise<void> {
  const result = await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    })
  );

  if (result.Errors?.length) {
    const failures = result.Errors.map(
      ({ Key, Message }) => `${Key ?? '?'} (${Message ?? 'unknown error'})`
    );

    throw new Error(`R2 refused to delete: ${failures.join(', ')}.`);
  }
}

export async function syncAudio(
  tracks: readonly LocalTrack[],
  report: Report
): Promise<void> {
  const r2 = createR2Bucket();
  const existingKeys = await listAudioKeys(r2);
  const wantedKeys = new Set(tracks.map((track) => track.audioKey));

  for (const track of tracks) {
    if (existingKeys.has(track.audioKey)) continue;

    await uploadTrack(r2, track);
    report.uploaded.push(track.audioKey);
  }

  const staleKeys = [...existingKeys].filter((key) => !wantedKeys.has(key));

  for (let start = 0; start < staleKeys.length; start += deleteBatchSize) {
    const batch = staleKeys.slice(start, start + deleteBatchSize);

    await deleteKeys(r2, batch);
    report.deleted.push(...batch);
  }
}

import { paths } from './config.ts';
import { writeJsonFile } from './json-file.ts';

export type Report = {
  tracks: number;
  withoutMatch: string[];
  withoutCover: string[];
  uploaded: string[];
  deleted: string[];
  notes: string[];
};

export function createReport(): Report {
  return {
    tracks: 0,
    withoutMatch: [],
    withoutCover: [],
    uploaded: [],
    deleted: [],
    notes: [],
  };
}

function printList(label: string, items: readonly string[]): void {
  console.info(`${label}: ${String(items.length)}`);

  for (const item of items) {
    console.info(`  - ${item}`);
  }
}

export async function saveReport(report: Report): Promise<void> {
  await writeJsonFile(paths.report, report);

  console.info(`\nTracks: ${String(report.tracks)}`);
  printList('No MusicBrainz match (tag data kept)', report.withoutMatch);
  printList('No album cover (placeholder)', report.withoutCover);
  printList('Uploaded to R2', report.uploaded);
  printList('Deleted from R2', report.deleted);
  printList('Automatic choices', report.notes);
  console.info(`Report: ${paths.report}`);
}

import * as z from 'zod/mini';

type KeyedEntry = {
  key: string;
  path: PropertyKey[];
};

type ContentIssue = {
  message: string;
  path: PropertyKey[];
};

function createUniqueKeysCheck<T>(
  label: string,
  getEntries: (items: T[]) => KeyedEntry[]
) {
  return z.superRefine<T[]>((items, ctx) => {
    const seenKeys = new Set<string>();

    for (const { key, path } of getEntries(items)) {
      if (seenKeys.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate ${label} "${key}".`,
          path,
        });
      }

      seenKeys.add(key);
    }
  });
}

function createLocalizedSchema<T extends z.ZodMiniType>(schema: T) {
  return z.object({ ru: schema, en: schema, uk: schema });
}

const slugSchema = z
  .string()
  .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a kebab-case slug.'));

const nonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));

const httpsUrlSchema = z.url({ protocol: /^https$/ });

const yearSchema = z.int().check(z.minimum(1900), z.maximum(2100));

const trackSchema = z.object({
  id: slugSchema,
  title: nonEmptyStringSchema,
  artist: nonEmptyStringSchema,
  album: nonEmptyStringSchema,
  year: yearSchema,
  durationSec: z.int().check(z.positive()),
  audioUrl: httpsUrlSchema,
  coverUrl: z.optional(httpsUrlSchema),
  coverThumbUrl: z.optional(httpsUrlSchema),
  coverLargeUrl: z.optional(httpsUrlSchema),
});

export type Track = z.infer<typeof trackSchema>;

export const tracksSchema = z.array(trackSchema).check(
  z.minLength(1),
  createUniqueKeysCheck<Track>('track id', (tracks) =>
    tracks.map(({ id }, index) => ({ key: id, path: [index, 'id'] }))
  )
);

const bandStatSchema = z.object({
  value: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
});

const bandCopySchema = z.object({
  origin: nonEmptyStringSchema,
  body: nonEmptyStringSchema,
  more: nonEmptyStringSchema,
  historyExtra: nonEmptyStringSchema,
  sound: nonEmptyStringSchema,
  members: z
    .array(z.object({ name: nonEmptyStringSchema, role: nonEmptyStringSchema }))
    .check(z.minLength(1), z.maxLength(5)),
});

export type BandCopy = z.infer<typeof bandCopySchema>;

const songCopySchema = z.object({
  lead: nonEmptyStringSchema.check(z.maxLength(180)),
  trackStory: nonEmptyStringSchema,
  stats: z.tuple([bandStatSchema, bandStatSchema, bandStatSchema]),
});

export type SongCopy = z.infer<typeof songCopySchema>;

export const bandCopyFileSchema = z.object({
  bands: z.record(nonEmptyStringSchema, bandCopySchema),
  songs: z.record(slugSchema, songCopySchema),
});

export type BandCopyFile = z.infer<typeof bandCopyFileSchema>;

const songSchema = z.object({
  trackId: slugSchema,
});

export type Song = z.infer<typeof songSchema>;

const bandSchema = z.object({
  artist: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  kind: z.enum(['band', 'solo']),
  sinceYear: yearSchema,
  songs: z.array(songSchema).check(z.minLength(1)),
  label: nonEmptyStringSchema,
  highlights: z.array(nonEmptyStringSchema).check(z.maxLength(3)),
  underline: z.optional(nonEmptyStringSchema),
  albums: z
    .array(z.object({ title: nonEmptyStringSchema, year: yearSchema }))
    .check(z.minLength(1)),
  photoUrl: z.optional(httpsUrlSchema),
});

export type Band = z.infer<typeof bandSchema>;

export const bandsSchema = z.array(bandSchema).check(
  createUniqueKeysCheck<Band>('band artist', (bands) =>
    bands.map(({ artist }, index) => ({ key: artist, path: [index, 'artist'] }))
  ),
  createUniqueKeysCheck<Band>('song trackId', (bands) =>
    bands.flatMap(({ songs }, index) =>
      songs.map(({ trackId }, songIndex) => ({
        key: trackId,
        path: [index, 'songs', songIndex, 'trackId'],
      }))
    )
  )
);

export const contactsSchema = z.object({
  email: z.email(),
  phone: nonEmptyStringSchema,
  telegram: nonEmptyStringSchema,
  linkedin: httpsUrlSchema,
  github: nonEmptyStringSchema,
});

export type Contacts = z.infer<typeof contactsSchema>;

const contentFilesSchema = z.object({
  tracks: tracksSchema,
  bands: bandsSchema,
  bandCopy: createLocalizedSchema(bandCopyFileSchema),
  contacts: contactsSchema,
});

type ContentFiles = z.infer<typeof contentFilesSchema>;

function getKeyMessages(
  label: string,
  expectedKeys: string[],
  actualKeys: string[]
) {
  const expected = new Set(expectedKeys);
  const actual = new Set(actualKeys);

  return [
    ...expectedKeys
      .filter((key) => !actual.has(key))
      .map((key) => `has no copy for ${label} "${key}".`),
    ...actualKeys
      .filter((key) => !expected.has(key))
      .map((key) => `has copy for unknown ${label} "${key}".`),
  ];
}

function getBandCopyIssues({ bands, bandCopy }: ContentFiles): ContentIssue[] {
  const artists = bands.map(({ artist }) => artist);
  const trackIds = bands.flatMap(({ songs }) =>
    songs.map(({ trackId }) => trackId)
  );

  return Object.entries(bandCopy).flatMap(([language, copy]) =>
    [
      ...getKeyMessages('band', artists, Object.keys(copy.bands)),
      ...getKeyMessages('song', trackIds, Object.keys(copy.songs)),
    ].map((message) => ({
      message: `band-copy/${language}.json ${message}`,
      path: ['bandCopy', language],
    }))
  );
}

function getSongArtistIssues({ tracks, bands }: ContentFiles): ContentIssue[] {
  const artistByTrackId = new Map(tracks.map(({ id, artist }) => [id, artist]));

  return bands.flatMap((band, bandIndex) =>
    band.songs.flatMap(({ trackId }, songIndex) => {
      const trackArtist = artistByTrackId.get(trackId);

      if (trackArtist === undefined || trackArtist === band.artist) return [];

      return {
        message: `Song "${trackId}" is listed under "${band.artist}", but tracks.json credits it to "${trackArtist}".`,
        path: ['bands', bandIndex, 'songs', songIndex, 'trackId'],
      };
    })
  );
}

export const contentSchema = contentFilesSchema.check(
  z.superRefine<ContentFiles>((content, ctx) => {
    const issues = [
      ...getBandCopyIssues(content),
      ...getSongArtistIssues(content),
    ];

    for (const { message, path } of issues) {
      ctx.addIssue({ code: 'custom', message, path });
    }
  })
);

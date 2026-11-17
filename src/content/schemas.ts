import * as z from 'zod/mini';

type KeyedEntry = {
  key: string;
  path: PropertyKey[];
};

function uniqueKeys<T>(
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

function localizedSchema<T extends z.ZodMiniType>(schema: T) {
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
  uniqueKeys<Track>('track id', (tracks) =>
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

const songCopySchema = z.object({
  lead: nonEmptyStringSchema.check(z.maxLength(180)),
  trackStory: nonEmptyStringSchema,
  stats: z.tuple([bandStatSchema, bandStatSchema, bandStatSchema]),
});

const songSchema = z.object({
  trackId: slugSchema,
  copy: localizedSchema(songCopySchema),
});

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
  copy: localizedSchema(bandCopySchema),
});

export type Band = z.infer<typeof bandSchema>;
export type Song = z.infer<typeof songSchema>;

export const bandsSchema = z.array(bandSchema).check(
  uniqueKeys<Band>('band artist', (bands) =>
    bands.map(({ artist }, index) => ({ key: artist, path: [index, 'artist'] }))
  ),
  uniqueKeys<Band>('song trackId', (bands) =>
    bands.flatMap(({ songs }, index) =>
      songs.map(({ trackId }, songIndex) => ({
        key: trackId,
        path: [index, 'songs', songIndex, 'trackId'],
      }))
    )
  )
);

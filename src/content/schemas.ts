import * as z from 'zod/mini';

const slugSchema = z
  .string()
  .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a kebab-case slug.'));

const nonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));

const httpsUrlSchema = z.url({ protocol: /^https$/ });

const trackSchema = z.object({
  id: slugSchema,
  title: nonEmptyStringSchema,
  artist: nonEmptyStringSchema,
  album: nonEmptyStringSchema,
  year: z.int().check(z.minimum(1900), z.maximum(2100)),
  durationSec: z.int().check(z.positive()),
  audioUrl: httpsUrlSchema,
  coverUrl: z.optional(httpsUrlSchema),
  coverThumbUrl: z.optional(httpsUrlSchema),
});

export const tracksSchema = z.array(trackSchema).check(
  z.minLength(1),
  z.superRefine((tracks, ctx) => {
    const seenIds = new Set<string>();

    tracks.forEach(({ id }, index) => {
      if (seenIds.has(id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate track id "${id}".`,
          path: [index, 'id'],
        });
      }

      seenIds.add(id);
    });
  })
);

export type Track = z.infer<typeof trackSchema>;

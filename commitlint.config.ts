import type { UserConfig } from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot bodies carry release-note links longer than body-max-line-length
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
} satisfies UserConfig;

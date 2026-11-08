// PostToolUse (Write|Edit) hook: lists the comments a Write or Edit added to a script file in
// src/, e2e/ or scripts/, each with what looks wrong in it against the CLAUDE.md "Comments" rules.
// Advisory only: it never blocks.
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

import {
  getEditedFilePath,
  isInsideProject,
  projectDir,
  readHookInput,
  writeHookContext,
} from './lib/read-hook-input.mjs';

const REPORT_LIMIT = 8_000;
const MAX_LINES_PER_BLOCK = 3;
const MAX_LINE_LENGTH = 160;
const MAX_PATH_LENGTH = 200;
// Shorter lines ("Ignore") are too generic to prove that a comment was moved rather than written.
const MIN_MOVED_LINE_LENGTH = 20;

const scriptFilePattern = /\.(ts|tsx|js|jsx|mts|mjs)$/i;
const checkedDirs = ['src', 'e2e', 'scripts'];

// Windows paths ignore case, so `Src/x.TSX` is the same file as `src/x.tsx`.
const isCheckedScript = (repoPath) => {
  const path = repoPath.toLowerCase();
  return (
    checkedDirs.some((dir) => path.startsWith(`${dir}/`)) &&
    scriptFilePattern.test(path)
  );
};

// Exact directive syntax, so a sentence starting with "eslint" or "global" is still a comment.
const directivePatterns = [
  /^eslint-(disable|enable)(-next-line|-line)?(\s|$)/,
  /^eslint-env\s/,
  /^eslint\s+[\w@/-]+\s*:\s*["']?(off|warn|error|[012])\b/,
  /^globals?\s+\w+(\s*:\s*\w+)?(\s*,\s*\w+(\s*:\s*\w+)?)*$/,
  /^@ts-(expect-error|nocheck|check)\b/,
  /^@jsx(ImportSource|Runtime|Frag)?\s/,
  /^(istanbul|c8|v8) ignore (next|start|stop|if|else|file)\b/,
  /^@refresh reset\b/,
  /^(prettier-ignore|@vite-ignore|[#@]__PURE__)\b/,
  /^<reference\s/,
];
const isDirective = (text) =>
  directivePatterns.some((pattern) => pattern.test(text));

const flagChecks = [
  {
    pattern:
      /\b(now|no longer|anymore|previously|used to|originally|QA|PR ?#\d+|as requested|the user asked)\b/i,
    describe: (match) =>
      `history or the task? ("${match}"): that belongs in the commit message`,
  },
  {
    pattern: /\bsee\b/i,
    describe: () =>
      'points at other code? ("see"): say the reason here, or nothing',
  },
  {
    pattern: /\b(I|[Ww]e|[Oo]ur|us)\b/,
    describe: (match) => `first person ("${match}")`,
  },
  {
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/,
    describe: (match) => `${match} the user did not ask for?`,
  },
  { pattern: /[А-Яа-яЁё]/, describe: () => 'not in English' },
  {
    pattern: /\b\d+(\.\d+)?\s?(px|%)|\d\s?×\s?\d|\d\s+x\s+\d/,
    describe: () =>
      'quotes sizes: if the code holds them, it restates the code',
  },
  {
    pattern:
      /^(const|let|var|import|export|return|if|await|function)\b|[;{]\s*$/m,
    describe: () => 'looks like commented-out code?',
  },
];

const regexPrecedingChars = new Set([...'(,=:[!&|?{;']);
const regexPrecedingKeyword =
  /(\b(return|typeof|case|default|do|else|in|of|void|yield|await|delete|throw)|=>)$/;
// An apostrophe after a letter, a digit or `}` is JSX text ("Don't", "{name}'s"), not a string.
const apostrophePrecedingChar = /[\p{L}\p{N}}]/u;

const toLf = (text) => String(text).replace(/\r\n/g, '\n');

// Prettier ends a broken line with its operator, so a `/` that opens a line starts a regex literal.
const isRegexStart = (line, index) => {
  const before = line.slice(0, index).trimEnd();
  return (
    !before ||
    regexPrecedingChars.has(before.at(-1)) ||
    regexPrecedingKeyword.test(before)
  );
};

const getRegexEnd = (line, start) => {
  let isInClass = false;
  for (let i = start + 1; i < line.length; i += 1) {
    const char = line[i];
    if (char === '\\') i += 1;
    else if (char === '[') isInClass = true;
    else if (char === ']') isInClass = false;
    else if (char === '/' && !isInClass) return i;
  }
  return line.length;
};

// A line scanner, not a parser: enough for code prettier has shaped.
const scanLines = (source) => {
  const templates = [];
  let isInBlock = false;
  let isJsxComment = false;

  return source.split('\n').map((line) => {
    let text = '';
    let code = '';
    let hasComment = isInBlock;
    let quote = null;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      const template = templates.at(-1);

      if (isInBlock) {
        if (char === '*' && next === '/') {
          isInBlock = false;
          i += isJsxComment && line[i + 2] === '}' ? 2 : 1;
          text += ' ';
        } else {
          text += char;
        }
      } else if (quote) {
        code += char;
        if (char === '\\') i += 1;
        else if (char === quote) quote = null;
      } else if (template && !template.isInExpression) {
        code += char;
        if (char === '\\') {
          i += 1;
        } else if (char === '`') {
          templates.pop();
        } else if (char === '$' && next === '{') {
          template.isInExpression = true;
          template.braces = 0;
          i += 1;
        }
      } else if (char === '/' && next === '/' && line[i - 1] !== ':') {
        hasComment = true;
        text += line.slice(i + 2);
        break;
      } else if (char === '/' && next === '*') {
        hasComment = true;
        isInBlock = true;
        isJsxComment = code.trimEnd().endsWith('{');
        if (isJsxComment) code = code.trimEnd().slice(0, -1);
        i += 1;
      } else if (char === '/' && isRegexStart(line, i)) {
        const end = getRegexEnd(line, i);
        code += line.slice(i, end + 1);
        i = end;
      } else {
        code += char;
        if (char === '`') {
          templates.push({ isInExpression: false, braces: 0 });
        } else if (
          char === '"' ||
          (char === "'" && !apostrophePrecedingChar.test(line[i - 1] ?? ''))
        ) {
          quote = char;
        } else if (template && char === '{') {
          template.braces += 1;
        } else if (template && char === '}') {
          if (template.braces === 0) template.isInExpression = false;
          else template.braces -= 1;
        }
      }
    }

    const normalized = text
      .replace(/^\s*[*/]+/, '')
      .replace(/\s+/g, ' ')
      .trim();
    return {
      raw: line.trim(),
      hasComment,
      hasCode: /\S/.test(code),
      normalized: hasComment && !isDirective(normalized) ? normalized : '',
    };
  });
};

const getCommentTexts = (source) =>
  scanLines(source)
    .map(({ normalized }) => normalized)
    .filter(Boolean);

const getAddedIndexes = (before, afterLines) => {
  const remaining = new Map();
  for (const text of getCommentTexts(before)) {
    remaining.set(text, (remaining.get(text) ?? 0) + 1);
  }

  return afterLines.flatMap(({ normalized }, index) => {
    if (!normalized) return [];
    const count = remaining.get(normalized) ?? 0;
    if (!count) return [index];
    remaining.set(normalized, count - 1);
    return [];
  });
};

const getBlocks = (lines, indexes) => {
  const blocks = [];
  for (const index of indexes) {
    const lastBlock = blocks.at(-1);
    const lastIndex = lastBlock?.at(-1);
    const isSameComment =
      lastBlock !== undefined &&
      !lines[index].hasCode &&
      !lines[lastIndex].hasCode &&
      lines
        .slice(lastIndex + 1, index)
        .every((line) => line.hasComment && !line.hasCode);
    if (isSameComment) lastBlock.push(index);
    else blocks.push([index]);
  }
  return blocks.map((block) => block.map((index) => lines[index]));
};

const runGit = (args, cwd, input) =>
  spawnSync('git', args, {
    cwd,
    input,
    maxBuffer: 256 * 1024 * 1024,
    timeout: 10_000,
    windowsHide: true,
  });

const getBlobContents = (batchOutput) => {
  const contents = [];
  let position = 0;
  while (position < batchOutput.length) {
    const headerEnd = batchOutput.indexOf(0x0a, position);
    if (headerEnd === -1) break;
    const size = batchOutput
      .toString('utf8', position, headerEnd)
      .match(/^[0-9a-f]+ blob (\d+)$/)?.[1];
    position = headerEnd + 1;
    if (size === undefined) continue;
    const end = position + Number(size);
    contents.push(toLf(batchOutput.toString('utf8', position, end)));
    position = end + 1;
  }
  return contents;
};

// Any git failure answers with an empty set, so the comment is listed rather than hidden.
const getCommentTextsInHead = (cwd) => {
  const tree = runGit(
    ['ls-tree', '-r', '-z', 'HEAD', '--', ...checkedDirs],
    cwd
  );
  if (tree.status !== 0) return new Set();

  const objectIds = tree.stdout
    .toString('utf8')
    .split('\0')
    .flatMap((entry) => {
      const [, objectId, path] =
        entry.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/s) ?? [];
      return path && isCheckedScript(path) ? [objectId] : [];
    });
  if (!objectIds.length) return new Set();

  const batch = runGit(
    ['cat-file', '--batch'],
    cwd,
    `${objectIds.join('\n')}\n`
  );
  if (batch.status !== 0) return new Set();

  return new Set(getBlobContents(batch.stdout).flatMap(getCommentTexts));
};

// A comment line already in HEAD moved with its code, so it is dropped, and so are the short lines
// left of a block whose long lines all moved.
const removeMovedLines = (blocks, cwd) => {
  const isLong = ({ normalized }) => normalized.length >= MIN_MOVED_LINE_LENGTH;
  if (!blocks.flat().some(isLong)) return blocks;

  const inHead = getCommentTextsInHead(cwd);
  return blocks.flatMap((block) => {
    const kept = block.filter(
      (line) => !isLong(line) || !inHead.has(line.normalized)
    );
    if (kept.length < block.length && !kept.some(isLong)) return [];
    return [kept];
  });
};

const getFlags = (block) => {
  const text = block.map(({ normalized }) => normalized).join('\n');
  const flags = flagChecks.flatMap(({ pattern, describe }) => {
    const match = text.match(pattern);
    return match ? [describe(match[0].trim())] : [];
  });
  return block.length > 2
    ? [`${block.length} lines: say the why in one or two`, ...flags]
    : flags;
};

const truncate = (text, length) => {
  const codePoints = [...text];
  return codePoints.length > length
    ? `${codePoints.slice(0, length).join('')}…`
    : text;
};

const formatBlock = (block, number) => {
  const shown = block
    .slice(0, MAX_LINES_PER_BLOCK)
    .map(({ raw }) => `   ${truncate(raw, MAX_LINE_LENGTH)}`);
  if (block.length > MAX_LINES_PER_BLOCK) {
    shown.push(`   … (+${block.length - MAX_LINES_PER_BLOCK} lines)`);
  }
  const flags = getFlags(block).map((flag) => `   ↳ ${flag}`);
  return [`${number}.`, ...shown, ...flags].join('\n');
};

// Write's result carries no originalFile for a large file, so the old content is rebuilt from the
// patch, or null when the patch does not line up with the new content.
const getOriginalFromPatch = (content, hunks) => {
  const lines = content.split('\n');
  const original = [];
  let cursor = 0;
  for (const hunk of hunks) {
    const { newStart, newLines, lines: hunkLines } = hunk ?? {};
    const start = newStart - 1;
    if (
      !Number.isInteger(start) ||
      start < cursor ||
      !Array.isArray(hunkLines) ||
      !hunkLines.every((line) => typeof line === 'string')
    )
      return null;
    // A CRLF file leaves a lone \r at the end of each hunk line.
    const getSide = (prefix) =>
      hunkLines
        .filter((line) => line[0] === ' ' || line[0] === prefix)
        .map((line) => line.slice(1).replace(/\r$/, ''));
    const newSide = getSide('+');
    if (
      newSide.length !== newLines ||
      newSide.some((line, i) => line !== lines[start + i])
    )
      return null;
    original.push(...lines.slice(cursor, start), ...getSide('-'));
    cursor = start + newLines;
  }
  original.push(...lines.slice(cursor));
  return original.join('\n');
};

const getBeforeAndAfter = (toolName, toolInput, toolResponse) => {
  if (toolName === 'Edit') {
    const oldString = toLf(toolInput.old_string ?? '');
    const newString = toLf(toolInput.new_string ?? '');
    const originalFile =
      typeof toolResponse.originalFile === 'string'
        ? toLf(toolResponse.originalFile)
        : null;
    // Only the whole file shows a block comment or a template literal the edit starts inside of.
    if (oldString && originalFile?.includes(oldString)) {
      const after = toolInput.replace_all
        ? originalFile.replaceAll(oldString, () => newString)
        : originalFile.replace(oldString, () => newString);
      return [originalFile, after];
    }
    return [oldString, newString];
  }

  if (toolName === 'Write') {
    const content = toLf(toolResponse.content ?? toolInput.content ?? '');
    if (typeof toolResponse.originalFile === 'string')
      return [toLf(toolResponse.originalFile), content];
    if (toolResponse.type === 'create') return ['', content];
    if (Array.isArray(toolResponse.structuredPatch)) {
      const original = getOriginalFromPatch(
        content,
        toolResponse.structuredPatch
      );
      if (original !== null) return [original, content];
    }
  }

  return null;
};

const input = await readHookInput();
const filePath = getEditedFilePath(input);
if (typeof filePath !== 'string' || !isInsideProject(filePath)) process.exit(0);

// In a .claude/worktrees/<name>/ session projectDir stays at the main checkout, so git has to run
// in the worktree to read its HEAD.
const segments = relative(projectDir, resolve(projectDir, filePath)).split(
  /[\\/]/
);
const checkoutDepth =
  segments[0] === '.claude' && segments[1] === 'worktrees' && segments[2]
    ? 3
    : 0;
const gitCwd = join(projectDir, ...segments.slice(0, checkoutDepth));
const repoPath = segments.slice(checkoutDepth).join('/');
if (!isCheckedScript(repoPath)) process.exit(0);

const toolResponse = input.tool_response ?? {};
// The user rewrote the change in the diff view, so their comments cannot be told from Claude's.
if (toolResponse.userModified) process.exit(0);

const beforeAndAfter = getBeforeAndAfter(
  input.tool_name,
  input.tool_input ?? {},
  toolResponse
);
if (!beforeAndAfter) process.exit(0);

const [before, after] = beforeAndAfter;
const afterLines = scanLines(after);
const addedIndexes = getAddedIndexes(before, afterLines);
if (!addedIndexes.length) process.exit(0);

const blocks = removeMovedLines(getBlocks(afterLines, addedIndexes), gitCwd);
if (!blocks.length) process.exit(0);

let report = [
  `This edit added ${blocks.length} comment${blocks.length === 1 ? '' : 's'} to ${truncate(repoPath, MAX_PATH_LENGTH)}. CLAUDE.md "Comments": the default is no comment.`,
  'Keep one only if a rule requires it (the `-- <why>` of an eslint-disable, the reason of a @ts-expect-error or of a deliberately silent catch), the user asked for it, or the code alone would mislead the next reader (a browser or library quirk such as a YouTube IFrame API or 3D-transform workaround, a value with no visible source) and it says why in one or two English lines, every claim verified this session. Delete the rest now, with Edit. This list is no reason to touch a comment it does not show.',
  '',
].join('\n');
let shownCount = 0;
for (const block of blocks) {
  const entry = `\n${formatBlock(block, shownCount + 1)}`;
  if (report.length + entry.length > REPORT_LIMIT) break;
  report += entry;
  shownCount += 1;
}
if (shownCount < blocks.length)
  report += `\n…and ${blocks.length - shownCount} more`;

await writeHookContext('PostToolUse', report);

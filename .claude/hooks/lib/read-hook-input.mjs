// Shared plumbing for the .claude/hooks scripts. Every hook speaks the same protocol — read one
// JSON payload from stdin, work relative to the project root, answer (or stay silent) through the
// same JSON envelope — so that protocol is defined here once. Copied per hook it drifts: a
// payload-shape change has to be found and repeated in every copy, and a copy that gets missed
// goes on failing silently, which is the exact failure mode these hooks exist to catch.
import { isAbsolute, relative, resolve, sep } from 'node:path';

export const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Resolves the parsed payload, or null when stdin carried nothing usable — the hook was run by
// hand outside Claude Code, or the harness sent a shape this version cannot read. Staying silent
// there is deliberate: a hook cannot act on a payload it cannot parse, and narrating that into
// every turn's context would be noise. Callers exit 0 on null.
export const readHookInput = () =>
  new Promise((resolvePayload) => {
    let raw = '';
    // setEncoding before the first read, not `String(chunk)` after: appending Buffers one at a
    // time decodes each in isolation, so a multi-byte character straddling a chunk boundary comes
    // back as replacement characters and the payload fails to parse. File paths are not always
    // ASCII (a Cyrillic user name puts one in every path), and a payload carrying file contents
    // can exceed one chunk.
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (raw += chunk));
    // A broken stdin is the same situation as an unparseable one: nothing to act on. Without a
    // listener the 'error' event would instead throw and take the hook down with a stack trace.
    process.stdin.on('error', () => resolvePayload(null));
    process.stdin.on('end', () => {
      try {
        resolvePayload(JSON.parse(raw));
      } catch {
        resolvePayload(null);
      }
    });
  });

// PostToolUse only: the file a Write|Edit just touched. tool_response uses camelCase `filePath`
// (checked against the Write/Edit results in local transcripts); it never carries a snake_case
// `file_path`. It is preferred over tool_input because it is the path the tool actually resolved
// and wrote, already absolute, while tool_input.file_path stays as the fallback that keeps this
// working if the response field is ever renamed. Do not 'fix' the casing.
export const getEditedFilePath = (input) =>
  input?.tool_response?.filePath || input?.tool_input?.file_path || '';

// True only for a path strictly inside the project. Claude also writes outside it — scratch files
// in the session scratchpad under the OS temp dir — and running this project's linters on those
// reports errors that have nothing to do with the repo. path.relative is separator-agnostic and,
// on Windows, compares case-insensitively, so `c:\…` and `C:\…` spellings of the same checkout
// agree. isAbsolute covers a path on another drive, where relative() answers with an absolute
// path instead of a '..' chain. The '..' test is anchored to a whole segment so that a file
// named `..env` at the root still counts as inside.
export const isInsideProject = (filePath) => {
  const rel = relative(projectDir, resolve(projectDir, filePath));
  return (
    rel !== '' &&
    rel !== '..' &&
    !rel.startsWith(`..${sep}`) &&
    !isAbsolute(rel)
  );
};

// Writes the hook's JSON answer and resolves once it has been flushed. Claude Code parses stdout
// as JSON, so a hook must write this and nothing else there. Callers await it before exiting: on
// POSIX a pipe write is asynchronous, and a process.exit() right after a plain write cut a large
// report off mid-object (reproduced on Linux at roughly 150 KB). Claude Code treats JSON that
// does not end with `}` as plain text, which for Stop and PostToolUse reaches the debug log only.
export const writeHookOutput = (output) =>
  new Promise((resolveWrite) => {
    process.stdout.write(JSON.stringify(output), () => resolveWrite());
  });

// The only channel a hook has back into the model's context.
export const writeHookContext = (hookEventName, additionalContext) =>
  writeHookOutput({ hookSpecificOutput: { hookEventName, additionalContext } });

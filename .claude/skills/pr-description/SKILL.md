---
name: pr-description
description: >-
  Opens or updates a pull request of the portfolio through `gh` with the user's personal GitHub account, so it
  is complete on GitHub: a commitlint-clean title, every section of `.github/pull_request_template.md` filled
  from the diff with only the true boxes ticked, the labels from `.github/labels.json` and the user as
  assignee. Run it right after a push to `develop` (its pull request into `main`) or to a feature branch (its
  pull request into `develop`), or when the user types `/pr-description`.
when_to_use: >-
  Also for "create a PR", "open a PR", "fill the PR", "update the PR", "PR description", "PR labels", "создай
  PR", "оформи PR", "заполни PR", "описание PR", and right after a `git push`.
---

# PR description

`.github/workflows/open-pull-request.yml` opens the pull request on a branch's first push with a commit of
its own: `develop` into `main`, any other branch into `develop`. It fills only what the commits tell: the
commit headers as Changes, the Type of change boxes and labels of their types, the pusher as assignee. On
later pushes it only adds labels. This skill writes what only the session knows (summary, test plan) and
corrects the rest from the diff. Read the diff, not just the commit subjects.

## Preconditions

- **Account.** The machine's `gh` has two accounts: a work one (the active one) and `NikitaShcherbakov`
  (personal, owns this repository). Never switch the active account and never log out: pass the personal
  token in **every** `gh` command, in the **Bash** tool. Shell state does not survive between tool calls,
  so an `export GH_TOKEN=…` in one call is gone in the next and `gh` silently falls back to the work
  account. Every `gh …` below means this prefixed form:

  ```bash
  GH_TOKEN=$(gh auth token --user NikitaShcherbakov) gh pr view --repo NikitaShcherbakov/portfolio ...
  ```

  If `gh auth token --user NikitaShcherbakov` fails, stop and ask the user to run `gh auth login` in the VS
  Code terminal (answer **No** to "Authenticate Git with your GitHub credentials?"), then switch back to
  their work account with `gh auth switch --user <work account>` afterwards.

- **Pushed.** After `git fetch -q origin`, `git log --oneline origin/<branch>..HEAD` prints nothing.
  Uncommitted work is not in the pull request: say so instead of describing it. Push only when the user
  asked (CLAUDE.md).
- **Base.** `develop` → `main`; any other branch → `develop`. Never a pull request from `main`.

## Procedure

1. **Read.**

   ```bash
   git fetch -q origin
   git log --no-merges --format='%h %s%n%b' origin/<base>..origin/<branch>
   git diff --stat origin/<base>...origin/<branch>
   git diff origin/<base>...origin/<branch>
   gh pr list --repo NikitaShcherbakov/portfolio --head <branch> --base <base> --state open \
     --json number,url,title,body,labels,assignees
   ```

   No open pull request: the workflow has not run yet, or failed; create it in step 7. In an open one this
   skill owns and recomputes from the current head: the title, Summary, Changes, Type of change, Testing,
   Test plan and every catalogue label. Whatever the user attached under Screenshots stays.

2. **Title.** `<type>: <lower-case subject>`, ≤ 100 characters, no trailing period. Merges into `main` are
   merge commits, so the title is not committed, but keep it valid anyway: for a release of several commits,
   the type of the most significant change (`feat` over `fix` over the rest) and a subject that sums them up.
   Check it in the **Bash** tool (git-workflow §2):

   ```bash
   printf '%s\n' "<title>" > "${TMPDIR:-/tmp}/pr-title" && pnpm exec commitlint --edit "${TMPDIR:-/tmp}/pr-title"
   ```

3. **Summary.** 2–4 sentences: what changed and why. For a UI change, which page and which part of the MVP
   plan.
4. **Changes.** One bullet per meaningful change, behaviour first, then refactors, then config and docs.
   Replace the workflow's commit headers; don't pad.
5. **Type of change and Testing.** Tick only what the diff and this session prove: `pnpm check passes
locally` only if it passed on this head in this session; `pnpm test:e2e` the same; _Added or updated
   tests_ only if the diff has test files. Untick what is no longer true.
6. **Test plan and Screenshots.** Numbered steps a reviewer can follow on the Vercel preview from the
   pull request (route, action, expected result). For a UI change list the `qa` screenshots saved in
   `.claude/qa-artifacts/` for the user to attach (they are gitignored); otherwise write "Not applicable."
7. **Labels.** From `.github/labels.json`: the label of each commit type in the pull request, plus each label
   without `types` the diff matches (`ui`, `content`, `dependencies`, `breaking change`). Create a missing
   one from the file first (`gh label create "<name>" --color <color> --description "<description>"`).
   Remove catalogue labels the diff no longer earns; leave labels outside the catalogue. A label the file
   lacks is a repo change: propose it to the user.
8. **Apply.** Write the body with the Write tool to the session scratchpad (never the repo), then:

   ```bash
   gh pr edit <number> --repo NikitaShcherbakov/portfolio --title "<title>" --body-file <file> \
     --add-label "<a>,<b>" --add-assignee NikitaShcherbakov
   gh pr create --repo NikitaShcherbakov/portfolio --base <base> --head <branch> --title "<title>" \
     --body-file <file> --label "<a>,<b>" --assignee NikitaShcherbakov
   ```

   If `create` answers that the pull request exists, the workflow got there first: re-read it and `edit`.
   Confirm with `gh pr view <number> --repo NikitaShcherbakov/portfolio --json url,title,labels,assignees`.

## Output shape

The pull request URL, its title and labels, the state of its checks, and what is left for the user:
screenshots to attach, and the merge itself.

## Must not

- Must not switch `gh`'s active account, log out, or use the work account for this repository; never run a
  `gh` command without the `GH_TOKEN=…` prefix.
- Must not add Claude attribution (a `Co-Authored-By` line or "Generated with Claude Code") to a title, body
  or commit: the user turned it off for this public repository.
- Must not invent a test result, screenshot or issue number.
- Must not merge, close, approve or comment: the user merges into `main`.

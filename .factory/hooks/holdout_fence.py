"""The holdout fence: only the holdout subagents may see the hidden scenarios, and nothing may change the fence.

The scenarios live in two places: the real file on the factory's machine, outside every checkout
(MACHINE_HOLDOUT, the path the launchers pass), and the in-repository template `.factory/holdout/`.
Claude Code runs this before every tool call (`pre`) and tags each call a subagent makes with its
`agent_type`. Calls from `holdout-writer` and `holdout-verifier` pass. Every other call (builders,
reviewers, the manager itself, a human session) is refused, by exit 2, when it would show a scenario:

- it names either folder or a HOLDOUT.md, or globs into `.factory`;
- one of its paths lands in either folder once `~`, `$HOME`, `..`, braces and globs are worked out
  (Read, Edit, Write, the Grep and Glob tools, and every word of a shell command, after `cd`);
- it is a recursive search or listing (`grep -r`, `rg`, `find`, `ls -R`, `tree`, `du`, `tar`, the
  Grep tool, a Glob with `**`) whose scope covers the machine folder, from `~`, `/home` or `/` too;
- it is a recursive search whose scope covers the in-repository folder. The Grep and Glob tools skip
  that folder through `.ignore`; shell `grep -r`, `git grep` and `rg --no-ignore` do not;
- it is a `git diff`, `git log -p` or `git show` whose output would include a file in the folder.
  Git is asked with `--name-only`, so a command that cannot reach the folder is never refused.

Any call that would change the fence itself (this folder, `.claude/settings.json`, `.ignore`) is
refused for everyone. After each call (`post`) the result is checked for the real scenarios' text,
and a hit is appended to `holdout-exposures.jsonl` in the repository's git directory, so a leak the
fence did not foresee (a script that opens the file itself) is counted instead of invisible.

Claude Code lets a call through when a hook errors, so `pre` fails closed: an error is a refusal.
"""

from __future__ import annotations

import fnmatch
import json
import os
import re
import shlex
import subprocess
import sys
import time
from pathlib import Path

HOLDOUT_AGENTS = {"holdout-writer", "holdout-verifier"}
FOLDER = ".factory/holdout"
# The real scenarios, on the factory's machine and outside every checkout: one folder per project
# under HOLDOUTS. MACHINE_HOLDOUT is the file the launchers pass (`holdout` in .factory/schedule.json
# and .factory/trigger.json, `--input holdout=` in the manager's service) and the default in
# factory/pack.json. The hook also reads what those launcher files pass (holdout_files); this
# constant is the floor, so a missing or edited launcher file can add a fenced path, never remove one.
HOLDOUTS = "/home/godspeed-forge/holdouts"
MACHINE_HOLDOUT = HOLDOUTS + "/querino/HOLDOUT.md"
LAUNCHERS = (".factory/schedule.json", ".factory/trigger.json")
# Tools that read, search or change files, or hand work to another agent. Output-only tools
# (StructuredOutput, TodoWrite, ...) are never refused for mentioning the folder.
ACCESS_TOOLS = {"Bash", "PowerShell", "Read", "Grep", "Glob", "Edit", "Write", "MultiEdit",
                "NotebookEdit", "NotebookRead", "Agent", "Task"}
WRITE_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
SHELL_TOOLS = {"Bash", "PowerShell"}

# The holdout verifier keeps a script per scenario in ~/.archon/holdout-tools/; they carry the
# scenarios' logic and thresholds, so they are fenced like the scenarios.
NAMED = re.compile(r"\.factory/+(?:holdout(?![\w-])|[*?\[])|(?<![\w-])holdout\.md\b|holdout-tools|"
                   r"/holdouts(?![\w.-])|(?<![\w.-])holdouts/", re.I)
FENCE = re.compile(r"\.factory/+hooks(?![\w-])|\.claude/+settings(?:\.local)?\.json|(?<![\w.])\.ignore\b", re.I)
MUTATES = re.compile(
    r">|\btee\b|\b(?:sed|perl)\s+-\w*i|\b(?:rm|mv|cp|chmod|truncate|ln|install)\b|"
    r"\bgit\s+(?:checkout|restore|rm|mv|reset|stash)\b|Set-Content|Add-Content|Out-File|"
    r"Remove-Item|Move-Item|Copy-Item|Rename-Item", re.I)
SEGMENT = re.compile(r"\s*(?:&&|\|\||;|\||\n)\s*")
NO_PATCH = {"--stat", "--name-only", "--name-status", "--numstat", "--shortstat", "--summary",
            "-s", "--no-patch", "--quiet", "--exit-code", "--raw"}
LOG_PATCH = re.compile(r"^(?:-p|--patch|-u|-U\d*|--unified(?:=\d+)?|--full-diff|-m|--cc|-c)$")
PROBE_DROP = re.compile(r"^(?:-p|--patch|-u|-U\d*|--unified(?:=\d+)?|--stat(?:=.*)?|--color(?:=.*)?|"
                        r"--format(?:=.*)?|--pretty(?:=.*)?|--oneline|--graph|-w|--word-diff(?:=.*)?)$")
GREP_ARG_OPTS = {"-e", "-f", "-A", "-B", "-C", "-m", "-d", "-D", "--context", "--max-count", "--include",
                 "--exclude", "--exclude-dir", "--regexp", "--file"}


def refuse(reason: str) -> None:
    print(f"Blocked by the holdout fence: {reason}. The holdout scenarios are for the "
          "holdout-verifier and holdout-writer subagents only; scope searches and diffs to source "
          "folders (or exclude .factory).", file=sys.stderr)
    sys.exit(2)


def normal(path: str) -> str:
    """A comparable absolute path: forward slashes, Git Bash drive form folded, case folded on Windows."""
    path = path.strip().strip("'\"").replace("\\", "/")
    drive = re.match(r"^/([a-zA-Z])(/|$)", path)
    if drive and os.name == "nt":
        path = f"{drive.group(1)}:/{path[3:]}"
    path = os.path.normpath(os.path.expanduser(path)).replace("\\", "/")
    return path.lower() if os.name == "nt" else path


def resolve(path: str, cwd: str) -> str:
    path = path.strip().strip("'\"")
    static = re.split(r"[*?\[{]", path, maxsplit=1)[0]
    if static != path:
        static = static.rsplit("/", 1)[0] if "/" in static else ""
    raw = static.replace("\\", "/")
    if raw == "" or not (raw.startswith("/") or re.match(r"^[a-zA-Z]:", raw) or raw.startswith("~")):
        raw = os.path.join(cwd, raw) if raw else cwd
    return normal(raw)


def covers(path: str, holdout: str) -> bool:
    path = path.rstrip("/")
    return holdout == path or holdout.startswith(path + "/")


def tokens(segment: str, posix: bool = True) -> list[str]:
    try:
        words = [w.strip("'\"") for w in shlex.split(segment, posix=posix)]
    except ValueError:
        words = segment.split()
    while words and re.match(r"^\w+=", words[0]):
        words = words[1:]
    return words


def excluded(words: list[str]) -> bool:
    """The search excludes .factory (or the holdout folder) itself."""
    text = " ".join(words).replace("\\", "/")
    return bool(re.search(r"(--exclude-dir[= ]\S*(\.factory|holdout|\.\*))|(:\(exclude\)|:!|:\^)\S*\.factory"
                          r"|(-g|--glob)[= ]['\"]?!\S*\.factory", text, re.I))


def grep_paths(args: list[str]) -> tuple[bool, list[str]]:
    recursive, positional, has_pattern_opt, skip = False, [], False, False
    for index, arg in enumerate(args):
        if skip:
            skip = False
            continue
        if arg == "--":
            positional.extend(args[index + 1:])
            break
        if arg.startswith("--"):
            recursive |= arg in ("--recursive", "--dereference-recursive")
            has_pattern_opt |= arg.startswith(("--regexp", "--file"))
            skip = arg in GREP_ARG_OPTS
        elif arg.startswith("-") and len(arg) > 1:
            letters = arg[1:]
            recursive |= "r" in letters or "R" in letters
            has_pattern_opt |= "e" in letters or "f" in letters
            skip = arg in GREP_ARG_OPTS or letters[-1:] in ("e", "f", "A", "B", "C", "m")
        else:
            positional.append(arg)
    paths = positional if has_pattern_opt else positional[1:]
    return recursive, paths


def git_probe(words: list[str], cwd: str, holdout_rel: str) -> bool:
    """Whether a git diff/log/show would print a file under the holdout folder."""
    index, base = 1, cwd
    while index < len(words) and words[index].startswith("-"):
        if words[index] in ("-C", "-c") and index + 1 < len(words):
            base = resolve(words[index + 1], cwd) if words[index] == "-C" else base
            index += 2
        else:
            index += 1
    if index >= len(words) or words[index] not in ("diff", "log", "show", "whatchanged"):
        return False
    sub, rest = words[index], words[index + 1:]
    if any(arg in NO_PATCH for arg in rest) and not any(LOG_PATCH.match(arg) for arg in rest):
        return False
    if sub in ("log", "whatchanged") and not any(LOG_PATCH.match(arg) for arg in rest):
        return False
    probe = ["git", "-C", base, sub, "--name-only"] + (["--format="] if sub != "diff" else [])
    probe += [arg for arg in rest if not PROBE_DROP.match(arg)]
    try:
        out = subprocess.run(probe, capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError):
        return False
    return any(line.strip().replace("\\", "/").startswith(holdout_rel + "/") for line in out.splitlines())


def check_shell(command: str, cwd: str, holdout: str, posix: bool) -> None:
    for segment in SEGMENT.split(command):
        words = tokens(segment, posix)
        if not words:
            continue
        program = words[0].rsplit("/", 1)[-1].lower()
        if program == "cd" and len(words) > 1:
            cwd = resolve(words[1], cwd)
            continue
        if program in ("grep", "egrep", "fgrep"):
            recursive, paths = grep_paths(words[1:])
            if recursive and not excluded(words) and any(covers(resolve(p, cwd), holdout) for p in paths or ["."]):
                refuse(f"`{segment.strip()[:80]}` searches the folder")
        elif program == "rg":
            no_ignore = any(re.match(r"^(-u+|--no-ignore(-dot|-files|-vcs)?)$", w) for w in words[1:])
            if no_ignore and not excluded(words):
                paths = [w for w in words[1:] if not w.startswith("-")][1:]
                if any(covers(resolve(p, cwd), holdout) for p in paths or ["."]):
                    refuse(f"`{segment.strip()[:80]}` searches the folder without .ignore")
        elif program == "git" and "grep" in words[1:3]:
            rest = words[words.index("grep") + 1:]
            specs = rest[rest.index("--") + 1:] if "--" in rest else []
            if not excluded(words) and any(covers(resolve(p, cwd), holdout) for p in specs or ["."]):
                refuse(f"`{segment.strip()[:80]}` searches the folder")
        elif program == "git" and git_probe(words, cwd, FOLDER):
            refuse(f"`{segment.strip()[:80]}` would print a holdout file")


# --- Where the scenarios are, and whether a path reaches them -----------------------------------

def holdout_values(data) -> list[str]:
    """Every `holdout` input a launcher file passes, wherever its format nests it."""
    if isinstance(data, dict):
        return [v for k, v in data.items() if k == "holdout" and isinstance(v, str) and v.strip()] + \
               [s for k, v in data.items() if k != "holdout" for s in holdout_values(v)]
    if isinstance(data, list):
        return [s for item in data for s in holdout_values(item)]
    return []


def checkouts(root: Path) -> list[Path]:
    """This checkout and, when it is a worktree, the main checkout that holds the launcher files."""
    found = [root]
    try:
        common = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=root, capture_output=True,
                                text=True, timeout=10).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        common = ""
    if common:
        main = (root / common).resolve().parent
        if main != root.resolve():
            found.append(main)
    return found


def rooted(path: str) -> bool:
    return path.startswith(("/", "~", "\\")) or bool(re.match(r"^[a-zA-Z]:", path))


def holdout_files(root: Path) -> list[str]:
    """The scenario files this checkout's factory uses: what the launchers pass, and MACHINE_HOLDOUT."""
    files = []
    for base in checkouts(root):
        for name in LAUNCHERS:
            try:
                data = json.loads((base / name).read_text(encoding="utf-8-sig"))
            except (OSError, ValueError):
                continue
            for value in holdout_values(data):
                value = value.strip()
                files.append(os.path.expanduser(value) if rooted(value) else str(base / value))
    files.append(MACHINE_HOLDOUT)
    return list(dict.fromkeys(files))


def forms(path: str) -> list[str]:
    """The comparable forms of a path: as written and, when it exists, with its links followed."""
    found = [normal(path)]
    try:
        if not re.search(r"[*?\[]", path) and os.path.lexists(path):
            found.append(normal(os.path.realpath(path)))
    except (OSError, ValueError):
        pass
    return list(dict.fromkeys(found))


def fences(root: Path) -> tuple[list[str], list[str]]:
    """(in-repository folders, machine folders) that hold scenarios, as normal() paths.

    A folder inside this checkout is searched by the Grep and Glob tools only through `.ignore`, so it
    keeps the in-repository rules. Every other folder is fenced against any search that covers it.
    """
    archon = os.environ.get("ARCHON_HOME") or os.path.expanduser("~/.archon")
    folders = [HOLDOUTS, os.path.join(archon, "holdout-tools")]
    folders += [os.path.dirname(path) for path in holdout_files(root)]
    here = normal(str(root))
    inrepo, machine = [normal(str(root / FOLDER))], []
    for folder in folders:
        for form in forms(folder):
            (inrepo if covers(here, form) else machine).append(form)
    return list(dict.fromkeys(inrepo)), list(dict.fromkeys(machine))


def place(word: str, cwd: str) -> list[str]:
    """Where a word of a command or a tool's path points, globs kept, in every comparable form."""
    home = os.path.expanduser("~")
    word = word.strip().strip("'\"")
    word = re.sub(r"\$\{HOME\}|\$HOME(?![\w])|\$env:(?:HOME|USERPROFILE)(?![\w])", lambda _: home, word, flags=re.I)
    word = re.sub(r"\{[^{}]*\}", "*", word.replace("\\", "/"))
    if word.startswith("~"):
        word = os.path.expanduser(word)
    if not rooted(word):
        word = f"{cwd}/{word}" if word else cwd
    return forms(word)


def parts(path: str) -> list[str]:
    return re.sub(r"/+", "/", path).rstrip("/").split("/")


def component(name: str, pattern: str, hidden: bool) -> bool:
    if not re.search(r"[*?\[]", pattern):
        return name == pattern
    if name.startswith(".") and not pattern.startswith(".") and not hidden:
        return False  # a shell glob does not match a hidden name
    return fnmatch.fnmatchcase(name, pattern)


def relation(path: str, folder: str, hidden: bool = False) -> str | None:
    """'inside' when the path is the folder or in it (a glob that can reach it counts), 'above' when
    it is one of the folder's ancestors (the scope of a search that would walk into it). `hidden`
    lets a glob match a name that starts with a dot, as some tools do; it is set for machine folders,
    which nothing searches through `.ignore`."""
    have, want = parts(path), parts(folder)
    for index, name in enumerate(want):
        if index >= len(have):
            return "above"
        if have[index] == "**":
            return "inside" if hidden or not any(n.startswith(".") for n in want[index:]) else None
        if not component(name, have[index], hidden):
            return None
    return "inside"


def lands_inside(path: str, inrepo: list[str], machine: list[str]) -> bool:
    return (any(relation(path, folder) == "inside" for folder in inrepo)
            or any(relation(path, folder, True) == "inside" for folder in machine))


def reaches(path: str, machine: list[str]) -> bool:
    return any(relation(path, folder, True) for folder in machine)


# --- Shell commands that search, list or name the machine folder --------------------------------

GREP_FAMILY = {"grep", "egrep", "fgrep", "zgrep", "ugrep"}
SEARCHERS = {"rg", "ag", "ack", "ack-grep", "pt", "sift"}
FINDERS = {"find", "bfs", "fd", "fdfind"}
WALKERS = {"tree", "du", "ncdu", "tar", "bsdtar", "zip", "7z", "7za", "rsync", "cpio", "rclone"}
WHOLE_DISK = {"locate", "plocate", "mlocate", "slocate"}
# Programs that only walk a folder when told to; for ls and dir a small -r means reverse order.
FLAG_WALKERS = {"ls", "dir", "cp", "scp", "diff", "chmod", "chown", "chgrp", "get-childitem", "gci",
                "select-string", "sls", "copy-item", "cpi", "get-item"}
SHELL_PROGRAMS = {"bash", "sh", "zsh", "dash", "ksh", "busybox"}
CD = {"cd", "pushd", "chdir", "set-location", "sl"}
LEADERS = {"if", "then", "elif", "else", "while", "until", "do", "!", "{", "time", "builtin", "command",
           "exec", "nohup", "sudo", "doas", "env"}
SEARCH_ARG_OPTS = {"-e", "-f", "-g", "--glob", "--iglob", "-t", "--type", "-T", "--type-not", "-m",
                   "--max-count", "-A", "-B", "-C", "--context", "-j", "--threads", "-M", "--max-columns",
                   "-d", "--max-depth", "--maxdepth", "-r", "--replace", "-E", "--encoding", "--pre",
                   "--pre-glob", "--sort", "--sortr", "--color", "--colors", "--type-add", "--type-clear",
                   "--ignore-file", "--max-filesize", "--path-separator", "-G", "--file-search-regex",
                   "--regexp", "--file"}
SEARCH_PATTERN_OPTS = {"-e", "-f", "-g", "-G", "--regexp", "--file", "--files", "--file-search-regex"}


def segments(command: str) -> list[str]:
    """The simple commands of a line, split on operators outside quotes (a `bash -c` string stays whole)."""
    found, current, quote, index = [], [], None, 0
    while index < len(command):
        char = command[index]
        if quote:
            current.append(char)
            if char == quote:
                quote = None
            elif char == "\\" and quote == '"' and index + 1 < len(command):
                current.append(command[index + 1])
                index += 1
        elif char in "'\"":
            quote = char
            current.append(char)
        elif char == "\\" and index + 1 < len(command) and command[index + 1] != "\n":
            current.extend(command[index:index + 2])
            index += 1
        elif char in ";&|\n()`":
            found.append("".join(current))
            current = []
        else:
            current.append(char)
        index += 1
    found.append("".join(current))
    return [segment for segment in found if segment.strip()]


def split_words(segment: str, posix: bool) -> list[str]:
    try:
        words = shlex.split(segment, posix=posix)
    except ValueError:
        words = segment.split()
    words = [re.sub(r"^\d*[<>]+&?", "", word.strip("'\"") if not posix else word) for word in words]
    return [word for word in words if word]


def program_name(word: str) -> str:
    name = word.replace("\\", "/").rsplit("/", 1)[-1].lower()
    return name[:-4] if name.endswith(".exe") else name


def candidates(words: list[str]) -> list[str]:
    """Every word that may be a path: plain words, and the value of `--opt=value` or `NAME=value`."""
    found = []
    for word in words:
        if not word.startswith("-"):
            found.append(word)
        if "=" in word:
            found.append(word.split("=", 1)[1])
    return [word for word in found if word]


def search_paths(args: list[str]) -> list[str]:
    """The paths of an rg/ag/ack search: its plain words after the pattern."""
    positional, has_pattern_opt, skip = [], False, False
    for index, arg in enumerate(args):
        if skip:
            skip = False
            continue
        if arg == "--":
            positional.extend(args[index + 1:])
            break
        if arg.startswith("--"):
            name = arg.split("=", 1)[0]
            has_pattern_opt |= name in SEARCH_PATTERN_OPTS
            skip = "=" not in arg and name in SEARCH_ARG_OPTS
        elif arg.startswith("-") and len(arg) > 1:
            has_pattern_opt |= any(f"-{letter}" in SEARCH_PATTERN_OPTS for letter in arg[1:])
            skip = f"-{arg[-1]}" in SEARCH_ARG_OPTS
        else:
            positional.append(arg)
    return positional if has_pattern_opt else positional[1:]


def find_paths(args: list[str]) -> list[str]:
    """The starting points of a find: the words before its expression."""
    found, skip = [], False
    for arg in args:
        if skip:
            skip = False
            continue
        if arg in ("-H", "-L", "-P") or arg.startswith("-O"):
            continue
        if arg == "-D":
            skip = True
            continue
        if arg.startswith("-") or arg in ("(", "!", ","):
            break
        found.append(arg)
    return found


def walks(program: str, args: list[str]) -> bool:
    for arg in args:
        low = arg.lower()
        if low in ("--recursive", "--dereference-recursive", "-recurse", "--archive"):
            return True
        if re.match(r"^-[a-zA-Z]+$", arg) and not arg.startswith("--"):
            letters = arg[1:]
            if "R" in letters or (program not in ("ls", "dir") and "r" in letters):
                return True
            if program in ("cp", "scp") and "a" in letters:
                return True
    return False


def scopes(words: list[str]) -> list[str]:
    """What the recursive searches and listings in one simple command walk ('.' when they name nothing)."""
    found = []
    for index, word in enumerate(words):
        program, args = program_name(word), words[index + 1:]
        plain = [arg for arg in args if not arg.startswith("-")]
        if program in GREP_FAMILY:
            recursive, paths = grep_paths(args)
            if recursive:
                found += paths or ["."]
        elif program in SEARCHERS:
            found += search_paths(args) or ["."]
        elif program in ("find", "bfs"):
            found += find_paths(args) or ["."]
        elif program in FINDERS or program in WALKERS:
            found += plain or ["."]
        elif program in WHOLE_DISK:
            found.append("/")
        elif program in FLAG_WALKERS and walks(program, args):
            found += plain or ["."]
    return found


def inner_command(words: list[str]) -> str | None:
    """The string a `bash -c`/`sh -c` or `eval` runs."""
    for index, word in enumerate(words):
        program = program_name(word)
        if program == "eval":
            return " ".join(words[index + 1:])
        if program in SHELL_PROGRAMS:
            for position, arg in enumerate(words[index + 1:], start=index + 1):
                if re.match(r"^-[a-zA-Z]*c[a-zA-Z]*$", arg) and position + 1 < len(words):
                    return words[position + 1]
    return None


def check_reach(command: str, cwd: str, inrepo: list[str], machine: list[str], posix: bool,
                depth: int = 0) -> None:
    """Refuse a shell command whose words land in a scenario folder, or that walks the machine folder."""
    for segment in segments(command):
        words = split_words(segment, posix)
        if not words:
            continue
        shown = segment.strip()[:80]
        for word in candidates(words):
            if any(lands_inside(path, inrepo, machine) for path in place(word, cwd)):
                refuse(f"`{shown}` names the holdout folder")
        lead = 0
        while lead < len(words) and (program_name(words[lead]) in LEADERS or re.match(r"^\w+=", words[lead])):
            lead += 1
        if lead < len(words) and program_name(words[lead]) in CD:
            target = next((w for w in words[lead + 1:] if not w.startswith("-")), "~")
            if target != "-":
                cwd = place(target, cwd)[0]
            continue
        inner = inner_command(words)
        if inner and depth < 4:
            check_reach(inner, cwd, inrepo, machine, True, depth + 1)
        for scope in scopes(words):
            if any(reaches(path, machine) for path in place(scope, cwd)):
                refuse(f"`{shown}` searches or lists the holdout folder")


def check_tool(tool: str, tool_input: dict, cwd: str, inrepo: list[str], machine: list[str]) -> None:
    """Refuse a file tool whose path lands in a scenario folder, or a search that covers the machine one."""
    for key in ("file_path", "notebook_path"):
        value = tool_input.get(key)
        if isinstance(value, str) and value and any(lands_inside(p, inrepo, machine) for p in place(value, cwd)):
            refuse("the call names the holdout folder")
    if tool in ("Grep", "Glob"):
        base = tool_input.get("path") if isinstance(tool_input.get("path"), str) else ""
        base_places = place(base or ".", cwd)
        if any(lands_inside(p, inrepo, machine) for p in base_places):
            refuse("the search names the holdout folder")
        if tool == "Grep" and any(reaches(p, machine) for p in base_places):
            refuse("the search covers the holdout folder")
        if tool == "Glob":
            pattern = tool_input.get("pattern") if isinstance(tool_input.get("pattern"), str) else ""
            pattern = (pattern or "*").replace("\\", "/")
            full = pattern if rooted(pattern) else f"{(base or '.').rstrip('/')}/{pattern}"
            if any(lands_inside(p, [], machine) for p in place(full, cwd)):
                refuse("the glob reaches the holdout folder")


def pre(event: dict) -> None:
    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input") or {}
    text = json.dumps(tool_input).replace("\\\\", "/")
    holdout_agent = event.get("agent_type") in HOLDOUT_AGENTS
    target = json.dumps([tool_input.get(key, "") for key in ("file_path", "notebook_path")]).replace("\\\\", "/")
    if tool in WRITE_TOOLS and FENCE.search(target):
        refuse("the fence itself only changes by hand")
    if tool in SHELL_TOOLS and FENCE.search(text) and MUTATES.search(tool_input.get("command", "")):
        refuse("the fence itself only changes by hand")
    if holdout_agent or tool not in ACCESS_TOOLS:
        return
    if tool in ("Agent", "Task") and tool_input.get("subagent_type") in HOLDOUT_AGENTS:
        return
    if NAMED.search(text):
        refuse("the call names the holdout folder")
    project = os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or os.getcwd()
    root = normal(project)
    cwd = normal(event.get("cwd") or root)
    inrepo, machine = fences(Path(project))
    if any(re.search(re.escape(folder) + r"(?![\w.-])", text, re.I) for folder in machine):
        refuse("the call names the holdout folder")
    if tool in SHELL_TOOLS:
        check_shell(tool_input.get("command", ""), cwd, f"{root}/{FOLDER}", tool == "Bash")
        check_reach(tool_input.get("command", ""), cwd, inrepo, machine, tool == "Bash")
    else:
        check_tool(tool, tool_input, cwd, inrepo, machine)


def strings(value) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [s for item in value.values() for s in strings(item)]
    if isinstance(value, list):
        return [s for item in value for s in strings(item)]
    return []


def squash(text: str) -> str:
    return " ".join(text.lower().split())


def post(event: dict) -> None:
    if event.get("agent_type") in HOLDOUT_AGENTS:
        return
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or os.getcwd())
    # The real scenarios (what the launchers pass, else MACHINE_HOLDOUT), not the empty template.
    prints = {}
    for name in holdout_files(root):
        scenarios = Path(name)
        if not scenarios.is_file():
            continue
        current = ""
        for line in scenarios.read_text(encoding="utf-8", errors="replace").splitlines():
            heading = re.match(r"^#{2,3}\s+(\S+)", line)
            if heading:
                current = heading.group(1)
            flat = squash(line.lstrip("#"))
            if len(flat) >= 40:
                prints.setdefault(flat, current)
    if not prints:
        return
    seen = squash("\n".join(strings(event.get("tool_response"))))
    hits = sorted({scenario for flat, scenario in prints.items() if flat in seen})
    if not hits:
        return
    common = subprocess.run(["git", "rev-parse", "--git-common-dir"], cwd=root, capture_output=True,
                            text=True, timeout=20).stdout.strip()
    log = (root / common if common else root / ".git") / "holdout-exposures.jsonl"
    with open(log, "a", encoding="utf-8") as handle:
        handle.write(json.dumps({"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                 "session": event.get("session_id", ""), "agent": event.get("agent_type", ""),
                                 "tool": event.get("tool_name", ""), "scenarios": hits}) + "\n")


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "pre"
    try:
        event = json.load(sys.stdin)
        (post if mode == "post" else pre)(event)
    except SystemExit:
        raise
    except Exception as error:  # noqa: BLE001 - any failure must refuse, never let the call through
        if mode == "post":
            sys.exit(0)
        refuse(f"the fence could not check this call ({type(error).__name__}: {error})")
    sys.exit(0)


if __name__ == "__main__":
    main()

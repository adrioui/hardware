import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  description: string;
  done: boolean;
  reads: string[];
  runs: string;
  validates: string;
  lineIndex: number;
}

interface ParsedPlan {
  tasks: Task[];
  currentTaskId: string;
}

interface RalphFlags {
  all: boolean;
  noCommit: boolean;
  status: boolean;
  taskId: string;
  model: string;
}

// ── Arg Parser ───────────────────────────────────────────────────────────────

function parseArgs(args: string): RalphFlags {
  const flags: RalphFlags = { all: false, noCommit: false, status: false, taskId: "", model: "" };
  const parts = args.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "--all") flags.all = true;
    else if (p === "--no-commit") flags.noCommit = true;
    else if (p === "--status") flags.status = true;
    else if (p === "--model" && i + 1 < parts.length) flags.model = parts[++i];
    else if (!p.startsWith("--")) flags.taskId = p;
  }
  return flags;
}

// ── Plan Parser ──────────────────────────────────────────────────────────────

function parsePlan(content: string): ParsedPlan {
  const lines = content.split("\n");
  const tasks: Task[] = [];
  let currentTaskId = "";

  // Extract "Current Task" field value
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## Current Task")) {
      for (let j = i + 1; j < lines.length; j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("#")) {
          currentTaskId = val;
          break;
        }
      }
      break;
    }
  }

  // Parse task lines: - [ ] **id** description  OR  - [x] **id** description
  const taskRe = /^- \[([ x])\] \*\*(.+?)\*\*\s*(.*)$/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(taskRe);
    if (!m) continue;

    const task: Task = {
      id: m[2],
      description: m[3].trim(),
      done: m[1] === "x",
      reads: [],
      runs: "",
      validates: "",
      lineIndex: i,
    };

    // Scan indented sub-items for reads/runs/validates
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].match(/^\s+- /)) break;
      const trimmed = lines[j].trim();

      if (trimmed.startsWith("- reads:")) {
        for (const bm of trimmed.slice("- reads:".length).matchAll(/`([^`]+)`/g)) {
          task.reads.push(bm[1]);
        }
      } else if (trimmed.startsWith("- runs:")) {
        const runsStr = trimmed.slice("- runs:".length).trim();
        const bm = runsStr.match(/`([^`]+)`/);
        task.runs = bm ? bm[1] : runsStr;
      } else if (trimmed.startsWith("- validates:")) {
        task.validates = trimmed.slice("- validates:".length).trim();
      }
    }

    tasks.push(task);
  }

  return { tasks, currentTaskId };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPrompt(task: Task): string {
  const parts: string[] = [`## Task ${task.id}: ${task.description}`, ""];

  if (task.reads.length > 0) {
    parts.push("Read these files for context first:");
    for (const f of task.reads) parts.push(`- \`${f}\``);
    parts.push("");
  }

  if (task.runs) {
    parts.push(`Run this command: \`${task.runs}\``);
    parts.push("");
  }

  if (task.validates) {
    parts.push(`**Validation:** ${task.validates}`);
    parts.push("");
  }

  parts.push("Complete the task and ensure validation passes. Be thorough but concise.");
  return parts.join("\n");
}

async function checkOffTask(
  planPath: string,
  taskId: string,
  nextTaskId: string | undefined,
): Promise<void> {
  const content = await readFile(planPath, "utf8");
  const lines = content.split("\n");

  // Check off the task: - [ ] **id** → - [x] **id**
  const checkRe = new RegExp(`^(- )\\[ \\]( \\*\\*${escapeRegex(taskId)}\\*\\*)`, "m");
  const updated = lines.join("\n").replace(checkRe, "$1[x]$2");
  const updatedLines = updated.split("\n");

  // Update "Current Task" value
  for (let i = 0; i < updatedLines.length; i++) {
    if (updatedLines[i].startsWith("## Current Task")) {
      for (let j = i + 1; j < updatedLines.length; j++) {
        const val = updatedLines[j].trim();
        if (val && !val.startsWith("#")) {
          updatedLines[j] = nextTaskId ?? "DONE ✅";
          break;
        }
      }
      break;
    }
  }

  await writeFile(planPath, updatedLines.join("\n"), "utf8");
}

async function logIssue(planPath: string, taskId: string, message: string): Promise<void> {
  const content = await readFile(planPath, "utf8");
  const lines = content.split("\n");

  const issueLine = `- Task ${taskId}: ${message}`;

  let issuesIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## Discovered Issues")) {
      issuesIdx = i;
      break;
    }
  }

  if (issuesIdx >= 0) {
    // Insert before next section or at end
    let insertIdx = lines.length;
    for (let i = issuesIdx + 1; i < lines.length; i++) {
      if (lines[i].startsWith("## ")) {
        insertIdx = i;
        break;
      }
    }
    lines.splice(insertIdx, 0, issueLine);
  } else {
    lines.push("", "## Discovered Issues", issueLine);
  }

  await writeFile(planPath, lines.join("\n"), "utf8");
}

// ── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const retries = new Map<string, number>();

  pi.registerCommand("ralph", {
    description: "Run tasks from IMPLEMENTATION_PLAN.md (Ralph-style loop)",
    handler: async (args, ctx) => {
      const flags = parseArgs(args);
      const planPath = resolve(ctx.cwd, "IMPLEMENTATION_PLAN.md");

      let content: string;
      try {
        content = await readFile(planPath, "utf8");
      } catch {
        ctx.ui.notify("❌ IMPLEMENTATION_PLAN.md not found", "error");
        return;
      }

      const plan = parsePlan(content);

      // ── --status ──────────────────────────────────────────────────────
      if (flags.status) {
        const done = plan.tasks.filter((t) => t.done).length;
        const total = plan.tasks.length;
        const remaining = plan.tasks.filter((t) => !t.done);

        const out: string[] = [
          "📋 Implementation Plan Status",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          `Current Task: ${plan.currentTaskId}`,
          `Done: ${done}/${total}`,
          `Remaining: ${remaining.length}`,
        ];

        if (remaining.length > 0) {
          out.push("", "Next tasks:");
          for (const t of remaining.slice(0, 10)) {
            out.push(`  ${t.id} ${t.description}`);
          }
          if (remaining.length > 10) out.push(`  ... and ${remaining.length - 10} more`);
        }

        ctx.ui.notify(out.join("\n"), "info");
        return;
      }

      // ── Find task to run ──────────────────────────────────────────────
      let task: Task | undefined;

      if (flags.taskId) {
        task = plan.tasks.find((t) => t.id === flags.taskId);
        if (!task) {
          ctx.ui.notify(`❌ Task ${flags.taskId} not found`, "error");
          return;
        }
        if (task.done) {
          ctx.ui.notify(`⏭ Task ${flags.taskId} already done`, "info");
          return;
        }
      } else {
        // Try current task from plan, fall back to first unchecked
        if (plan.currentTaskId && !plan.currentTaskId.includes("DONE")) {
          task = plan.tasks.find((t) => t.id === plan.currentTaskId && !t.done);
        }
        if (!task) {
          task = plan.tasks.find((t) => !t.done);
        }
      }

      if (!task) {
        ctx.ui.notify("🎉 All tasks complete!", "success");
        return;
      }

      // ── Execution loop ────────────────────────────────────────────────
      const doneSet = new Set(plan.tasks.filter((t) => t.done).map((t) => t.id));

      while (task) {
        ctx.ui.setStatus("ralph", `🔨 Task ${task.id}...`);
        ctx.ui.notify(`▶ Starting task ${task.id}: ${task.description}`, "info");

        // Build prompt and dispatch via pi -p (full context isolation)
        const prompt = buildPrompt(task);
        const piArgs: string[] = [];
        if (flags.model) piArgs.push("--model", flags.model);
        piArgs.push("-p", prompt);

        const result = await pi.exec("pi", piArgs, { timeout: 300_000 });
        let passed = result.code === 0;

        // Hard validation gate: if task has a runs: command, execute it
        if (passed && task.runs) {
          const val = await pi.exec("bash", ["-c", task.runs], { timeout: 60_000 });
          passed = val.code === 0;
          if (!passed) {
            ctx.ui.notify(`⚠️ Validation command failed: ${task.runs}`, "warning");
          }
        }

        if (passed) {
          doneSet.add(task.id);
          const nextTask = plan.tasks.find((t) => !doneSet.has(t.id));
          await checkOffTask(planPath, task.id, nextTask?.id);
          retries.delete(task.id);

          // Git commit (unless --no-commit)
          if (!flags.noCommit) {
            await pi.exec("git", ["add", "-A"]);
            await pi.exec("git", [
              "commit",
              "-m",
              `ralph: task ${task.id} — ${task.description}`.slice(0, 72),
            ]);
          }

          ctx.ui.notify(`✅ Task ${task.id} done`, "success");

          if (!flags.all) break;
          task = plan.tasks.find((t) => !doneSet.has(t.id));
        } else {
          // ── Circuit breaker: 3 failures → stop ──────────────────────
          const count = (retries.get(task.id) || 0) + 1;
          retries.set(task.id, count);

          if (count >= 3) {
            const snippet = (result.stderr || result.stdout).slice(0, 200);
            await logIssue(planPath, task.id, `Failed ${count} times. Last output: ${snippet}`);
            ctx.ui.notify(`❌ Task ${task.id} failed 3 times. Stopping.`, "error");
            break;
          }

          ctx.ui.notify(`⚠️ Task ${task.id} failed (attempt ${count}/3). Retrying...`, "warning");
          // task stays the same → retry on next loop iteration
        }
      }

      ctx.ui.setStatus("ralph", undefined);
    },
  });
}

/**
 * HDLBits AI Tutor Extension
 *
 * Provides Socratic tutoring for HDLBits Verilog exercises.
 *
 * Features:
 * - Load exercise descriptions and current code
 * - Submit and grade exercises
 * - Request hints via the CLI
 * - Navigate to the next incomplete exercise
 * - Show per-category progress with visual bars
 * - Toggle Socratic tutor mode that injects a teaching persona
 * - Persistent status line + widget showing current exercise
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
	index: number;
	slug: string;
	tc: string;
	category: string;
	title: string;
	relpath: string;
}

interface TutorState {
	tutorMode: boolean;
	currentExercise: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip ANSI escape sequences from a string */
function stripAnsi(str: string): string {
	return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

/** Parse .manifest (pipe-delimited: index|slug|tc|category|title|relpath) */
function parseManifest(content: string): Exercise[] {
	const exercises: Exercise[] = [];
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const parts = trimmed.split("|");
		if (parts.length < 6) continue;
		exercises.push({
			index: parseInt(parts[0]!, 10),
			slug: parts[1]!,
			tc: parts[2]!,
			category: parts[3]!,
			title: parts[4]!,
			relpath: parts[5]!,
		});
	}
	return exercises;
}

/** Parse .categories (pipe-delimited: dir|name) */
function parseCategories(content: string): Map<string, string> {
	const map = new Map<string, string>();
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf("|");
		if (idx === -1) continue;
		map.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
	}
	return map;
}

/**
 * Check each exercise file for the sentinel "// I AM NOT DONE".
 * Returns a map of category → { done, total }.
 */
async function getProgress(
	cwd: string,
	exercises: Exercise[],
): Promise<Map<string, { done: number; total: number }>> {
	const result = new Map<string, { done: number; total: number }>();

	for (const ex of exercises) {
		const cat = ex.category;
		if (!result.has(cat)) result.set(cat, { done: 0, total: 0 });
		const entry = result.get(cat)!;
		entry.total++;

		try {
			const content = await readFile(join(cwd, "exercises", ex.relpath), "utf8");
			if (!content.includes("// I AM NOT DONE")) {
				entry.done++;
			}
		} catch {
			// file missing → treat as not done
		}
	}

	return result;
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function hdlbitsTutorExtension(pi: ExtensionAPI) {
	// ── In-memory state ──────────────────────────────────────────────────────

	let exercises: Exercise[] = [];
	let categories: Map<string, string> = new Map();
	let tutorMode = false;
	let currentExercise: string | null = null;

	// ── State persistence helpers ────────────────────────────────────────────

	function persistState() {
		const state: TutorState = { tutorMode, currentExercise };
		pi.appendEntry("hdlbits-tutor-state", state);
	}

	function reconstructState(ctx: ExtensionContext) {
		tutorMode = false;
		currentExercise = null;

		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type === "custom" && entry.customType === "hdlbits-tutor-state") {
				const data = entry.data as TutorState;
				tutorMode = data.tutorMode ?? false;
				currentExercise = data.currentExercise ?? null;
			}
		}
	}

	// ── Resource loading ─────────────────────────────────────────────────────

	async function loadResources(cwd: string) {
		try {
			const manifestRaw = await readFile(join(cwd, ".manifest"), "utf8");
			exercises = parseManifest(manifestRaw);
		} catch {
			exercises = [];
		}

		try {
			const categoriesRaw = await readFile(join(cwd, ".categories"), "utf8");
			categories = parseCategories(categoriesRaw);
		} catch {
			categories = new Map();
		}
	}

	// ── UI helpers ───────────────────────────────────────────────────────────

	function updateUI(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;
		const theme = ctx.ui.theme;

		// ── Status line ──────────────────────────────────────────────────────
		const modeStr = tutorMode
			? theme.fg("accent", "🎓 TUTOR")
			: theme.fg("dim", "tutor:off");

		let exerciseStr = theme.fg("dim", "no exercise");
		if (currentExercise) {
			const ex = exercises.find((e) => e.slug === currentExercise);
			if (ex) {
				exerciseStr =
					theme.fg("muted", ex.slug) + theme.fg("dim", ` (${ex.category})`);
			} else {
				exerciseStr = theme.fg("muted", currentExercise);
			}
		}

		ctx.ui.setStatus(
			"hdlbits-tutor",
			`${modeStr}  ${theme.fg("dim", "│")}  ${exerciseStr}`,
		);

		// ── Widget ───────────────────────────────────────────────────────────
		const widgetLines: string[] = [];

		if (currentExercise) {
			const ex = exercises.find((e) => e.slug === currentExercise);
			if (ex) {
				const catName = categories.get(ex.category) ?? ex.category;
				widgetLines.push(
					theme.fg("accent", "  HDLBits ") +
						(tutorMode
							? theme.fg("success", "[TUTOR MODE]")
							: theme.fg("dim", "[tutor:off]")),
				);
				widgetLines.push(
					theme.fg("toolTitle", "  ") +
						theme.bold(ex.title) +
						theme.fg("dim", `  #${ex.index}`),
				);
				widgetLines.push(
					theme.fg("dim", "  ") + theme.fg("muted", catName),
				);
				widgetLines.push(
					theme.fg("dim", "  slug: ") + theme.fg("accent", ex.slug),
				);
			}
		} else {
			widgetLines.push(
				theme.fg("accent", "  HDLBits ") +
					(tutorMode
						? theme.fg("success", "[TUTOR MODE]")
						: theme.fg("dim", "[tutor:off]")),
			);
			widgetLines.push(theme.fg("dim", "  No exercise selected"));
		}

		ctx.ui.setWidget("hdlbits-tutor", widgetLines);
	}

	// ── Session events ───────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		await loadResources(ctx.cwd);
		reconstructState(ctx);
		updateUI(ctx);

		if (currentExercise) {
			pi.setSessionName(`HDLBits › ${currentExercise}`);
		}
	});

	pi.on("session_switch", async (_event, ctx) => {
		reconstructState(ctx);
		updateUI(ctx);
		if (currentExercise) {
			pi.setSessionName(`HDLBits › ${currentExercise}`);
		}
	});

	pi.on("session_fork", async (_event, ctx) => {
		reconstructState(ctx);
		updateUI(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		reconstructState(ctx);
		updateUI(ctx);
	});

	// ── Context injection (tutor persona) ────────────────────────────────────

	pi.on("before_agent_start", async (_event, ctx) => {
		if (!tutorMode) return undefined;

		const ex = currentExercise
			? exercises.find((e) => e.slug === currentExercise)
			: null;
		const catName = ex ? (categories.get(ex.category) ?? ex.category) : "unknown";

		let exerciseInfo = "No exercise is currently selected.";
		if (ex) {
			exerciseInfo = `Current exercise: "${ex.title}" (slug: ${ex.slug}, category: ${catName}, #${ex.index})`;
		}

		const tutorInstructions = `\
You are an expert Verilog / digital-logic tutor helping a student work through HDLBits exercises.
${exerciseInfo}

TEACHING APPROACH (Socratic method — strictly follow these rules):
1. NEVER give complete solutions directly. Guide the student to discover the answer.
2. Ask probing questions to reveal gaps in understanding.
3. When the student makes a mistake, point out WHERE they went wrong and ask them to think about WHY.
4. Offer conceptual hints before code hints.
5. Celebrate correct reasoning, even partial progress.
6. If the student asks to just see the answer after genuine struggle (3+ failed attempts), you may provide it, but explain every line.
7. Keep responses concise. Use code blocks only for small illustrative snippets, not full solutions.

Use the available tools (hdlbits_exercise, hdlbits_run, hdlbits_hint, hdlbits_next, hdlbits_progress) proactively to give the student accurate, up-to-date context.`;

		return {
			message: {
				customType: "hdlbits-tutor-context",
				content: tutorInstructions,
				display: false,
			},
		};
	});

	/** Remove stale tutor-context messages when tutor mode is off */
	pi.on("context", async (event) => {
		if (tutorMode) return undefined;
		return {
			messages: event.messages.filter((m) => {
				const msg = m as typeof m & { customType?: string };
				if (msg.customType === "hdlbits-tutor-context") return false;
				return true;
			}),
		};
	});

	// ── Tool: hdlbits_exercise ────────────────────────────────────────────────

	pi.registerTool({
		name: "hdlbits_exercise",
		label: "HDLBits Exercise",
		description:
			"Read an HDLBits exercise description and current Verilog code. " +
			"Call this before helping with or discussing any specific exercise. " +
			"The tool returns the full .v file content (description + current student code).",
		promptSnippet: "Read an HDLBits exercise description and current Verilog code",
		parameters: Type.Object({
			slug: Type.String({
				description: "Exercise slug identifier (e.g. 'wire', 'notgate', 'mux2to1v')",
			}),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const { slug } = params;
			const ex = exercises.find((e) => e.slug === slug);

			if (!ex) {
				throw new Error(
					`Exercise '${slug}' not found. Use hdlbits_progress to list available exercises.`,
				);
			}

			const filePath = join(ctx.cwd, "exercises", ex.relpath);
			let content: string;
			try {
				content = await readFile(filePath, "utf8");
			} catch {
				throw new Error(`Could not read exercise file: exercises/${ex.relpath}`);
			}

			// Update state
			currentExercise = slug;
			persistState();
			pi.setSessionName(`HDLBits › ${slug}`);
			updateUI(ctx);

			return {
				content: [{ type: "text", text: content }],
				details: { slug, title: ex.title, category: ex.category, filePath },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("hdlbits_exercise ")) +
					theme.fg("accent", args.slug),
				0,
				0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as
				| { slug: string; title: string; category: string }
				| undefined;
			if (!details) {
				return new Text(theme.fg("error", "No details returned"), 0, 0);
			}

			const content = result.content[0];
			const raw = content?.type === "text" ? content.text : "";
			const lines = raw.split("\n").slice(0, 6);
			const preview = lines.join("\n");
			const catName = categories.get(details.category) ?? details.category;

			return new Text(
				theme.fg("success", "✓ ") +
					theme.bold(details.title) +
					theme.fg("dim", `  [${catName}]`) +
					"\n" +
					theme.fg("dim", preview),
				0,
				0,
			);
		},
	});

	// ── Tool: hdlbits_run ─────────────────────────────────────────────────────

	pi.registerTool({
		name: "hdlbits_run",
		label: "HDLBits Run",
		description:
			"Submit and grade an HDLBits Verilog exercise. " +
			"Run this after the student has made changes to verify correctness. " +
			"Returns the grader output including compile errors or test results.",
		promptSnippet: "Submit and grade an HDLBits exercise",
		parameters: Type.Object({
			slug: Type.String({
				description: "Exercise slug to grade (e.g. 'wire', 'notgate')",
			}),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const { slug } = params;
			const ex = exercises.find((e) => e.slug === slug);
			if (!ex) {
				throw new Error(`Exercise '${slug}' not found.`);
			}

			let stdout = "";
			let stderr = "";
			let code = 1;

			try {
				const result = await pi.exec("./hdlbits", ["run", slug], {
					signal,
					timeout: 120_000,
				});
				stdout = stripAnsi(result.stdout ?? "");
				stderr = stripAnsi(result.stderr ?? "");
				code = result.code ?? 1;
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				throw new Error(`Failed to run grader: ${msg}`);
			}

			const combined = stdout + (stderr ? "\n" + stderr : "");

			// Parse status
			let status: "success" | "compile_error" | "incorrect" | "unknown" = "unknown";
			if (/success!/i.test(combined)) status = "success";
			else if (/compile error/i.test(combined)) status = "compile_error";
			else if (/incorrect/i.test(combined)) status = "incorrect";
			else if (code === 0) status = "success";

			// Update current exercise
			currentExercise = slug;
			persistState();
			updateUI(ctx);

			return {
				content: [{ type: "text", text: combined || "(no output)" }],
				details: { slug, status, output: combined, exitCode: code },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("hdlbits_run ")) +
					theme.fg("dim", "Grading ") +
					theme.fg("accent", args.slug) +
					theme.fg("dim", "..."),
				0,
				0,
			);
		},

		renderResult(result, { expanded }, theme) {
			const details = result.details as
				| { slug: string; status: string; output: string }
				| undefined;
			if (!details) {
				return new Text(theme.fg("error", "No details returned"), 0, 0);
			}

			const { slug, status, output } = details;

			let header: string;
			if (status === "success") {
				header =
					theme.fg("success", "✓ ") +
					theme.fg("success", theme.bold("Success!")) +
					theme.fg("dim", `  ${slug}`);
			} else if (status === "compile_error") {
				header =
					theme.fg("error", "✗ ") +
					theme.fg("error", theme.bold("Compile Error")) +
					theme.fg("dim", `  ${slug}`);
			} else {
				header =
					theme.fg("error", "✗ ") +
					theme.fg("warning", theme.bold("Incorrect")) +
					theme.fg("dim", `  ${slug}`);
			}

			if (expanded && output) {
				// Show up to 20 lines of output when expanded
				const lines = output.split("\n").slice(0, 20);
				return new Text(header + "\n" + theme.fg("dim", lines.join("\n")), 0, 0);
			}

			return new Text(header, 0, 0);
		},
	});

	// ── Tool: hdlbits_hint ────────────────────────────────────────────────────

	pi.registerTool({
		name: "hdlbits_hint",
		label: "HDLBits Hint",
		description:
			"Show a hint for an HDLBits exercise. " +
			"Use sparingly in tutor mode — only after the student is genuinely stuck.",
		promptSnippet: "Show a hint for an HDLBits exercise",
		parameters: Type.Object({
			slug: Type.String({
				description: "Exercise slug to get a hint for",
			}),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
			const { slug } = params;

			let stdout = "";
			let stderr = "";

			try {
				const result = await pi.exec("./hdlbits", ["hint", slug], {
					signal,
					timeout: 30_000,
				});
				stdout = stripAnsi(result.stdout ?? "");
				stderr = stripAnsi(result.stderr ?? "");
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				throw new Error(`Failed to get hint: ${msg}`);
			}

			const output = stdout + (stderr ? "\n" + stderr : "");
			return {
				content: [{ type: "text", text: output || "(no hint available)" }],
				details: { slug, hint: output },
			};
		},

		renderCall(args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("hdlbits_hint ")) +
					theme.fg("accent", args.slug),
				0,
				0,
			);
		},
	});

	// ── Tool: hdlbits_next ────────────────────────────────────────────────────

	pi.registerTool({
		name: "hdlbits_next",
		label: "HDLBits Next",
		description:
			"Find and navigate to the next incomplete HDLBits exercise. " +
			"Call this when the student completes an exercise and is ready to move on.",
		promptSnippet: "Find the next incomplete HDLBits exercise",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, signal, _onUpdate, ctx) {
			let stdout = "";
			let stderr = "";

			try {
				const result = await pi.exec("./hdlbits", ["next"], {
					signal,
					timeout: 30_000,
				});
				stdout = stripAnsi(result.stdout ?? "");
				stderr = stripAnsi(result.stderr ?? "");
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				throw new Error(`Failed to find next exercise: ${msg}`);
			}

			const output = (stdout + (stderr ? "\n" + stderr : "")).trim();

			// Try to extract the slug from the output — look for a known exercise slug
			let nextSlug: string | null = null;
			for (const ex of exercises) {
				if (output.includes(ex.slug)) {
					nextSlug = ex.slug;
					break;
				}
			}

			if (nextSlug) {
				currentExercise = nextSlug;
				persistState();
				pi.setSessionName(`HDLBits › ${nextSlug}`);
				updateUI(ctx);
			}

			return {
				content: [{ type: "text", text: output || "(no output)" }],
				details: { nextSlug, output },
			};
		},

		renderCall(_args, theme) {
			return new Text(
				theme.fg("toolTitle", theme.bold("hdlbits_next ")) +
					theme.fg("dim", "Finding next incomplete exercise..."),
				0,
				0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as
				| { nextSlug: string | null; output: string }
				| undefined;
			if (!details) {
				return new Text(theme.fg("error", "No details returned"), 0, 0);
			}

			if (details.nextSlug) {
				return new Text(
					theme.fg("success", "→ ") +
						theme.fg("muted", "Next exercise: ") +
						theme.fg("accent", details.nextSlug),
					0,
					0,
				);
			}

			return new Text(
				theme.fg("success", "🎉 ") +
					theme.fg("success", "All exercises complete!"),
				0,
				0,
			);
		},
	});

	// ── Tool: hdlbits_progress ────────────────────────────────────────────────

	pi.registerTool({
		name: "hdlbits_progress",
		label: "HDLBits Progress",
		description:
			"Show completion progress for all HDLBits exercise categories. " +
			"Use this to give the student an overview of how far they have come.",
		promptSnippet: "Show HDLBits completion progress by category",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			const progress = await getProgress(ctx.cwd, exercises);

			let totalDone = 0;
			let totalAll = 0;

			const lines: string[] = [];
			for (const [dir, { done, total }] of progress) {
				const name = categories.get(dir) ?? dir;
				const pct = total > 0 ? Math.round((done / total) * 100) : 0;
				const barWidth = 20;
				const filled = Math.round((pct / 100) * barWidth);
				const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
				lines.push(`${name}: ${done}/${total}  [${bar}] ${pct}%`);
				totalDone += done;
				totalAll += total;
			}

			const overallPct =
				totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
			const summary = `Overall: ${totalDone}/${totalAll} (${overallPct}%)`;

			const text = [summary, "", ...lines].join("\n");

			return {
				content: [{ type: "text", text }],
				details: { progress: Object.fromEntries(progress), totalDone, totalAll },
			};
		},

		renderResult(result, { expanded }, theme) {
			const details = result.details as
				| {
						progress: Record<string, { done: number; total: number }>;
						totalDone: number;
						totalAll: number;
				  }
				| undefined;

			if (!details) {
				return new Text(theme.fg("error", "No details returned"), 0, 0);
			}

			const { totalDone, totalAll } = details;
			const pct =
				totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

			const header =
				theme.fg("accent", "HDLBits Progress  ") +
				theme.fg("success", `${totalDone}`) +
				theme.fg("dim", `/${totalAll}  `) +
				theme.fg("muted", `${pct}%`);

			if (!expanded) {
				return new Text(header, 0, 0);
			}

			let text = header;
			for (const [dir, { done, total }] of Object.entries(details.progress)) {
				const name = categories.get(dir) ?? dir;
				const catPct = total > 0 ? Math.round((done / total) * 100) : 0;
				const barWidth = 16;
				const filled = Math.round((catPct / 100) * barWidth);
				const bar =
					theme.fg("success", "█".repeat(filled)) +
					theme.fg("dim", "░".repeat(barWidth - filled));
				text +=
					"\n" +
					theme.fg("dim", `  ${name}: `) +
					theme.fg("muted", `${done}/${total}`) +
					`  [${bar}] ` +
					theme.fg("dim", `${catPct}%`);
			}

			return new Text(text, 0, 0);
		},
	});

	// ── Command: /tutor ───────────────────────────────────────────────────────

	pi.registerCommand("tutor", {
		description: "Toggle Socratic tutor mode on/off",
		handler: async (_args, ctx) => {
			tutorMode = !tutorMode;
			persistState();
			updateUI(ctx);

			if (tutorMode) {
				ctx.ui.notify(
					"🎓 Tutor mode ON — I will guide you Socratically without giving away answers.",
					"info",
				);
			} else {
				ctx.ui.notify("Tutor mode OFF — direct assistant mode.", "info");
			}
		},
	});

	// ── Command: /progress ────────────────────────────────────────────────────

	pi.registerCommand("progress", {
		description: "Show HDLBits exercise completion progress",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("/progress requires interactive mode", "error");
				return;
			}

			const progress = await getProgress(ctx.cwd, exercises);
			let totalDone = 0;
			let totalAll = 0;

			const rows: string[] = [];
			for (const [dir, { done, total }] of progress) {
				const name = categories.get(dir) ?? dir;
				const pct = total > 0 ? Math.round((done / total) * 100) : 0;
				const barWidth = 20;
				const filled = Math.round((pct / 100) * barWidth);
				const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
				rows.push(`${name}: ${done}/${total}  [${bar}] ${pct}%`);
				totalDone += done;
				totalAll += total;
			}

			const overallPct =
				totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

			const lines = [
				`Overall: ${totalDone}/${totalAll} (${overallPct}%)`,
				"",
				...rows,
			];

			await ctx.ui.select("HDLBits Progress", lines);
		},
	});
}

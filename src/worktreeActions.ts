import type { SimpleGit } from "simple-git";
import type { ExitAction } from "./exitAction";
import {
	type EnsurePrWorktreeResult,
	ensurePrWorktree,
	findRemoteForRepo,
} from "./git";

/**
 * Ensures a worktree exists for a PR, handling remote discovery.
 * Combines findRemoteForRepo + ensurePrWorktree into a single call.
 */
export async function ensurePrWorktreeWithRemote(
	git: SimpleGit,
	cacheDir: string,
	owner: string,
	repo: string,
	prNumber: number,
	branch: string,
): Promise<EnsurePrWorktreeResult> {
	const remote = await findRemoteForRepo(git, owner, repo);
	return ensurePrWorktree(git, cacheDir, prNumber, branch, remote);
}

export function openInEditor(path: string): void {
	Bun.spawn(["code", path], { stdout: "ignore", stderr: "ignore" });
}

export function openPrInBrowser(prNumber: number): void {
	Bun.spawn(["gh", "pr", "view", "--web", String(prNumber)], {
		stdout: "ignore",
		stderr: "ignore",
	});
}

export function copilotExitAction(path: string): ExitAction {
	return { type: "exec", command: ["copilot"], cwd: path };
}

export function shellExitAction(path: string): ExitAction {
	const shell = process.env.SHELL || "/bin/sh";
	return { type: "exec", command: [shell], cwd: path };
}

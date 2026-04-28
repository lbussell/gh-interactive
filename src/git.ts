import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import type { SimpleGit } from "simple-git";

export type Branch = {
	name: string;
	commit: string;
	label: string;
	current: boolean;
};

export type Worktree = {
	path: string;
	head: string;
	branch: string | null;
	bare: boolean;
	detached: boolean;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getRepoName(git: SimpleGit): Promise<string> {
	const toplevel = await git.revparse(["--show-toplevel"]);
	return basename(toplevel.trim());
}

export async function getLocalBranches(git: SimpleGit): Promise<Branch[]> {
	const result = await git.branchLocal();
	// Artificial delay to test caching
	await delay(2000);
	return result.all.flatMap((name) => {
		const branch = result.branches[name];
		if (branch === undefined) {
			return [];
		}
		return {
			name: branch.name,
			commit: branch.commit,
			label: branch.label,
			current: branch.current,
		};
	});
}

function parseWorktrees(output: string): Worktree[] {
	return output
		.split("\n\n")
		.filter((block) => block.trim() !== "")
		.map((block) => {
			const lines = block.split("\n");
			const worktree: Worktree = {
				path: "",
				head: "",
				branch: null,
				bare: false,
				detached: false,
			};
			for (const line of lines) {
				if (line.startsWith("worktree ")) {
					worktree.path = line.slice("worktree ".length);
				} else if (line.startsWith("HEAD ")) {
					worktree.head = line.slice("HEAD ".length);
				} else if (line.startsWith("branch ")) {
					worktree.branch = line.slice("branch refs/heads/".length);
				} else if (line === "bare") {
					worktree.bare = true;
				} else if (line === "detached") {
					worktree.detached = true;
				}
			}
			return worktree;
		});
}

export async function getWorktrees(git: SimpleGit): Promise<Worktree[]> {
	const output = await git.raw("worktree", "list", "--porcelain");
	await delay(2000);
	return parseWorktrees(output);
}

export async function addWorktree(
	git: SimpleGit,
	path: string,
	base: string,
	branchName: string | null,
): Promise<void> {
	if (branchName) {
		await git.raw("worktree", "add", "-b", branchName, path, base);
	} else {
		await git.raw("worktree", "add", "--detach", path, base);
	}
}

export type EnsurePrWorktreeResult =
	| { status: "created"; path: string }
	| { status: "exists"; path: string }
	| { status: "checked-out"; path: string };

/**
 * Ensures a worktree exists for a given pull request.
 * - If a worktree at pr-NNNN already exists, returns it.
 * - If the branch is already checked out in another worktree, returns that path.
 * - If the branch exists locally, tries to fast-forward it from the PR head, then creates a worktree.
 * - Otherwise, fetches the PR head and creates a new branch + worktree.
 */
export async function ensurePrWorktree(
	git: SimpleGit,
	basePath: string,
	prNumber: number,
	branch: string,
): Promise<EnsurePrWorktreeResult> {
	const worktreePath = join(basePath, `pr-${prNumber}`);

	const worktrees = parseWorktrees(
		await git.raw("worktree", "list", "--porcelain"),
	);

	const existing = worktrees.find((w) => w.path === worktreePath);
	if (existing) return { status: "exists", path: worktreePath };

	const branchWorktree = worktrees.find((w) => w.branch === branch);
	if (branchWorktree)
		return { status: "checked-out", path: branchWorktree.path };

	let branchExists = false;
	try {
		await git.raw("rev-parse", "--verify", branch);
		branchExists = true;
	} catch {}

	await mkdir(basePath, { recursive: true });

	if (branchExists) {
		// Try to fast-forward the local branch from the PR head
		try {
			await git.fetch("origin", `pull/${prNumber}/head:${branch}`);
		} catch {
			// Not a fast-forward or fetch failed — use branch as-is
		}
		await git.raw("worktree", "add", worktreePath, branch);
	} else {
		// Fetch PR head and create a new local branch
		await git.fetch("origin", `pull/${prNumber}/head`);
		await git.raw("worktree", "add", "-b", branch, worktreePath, "FETCH_HEAD");
	}

	return { status: "created", path: worktreePath };
}

/**
 * Ensures a worktree exists for a local branch.
 * - If the branch is already checked out in a worktree, returns that path.
 * - Otherwise creates a new worktree from the branch.
 */
export async function ensureBranchWorktree(
	git: SimpleGit,
	basePath: string,
	branch: string,
): Promise<EnsurePrWorktreeResult> {
	const worktreePath = join(basePath, branch);
	const worktrees = parseWorktrees(
		await git.raw("worktree", "list", "--porcelain"),
	);

	const existing = worktrees.find((w) => w.path === worktreePath);
	if (existing) return { status: "exists", path: worktreePath };

	const branchWorktree = worktrees.find((w) => w.branch === branch);
	if (branchWorktree)
		return { status: "checked-out", path: branchWorktree.path };

	await mkdir(basePath, { recursive: true });
	await git.raw("worktree", "add", worktreePath, branch);

	return { status: "created", path: worktreePath };
}

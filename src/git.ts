import { basename } from "node:path";
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

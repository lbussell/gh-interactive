import simpleGit from "simple-git";

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

export async function getLocalBranches(
	_signal: AbortSignal,
): Promise<Branch[]> {
	const result = await simpleGit().branchLocal();
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
					worktree.branch = line.slice("branch ".length);
				} else if (line === "bare") {
					worktree.bare = true;
				} else if (line === "detached") {
					worktree.detached = true;
				}
			}
			return worktree;
		});
}

export async function getWorktrees(_signal: AbortSignal): Promise<Worktree[]> {
	const output = await simpleGit().raw("worktree", "list", "--porcelain");
	return parseWorktrees(output);
}

import simpleGit from "simple-git";

export async function getLocalBranches(
	_signal: AbortSignal,
): Promise<string[]> {
	const branches = await simpleGit().branchLocal();
	return branches.all;
}

export const getWorktrees = async (_signal: AbortSignal): Promise<string[]> => {
	const output = await simpleGit().raw("worktree", "list", "--porcelain");
	return output
		.split("\n")
		.filter((line) => line.startsWith("worktree "))
		.map((line) => line.slice("worktree ".length));
};

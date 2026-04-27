import simpleGit from "simple-git";

export async function getLocalBranches(_signal: AbortSignal) {
	const branches = await simpleGit().branchLocal();
	return branches.all;
}

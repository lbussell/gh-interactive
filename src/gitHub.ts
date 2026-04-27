import { Octokit } from "octokit";

export type PullRequest = {
	number: number;
	title: string;
	author: string;
	branch: string;
	baseBranch: string;
	sourceRemote: string | null;
	draft: boolean;
	updatedAt: string;
};

export type WorktreePullRequest = {
	number: number;
	title: string;
	state: "open" | "closed" | "merged";
	draft: boolean;
};

export type WorktreePullRequestMap = Record<string, WorktreePullRequest[]>;

export async function createOctokit(): Promise<Octokit> {
	const result = Bun.spawnSync(["gh", "auth", "token"]);
	const token = result.stdout.toString().trim();
	if (!token) {
		throw new Error(
			"Failed to get GitHub token. Make sure you are logged in with `gh auth login`.",
		);
	}
	return new Octokit({ auth: token });
}

export async function getRepoSlug(): Promise<{ owner: string; repo: string }> {
	const result = Bun.spawnSync(["gh", "repo", "view", "--json", "owner,name"]);
	const json = JSON.parse(result.stdout.toString().trim());
	return { owner: json.owner.login, repo: json.name };
}

export async function getPullRequests(
	octokit: Octokit,
	owner: string,
	repo: string,
): Promise<PullRequest[]> {
	const { data } = await octokit.rest.pulls.list({
		owner,
		repo,
		state: "open",
		sort: "updated",
		direction: "desc",
		per_page: 30,
	});

	return data.map((pr) => {
		const isFork = pr.head.repo?.full_name !== pr.base.repo?.full_name;
		return {
			number: pr.number,
			title: pr.title,
			author: pr.user?.login ?? "unknown",
			branch: pr.head.ref,
			baseBranch: pr.base.ref,
			sourceRemote: isFork ? (pr.head.repo?.owner.login ?? null) : null,
			draft: pr.draft ?? false,
			updatedAt: pr.updated_at,
		};
	});
}

export async function getWorktreePullRequests(
	octokit: Octokit,
	owner: string,
	repo: string,
): Promise<WorktreePullRequestMap> {
	const { data } = await octokit.rest.pulls.list({
		owner,
		repo,
		state: "all",
		sort: "updated",
		direction: "desc",
		per_page: 100,
	});

	const map: WorktreePullRequestMap = {};
	for (const pr of data) {
		const branch = pr.head.ref;
		const entry: WorktreePullRequest = {
			number: pr.number,
			title: pr.title,
			state: pr.merged_at
				? "merged"
				: pr.state === "closed"
					? "closed"
					: "open",
			draft: pr.draft ?? false,
		};
		if (map[branch]) {
			map[branch].push(entry);
		} else {
			map[branch] = [entry];
		}
	}
	return map;
}

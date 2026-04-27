import { join } from "node:path";
import { Spinner } from "@inkjs/ui";
import { Box, Text } from "ink";
import { useCallback } from "react";
import { useCacheDir } from "../context/cacheContext";
import { useGitHub } from "../context/gitHubContext";
import type { Worktree } from "../git";
import { getPullRequestsForBranch, type WorktreePullRequest } from "../gitHub";
import { useAsyncCached } from "../hooks";

type WorktreeViewProps = {
	worktree: Worktree;
	selected: boolean;
};

function PullRequestInfo({ branch }: { branch: string }) {
	const { octokit, owner, repo } = useGitHub();
	const cacheDir = useCacheDir();
	const cachePath = join(cacheDir, "worktree-prs", `${branch}.cache.json`);

	const fetchPRs = useCallback(
		() => getPullRequestsForBranch(octokit, owner, repo, branch),
		[octokit, owner, repo, branch],
	);
	const prs = useAsyncCached(fetchPRs, cachePath);

	if (prs.status === "loading") {
		return <Spinner label="" />;
	}

	if (prs.status === "error" || prs.data.length === 0) {
		return null;
	}

	return (
		<Text dimColor>
			{prs.data.map((pr) => formatPR(pr)).join(", ")}
			{prs.refreshing ? " …" : ""}
		</Text>
	);
}

function formatPR(pr: WorktreePullRequest): string {
	const state =
		pr.state === "merged"
			? "merged"
			: pr.state === "closed"
				? "closed"
				: pr.draft
					? "draft"
					: "open";
	return `#${pr.number} (${state})`;
}

export function WorktreeView({ worktree, selected }: WorktreeViewProps) {
	const color = selected ? "green" : undefined;
	const branch = worktree.branch?.replace("refs/heads/", "") ?? null;
	const status = worktree.bare
		? "bare"
		: worktree.detached
			? "detached"
			: branch;

	return (
		<Box flexDirection="column">
			<Text color={color}>
				{worktree.path}
				{status ? ` [${status}]` : ""}
			</Text>
			<Box gap={1}>
				<Text dimColor color={color}>
					{worktree.head.slice(0, 7)}
				</Text>
				{branch && <PullRequestInfo branch={branch} />}
			</Box>
		</Box>
	);
}

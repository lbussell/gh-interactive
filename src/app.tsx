import { join } from "node:path";
import { Box, useApp } from "ink";
import { useCallback, useMemo } from "react";
import { ShortcutFooter } from "./components/shortcutFooter";
import { TabContent, Tabs } from "./components/tabs";
import { useCacheDir } from "./context/cacheContext";
import { useGit } from "./context/gitContext";
import { useGitHub } from "./context/gitHubContext";
import { useShortcuts } from "./context/shortcutContext";
import { getLocalBranches, getWorktrees } from "./git";
import { getPullRequests } from "./gitHub";
import { useAsyncCached, useWorktreePullRequests } from "./hooks";
import { BranchesView } from "./views/branchesView";
import { PullRequestsView } from "./views/pullRequestsView";
import { WorktreesView } from "./views/worktreesView";

export const App = () => {
	const { exit } = useApp();
	const git = useGit();
	const { octokit, owner, repo } = useGitHub();
	const cacheDir = useCacheDir();

	const branchesCachePath = join(cacheDir, "branches.cache.json");
	const worktreesCachePath = join(cacheDir, "worktrees.cache.json");
	const pullRequestsCachePath = join(cacheDir, "pullRequests.cache.json");

	const fetchBranches = useCallback(() => getLocalBranches(git), [git]);
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const fetchPullRequests = useCallback(
		() => getPullRequests(octokit, owner, repo),
		[octokit, owner, repo],
	);
	const branches = useAsyncCached(fetchBranches, branchesCachePath);
	const worktrees = useAsyncCached(fetchWorktrees, worktreesCachePath);
	const pullRequests = useAsyncCached(fetchPullRequests, pullRequestsCachePath);

	const worktreeBranches = useMemo(() => {
		if (worktrees.status !== "done") return [];
		return worktrees.data
			.map((w) => w.branch)
			.filter((b): b is string => b !== null);
	}, [worktrees.status, worktrees.data]);

	const worktreePRs = useWorktreePullRequests(
		worktreeBranches,
		octokit,
		owner,
		repo,
		cacheDir,
	);

	useShortcuts([
		{ id: "quit", keys: ["q"], label: "q/ctrl+c quit", action: () => exit() },
	]);

	return (
		<Box flexDirection="column">
			<Tabs>
				<TabContent id="branches" label="Branches">
					<BranchesView branches={branches} />
				</TabContent>
				<TabContent id="worktrees" label="Worktrees">
					<WorktreesView worktrees={worktrees} worktreePRs={worktreePRs} />
				</TabContent>
				<TabContent id="pull-requests" label="Pull Requests">
					<PullRequestsView pullRequests={pullRequests} />
				</TabContent>
			</Tabs>
			<ShortcutFooter />
		</Box>
	);
};

import { Box, useApp } from "ink";
import { useCallback, useMemo, useState } from "react";
import { useAsyncCached } from "./cache";
import { ShortcutFooter } from "./components/shortcutFooter";
import { TabContent, Tabs } from "./components/tabs";
import { useCacheDir } from "./context/cacheContext";
import { useGit } from "./context/gitContext";
import { useGitHub } from "./context/gitHubContext";
import { useShortcuts } from "./context/shortcutContext";
import { getLocalBranches, getWorktrees } from "./git";
import { getPullRequests } from "./gitHub";
import { useWorktreePullRequests } from "./useWorktreePullRequests";
import { BranchesView } from "./views/branchesView";
import { PullRequestsView } from "./views/pullRequestsView";
import { WorktreesView } from "./views/worktreesView";

export const App = () => {
	const { exit } = useApp();
	const git = useGit();
	const { octokit, owner, repo } = useGitHub();
	const cacheDir = useCacheDir();
	const [activeTab, setActiveTab] = useState("branches");

	const fetchBranches = useCallback(() => getLocalBranches(git), [git]);
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const fetchPullRequests = useCallback(
		() => getPullRequests(octokit, owner, repo),
		[octokit, owner, repo],
	);
	const branches = useAsyncCached("branches", fetchBranches);
	const worktrees = useAsyncCached("worktrees", fetchWorktrees);
	const pullRequests = useAsyncCached("pullRequests", fetchPullRequests);

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
	);

	useShortcuts([
		{ id: "quit", keys: ["q"], label: "q quit", action: () => exit() },
	]);

	return (
		<Box flexDirection="column">
			<Tabs activeId={activeTab} onTabChange={setActiveTab} height={15}>
				<TabContent id="branches" label="Branches">
					<BranchesView
						branches={branches}
						onBranchDeleted={branches.refresh}
					/>
				</TabContent>
				<TabContent id="worktrees" label="Worktrees">
					<WorktreesView
						worktrees={worktrees}
						worktreePRs={worktreePRs}
						worktreeBasePath={cacheDir}
						onWorktreeCreated={worktrees.refresh}
						onWorktreeRemoved={(branchDeleted) => {
							worktrees.refresh();
							if (branchDeleted) branches.refresh();
						}}
					/>
				</TabContent>
				<TabContent id="pull-requests" label="Pull Requests">
					<PullRequestsView
						pullRequests={pullRequests}
						onWorktreeCreated={worktrees.refresh}
						onNavigateToWorktrees={() => setActiveTab("worktrees")}
					/>
				</TabContent>
			</Tabs>
			<ShortcutFooter />
		</Box>
	);
};

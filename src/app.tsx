import { join } from "node:path";
import { Box, useApp } from "ink";
import { useCallback } from "react";
import { ShortcutFooter } from "./components/shortcutFooter";
import { TabContent, Tabs } from "./components/tabs";
import { useCacheDir } from "./context/cacheContext";
import { useGit } from "./context/gitContext";
import { useShortcuts } from "./context/shortcutContext";
import { getLocalBranches, getWorktrees } from "./git";
import { useAsyncCached } from "./hooks";
import { BranchesView } from "./views/branchesView";
import { WorktreesView } from "./views/worktreesView";

export const App = () => {
	const { exit } = useApp();
	const git = useGit();
	const cacheDir = useCacheDir();

	const branchesCachePath = join(cacheDir, "branches.cache.json");
	const worktreesCachePath = join(cacheDir, "worktrees.cache.json");

	const fetchBranches = useCallback(() => getLocalBranches(git), [git]);
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const branches = useAsyncCached(fetchBranches, branchesCachePath);
	const worktrees = useAsyncCached(fetchWorktrees, worktreesCachePath);

	useShortcuts([
		{ id: "quit", keys: ["q"], label: "q quit", action: () => exit() },
	]);

	return (
		<Box flexDirection="column">
			<Tabs>
				<TabContent id="branches" label="Branches">
					<BranchesView branches={branches} />
				</TabContent>
				<TabContent id="worktrees" label="Worktrees">
					<WorktreesView worktrees={worktrees} />
				</TabContent>
			</Tabs>
			<ShortcutFooter />
		</Box>
	);
};

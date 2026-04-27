import { join } from "node:path";
import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp, useInput } from "ink";
import { useCallback } from "react";
import { ShortcutFooter } from "./components/shortcutFooter";
import { WorktreeView } from "./components/worktreeView";
import { useCacheDir } from "./context/cacheContext";
import { useConfig } from "./context/configContext";
import { useGit } from "./context/gitContext";
import { getWorktrees } from "./git";
import { useAsyncCached } from "./hooks";
import { BranchesView } from "./views/branchesView";

export const App = () => {
	const { exit } = useApp();
	const config = useConfig();
	const git = useGit();
	const cacheDir = useCacheDir();

	const worktreesCachePath = join(cacheDir, "worktrees.cache.json");
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const worktrees = useAsyncCached(fetchWorktrees, worktreesCachePath);

	useInput(
		(input, key) => {
			if (input === "q" || key.escape) {
				exit();
			}
		},
		{ isActive: worktrees.status !== "done" },
	);

	if (worktrees.status === "loading") {
		return <Spinner label="Loading..." />;
	}

	if (worktrees.status === "error") {
		const message =
			worktrees.error instanceof Error
				? worktrees.error.message
				: String(worktrees.error);
		return <Text>Error: {message}.</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text>Worktree directory: {config.worktreeDirectory}</Text>
			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>Worktrees:</Text>
				{worktrees.data.map((worktree) => (
					<WorktreeView
						key={worktree.path}
						worktree={worktree}
						selected={false}
					/>
				))}
			</Box>
			<BranchesView />
			<ShortcutFooter />
		</Box>
	);
};

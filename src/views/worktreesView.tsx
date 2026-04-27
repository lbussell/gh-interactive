import { join } from "node:path";
import { Spinner } from "@inkjs/ui";
import { Box, Text } from "ink";
import { useCallback } from "react";
import { WorktreeView } from "../components/worktreeView";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import { getWorktrees } from "../git";
import { useAsyncCached } from "../hooks";

export function WorktreesView() {
	const git = useGit();
	const cacheDir = useCacheDir();

	const worktreesCachePath = join(cacheDir, "worktrees.cache.json");
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const worktrees = useAsyncCached(fetchWorktrees, worktreesCachePath);

	if (worktrees.status === "loading") {
		return <Spinner label="Loading worktrees..." />;
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
			{worktrees.data.map((worktree) => (
				<WorktreeView
					key={worktree.path}
					worktree={worktree}
					selected={false}
				/>
			))}
			{worktrees.refreshing && <Spinner label="Refreshing..." />}
		</Box>
	);
}

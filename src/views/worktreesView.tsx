import { Spinner } from "@inkjs/ui";
import { Box, Text } from "ink";
import { WorktreeView } from "../components/worktreeView";
import type { Worktree } from "../git";
import type { CachedAsyncState } from "../hooks";

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
};

export function WorktreesView({ worktrees }: WorktreesViewProps) {
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

import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { Select } from "../components/select";
import { WorktreeView } from "../components/worktreeView";
import type { Worktree } from "../git";
import type { CachedAsyncState } from "../hooks";

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
};

export function WorktreesView({ worktrees }: WorktreesViewProps) {
	const { exit } = useApp();

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
		<>
			<Text dimColor>Choose a worktree.</Text>
			<Select
				items={worktrees.data}
				keyOf={(w) => w.path}
				maxVisible={5}
				renderItem={(worktree, selected) => (
					<WorktreeView worktree={worktree} selected={selected} />
				)}
				renderEmpty={() => <Text>No worktrees found.</Text>}
				onSelect={(worktree) => exit(worktree.path)}
			/>
			{worktrees.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

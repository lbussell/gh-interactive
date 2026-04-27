import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { Select } from "../components/select";
import { WorktreeView } from "../components/worktreeView";
import type { Worktree } from "../git";
import type { WorktreePullRequestMap } from "../gitHub";
import type { CachedAsyncState } from "../hooks";

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
	worktreePRs: CachedAsyncState<WorktreePullRequestMap>;
};

export function WorktreesView({ worktrees, worktreePRs }: WorktreesViewProps) {
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

	const prMap = worktreePRs.status === "done" ? worktreePRs.data : null;

	return (
		<>
			<Text dimColor>Choose a worktree.</Text>
			<Select
				items={worktrees.data}
				keyOf={(w) => w.path}
				maxVisible={5}
				renderItem={(worktree, selected) => {
					const branch = worktree.branch?.replace("refs/heads/", "") ?? null;
					const prs = branch && prMap ? (prMap[branch] ?? []) : null;
					return (
						<WorktreeView
							worktree={worktree}
							selected={selected}
							pullRequests={prs}
						/>
					);
				}}
				renderEmpty={() => <Text>No worktrees found.</Text>}
				onSelect={(worktree) => exit(worktree.path)}
			/>
			{worktrees.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

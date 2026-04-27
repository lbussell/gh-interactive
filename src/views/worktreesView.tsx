import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { Select } from "../components/select";
import { WorktreeView } from "../components/worktreeView";
import type { Worktree } from "../git";
import type { WorktreePullRequestMap } from "../gitHub";
import type { CachedAsyncState } from "../hooks";

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
	worktreePRs: WorktreePullRequestMap;
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

	return (
		<>
			<Select
				items={worktrees.data}
				keyOf={(w) => w.path}
				renderItem={(worktree, selected) => {
					const branch = worktree.branch;
					const prs = branch ? (worktreePRs[branch] ?? null) : null;
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

import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp } from "ink";
import { useState } from "react";
import type { CachedAsyncState } from "../cache";
import { CreateWorktreeForm } from "../components/createWorktreeForm";
import { RemoveWorktreeForm } from "../components/removeWorktreeForm";
import { Select } from "../components/select";
import { WorktreeView } from "../components/worktreeView";
import { useShortcuts } from "../context/shortcutContext";
import type { Worktree } from "../git";
import type { WorktreePullRequestMap } from "../gitHub";
import { formatError } from "../util";
import {
	copilotExitAction,
	openInEditor,
	shellExitAction,
} from "../worktreeActions";

type ModalState =
	| null
	| { type: "create" }
	| { type: "remove"; worktree: Worktree };

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
	worktreePRs: WorktreePullRequestMap;
	worktreeBasePath: string;
	focusKey?: string | null;
	onWorktreeCreated: () => void;
	onWorktreeRemoved: (branchDeleted: boolean) => void;
};

export function WorktreesView({
	worktrees,
	worktreePRs,
	worktreeBasePath,
	focusKey,
	onWorktreeCreated,
	onWorktreeRemoved,
}: WorktreesViewProps) {
	const { exit } = useApp();
	const [modal, setModal] = useState<ModalState>(null);

	useShortcuts(
		{
			n: { label: "new", action: () => setModal({ type: "create" }) },
		},
		modal === null,
	);

	if (worktrees.status === "loading") {
		return <Spinner label="Loading worktrees..." />;
	}

	if (worktrees.status === "error") {
		return <Text>Error: {formatError(worktrees.error)}.</Text>;
	}

	return (
		<>
			<Box display={modal ? "none" : "flex"} flexDirection="column">
				<Select
					items={worktrees.data}
					keyOf={(w) => w.path}
					focusKey={focusKey}
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
					onSelect={(worktree) => exit(shellExitAction(worktree.path))}
					itemShortcuts={{
						o: {
							label: "open",
							children: {
								e: {
									label: "code",
									action: (worktree) => openInEditor(worktree.path),
								},
								c: {
									label: "copilot",
									action: (worktree) => exit(copilotExitAction(worktree.path)),
								},
							},
						},
						d: {
							label: "remove",
							action: (worktree) => setModal({ type: "remove", worktree }),
						},
					}}
				/>
				{worktrees.refreshing && <Spinner label="Refreshing..." />}
			</Box>
			{modal?.type === "create" && (
				<CreateWorktreeForm
					worktreeBasePath={worktreeBasePath}
					onSuccess={() => {
						setModal(null);
						onWorktreeCreated();
					}}
					onCancel={() => setModal(null)}
				/>
			)}
			{modal?.type === "remove" && (
				<RemoveWorktreeForm
					worktree={modal.worktree}
					onSuccess={(branchDeleted) => {
						setModal(null);
						onWorktreeRemoved(branchDeleted);
					}}
					onCancel={() => setModal(null)}
				/>
			)}
		</>
	);
}

import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
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
	onWorktreeCreated: () => void;
	onWorktreeRemoved: (branchDeleted: boolean) => void;
};

export function WorktreesView({
	worktrees,
	worktreePRs,
	worktreeBasePath,
	onWorktreeCreated,
	onWorktreeRemoved,
}: WorktreesViewProps) {
	const { exit } = useApp();
	const [modal, setModal] = useState<ModalState>(null);

	useShortcuts(
		[
			{
				id: "create-worktree",
				keys: ["n"],
				label: "n new",
				action: () => setModal({ type: "create" }),
			},
		],
		modal === null,
	);

	if (modal?.type === "create") {
		return (
			<CreateWorktreeForm
				worktreeBasePath={worktreeBasePath}
				onSuccess={() => {
					setModal(null);
					onWorktreeCreated();
				}}
				onCancel={() => setModal(null)}
			/>
		);
	}

	if (modal?.type === "remove") {
		return (
			<RemoveWorktreeForm
				worktree={modal.worktree}
				onSuccess={(branchDeleted) => {
					setModal(null);
					onWorktreeRemoved(branchDeleted);
				}}
				onCancel={() => setModal(null)}
			/>
		);
	}

	if (worktrees.status === "loading") {
		return <Spinner label="Loading worktrees..." />;
	}

	if (worktrees.status === "error") {
		return <Text>Error: {formatError(worktrees.error)}.</Text>;
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
				onSelect={(worktree) => exit(shellExitAction(worktree.path))}
				itemShortcuts={[
					{
						id: "open-in-vscode",
						keys: ["o", "e"],
						label: "e code",
						action: (worktree) => openInEditor(worktree.path),
					},
					{
						id: "copilot",
						keys: ["o", "c"],
						label: "c copilot",
						action: (worktree) => exit(copilotExitAction(worktree.path)),
					},
					{
						id: "remove-worktree",
						keys: ["d"],
						label: "d remove",
						action: (worktree) => setModal({ type: "remove", worktree }),
					},
				]}
			/>
			{worktrees.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

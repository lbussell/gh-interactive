import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useState } from "react";
import { CreateWorktreeForm } from "../components/createWorktreeForm";
import { Select } from "../components/select";
import { WorktreeView } from "../components/worktreeView";
import { useShortcuts } from "../context/shortcutContext";
import type { ExitAction } from "../exitAction";
import type { Worktree } from "../git";
import type { WorktreePullRequestMap } from "../gitHub";
import type { CachedAsyncState } from "../hooks";

type WorktreesViewProps = {
	worktrees: CachedAsyncState<Worktree[]>;
	worktreePRs: WorktreePullRequestMap;
	worktreeBasePath: string;
	onWorktreeCreated: () => void;
};

export function WorktreesView({
	worktrees,
	worktreePRs,
	worktreeBasePath,
	onWorktreeCreated,
}: WorktreesViewProps) {
	const { exit } = useApp();
	const [modalOpen, setModalOpen] = useState(false);

	useShortcuts(
		[
			{
				id: "create-worktree",
				keys: ["n"],
				label: "n new",
				action: () => setModalOpen(true),
			},
		],
		!modalOpen,
	);

	if (modalOpen) {
		return (
			<CreateWorktreeForm
				worktreeBasePath={worktreeBasePath}
				onSuccess={() => {
					setModalOpen(false);
					onWorktreeCreated();
				}}
				onCancel={() => setModalOpen(false)}
			/>
		);
	}

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
				onSelect={(worktree) => {
					const shell = process.env.SHELL || "/bin/sh";
					exit({
						type: "exec",
						command: [shell],
						cwd: worktree.path,
					} satisfies ExitAction);
				}}
				itemShortcuts={[
					{
						id: "open-in-vscode",
						keys: ["o", "e"],
						label: "e [E]ditor",
						action: (worktree) => {
							Bun.spawn(["code", worktree.path], {
								stdout: "ignore",
								stderr: "ignore",
							});
						},
					},
					{
						id: "copilot",
						keys: ["o", "c"],
						label: "c [C]opilot",
						action: (worktree) => {
							exit({
								type: "exec",
								command: ["copilot"],
								cwd: worktree.path,
							} satisfies ExitAction);
						},
					},
				]}
			/>
			{worktrees.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

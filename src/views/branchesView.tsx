import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp } from "ink";
import { useCallback, useState } from "react";
import type { CachedAsyncState } from "../cache";
import { BranchView } from "../components/branchView";
import { ConfirmDialog } from "../components/confirmDialog";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import type { ExitAction } from "../exitAction";
import { type Branch, deleteBranch, ensureBranchWorktree } from "../git";
import { withStatus } from "../statusAction";
import { formatError } from "../util";
import { copilotExitAction, openInEditor } from "../worktreeActions";

type BranchesViewProps = {
	branches: CachedAsyncState<Branch[]>;
	onBranchDeleted: () => void;
};

function isUnmergedBranchError(err: unknown): boolean {
	return err instanceof Error && err.message.includes("not fully merged");
}

type DeleteState =
	| null
	| { step: "confirm"; branch: Branch }
	| { step: "confirm-force"; branch: Branch };

export function BranchesView({ branches, onBranchDeleted }: BranchesViewProps) {
	const { exit } = useApp();
	const git = useGit();
	const cacheDir = useCacheDir();
	const [status, setStatus] = useState<string | null>(null);
	const [deleteState, setDeleteState] = useState<DeleteState>(null);
	const [submitting, setSubmitting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const openInVSCode = useCallback(
		(branch: Branch) =>
			withStatus(
				setStatus,
				`Opening ${branch.name} in VS Code...`,
				async () => {
					const result = await ensureBranchWorktree(git, cacheDir, branch.name);
					openInEditor(result.path);
					return `Opened in VS Code: ${result.path}`;
				},
			),
		[git, cacheDir],
	);

	const startCopilot = useCallback(
		(branch: Branch) =>
			withStatus(setStatus, `Setting up worktree for Copilot...`, async () => {
				const result = await ensureBranchWorktree(git, cacheDir, branch.name);
				exit(copilotExitAction(result.path));
			}),
		[git, cacheDir, exit],
	);

	const checkoutBranch = useCallback(
		(branch: Branch) => {
			if (branch.current) {
				setStatus(`Already on ${branch.name}`);
				return;
			}
			return withStatus(
				setStatus,
				`Checking out ${branch.name}...`,
				async () => {
					await git.checkout(branch.name);
					exit({
						type: "print",
						value: `Switched to branch '${branch.name}'`,
					} satisfies ExitAction);
				},
			);
		},
		[git, exit],
	);

	const handleDelete = async () => {
		if (!deleteState) return;
		setSubmitting(true);
		setDeleteError(null);
		try {
			await deleteBranch(git, deleteState.branch.name);
			setDeleteState(null);
			onBranchDeleted();
		} catch (err) {
			if (isUnmergedBranchError(err)) {
				setDeleteState({ step: "confirm-force", branch: deleteState.branch });
				setSubmitting(false);
				return;
			}
			setDeleteError(formatError(err));
			setSubmitting(false);
		}
	};

	const handleForceDelete = async () => {
		if (!deleteState) return;
		setSubmitting(true);
		setDeleteError(null);
		try {
			await deleteBranch(git, deleteState.branch.name, true);
			setDeleteState(null);
			onBranchDeleted();
		} catch (err) {
			setDeleteError(formatError(err));
			setSubmitting(false);
		}
	};

	if (branches.status === "loading") {
		return <Spinner label="Loading branches..." />;
	}

	if (branches.status === "error") {
		return <Text>Error: {formatError(branches.error)}.</Text>;
	}

	return (
		<>
			<Box display={deleteState ? "none" : "flex"} flexDirection="column">
				<Select
					items={branches.data}
					keyOf={(b) => b.name}
					renderItem={(branch, selected) => (
						<BranchView branch={branch} selected={selected} />
					)}
					renderEmpty={() => <Text>No local git branches found.</Text>}
					onSelect={(branch) => {
						checkoutBranch(branch);
					}}
					itemShortcuts={[
						{
							id: "open-in-vscode",
							keys: ["o", "e"],
							label: "e code",
							action: (branch) => {
								openInVSCode(branch);
							},
						},
						{
							id: "copilot",
							keys: ["o", "c"],
							label: "c copilot",
							action: (branch) => {
								startCopilot(branch);
							},
						},
						{
							id: "delete-branch",
							keys: ["d"],
							label: "d delete",
							action: (branch) => setDeleteState({ step: "confirm", branch }),
						},
					]}
				/>
				{status && <Text>{status}</Text>}
				{branches.refreshing && <Spinner label="Refreshing..." />}
			</Box>
			{deleteState?.step === "confirm" && (
				<ConfirmDialog
					title="Delete Branch"
					onConfirm={handleDelete}
					onCancel={() => setDeleteState(null)}
					yesLabel="Yes, delete the branch"
					noLabel="No, keep the branch"
					color="red"
					submitting={submitting}
					error={deleteError}
				>
					<Text>Delete branch '{deleteState.branch.name}'?</Text>
				</ConfirmDialog>
			)}
			{deleteState?.step === "confirm-force" && (
				<ConfirmDialog
					title="Force Delete Branch?"
					onConfirm={handleForceDelete}
					onCancel={() => setDeleteState(null)}
					yesLabel="Yes, force delete"
					noLabel="No, keep the branch"
					color="red"
					submitting={submitting}
					error={deleteError}
				>
					<Text>
						Branch '{deleteState.branch.name}' is not fully merged (common with
						squash-merged PRs).
					</Text>
				</ConfirmDialog>
			)}
		</>
	);
}

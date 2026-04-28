import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { useGit } from "../context/gitContext";
import { deleteBranch, removeWorktree, type Worktree } from "../git";
import { formatError } from "../util";
import { ConfirmDialog } from "./confirmDialog";

type RemoveWorktreeFormProps = {
	worktree: Worktree;
	onSuccess: (branchDeleted: boolean) => void;
	onCancel: () => void;
};

function isUnmergedBranchError(err: unknown): boolean {
	return err instanceof Error && err.message.includes("not fully merged");
}

export function RemoveWorktreeForm({
	worktree,
	onSuccess,
	onCancel,
}: RemoveWorktreeFormProps) {
	const git = useGit();
	const [confirmForceDelete, setConfirmForceDelete] = useState(false);
	const [deleteBranchChecked, setDeleteBranchChecked] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useInput(
		(input) => {
			if (input === "b" && worktree.branch) {
				setDeleteBranchChecked((v) => !v);
			}
		},
		{ isActive: !submitting && !confirmForceDelete },
	);

	const handleConfirm = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await removeWorktree(git, worktree.path);

			if (deleteBranchChecked && worktree.branch) {
				try {
					await deleteBranch(git, worktree.branch);
				} catch (err) {
					if (isUnmergedBranchError(err)) {
						setConfirmForceDelete(true);
						setSubmitting(false);
						return;
					}
					throw err;
				}
			}

			onSuccess(deleteBranchChecked);
		} catch (err) {
			setError(formatError(err));
			setSubmitting(false);
		}
	};

	const handleForceDelete = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await deleteBranch(git, worktree.branch!, true);
			onSuccess(true);
		} catch (err) {
			setError(formatError(err));
			setSubmitting(false);
		}
	};

	if (confirmForceDelete) {
		return (
			<ConfirmDialog
				title="Force Delete Branch?"
				onConfirm={handleForceDelete}
				onCancel={() => onSuccess(false)}
				confirmLabel="force delete"
				cancelLabel="skip"
				submitting={submitting}
				error={error}
			>
				<Text>
					Branch '{worktree.branch}' is not fully merged (common with
					squash-merged PRs).
				</Text>
			</ConfirmDialog>
		);
	}

	return (
		<ConfirmDialog
			title="Remove Worktree"
			onConfirm={handleConfirm}
			onCancel={onCancel}
			confirmLabel="remove"
			submitting={submitting}
			error={error}
		>
			<Text>Remove worktree at {worktree.path}?</Text>
			{worktree.branch && (
				<Box gap={1} marginTop={1}>
					<Text>{deleteBranchChecked ? "[✓]" : "[ ]"}</Text>
					<Text>Also delete branch '{worktree.branch}'</Text>
					<Text dimColor>(b)</Text>
				</Box>
			)}
		</ConfirmDialog>
	);
}

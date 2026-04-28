import { Text } from "ink";
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

type Step =
	| { type: "confirm-remove" }
	| { type: "confirm-delete-branch" }
	| { type: "confirm-force-delete" };

export function RemoveWorktreeForm({
	worktree,
	onSuccess,
	onCancel,
}: RemoveWorktreeFormProps) {
	const git = useGit();
	const [step, setStep] = useState<Step>({ type: "confirm-remove" });
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRemove = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await removeWorktree(git, worktree.path);
			if (worktree.branch) {
				setStep({ type: "confirm-delete-branch" });
				setSubmitting(false);
			} else {
				onSuccess(false);
			}
		} catch (err) {
			setError(formatError(err));
			setSubmitting(false);
		}
	};

	const handleDeleteBranch = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await deleteBranch(git, worktree.branch!);
			onSuccess(true);
		} catch (err) {
			if (isUnmergedBranchError(err)) {
				setStep({ type: "confirm-force-delete" });
				setSubmitting(false);
				return;
			}
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

	if (step.type === "confirm-force-delete") {
		return (
			<ConfirmDialog
				title="Force Delete Branch?"
				onConfirm={handleForceDelete}
				onCancel={() => onSuccess(false)}
				yesLabel="Yes, force delete"
				noLabel="No, keep the branch"
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

	if (step.type === "confirm-delete-branch") {
		return (
			<ConfirmDialog
				title="Delete Branch?"
				onConfirm={handleDeleteBranch}
				onCancel={() => onSuccess(false)}
				yesLabel="Yes, delete the branch"
				noLabel="No, keep the branch"
				submitting={submitting}
				error={error}
			>
				<Text>Also delete branch '{worktree.branch}'?</Text>
			</ConfirmDialog>
		);
	}

	return (
		<ConfirmDialog
			title="Remove Worktree"
			onConfirm={handleRemove}
			onCancel={onCancel}
			yesLabel="Yes, remove"
			noLabel="No, do not remove"
			submitting={submitting}
			error={error}
		>
			<Text>Remove worktree at {worktree.path}?</Text>
		</ConfirmDialog>
	);
}

import { Text } from "ink";
import { useState } from "react";
import { useGit } from "../context/gitContext";
import { deleteBranch, removeWorktree, type Worktree } from "../git";
import { formatError } from "../util";
import { Form, type FormField } from "./form";
import { Modal } from "./modal";

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
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
			<Modal
				title="Force Delete Branch?"
				onClose={() => onSuccess(false)}
				closeable={!submitting}
			>
				<Text>
					Branch '{worktree.branch}' is not fully merged (common with
					squash-merged PRs).
				</Text>
				<Form
					fields={[]}
					onSubmit={handleForceDelete}
					onCancel={() => onSuccess(false)}
					submitLabel="Force Delete"
					error={error}
					submitting={submitting}
				/>
			</Modal>
		);
	}

	const fields: FormField[] = worktree.branch
		? [
				{
					type: "checkbox",
					id: "deleteBranch",
					label: `Also delete branch '${worktree.branch}'`,
					defaultValue: false,
				},
			]
		: [];

	const handleSubmit = async (values: Record<string, string | boolean>) => {
		setSubmitting(true);
		setError(null);
		const shouldDeleteBranch =
			worktree.branch !== null && (values.deleteBranch as boolean);

		try {
			await removeWorktree(git, worktree.path);

			if (shouldDeleteBranch && worktree.branch) {
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

			onSuccess(shouldDeleteBranch);
		} catch (err) {
			setError(formatError(err));
			setSubmitting(false);
		}
	};

	return (
		<Modal title="Remove Worktree" onClose={onCancel} closeable={!submitting}>
			<Form
				fields={fields}
				onSubmit={handleSubmit}
				onCancel={onCancel}
				submitLabel="Remove"
				error={error}
				submitting={submitting}
			/>
		</Modal>
	);
}

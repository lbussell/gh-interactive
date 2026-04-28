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

export function RemoveWorktreeForm({
	worktree,
	onSuccess,
	onCancel,
}: RemoveWorktreeFormProps) {
	const git = useGit();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
				await deleteBranch(git, worktree.branch);
			}

			onSuccess(shouldDeleteBranch);
		} catch (err) {
			setError(formatError(err));
		} finally {
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

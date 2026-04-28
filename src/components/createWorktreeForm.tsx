import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { useState } from "react";
import { useGit } from "../context/gitContext";
import { addWorktree } from "../git";
import { Form, type FormField } from "./form";
import { Modal } from "./modal";

type CreateWorktreeFormProps = {
	worktreeBasePath: string;
	onSuccess: () => void;
	onCancel: () => void;
};

const fields: FormField[] = [
	{
		type: "text",
		id: "base",
		label: "Base",
		placeholder: "upstream/main",
	},
	{
		type: "text",
		id: "name",
		label: "Name",
		placeholder: "my-feature",
	},
	{
		type: "checkbox",
		id: "createBranch",
		label: "Create branch",
		defaultValue: true,
	},
];

function isValidWorktreeName(name: string): boolean {
	if (name.includes("..") || name.startsWith("/") || name.includes("\\")) {
		return false;
	}
	return true;
}

export function CreateWorktreeForm({
	worktreeBasePath,
	onSuccess,
	onCancel,
}: CreateWorktreeFormProps) {
	const git = useGit();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (values: Record<string, string | boolean>) => {
		const base = (values.base as string).trim();
		const name = (values.name as string).trim();
		const createBranch = values.createBranch as boolean;

		if (!base || !name) {
			setError("Base and Name are required.");
			return;
		}

		if (!isValidWorktreeName(name)) {
			setError("Name must not contain '..' or absolute paths.");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const worktreePath = join(worktreeBasePath, name);
			await mkdir(worktreeBasePath, { recursive: true });
			const branchName = createBranch ? name : null;
			await addWorktree(git, worktreePath, base, branchName);
			onSuccess();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal title="Create Worktree" onClose={onCancel} closeable={!submitting}>
			<Form
				fields={fields}
				onSubmit={handleSubmit}
				onCancel={onCancel}
				submitLabel="Create"
				error={error}
				submitting={submitting}
			/>
		</Modal>
	);
}

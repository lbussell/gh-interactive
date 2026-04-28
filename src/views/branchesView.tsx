import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useCallback, useState } from "react";
import { BranchView } from "../components/branchView";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import type { ExitAction } from "../exitAction";
import { type Branch, ensureBranchWorktree } from "../git";
import type { CachedAsyncState } from "../hooks";

type BranchesViewProps = {
	branches: CachedAsyncState<Branch[]>;
};

export function BranchesView({ branches }: BranchesViewProps) {
	const { exit } = useApp();
	const git = useGit();
	const cacheDir = useCacheDir();
	const [status, setStatus] = useState<string | null>(null);

	const openInVSCode = useCallback(
		async (branch: Branch) => {
			setStatus(`Opening ${branch.name} in VS Code...`);
			try {
				const result = await ensureBranchWorktree(git, cacheDir, branch.name);
				Bun.spawn(["code", result.path], {
					stdout: "ignore",
					stderr: "ignore",
				});
				setStatus(`Opened in VS Code: ${result.path}`);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, cacheDir],
	);

	const startCopilot = useCallback(
		async (branch: Branch) => {
			setStatus(`Setting up worktree for Copilot...`);
			try {
				const result = await ensureBranchWorktree(git, cacheDir, branch.name);
				exit({
					type: "exec",
					command: ["copilot"],
					cwd: result.path,
				} satisfies ExitAction);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, cacheDir, exit],
	);

	const checkoutBranch = useCallback(
		async (branch: Branch) => {
			if (branch.current) {
				setStatus(`Already on ${branch.name}`);
				return;
			}
			setStatus(`Checking out ${branch.name}...`);
			try {
				await git.checkout(branch.name);
				exit({
					type: "print",
					value: `Switched to branch '${branch.name}'`,
				} satisfies ExitAction);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, exit],
	);

	if (branches.status === "loading") {
		return <Spinner label="Loading branches..." />;
	}

	if (branches.status === "error") {
		const message =
			branches.error instanceof Error
				? branches.error.message
				: String(branches.error);
		return <Text>Error: {message}.</Text>;
	}

	return (
		<>
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
						label: "e editor",
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
				]}
			/>
			{status && <Text>{status}</Text>}
			{branches.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

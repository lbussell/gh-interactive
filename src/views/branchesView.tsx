import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useCallback, useState } from "react";
import type { CachedAsyncState } from "../cache";
import { BranchView } from "../components/branchView";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import type { ExitAction } from "../exitAction";
import { type Branch, ensureBranchWorktree } from "../git";
import { withStatus } from "../statusAction";
import { formatError } from "../util";
import { copilotExitAction, openInEditor } from "../worktreeActions";

type BranchesViewProps = {
	branches: CachedAsyncState<Branch[]>;
};

export function BranchesView({ branches }: BranchesViewProps) {
	const { exit } = useApp();
	const git = useGit();
	const cacheDir = useCacheDir();
	const [status, setStatus] = useState<string | null>(null);

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

	if (branches.status === "loading") {
		return <Spinner label="Loading branches..." />;
	}

	if (branches.status === "error") {
		return <Text>Error: {formatError(branches.error)}.</Text>;
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
				]}
			/>
			{status && <Text>{status}</Text>}
			{branches.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

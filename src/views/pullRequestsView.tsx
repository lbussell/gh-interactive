import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useCallback, useState } from "react";
import type { CachedAsyncState } from "../cache";
import { ConfirmDialog } from "../components/confirmDialog";
import { PullRequestView } from "../components/pullRequestView";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import { useGitHub } from "../context/gitHubContext";
import type { EnsurePrWorktreeResult } from "../git";
import type { PullRequest } from "../gitHub";
import { withStatus } from "../statusAction";
import { formatError } from "../util";
import {
	copilotExitAction,
	ensurePrWorktreeWithRemote,
	openInEditor,
	openPrInBrowser,
} from "../worktreeActions";

type PullRequestsViewProps = {
	pullRequests: CachedAsyncState<PullRequest[]>;
	onNavigateToWorktrees: () => void;
};

function worktreeResultMessage(result: EnsurePrWorktreeResult): string {
	switch (result.status) {
		case "created":
			return `Created worktree at ${result.path}.`;
		case "exists":
			return `Worktree already exists at ${result.path}.`;
		case "checked-out":
			return `Branch already checked out at ${result.path}.`;
	}
}

export function PullRequestsView({
	pullRequests,
	onNavigateToWorktrees,
}: PullRequestsViewProps) {
	const { exit } = useApp();
	const git = useGit();
	const { owner, repo } = useGitHub();
	const cacheDir = useCacheDir();
	const [status, setStatus] = useState<string | null>(null);
	const [worktreePrompt, setWorktreePrompt] = useState<string | null>(null);

	const createWorktree = useCallback(
		async (pr: PullRequest) => {
			setStatus(`Creating worktree for PR #${pr.number}...`);
			try {
				const result = await ensurePrWorktreeWithRemote(
					git,
					cacheDir,
					owner,
					repo,
					pr.number,
					pr.branch,
				);
				setStatus(null);
				setWorktreePrompt(worktreeResultMessage(result));
			} catch (err) {
				setStatus(`Error: ${formatError(err)}`);
			}
		},
		[git, cacheDir, owner, repo],
	);

	const openInVSCode = useCallback(
		(pr: PullRequest) =>
			withStatus(
				setStatus,
				`Opening PR #${pr.number} in VS Code...`,
				async () => {
					const result = await ensurePrWorktreeWithRemote(
						git,
						cacheDir,
						owner,
						repo,
						pr.number,
						pr.branch,
					);
					openInEditor(result.path);
					return `Opened in VS Code: ${result.path}`;
				},
			),
		[git, cacheDir, owner, repo],
	);

	const startCopilot = useCallback(
		(pr: PullRequest) =>
			withStatus(setStatus, `Setting up worktree for Copilot...`, async () => {
				const result = await ensurePrWorktreeWithRemote(
					git,
					cacheDir,
					owner,
					repo,
					pr.number,
					pr.branch,
				);
				exit(copilotExitAction(result.path));
			}),
		[git, cacheDir, owner, repo, exit],
	);

	if (worktreePrompt) {
		return (
			<ConfirmDialog
				title="Worktree Ready"
				onConfirm={() => {
					setWorktreePrompt(null);
					onNavigateToWorktrees();
				}}
				onCancel={() => setWorktreePrompt(null)}
				yesLabel="Yes, go to worktrees"
				noLabel="No, stay here"
			>
				<Text>{worktreePrompt} Go there now?</Text>
			</ConfirmDialog>
		);
	}

	if (pullRequests.status === "loading") {
		return <Spinner label="Loading pull requests..." />;
	}

	if (pullRequests.status === "error") {
		return <Text>Error: {formatError(pullRequests.error)}.</Text>;
	}

	return (
		<>
			<Select
				items={pullRequests.data}
				keyOf={(pr) => String(pr.number)}
				renderItem={(pr, selected) => (
					<PullRequestView pullRequest={pr} selected={selected} />
				)}
				renderEmpty={() => <Text>No open pull requests found.</Text>}
				onSelect={() => {}}
				itemShortcuts={[
					{
						id: "open-in-browser",
						keys: ["o", "b"],
						label: "b browser",
						action: (pr) => openPrInBrowser(pr.number),
					},
					{
						id: "create-worktree",
						keys: ["w"],
						label: "w worktree",
						action: (pr) => {
							createWorktree(pr);
						},
					},
					{
						id: "open-in-vscode",
						keys: ["o", "e"],
						label: "e code",
						action: (pr) => {
							openInVSCode(pr);
						},
					},
					{
						id: "copilot",
						keys: ["o", "c"],
						label: "c copilot",
						action: (pr) => {
							startCopilot(pr);
						},
					},
				]}
			/>
			{status && <Text>{status}</Text>}
			{pullRequests.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

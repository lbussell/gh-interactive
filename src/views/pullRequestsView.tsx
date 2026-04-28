import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useCallback, useState } from "react";
import type { CachedAsyncState } from "../cache";
import { PullRequestView } from "../components/pullRequestView";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import { useGitHub } from "../context/gitHubContext";
import type { EnsurePrWorktreeResult } from "../git";
import type { PullRequest } from "../gitHub";
import {
	copilotExitAction,
	ensurePrWorktreeWithRemote,
	openInEditor,
	openPrInBrowser,
} from "../worktreeActions";

type PullRequestsViewProps = {
	pullRequests: CachedAsyncState<PullRequest[]>;
};

function worktreeResultMessage(result: EnsurePrWorktreeResult): string {
	switch (result.status) {
		case "created":
			return `Worktree created: ${result.path}`;
		case "exists":
			return `Worktree already exists: ${result.path}`;
		case "checked-out":
			return `Branch already checked out: ${result.path}`;
	}
}

export function PullRequestsView({ pullRequests }: PullRequestsViewProps) {
	const { exit } = useApp();
	const git = useGit();
	const { owner, repo } = useGitHub();
	const cacheDir = useCacheDir();
	const [status, setStatus] = useState<string | null>(null);

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
				setStatus(worktreeResultMessage(result));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, cacheDir, owner, repo],
	);

	const openInVSCode = useCallback(
		async (pr: PullRequest) => {
			setStatus(`Opening PR #${pr.number} in VS Code...`);
			try {
				const result = await ensurePrWorktreeWithRemote(
					git,
					cacheDir,
					owner,
					repo,
					pr.number,
					pr.branch,
				);
				openInEditor(result.path);
				setStatus(`Opened in VS Code: ${result.path}`);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, cacheDir, owner, repo],
	);

	const startCopilot = useCallback(
		async (pr: PullRequest) => {
			setStatus(`Setting up worktree for Copilot...`);
			try {
				const result = await ensurePrWorktreeWithRemote(
					git,
					cacheDir,
					owner,
					repo,
					pr.number,
					pr.branch,
				);
				exit(copilotExitAction(result.path));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				setStatus(`Error: ${msg}`);
			}
		},
		[git, cacheDir, owner, repo, exit],
	);

	if (pullRequests.status === "loading") {
		return <Spinner label="Loading pull requests..." />;
	}

	if (pullRequests.status === "error") {
		const message =
			pullRequests.error instanceof Error
				? pullRequests.error.message
				: String(pullRequests.error);
		return <Text>Error: {message}.</Text>;
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

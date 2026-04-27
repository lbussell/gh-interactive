import { Spinner } from "@inkjs/ui";
import { Box, Text } from "ink";
import type { Worktree } from "../git";
import type { WorktreePullRequest } from "../gitHub";

type WorktreeViewProps = {
	worktree: Worktree;
	selected: boolean;
	pullRequests: WorktreePullRequest[] | null;
};

function formatPR(pr: WorktreePullRequest): string {
	const state =
		pr.state === "merged"
			? "merged"
			: pr.state === "closed"
				? "closed"
				: pr.draft
					? "draft"
					: "open";
	return `#${pr.number} (${state})`;
}

export function WorktreeView({
	worktree,
	selected,
	pullRequests,
}: WorktreeViewProps) {
	const color = selected ? "green" : undefined;
	const branch = worktree.branch;
	const status = worktree.bare
		? "bare"
		: worktree.detached
			? "detached"
			: branch;

	return (
		<Box flexDirection="column">
			<Text color={color}>
				{worktree.path}
				{status ? ` [${status}]` : ""}
			</Text>
			<Box gap={1}>
				<Text dimColor color={color}>
					{worktree.head.slice(0, 7)}
				</Text>
				{pullRequests === null && branch && <Spinner label="" />}
				{pullRequests && pullRequests.length > 0 && (
					<Text dimColor>{pullRequests.map(formatPR).join(", ")}</Text>
				)}
			</Box>
		</Box>
	);
}

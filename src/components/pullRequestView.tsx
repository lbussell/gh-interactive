import { Box, Text } from "ink";
import type { PullRequest } from "../gitHub";

type PullRequestViewProps = {
	pullRequest: PullRequest;
	selected: boolean;
};

export function PullRequestView({
	pullRequest,
	selected,
}: PullRequestViewProps) {
	const color = selected ? "green" : undefined;
	const source = pullRequest.sourceRemote
		? `${pullRequest.sourceRemote}:${pullRequest.branch}`
		: pullRequest.branch;

	return (
		<Box flexDirection="column">
			<Text color={color} wrap="truncate">
				#{pullRequest.number} {pullRequest.title}
				{pullRequest.draft ? " (draft)" : ""}
				<Text dimColor> by {pullRequest.author}</Text>
			</Text>
			<Text dimColor color={color} wrap="truncate">
				{pullRequest.baseBranch} ← {source}
			</Text>
		</Box>
	);
}

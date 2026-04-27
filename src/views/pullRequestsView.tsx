import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { PullRequestView } from "../components/pullRequestView";
import { Select } from "../components/select";
import type { PullRequest } from "../gitHub";
import type { CachedAsyncState } from "../hooks";

type PullRequestsViewProps = {
	pullRequests: CachedAsyncState<PullRequest[]>;
};

export function PullRequestsView({ pullRequests }: PullRequestsViewProps) {
	const { exit } = useApp();

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
			<Text dimColor>Choose a pull request.</Text>
			<Select
				items={pullRequests.data}
				keyOf={(pr) => String(pr.number)}
				maxVisible={5}
				renderItem={(pr, selected) => (
					<PullRequestView pullRequest={pr} selected={selected} />
				)}
				renderEmpty={() => <Text>No open pull requests found.</Text>}
				onSelect={(pr) => exit(String(pr.number))}
			/>
			{pullRequests.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

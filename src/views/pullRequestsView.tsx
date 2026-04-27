import { Spinner } from "@inkjs/ui";
import { Text } from "ink";
import { PullRequestView } from "../components/pullRequestView";
import { Select } from "../components/select";
import type { PullRequest } from "../gitHub";
import type { CachedAsyncState } from "../hooks";

type PullRequestsViewProps = {
	pullRequests: CachedAsyncState<PullRequest[]>;
	onSelect: (pr: PullRequest) => void;
};

export function PullRequestsView({
	pullRequests,
	onSelect,
}: PullRequestsViewProps) {
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
				onSelect={onSelect}
				itemShortcuts={[
					{
						id: "open-in-browser",
						keys: ["o"],
						label: "o open",
						action: (pr) => {
							Bun.spawn(["gh", "pr", "view", "--web", String(pr.number)], {
								stdout: "ignore",
								stderr: "ignore",
							});
						},
					},
				]}
			/>
			{pullRequests.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

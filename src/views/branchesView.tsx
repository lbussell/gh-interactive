import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { BranchView } from "../components/branchView";
import { Select } from "../components/select";
import type { Branch } from "../git";
import type { CachedAsyncState } from "../hooks";

type BranchesViewProps = {
	branches: CachedAsyncState<Branch[]>;
};

export function BranchesView({ branches }: BranchesViewProps) {
	const { exit } = useApp();

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
				maxVisible={5}
				renderItem={(branch, selected) => (
					<BranchView branch={branch} selected={selected} />
				)}
				renderEmpty={() => <Text>No local git branches found.</Text>}
				onSelect={(branch) => exit(branch.name)}
			/>
			{branches.refreshing && <Spinner label="Refreshing..." />}
		</>
	);
}

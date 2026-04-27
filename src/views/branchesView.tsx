import { join } from "node:path";
import { Spinner } from "@inkjs/ui";
import { Text, useApp } from "ink";
import { useCallback } from "react";
import { BranchView } from "../components/branchView";
import { Select } from "../components/select";
import { useCacheDir } from "../context/cacheContext";
import { useGit } from "../context/gitContext";
import { getLocalBranches } from "../git";
import { useAsyncCached } from "../hooks";

export function BranchesView() {
	const { exit } = useApp();
	const git = useGit();
	const cacheDir = useCacheDir();

	const branchesCachePath = join(cacheDir, "branches.cache.json");
	const fetchBranches = useCallback(() => getLocalBranches(git), [git]);
	const branches = useAsyncCached(fetchBranches, branchesCachePath);

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
			<Text dimColor>Choose a branch.</Text>
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

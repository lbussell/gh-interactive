import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp, useInput } from "ink";
import { useCallback } from "react";
import { BranchView } from "./components/branchView";
import { Select } from "./components/select";
import { useConfig } from "./context/configContext";
import { useGit } from "./context/gitContext";
import { getLocalBranches, getWorktrees } from "./git";
import { useAsync } from "./hooks";

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

export const App = () => {
	const { exit } = useApp();
	const config = useConfig();
	const git = useGit();

	// useAsync re-runs its effect when the function identity changes,
	// so useCallback keeps these stable across renders to avoid infinite loops.
	const fetchBranches = useCallback(() => getLocalBranches(git), [git]);
	const fetchWorktrees = useCallback(() => getWorktrees(git), [git]);
	const branches = useAsync(fetchBranches);
	const worktrees = useAsync(fetchWorktrees);

	useInput(
		(input, key) => {
			if (input === "q" || key.escape) {
				exit();
			}
		},
		{ isActive: branches.status !== "done" },
	);

	if (branches.status === "loading" || worktrees.status === "loading") {
		return <Spinner label="Loading..." />;
	}

	if (branches.status === "error") {
		return <Text>Error: {getErrorMessage(branches.error)}.</Text>;
	}

	if (worktrees.status === "error") {
		return <Text>Error: {getErrorMessage(worktrees.error)}.</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text>Worktree directory: {config.worktreeDirectory}</Text>
			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>Worktrees:</Text>
				{worktrees.data.map((worktree) => (
					<Text key={worktree.path}>
						{" "}
						{worktree.path} ({worktree.branch ?? "detached"})
					</Text>
				))}
			</Box>
			<Text dimColor>Choose a branch.</Text>
			<Select
				items={branches.data}
				keyOf={(b) => b.name}
				renderItem={(branch, selected) => (
					<BranchView branch={branch} selected={selected} />
				)}
				renderEmpty={() => <Text>No local git branches found.</Text>}
				onSelect={(branch) => exit(branch.name)}
				onCancel={() => exit()}
			/>
		</Box>
	);
};

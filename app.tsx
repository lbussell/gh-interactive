import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp, useInput } from "ink";
import { useConfig } from "./config-context";
import { getLocalBranches, getWorktrees } from "./git";
import { useAsync } from "./hooks";
import { Select } from "./select";

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

export const App = () => {
	const { exit } = useApp();
	const config = useConfig();
	const branches = useAsync(getLocalBranches);
	const worktrees = useAsync(getWorktrees);

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
			<Select
				items={branches.data.map((b) => b.name)}
				label="Choose a branch."
				emptyMessage="No local git branches found."
				onSelect={(branch) => exit(branch)}
				onCancel={() => exit()}
			/>
		</Box>
	);
};

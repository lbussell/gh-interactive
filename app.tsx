import { Spinner } from "@inkjs/ui";
import { Box, Text, useApp, useInput } from "ink";
import { getLocalBranches } from "./branches";
import { useConfig } from "./config-context";
import { useAsync } from "./hooks";
import { Select } from "./select";

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

export const App = () => {
	const { exit } = useApp();
	const config = useConfig();
	const branches = useAsync(getLocalBranches);

	useInput(
		(input, key) => {
			if (input === "q" || key.escape) {
				exit();
			}
		},
		{ isActive: branches.status !== "done" },
	);

	if (branches.status === "loading") {
		return <Spinner label="Loading branches" />;
	}

	if (branches.status === "error") {
		return <Text>Error: {getErrorMessage(branches.error)}.</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text>Worktree directory: {config.worktreeDirectory}</Text>
			<Select
				items={branches.data}
				label="Choose a branch."
				emptyMessage="No local git branches found."
				onSelect={(branch) => exit(branch)}
				onCancel={() => exit()}
			/>
		</Box>
	);
};

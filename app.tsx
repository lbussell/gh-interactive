import { Spinner } from "@inkjs/ui";
import { Text, useApp, useInput } from "ink";
import { getBranches } from "./branches";
import { useAsync } from "./hooks";
import { Select } from "./select";

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

export const App = () => {
	const { exit } = useApp();
	const branches = useAsync(getBranches);

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
		return (
			<Text>
				Error: {getErrorMessage(branches.error)}.
			</Text>
		);
	}

	return (
		<Select
			items={branches.data}
			label="Choose a branch."
			emptyMessage="No local git branches found."
			onSelect={(branch) => exit(branch)}
			onCancel={() => exit()}
		/>
	);
};

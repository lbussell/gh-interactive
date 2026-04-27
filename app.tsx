import { Spinner } from "@inkjs/ui";
import { Text, useApp, useInput } from "ink";
import { getBranches } from "./branches";
import { useAsync } from "./hooks";
import { Select } from "./select";

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
		const message =
			branches.error instanceof Error
				? branches.error.message
				: String(branches.error);

		return (
			<Text>
				Error: {message}. Press q or Esc to exit.
			</Text>
		);
	}

	return (
		<Select
			items={branches.data}
			label="Choose a branch with Up/Down, Enter to select, q/Esc to exit."
			emptyMessage="No local git branches found. Press q or Esc to exit."
			onSelect={(branch) => exit(branch)}
			onCancel={() => exit()}
		/>
	);
};

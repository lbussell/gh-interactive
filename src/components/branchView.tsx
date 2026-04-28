import { Box, Text } from "ink";
import type { Branch } from "../git";

type BranchViewProps = {
	branch: Branch;
	selected: boolean;
};

export function BranchView({ branch, selected }: BranchViewProps) {
	const color = selected ? "green" : undefined;

	return (
		<Box flexDirection="column">
			<Text color={color} wrap="truncate">
				{branch.current ? "* " : ""}
				{branch.name}
			</Text>
			<Text dimColor color={color} wrap="truncate">
				{branch.commit} {branch.label}
			</Text>
		</Box>
	);
}

import { Box, Text } from "ink";
import type { Worktree } from "../git";

type WorktreeViewProps = {
	worktree: Worktree;
	selected: boolean;
};

export function WorktreeView({ worktree, selected }: WorktreeViewProps) {
	const color = selected ? "green" : undefined;
	const branch = worktree.branch?.replace("refs/heads/", "") ?? null;
	const status = worktree.bare
		? "bare"
		: worktree.detached
			? "detached"
			: branch;

	return (
		<Box flexDirection="column">
			<Text color={color}>
				{worktree.path}
				{status ? ` [${status}]` : ""}
			</Text>
			<Text dimColor color={color}>
				{worktree.head.slice(0, 7)}
			</Text>
		</Box>
	);
}

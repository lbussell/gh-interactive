import { Box, useApp } from "ink";
import { ShortcutFooter } from "./components/shortcutFooter";
import { Tabs } from "./components/tabs";
import { useShortcut } from "./context/shortcutContext";
import { BranchesView } from "./views/branchesView";
import { WorktreesView } from "./views/worktreesView";

export const App = () => {
	const { exit } = useApp();

	useShortcut({ id: "quit", keys: ["q"], label: "quit", action: () => exit() });

	return (
		<Box flexDirection="column">
			<Tabs
				tabs={[
					{ id: "branches", label: "Branches", content: <BranchesView /> },
					{ id: "worktrees", label: "Worktrees", content: <WorktreesView /> },
				]}
			/>
			<ShortcutFooter />
		</Box>
	);
};

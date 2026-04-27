import { Box } from "ink";
import { type ReactNode, useCallback, useState } from "react";
import { useShortcut } from "../context/shortcutContext";
import { TabBar } from "./tabBar";

type TabDefinition = {
	id: string;
	label: string;
	content: ReactNode;
};

type TabsProps = {
	tabs: TabDefinition[];
};

export function Tabs({ tabs }: TabsProps) {
	const [activeIndex, setActiveIndex] = useState(0);

	const prevTab = useCallback(
		() => setActiveIndex((i) => (i === 0 ? tabs.length - 1 : i - 1)),
		[tabs.length],
	);
	const nextTab = useCallback(
		() => setActiveIndex((i) => (i === tabs.length - 1 ? 0 : i + 1)),
		[tabs.length],
	);

	useShortcut({ id: "tab-prev-arrow", keys: ["<left>"], action: prevTab });
	useShortcut({ id: "tab-prev-h", keys: ["h"], action: prevTab });
	useShortcut({ id: "tab-next-arrow", keys: ["<right>"], action: nextTab });
	useShortcut({
		id: "tab-next-l",
		keys: ["l"],
		label: "←/→/h/l switch tabs",
		action: nextTab,
	});

	const activeTab = tabs[activeIndex];
	if (!activeTab) return null;

	return (
		<Box flexDirection="column">
			<TabBar
				tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
				activeId={activeTab.id}
			/>
			{activeTab.content}
		</Box>
	);
}

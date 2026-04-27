import { Box, useInput } from "ink";
import { type ReactNode, useState } from "react";
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

	useInput((input, key) => {
		if (key.leftArrow || input === "h") {
			setActiveIndex((i) => (i === 0 ? tabs.length - 1 : i - 1));
			return;
		}
		if (key.rightArrow || input === "l") {
			setActiveIndex((i) => (i === tabs.length - 1 ? 0 : i + 1));
		}
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

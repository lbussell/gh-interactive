import { Box } from "ink";
import {
	Children,
	type ReactElement,
	type ReactNode,
	useCallback,
	useState,
} from "react";
import { useShortcuts } from "../context/shortcutContext";
import { TabBar } from "./tabBar";

type TabContentProps = {
	id: string;
	label: string;
	children: ReactNode;
};

export function TabContent({ children }: TabContentProps) {
	return <>{children}</>;
}

type TabsProps = {
	children: ReactNode;
};

export function Tabs({ children }: TabsProps) {
	const tabs = Children.toArray(children) as ReactElement<TabContentProps>[];
	const [activeIndex, setActiveIndex] = useState(0);

	const prevTab = useCallback(
		() => setActiveIndex((i) => (i === 0 ? tabs.length - 1 : i - 1)),
		[tabs.length],
	);
	const nextTab = useCallback(
		() => setActiveIndex((i) => (i === tabs.length - 1 ? 0 : i + 1)),
		[tabs.length],
	);

	useShortcuts([
		{ id: "tab-prev-arrow", keys: ["<left>"], action: prevTab },
		{ id: "tab-prev-h", keys: ["h"], action: prevTab },
		{ id: "tab-next-arrow", keys: ["<right>"], action: nextTab },
		{
			id: "tab-next-l",
			keys: ["l"],
			label: "←/→/h/l switch tabs",
			action: nextTab,
		},
	]);

	const activeTab = tabs[activeIndex];
	if (!activeTab) return null;

	return (
		<Box flexDirection="column">
			<TabBar
				tabs={tabs.map((t) => ({ id: t.props.id, label: t.props.label }))}
				activeId={activeTab.props.id}
			/>
			{activeTab}
		</Box>
	);
}

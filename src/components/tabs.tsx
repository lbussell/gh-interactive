import { Box } from "ink";
import {
	Children,
	type ReactElement,
	type ReactNode,
	useCallback,
} from "react";
import { useShortcuts } from "../context/shortcutContext";
import { TabActiveContext } from "../context/tabActiveContext";
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
	activeId: string;
	onTabChange: (id: string) => void;
	children: ReactNode;
	height?: number;
};

export function Tabs({ activeId, onTabChange, children, height }: TabsProps) {
	const tabs = Children.toArray(children) as ReactElement<TabContentProps>[];
	const activeIndex = Math.max(
		0,
		tabs.findIndex((t) => t.props.id === activeId),
	);

	const prevTab = useCallback(
		() =>
			onTabChange(
				tabs[activeIndex === 0 ? tabs.length - 1 : activeIndex - 1].props.id,
			),
		[tabs, activeIndex, onTabChange],
	);
	const nextTab = useCallback(
		() =>
			onTabChange(
				tabs[activeIndex === tabs.length - 1 ? 0 : activeIndex + 1].props.id,
			),
		[tabs, activeIndex, onTabChange],
	);

	useShortcuts({
		"<left>": { label: "prev tab", action: prevTab, hidden: true },
		h: { label: "prev tab", action: prevTab, hidden: true },
		"<right>": { label: "next tab", action: nextTab, hidden: true },
		l: { label: "next tab", action: nextTab, hidden: true },
	});

	return (
		<Box flexDirection="column">
			<TabBar
				tabs={tabs.map((t) => ({ id: t.props.id, label: t.props.label }))}
				activeId={tabs[activeIndex]?.props.id ?? ""}
			/>
			{tabs.map((tab, index) => (
				<TabActiveContext key={tab.props.id} value={index === activeIndex}>
					<Box
						display={index === activeIndex ? "flex" : "none"}
						flexDirection="column"
						height={height}
					>
						{tab}
					</Box>
				</TabActiveContext>
			))}
		</Box>
	);
}

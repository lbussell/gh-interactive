import { Box, Text } from "ink";

type Tab = {
	id: string;
	label: string;
};

type TabBarProps = {
	tabs: Tab[];
	activeId: string;
};

export function TabBar({ tabs, activeId }: TabBarProps) {
	return (
		<Box marginBottom={1}>
			{tabs.map((tab, i) => {
				const active = tab.id === activeId;
				return (
					<Text key={tab.id}>
						{i > 0 && <Text> </Text>}
						{active ? (
							<Text bold>[{tab.label}]</Text>
						) : (
							<Text dimColor>[{tab.label}]</Text>
						)}
					</Text>
				);
			})}
		</Box>
	);
}

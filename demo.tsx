import { Box, render, Text } from "ink";
import { Select } from "./src/components/select";
import { ShortcutFooter } from "./src/components/shortcutFooter";
import { ShortcutProvider } from "./src/context/shortcutContext";

type DemoItem = {
	id: string;
	title: string;
	lines: string[];
};

const items: DemoItem[] = [
	{ id: "1", title: "Single line item", lines: [] },
	{
		id: "2",
		title: "Two-line item",
		lines: ["Some extra detail here"],
	},
	{ id: "3", title: "Another single-liner", lines: [] },
	{
		id: "4",
		title: "Three-line item",
		lines: ["Line two of details", "Line three with more info"],
	},
	{
		id: "5",
		title: "Two-line item again",
		lines: ["With a subtitle"],
	},
	{ id: "6", title: "Short", lines: [] },
	{
		id: "7",
		title: "Four lines!",
		lines: ["Detail A", "Detail B", "Detail C"],
	},
	{ id: "8", title: "Simple", lines: [] },
	{
		id: "9",
		title: "Another two-liner",
		lines: ["Extra context"],
	},
	{ id: "10", title: "Last item, single line", lines: [] },
];

function DemoItemView({
	item,
	selected,
}: {
	item: DemoItem;
	selected: boolean;
}) {
	const color = selected ? "green" : undefined;
	return (
		<Box flexDirection="column">
			<Text color={color} bold={selected}>
				{item.title}
			</Text>
			{item.lines.map((line) => (
				<Text key={line} dimColor color={color}>
					{line}
				</Text>
			))}
		</Box>
	);
}

function Demo() {
	return (
		<ShortcutProvider>
			<Box flexDirection="column">
				<Text bold>Variable Height Select Demo</Text>
				<Text dimColor>Items have 1-4 lines each.</Text>
				<Box height={14} flexDirection="column">
					<Select
						items={items}
						keyOf={(item) => item.id}
						heightOf={(item) => 1 + item.lines.length}
						renderItem={(item, selected) => (
							<DemoItemView item={item} selected={selected} />
						)}
						onSelect={() => {
							process.exit(0);
						}}
					/>
				</Box>
				<ShortcutFooter />
			</Box>
		</ShortcutProvider>
	);
}

render(<Demo />, { stdout: process.stderr });

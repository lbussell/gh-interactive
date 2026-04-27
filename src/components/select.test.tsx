import { expect, test } from "bun:test";
import { Box, renderToString, Text } from "ink";
import { ShortcutProvider } from "../context/shortcutContext";
import { Select } from "./select";

type TestItem = {
	id: string;
	title: string;
	lines: string[];
};

const uniformItems: TestItem[] = [
	{ id: "1", title: "Alpha", lines: ["detail a"] },
	{ id: "2", title: "Beta", lines: ["detail b"] },
	{ id: "3", title: "Gamma", lines: ["detail c"] },
	{ id: "4", title: "Delta", lines: ["detail d"] },
	{ id: "5", title: "Epsilon", lines: ["detail e"] },
	{ id: "6", title: "Zeta", lines: ["detail f"] },
	{ id: "7", title: "Eta", lines: ["detail g"] },
	{ id: "8", title: "Theta", lines: ["detail h"] },
];

function renderItem(item: TestItem, selected: boolean) {
	const color = selected ? "green" : undefined;
	return (
		<Box flexDirection="column">
			<Text color={color}>{item.title}</Text>
			{item.lines.map((line) => (
				<Text key={line} dimColor color={color}>
					{line}
				</Text>
			))}
		</Box>
	);
}

function renderSelect(items: TestItem[]) {
	return renderToString(
		<ShortcutProvider>
			<Box height={14} flexDirection="column">
				<Select
					items={items}
					keyOf={(item) => item.id}
					renderItem={renderItem}
					onSelect={() => {}}
				/>
			</Box>
		</ShortcutProvider>,
		{ columns: 60 },
	);
}

test("uniform items: initial render shows first item selected", () => {
	const output = renderSelect(uniformItems);
	expect(output).toMatchSnapshot();
});

test("uniform items: fewer items than budget shows all with padding", () => {
	const output = renderSelect(uniformItems.slice(0, 3));
	expect(output).toMatchSnapshot();
});

test("empty items shows renderEmpty", () => {
	const output = renderToString(
		<ShortcutProvider>
			<Box height={14} flexDirection="column">
				<Select
					items={[] as TestItem[]}
					keyOf={(item) => item.id}
					renderItem={renderItem}
					renderEmpty={() => <Text>Nothing here.</Text>}
					onSelect={() => {}}
				/>
			</Box>
		</ShortcutProvider>,
		{ columns: 60 },
	);
	expect(output).toMatchSnapshot();
});

test("single item renders without scroll indicators", () => {
	const output = renderSelect([uniformItems[0]!]);
	expect(output).toMatchSnapshot();
});

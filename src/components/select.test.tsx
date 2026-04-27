import { expect, test } from "bun:test";
import { stripVTControlCharacters } from "node:util";
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

const longItems: TestItem[] = [
	{
		id: "1",
		title: "Alpha Alpha Alpha Alpha Alpha Alpha Alpha Alpha Alpha Alpha Alpha",
		lines: ["detail a detail a detail a detail a detail a detail a detail a"],
	},
	{
		id: "2",
		title: "Beta Beta Beta Beta Beta Beta Beta Beta Beta Beta Beta",
		lines: ["detail b detail b detail b detail b detail b detail b detail b"],
	},
];

function renderItem(item: TestItem, selected: boolean) {
	const color = selected ? "green" : undefined;
	return (
		<Box flexDirection="column">
			<Text color={color} wrap="truncate">
				{item.title}
			</Text>
			{item.lines.map((line) => (
				<Text key={line} dimColor color={color} wrap="truncate">
					{line}
				</Text>
			))}
		</Box>
	);
}

function renderSelect(items: TestItem[], height = 14) {
	return renderToString(
		<ShortcutProvider>
			<Box height={height} flexDirection="column">
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

function stripAnsi(output: string) {
	return stripVTControlCharacters(output);
}

test("uniform items: initial render shows first item selected", () => {
	const output = renderSelect(uniformItems);
	expect(output).toMatchSnapshot();
});

test("uniform items: fewer items than budget shows all with padding", () => {
	const output = renderSelect(uniformItems.slice(0, 3));
	expect(output).toMatchSnapshot();
});

test("items that fit still reserve room for the position indicator", () => {
	const output = stripAnsi(renderSelect(longItems, 12));
	expect(output).toContain("> Alpha Alpha Alpha");
	expect(output).toContain("  Beta Beta Beta");
	expect(output).not.toContain("> detail a");
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

test("single item renders with position indicator", () => {
	const output = renderSelect(uniformItems.slice(0, 1));
	expect(output).toMatchSnapshot();
});

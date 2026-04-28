import { Box, Text } from "ink";
import {
	isShortcutGroup,
	type ShortcutDict,
	useShortcutContext,
} from "../context/shortcutContext";

function formatKeyForDisplay(key: string): string {
	switch (key) {
		case "<up>":
			return "↑";
		case "<down>":
			return "↓";
		case "<left>":
			return "←";
		case "<right>":
			return "→";
		case "<enter>":
			return "↵";
		case "<escape>":
			return "esc";
		case "<tab>":
			return "tab";
		case "<home>":
			return "home";
		case "<end>":
			return "end";
		case " ":
			return "space";
		default:
			return key;
	}
}

type DisplayEntry = {
	keys: string;
	label: string;
};

function collectDisplayEntries(
	dict: ShortcutDict,
	showHidden: boolean,
): DisplayEntry[] {
	const groups = new Map<string, string[]>();
	const order: string[] = [];

	for (const [key, entry] of Object.entries(dict)) {
		if (!showHidden && entry.hidden) continue;
		const { label } = entry;
		const displayKey = formatKeyForDisplay(key);

		const existing = groups.get(label);
		if (existing) {
			existing.push(displayKey);
		} else {
			groups.set(label, [displayKey]);
			order.push(label);
		}
	}

	return order.map((label) => ({
		keys: groups.get(label)?.join("/") ?? "",
		label,
	}));
}

export function ShortcutFooter() {
	const { merged, buffer, showAll } = useShortcutContext();
	const termWidth = process.stderr.columns || 80;

	// Walk tree to current level based on buffer
	let currentDict = merged;
	const bufferParts: { key: string; label: string }[] = [];
	let validBuffer = true;

	for (const key of buffer) {
		const entry = currentDict[key];
		if (entry && isShortcutGroup(entry)) {
			bufferParts.push({
				key: formatKeyForDisplay(key),
				label: entry.label,
			});
			currentDict = entry.children;
		} else {
			validBuffer = false;
			break;
		}
	}

	if (!validBuffer) return null;

	// Show all children when in a leader group
	const showHidden = showAll || buffer.length > 0;
	const entries = collectDisplayEntries(currentDict, showHidden);

	// Add ? help at root level
	if (buffer.length === 0) {
		entries.push({ keys: "?", label: "help" });
	}

	if (entries.length === 0) return null;

	// Multi-row grid with aligned columns
	const separator = " │ ";
	const sepLen = separator.length;
	const maxEntryWidth = Math.max(
		...entries.map((e) => e.keys.length + 1 + e.label.length),
	);
	const colWidth = maxEntryWidth;
	const numCols = Math.max(
		1,
		Math.floor((termWidth + sepLen) / (colWidth + sepLen)),
	);
	const numRows = Math.ceil(entries.length / numCols);

	return (
		<Box flexDirection="column">
			{bufferParts.length > 0 && (
				<Text>
					<Text color="yellow">
						{bufferParts.map((p) => `${p.key} ${p.label}`).join(" → ")}
					</Text>
					<Text dimColor>{" →"}</Text>
				</Text>
			)}
			{Array.from({ length: numRows }, (_, rowIdx) => {
				const rowEntries = entries.slice(
					rowIdx * numCols,
					(rowIdx + 1) * numCols,
				);
				const rowKey = rowEntries.map((e) => e.keys).join(",");
				return (
					<Box key={rowKey}>
						{rowEntries.map((entry, colIdx) => {
							const text = `${entry.keys} ${entry.label}`.padEnd(colWidth);
							return (
								<Text key={entry.keys}>
									{colIdx > 0 && <Text dimColor>{separator}</Text>}
									<Text dimColor>{text}</Text>
								</Text>
							);
						})}
					</Box>
				);
			})}
		</Box>
	);
}

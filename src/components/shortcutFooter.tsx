import { Box, Text } from "ink";
import { useShortcuts } from "../context/shortcutContext";

export function ShortcutFooter() {
	const { shortcuts, buffer } = useShortcuts();

	const visible =
		buffer.length === 0
			? shortcuts.filter((s) => s.label)
			: shortcuts.filter(
					(s) =>
						s.label &&
						s.keys.length > buffer.length &&
						buffer.every((k, i) => s.keys[i] === k),
				);

	const sorted = [...visible].sort(
		(a, b) => (b.priority ?? 0) - (a.priority ?? 0),
	);

	if (sorted.length === 0) return null;

	return (
		<Box marginTop={1}>
			{buffer.length > 0 && (
				<Text>
					<Text color="yellow">{buffer.join(" ")}</Text>
					<Text dimColor>{" → "}</Text>
				</Text>
			)}
			{sorted.map((s, i) => (
				<Text key={s.id}>
					{i > 0 && <Text dimColor> │ </Text>}
					<Text dimColor>{s.label}</Text>
				</Text>
			))}
		</Box>
	);
}

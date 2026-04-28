import { Box, Text } from "ink";
import { useShortcutContext } from "../context/shortcutContext";

export function ShortcutFooter() {
	const { shortcuts, buffer } = useShortcutContext();

	// When no leader key is active, show single-key shortcuts + leader key prefixes
	// When a leader key is active, show only matching continuations
	const visible =
		buffer.length === 0
			? shortcuts.filter((s) => s.label && s.keys.length === 1)
			: shortcuts.filter(
					(s) =>
						s.label &&
						s.keys.length > buffer.length &&
						buffer.every((k, i) => s.keys[i] === k),
				);

	// Collect leader key prefixes (keys that are only the start of multi-key sequences)
	const leaderPrefixes =
		buffer.length === 0
			? [
					...new Set(
						shortcuts
							.filter((s) => s.keys.length > 1)
							.map((s) => s.keys[0])
							.filter(
								(prefix) =>
									prefix !== undefined &&
									!shortcuts.some(
										(s) => s.keys.length === 1 && s.keys[0] === prefix,
									),
							),
					),
				]
			: [];

	const sorted = [...visible].sort(
		(a, b) => (b.priority ?? 0) - (a.priority ?? 0),
	);

	if (sorted.length === 0 && leaderPrefixes.length === 0) return null;

	return (
		<Box>
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
			{leaderPrefixes.map((prefix) => (
				<Text key={`leader-${prefix}`}>
					{sorted.length > 0 && <Text dimColor> │ </Text>}
					<Text dimColor>{prefix} …</Text>
				</Text>
			))}
		</Box>
	);
}

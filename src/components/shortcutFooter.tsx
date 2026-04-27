import { Box, Text } from "ink";
import { useShortcuts } from "../context/shortcutContext";

export function ShortcutFooter() {
	const { shortcuts, buffer } = useShortcuts();

	const nonHidden = shortcuts.filter((s) => !s.hidden);

	const visible =
		buffer.length === 0
			? nonHidden.filter(
					(s) =>
						s.keys.length === 1 ||
						!nonHidden.some(
							(other) =>
								other.id !== s.id &&
								other.keys[0] === s.keys[0] &&
								other.keys.length > s.keys.length,
						),
				)
			: nonHidden.filter(
					(s) =>
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
			{sorted.map((s, i) => {
				const displayKeys = s.keys.slice(buffer.length).join(" ");
				const isLeader =
					buffer.length === 0 &&
					nonHidden.some(
						(other) =>
							other.id !== s.id &&
							other.keys.length > s.keys.length &&
							other.keys[0] === s.keys[0],
					);

				return (
					<Text key={s.id}>
						{i > 0 && <Text dimColor> │ </Text>}
						<Text color="cyan">{displayKeys}</Text>
						{isLeader ? (
							<Text dimColor> {s.label}…</Text>
						) : (
							<Text dimColor> {s.label}</Text>
						)}
					</Text>
				);
			})}
		</Box>
	);
}

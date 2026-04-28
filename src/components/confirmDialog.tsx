import { Spinner } from "@inkjs/ui";
import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useShortcutContext } from "../context/shortcutContext";

type ConfirmDialogProps = {
	title: string;
	onConfirm: () => void;
	onCancel: () => void;
	yesLabel: string;
	noLabel: string;
	submitting?: boolean;
	error?: string | null;
	children: ReactNode;
};

export function ConfirmDialog({
	title,
	onConfirm,
	onCancel,
	yesLabel,
	noLabel,
	submitting = false,
	error,
	children,
}: ConfirmDialogProps) {
	const { setLocked } = useShortcutContext();

	useEffect(() => {
		setLocked(true);
		return () => setLocked(false);
	}, [setLocked]);

	useInput(
		(input, key) => {
			if (input === "y") onConfirm();
			if (input === "n" || key.escape) onCancel();
		},
		{ isActive: !submitting },
	);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="blue"
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text bold color="blue">
					{title}
				</Text>
			</Box>
			{children}
			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}
			<Box flexDirection="column" marginTop={1}>
				{submitting ? (
					<Spinner label="Working..." />
				) : (
					<>
						<Text dimColor>(y) {yesLabel}</Text>
						<Text dimColor>(n) {noLabel}</Text>
					</>
				)}
			</Box>
		</Box>
	);
}

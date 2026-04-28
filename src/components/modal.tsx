import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useShortcutContext } from "../context/shortcutContext";

type ModalProps = {
	title: string;
	onClose: () => void;
	closeable?: boolean;
	children: ReactNode;
};

export function Modal({
	title,
	onClose,
	closeable = true,
	children,
}: ModalProps) {
	const { setLocked } = useShortcutContext();

	useEffect(() => {
		setLocked(true);
		return () => setLocked(false);
	}, [setLocked]);

	useInput((_input, key) => {
		if (key.escape && closeable) {
			onClose();
		}
	});

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
			<Box justifyContent="flex-end" marginTop={1}>
				<Text dimColor>Esc to cancel</Text>
			</Box>
		</Box>
	);
}

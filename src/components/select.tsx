import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type SelectProps<T> = {
	items: T[];
	keyOf: (item: T) => string;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	onSelect: (item: T) => void;
	onCancel: () => void;
};

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	onSelect,
	onCancel,
}: SelectProps<T>) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const selectedIndexRef = useRef(0);

	const selectIndex = useCallback((nextIndex: number) => {
		selectedIndexRef.current = nextIndex;
		setSelectedIndex(nextIndex);
	}, []);

	useEffect(() => {
		if (items.length === 0) {
			selectIndex(0);
			return;
		}

		if (selectedIndexRef.current >= items.length) {
			selectIndex(items.length - 1);
		}
	}, [items.length, selectIndex]);

	useInput((input, key) => {
		if (input === "q" || key.escape) {
			onCancel();
			return;
		}

		if (items.length === 0) {
			return;
		}

		if (key.upArrow) {
			const nextIndex =
				selectedIndexRef.current === 0
					? items.length - 1
					: selectedIndexRef.current - 1;
			selectIndex(nextIndex);
			return;
		}

		if (key.downArrow) {
			const nextIndex =
				selectedIndexRef.current === items.length - 1
					? 0
					: selectedIndexRef.current + 1;
			selectIndex(nextIndex);
			return;
		}

		if (key.return) {
			const selectedItem = items[selectedIndexRef.current];

			if (selectedItem !== undefined) {
				onSelect(selectedItem);
			}
		}
	});

	const padding = " ".repeat(selector.length + 1);

	if (items.length === 0) {
		return <>{renderEmpty?.()}</>;
	}

	return (
		<Box flexDirection="column">
			{items.map((item, index) => {
				const selected = index === selectedIndex;

				return (
					<Box key={keyOf(item)} flexDirection="row">
						<Text>{selected ? `${selector} ` : padding}</Text>
						<Box>{renderItem(item, selected)}</Box>
					</Box>
				);
			})}
		</Box>
	);
}

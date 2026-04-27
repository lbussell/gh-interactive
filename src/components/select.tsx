import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShortcut } from "../context/shortcutContext";

type SelectProps<T> = {
	items: T[];
	keyOf: (item: T) => string;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	maxVisible?: number;
	onSelect: (item: T) => void;
};

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	maxVisible,
	onSelect,
}: SelectProps<T>) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const selectedIndexRef = useRef(0);

	const selectIndex = useCallback(
		(nextIndex: number) => {
			selectedIndexRef.current = nextIndex;
			setSelectedIndex(nextIndex);

			if (maxVisible === undefined || items.length <= maxVisible) {
				return;
			}

			setScrollOffset((prev) => {
				if (nextIndex < prev) {
					return nextIndex;
				}
				if (nextIndex >= prev + maxVisible) {
					return nextIndex - maxVisible + 1;
				}
				return prev;
			});
		},
		[maxVisible, items.length],
	);

	useEffect(() => {
		if (items.length === 0) {
			selectIndex(0);
			return;
		}

		if (selectedIndexRef.current >= items.length) {
			selectIndex(items.length - 1);
		}
	}, [items.length, selectIndex]);

	const moveUp = useCallback(() => {
		if (items.length === 0) return;
		const nextIndex =
			selectedIndexRef.current === 0
				? items.length - 1
				: selectedIndexRef.current - 1;
		selectIndex(nextIndex);
	}, [items.length, selectIndex]);

	const moveDown = useCallback(() => {
		if (items.length === 0) return;
		const nextIndex =
			selectedIndexRef.current === items.length - 1
				? 0
				: selectedIndexRef.current + 1;
		selectIndex(nextIndex);
	}, [items.length, selectIndex]);

	const confirmSelection = useCallback(() => {
		if (items.length === 0) return;
		const selectedItem = items[selectedIndexRef.current];
		if (selectedItem !== undefined) {
			onSelect(selectedItem);
		}
	}, [items, onSelect]);

	const hasItems = items.length > 0;
	useShortcut(
		{ id: "select-up-arrow", keys: ["<up>"], action: moveUp },
		hasItems,
	);
	useShortcut(
		{
			id: "select-up-k",
			keys: ["k"],
			label: "↑/↓/j/k scroll",
			action: moveUp,
		},
		hasItems,
	);
	useShortcut(
		{ id: "select-down-arrow", keys: ["<down>"], action: moveDown },
		hasItems,
	);
	useShortcut({ id: "select-down-j", keys: ["j"], action: moveDown }, hasItems);
	useShortcut(
		{
			id: "select-enter",
			keys: ["<enter>"],
			label: "↵ select",
			action: confirmSelection,
		},
		hasItems,
	);

	const padding = " ".repeat(selector.length + 1);

	if (items.length === 0) {
		return <>{renderEmpty?.()}</>;
	}

	const shouldScroll = maxVisible !== undefined && items.length > maxVisible;
	const visibleItems = shouldScroll
		? items.slice(scrollOffset, scrollOffset + maxVisible)
		: items;
	const hiddenAbove = shouldScroll ? scrollOffset : 0;
	const hiddenBelow = shouldScroll
		? items.length - scrollOffset - maxVisible
		: 0;

	return (
		<Box flexDirection="column">
			{hiddenAbove > 0 && (
				<Text dimColor>
					{padding}↑ {hiddenAbove} more
				</Text>
			)}
			{visibleItems.map((item, visibleIndex) => {
				const actualIndex = shouldScroll
					? visibleIndex + scrollOffset
					: visibleIndex;
				const selected = actualIndex === selectedIndex;

				return (
					<Box key={keyOf(item)} flexDirection="row">
						<Text>{selected ? `${selector} ` : padding}</Text>
						<Box>{renderItem(item, selected)}</Box>
					</Box>
				);
			})}
			{hiddenBelow > 0 && (
				<Text dimColor>
					{padding}↓ {hiddenBelow} more
				</Text>
			)}
		</Box>
	);
}

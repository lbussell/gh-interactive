import { Box, type DOMElement, Text, useBoxMetrics } from "ink";
import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useShortcuts } from "../context/shortcutContext";

type SelectProps<T> = {
	items: T[];
	keyOf: (item: T) => string;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	itemHeight?: number;
	onSelect: (item: T) => void;
};

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	itemHeight = 2,
	onSelect,
}: SelectProps<T>) {
	const containerRef = useRef<DOMElement | null>(
		null,
	) as unknown as React.RefObject<DOMElement>;
	const { height, hasMeasured } = useBoxMetrics(containerRef);

	// Reserve 2 lines for scroll indicators (top + bottom)
	const indicatorLines = 2;
	const maxVisible = hasMeasured
		? Math.max(1, Math.floor((height - indicatorLines) / itemHeight))
		: 5;

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const selectedIndexRef = useRef(0);

	const selectIndex = useCallback(
		(nextIndex: number) => {
			selectedIndexRef.current = nextIndex;
			setSelectedIndex(nextIndex);

			if (items.length <= maxVisible) {
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
	useShortcuts(
		[
			{ id: "select-up-arrow", keys: ["<up>"], action: moveUp },
			{
				id: "select-up-k",
				keys: ["k"],
				label: "↑/↓/j/k scroll",
				action: moveUp,
			},
			{ id: "select-down-arrow", keys: ["<down>"], action: moveDown },
			{ id: "select-down-j", keys: ["j"], action: moveDown },
			{
				id: "select-enter",
				keys: ["<enter>"],
				label: "↵ select",
				action: confirmSelection,
			},
		],
		hasItems,
	);

	const padding = " ".repeat(selector.length + 1);

	if (items.length === 0) {
		return <>{renderEmpty?.()}</>;
	}

	const shouldScroll = items.length > maxVisible;
	const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisible);
	const hiddenAbove = scrollOffset;
	const hiddenBelow = shouldScroll
		? Math.max(0, items.length - scrollOffset - maxVisible)
		: 0;

	return (
		<Box
			ref={containerRef}
			flexDirection="column"
			flexGrow={1}
			overflowY="hidden"
		>
			<Text dimColor>
				{hiddenAbove > 0 ? `${padding}↑ ${hiddenAbove} more` : " "}
			</Text>
			{visibleItems.map((item, visibleIndex) => {
				const actualIndex = visibleIndex + scrollOffset;
				const selected = actualIndex === selectedIndex;

				return (
					<Box key={keyOf(item)} flexDirection="row">
						<Text>{selected ? `${selector} ` : padding}</Text>
						<Box>{renderItem(item, selected)}</Box>
					</Box>
				);
			})}
			<Text dimColor>
				{hiddenBelow > 0 ? `${padding}↓ ${hiddenBelow} more` : " "}
			</Text>
		</Box>
	);
}

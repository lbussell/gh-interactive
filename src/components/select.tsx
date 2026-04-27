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
	onSelect: (item: T) => void;
};

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	onSelect,
}: SelectProps<T>) {
	const containerRef = useRef<DOMElement | null>(
		null,
	) as unknown as React.RefObject<DOMElement>;
	const { height, hasMeasured } = useBoxMetrics(containerRef);

	const itemHeight = 2;

	// Determine if scrolling is needed: try fitting all items without indicator lines
	const fullBudget = hasMeasured ? height : 12;
	const totalLines = items.length * itemHeight;
	const fitsWithout = totalLines <= fullBudget;
	// Only reserve indicator lines when we actually need scrolling
	const budget = fitsWithout ? fullBudget : fullBudget - 2;
	const maxVisible = Math.floor(budget / itemHeight);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const selectedIndexRef = useRef(0);

	const selectIndex = useCallback(
		(nextIndex: number) => {
			selectedIndexRef.current = nextIndex;
			setSelectedIndex(nextIndex);

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
		[maxVisible],
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

	const visibleCount = Math.min(maxVisible, items.length - scrollOffset);
	const visibleItems = items.slice(scrollOffset, scrollOffset + visibleCount);
	const hiddenAbove = scrollOffset;
	const hiddenBelow = Math.max(0, items.length - scrollOffset - visibleCount);

	const padLines = Math.max(0, budget - visibleCount * itemHeight);

	return (
		<Box ref={containerRef} flexDirection="column" flexGrow={1}>
			{hiddenAbove > 0 && (
				<Text dimColor>{`${padding}↑ ${hiddenAbove} more`}</Text>
			)}
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
			{padLines > 0 && <Box height={padLines} />}
			{hiddenBelow > 0 && (
				<Text dimColor>{`${padding}↓ ${hiddenBelow} more`}</Text>
			)}
		</Box>
	);
}

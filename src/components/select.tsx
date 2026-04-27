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
	heightOf?: (item: T) => number;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	onSelect: (item: T) => void;
};

export function Select<T>({
	items,
	keyOf,
	heightOf,
	renderItem,
	renderEmpty,
	selector = ">",
	onSelect,
}: SelectProps<T>) {
	const containerRef = useRef<DOMElement | null>(
		null,
	) as unknown as React.RefObject<DOMElement>;
	const { height, hasMeasured } = useBoxMetrics(containerRef);

	const itemHeightOf = heightOf ?? (() => 2);

	// Reserve 2 lines for scroll indicators (top + bottom)
	const indicatorLines = 2;
	const budget = hasMeasured ? height - indicatorLines : 10;

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const selectedIndexRef = useRef(0);

	// Count how many items fit within a line budget starting from `from`
	const countVisible = useCallback(
		(from: number, lineBudget: number) => {
			let lines = 0;
			let count = 0;
			for (let i = from; i < items.length; i++) {
				const h = itemHeightOf(items[i] as T);
				if (lines + h > lineBudget) break;
				lines += h;
				count++;
			}
			return Math.max(1, count);
		},
		[items, itemHeightOf],
	);

	const selectIndex = useCallback(
		(nextIndex: number) => {
			selectedIndexRef.current = nextIndex;
			setSelectedIndex(nextIndex);

			setScrollOffset((prev) => {
				// If selected is above viewport, scroll up to it
				if (nextIndex < prev) {
					return nextIndex;
				}
				// If selected is below viewport, scroll down until it fits
				const visible = countVisible(prev, budget);
				if (nextIndex >= prev + visible) {
					// Walk backward from nextIndex to find a scroll offset
					// that keeps nextIndex visible within budget
					let offset = nextIndex;
					let lines = itemHeightOf(items[nextIndex] as T);
					while (
						offset > 0 &&
						lines + itemHeightOf(items[offset - 1] as T) <= budget
					) {
						offset--;
						lines += itemHeightOf(items[offset] as T);
					}
					return offset;
				}
				return prev;
			});
		},
		[items, budget, countVisible, itemHeightOf],
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

	const visibleCount = countVisible(scrollOffset, budget);
	const hasMore = scrollOffset + visibleCount < items.length;
	// Render one extra item beyond what fits — it'll be clipped by overflow
	const renderCount = hasMore ? visibleCount + 1 : visibleCount;
	const visibleItems = items.slice(scrollOffset, scrollOffset + renderCount);
	const hiddenAbove = scrollOffset;
	const hiddenBelow = Math.max(0, items.length - scrollOffset - visibleCount);

	return (
		<Box ref={containerRef} flexDirection="column" flexGrow={1}>
			<Text dimColor>
				{hiddenAbove > 0 ? `${padding}↑ ${hiddenAbove} more` : " "}
			</Text>
			<Box flexDirection="column" flexGrow={1} overflowY="hidden">
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
			</Box>
			<Text dimColor>
				{hiddenBelow > 0 ? `${padding}↓ ${hiddenBelow} more` : " "}
			</Text>
		</Box>
	);
}

import { Box, type DOMElement, Spacer, Text, useBoxMetrics } from "ink";
import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { type Shortcut, useShortcuts } from "../context/shortcutContext";

export type ItemShortcut<T> = {
	id: string;
	keys: string[];
	label?: string;
	action: (item: T) => void;
	priority?: number;
};

type SelectProps<T> = {
	items: T[];
	keyOf: (item: T) => string;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	onSelect: (item: T) => void;
	itemShortcuts?: ItemShortcut<T>[];
};

const calculateNumVisibleItems = (itemHeight: number, availableSpace: number) =>
	itemHeight > 0
		? Math.max(1, Math.floor(availableSpace / itemHeight))
		: 1;

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	onSelect,
	itemShortcuts,
}: SelectProps<T>) {
	const containerRef = useRef<DOMElement | null>(
		null,
	) as unknown as React.RefObject<DOMElement>;
	const { height } = useBoxMetrics(containerRef);

	const itemHeight = 2;
	const maxVisible = calculateNumVisibleItems(itemHeight, height);

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
		const nextIndex = Math.max(selectedIndexRef.current - 1, 0);
		selectIndex(nextIndex);
	}, [items.length, selectIndex]);

	const moveDown = useCallback(() => {
		const nextIndex = Math.min(selectedIndexRef.current + 1, items.length - 1);
		selectIndex(nextIndex);
	}, [items.length, selectIndex]);

	const confirmSelection = useCallback(() => {
		if (items.length === 0) return;
		const selectedItem = items[selectedIndexRef.current];
		if (selectedItem !== undefined) {
			onSelect(selectedItem);
		}
	}, [items, onSelect]);

	const itemShortcutsRef = useRef<ItemShortcut<T>[]>([]);
	itemShortcutsRef.current = itemShortcuts ?? [];

	const boundItemShortcuts: Shortcut[] = (itemShortcuts ?? []).map((s) => ({
		id: s.id,
		keys: s.keys,
		label: s.label,
		priority: s.priority,
		action: () => {
			const item = items[selectedIndexRef.current];
			if (item !== undefined) {
				itemShortcutsRef.current.find((x) => x.id === s.id)?.action(item);
			}
		},
	}));

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
			...boundItemShortcuts,
		],
		hasItems,
	);

	const padding = " ".repeat(selector.length + 1);

	if (items.length === 0) {
		return <>{renderEmpty?.()}</>;
	}

	const visibleCount = Math.min(maxVisible, items.length - scrollOffset);
	const visibleItems = items.slice(scrollOffset, scrollOffset + visibleCount);

	return (
		<Box ref={containerRef} flexDirection="column" height={40}>
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
			<Spacer/>
		</Box>
	);
}

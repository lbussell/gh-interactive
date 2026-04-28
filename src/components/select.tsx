import { Box, type DOMElement, Spacer, Text, useBoxMetrics } from "ink";
import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { type Shortcut, useShortcuts } from "../context/shortcutContext";
import { clamp } from "../util";

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
	focusKey?: string | null;
	onSelect: (item: T) => void;
	itemShortcuts?: ItemShortcut<T>[];
};

export function Select<T>({
	items,
	keyOf,
	renderItem,
	renderEmpty,
	selector = ">",
	focusKey,
	onSelect,
	itemShortcuts,
}: SelectProps<T>) {
	const containerRef = useRef<DOMElement | null>(
		null,
	) as unknown as React.RefObject<DOMElement>;
	const { height } = useBoxMetrics(containerRef);

	const itemHeight = 2;
	const maxVisible = Math.max(1, Math.floor(height / itemHeight));

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const selectedIndexRef = useRef(0);

	const selectIndex = useCallback(
		(nextIndex: number) => {
			selectedIndexRef.current = nextIndex;
			setSelectedIndex(nextIndex);

			setScrollOffset((prev) => {
				if (nextIndex < prev) return nextIndex;
				if (nextIndex >= prev + maxVisible) return nextIndex - maxVisible + 1;
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

	useEffect(() => {
		if (!focusKey || items.length === 0) return;
		const index = items.findIndex((item) => keyOf(item) === focusKey);
		if (index >= 0) {
			selectIndex(index);
		}
	}, [focusKey, items, keyOf, selectIndex]);

	const move = useCallback(
		(delta: number) => {
			const nextIndex = clamp(
				selectedIndexRef.current + delta,
				0,
				items.length - 1,
			);
			selectIndex(nextIndex);
		},
		[items.length, selectIndex],
	);

	const confirmSelection = useCallback(() => {
		if (items.length === 0) return;
		const selectedItem = items[selectedIndexRef.current];
		if (selectedItem !== undefined) {
			onSelect(selectedItem);
		}
	}, [items, onSelect]);

	const boundItemShortcuts: Shortcut[] = (itemShortcuts ?? []).map((s) => ({
		id: s.id,
		keys: s.keys,
		label: s.label,
		priority: s.priority,
		action: () => {
			const item = items[selectedIndexRef.current];
			if (item !== undefined) {
				s.action(item);
			}
		},
	}));

	const goToFirst = useCallback(() => selectIndex(0), [selectIndex]);
	const goToLast = useCallback(
		() => selectIndex(Math.max(0, items.length - 1)),
		[items.length, selectIndex],
	);

	const hasItems = items.length > 0;
	useShortcuts(
		[
			{ id: "select-up-arrow", keys: ["<up>"], action: () => move(-1) },
			{
				id: "select-up-k",
				keys: ["k"],
				label: "↑↓ nav",
				action: () => move(-1),
			},
			{ id: "select-down-arrow", keys: ["<down>"], action: () => move(1) },
			{ id: "select-down-j", keys: ["j"], action: () => move(1) },
			{ id: "select-home", keys: ["<home>"], action: goToFirst },
			{ id: "select-top-g", keys: ["g"], action: goToFirst },
			{ id: "select-end", keys: ["<end>"], action: goToLast },
			{
				id: "select-bottom-G",
				keys: ["G"],
				label: "g/G top/bottom",
				action: goToLast,
			},
			{
				id: "select-enter",
				keys: ["<enter>"],
				action: confirmSelection,
			},
			...boundItemShortcuts,
		],
		hasItems,
	);

	if (!hasItems) {
		return <>{renderEmpty?.()}</>;
	}

	const padding = " ".repeat(selector.length + 1);
	const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisible);

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
			<Spacer />
		</Box>
	);
}

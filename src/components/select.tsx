import { Box, type DOMElement, Spacer, Text, useBoxMetrics } from "ink";
import React, {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { type ShortcutDict, useShortcuts } from "../context/shortcutContext";
import { clamp } from "../util";

export type ItemShortcutAction<T> = {
	label: string;
	action: (item: T) => void;
	hidden?: boolean;
};

export type ItemShortcutGroup<T> = {
	label: string;
	children: ItemShortcutDict<T>;
	hidden?: boolean;
};

export type ItemShortcutEntry<T> = ItemShortcutAction<T> | ItemShortcutGroup<T>;
export type ItemShortcutDict<T> = Record<string, ItemShortcutEntry<T>>;

function bindItemShortcuts<T>(
	dict: ItemShortcutDict<T> | undefined,
	getItem: () => T | undefined,
): ShortcutDict {
	if (!dict) return {};
	const result: ShortcutDict = {};
	for (const [key, entry] of Object.entries(dict)) {
		if ("children" in entry) {
			result[key] = {
				label: entry.label,
				hidden: entry.hidden,
				children: bindItemShortcuts(entry.children, getItem),
			};
		} else {
			const itemAction = entry.action;
			result[key] = {
				label: entry.label,
				hidden: entry.hidden,
				action: () => {
					const item = getItem();
					if (item !== undefined) itemAction(item);
				},
			};
		}
	}
	return result;
}

type SelectProps<T> = {
	items: T[];
	keyOf: (item: T) => string;
	renderItem: (item: T, selected: boolean) => ReactNode;
	renderEmpty?: () => ReactNode;
	selector?: string;
	focusKey?: string | null;
	onSelect: (item: T) => void;
	itemShortcuts?: ItemShortcutDict<T>;
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

	const lastFocusKeyRef = useRef<string | null>(null);

	useEffect(() => {
		if (!focusKey || items.length === 0) return;
		if (focusKey === lastFocusKeyRef.current) return;
		lastFocusKeyRef.current = focusKey;
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

	const getSelectedItem = () => items[selectedIndexRef.current];
	const boundItemShortcuts = bindItemShortcuts(itemShortcuts, getSelectedItem);

	const goToFirst = useCallback(() => selectIndex(0), [selectIndex]);
	const goToLast = useCallback(
		() => selectIndex(Math.max(0, items.length - 1)),
		[items.length, selectIndex],
	);

	const hasItems = items.length > 0;
	useShortcuts(
		{
			...boundItemShortcuts,
			k: { label: "up", action: () => move(-1), hidden: true },
			"<up>": { label: "up", action: () => move(-1), hidden: true },
			j: { label: "down", action: () => move(1), hidden: true },
			"<down>": { label: "down", action: () => move(1), hidden: true },
			g: { label: "top", action: goToFirst, hidden: true },
			"<home>": { label: "top", action: goToFirst, hidden: true },
			G: { label: "bottom", action: goToLast, hidden: true },
			"<end>": { label: "bottom", action: goToLast, hidden: true },
			"<enter>": { label: "select", action: confirmSelection, hidden: true },
		},
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

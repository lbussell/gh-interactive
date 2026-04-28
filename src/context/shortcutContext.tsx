import { useInput } from "ink";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTabActive } from "./tabActiveContext";

// --- Types ---

export type ShortcutAction = {
	label: string;
	action: () => void;
	hidden?: boolean;
};

export type ShortcutGroup = {
	label: string;
	children: ShortcutDict;
	hidden?: boolean;
};

export type ShortcutEntry = ShortcutAction | ShortcutGroup;
export type ShortcutDict = Record<string, ShortcutEntry>;

export function isShortcutGroup(entry: ShortcutEntry): entry is ShortcutGroup {
	return "children" in entry;
}

// --- Context ---

type ShortcutContextType = {
	merged: ShortcutDict;
	register: (dict: ShortcutDict) => () => void;
	buffer: string[];
	locked: boolean;
	setLocked: (v: boolean) => void;
	showAll: boolean;
};

const ShortcutContext = createContext<ShortcutContextType | null>(null);

function resolveKey(
	input: string,
	key: Record<string, boolean>,
): string | null {
	if (key.upArrow) return "<up>";
	if (key.downArrow) return "<down>";
	if (key.leftArrow) return "<left>";
	if (key.rightArrow) return "<right>";
	if (key.return) return "<enter>";
	if (key.escape) return "<escape>";
	if (key.tab) return "<tab>";
	if (key.home) return "<home>";
	if (key.end) return "<end>";
	if (input) return input;
	return null;
}

// --- Tree Merging ---

function mergeDicts(dicts: ShortcutDict[]): ShortcutDict {
	const result: ShortcutDict = {};
	for (const dict of dicts) {
		for (const [key, entry] of Object.entries(dict)) {
			const existing = result[key];
			if (existing && isShortcutGroup(existing) && isShortcutGroup(entry)) {
				result[key] = {
					label: existing.label,
					hidden: existing.hidden,
					children: mergeDicts([existing.children, entry.children]),
				};
			} else {
				result[key] = entry;
			}
		}
	}
	return result;
}

// --- Provider ---

type Registration = {
	id: number;
	dict: ShortcutDict;
};

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [buffer, setBuffer] = useState<string[]>([]);
	const [locked, setLocked] = useState(false);
	const [showAll, setShowAll] = useState(false);
	const nextId = useRef(0);

	const register = useCallback((dict: ShortcutDict) => {
		const id = nextId.current++;
		setRegistrations((prev) => [...prev, { id, dict }]);
		return () => setRegistrations((prev) => prev.filter((r) => r.id !== id));
	}, []);

	const merged = useMemo(
		() => mergeDicts(registrations.map((r) => r.dict)),
		[registrations],
	);

	useInput(
		(input, key) => {
			const resolved = resolveKey(
				input,
				key as unknown as Record<string, boolean>,
			);
			if (!resolved) return;

			if (resolved === "<escape>") {
				setBuffer([]);
				return;
			}

			// Toggle help at root level
			if (resolved === "?" && buffer.length === 0) {
				setShowAll((prev) => !prev);
				return;
			}

			// Walk tree to current position based on buffer
			let node: ShortcutDict = merged;
			for (const k of buffer) {
				const entry = node[k];
				if (entry && isShortcutGroup(entry)) {
					node = entry.children;
				} else {
					setBuffer([]);
					return;
				}
			}

			const entry = node[resolved];
			if (!entry) {
				setBuffer([]);
				return;
			}

			if (isShortcutGroup(entry)) {
				setBuffer([...buffer, resolved]);
			} else {
				entry.action();
				setBuffer([]);
			}
		},
		{ isActive: !locked },
	);

	return (
		<ShortcutContext
			value={{ merged, register, buffer, locked, setLocked, showAll }}
		>
			{children}
		</ShortcutContext>
	);
}

// --- Hooks ---

export function useShortcutContext() {
	const ctx = useContext(ShortcutContext);
	if (!ctx) {
		throw new Error("useShortcutContext must be used within ShortcutProvider.");
	}
	return ctx;
}

function serializeDict(dict: ShortcutDict): string {
	const parts: string[] = [];
	for (const key of Object.keys(dict).sort()) {
		const entry = dict[key];
		if (!entry) continue;
		if (isShortcutGroup(entry)) {
			parts.push(
				`${key}\0G\0${entry.label}\0${entry.hidden ?? ""}\0${serializeDict(entry.children)}`,
			);
		} else {
			parts.push(`${key}\0A\0${entry.label}\0${entry.hidden ?? ""}`);
		}
	}
	return parts.join("\n");
}

function collectActions(
	dict: ShortcutDict,
	prefix: string,
	target: Record<string, () => void>,
): void {
	for (const [key, entry] of Object.entries(dict)) {
		const path = prefix ? `${prefix}\0${key}` : key;
		if (isShortcutGroup(entry)) {
			collectActions(entry.children, path, target);
		} else {
			target[path] = entry.action;
		}
	}
}

function makeStableDict(
	dict: ShortcutDict,
	actionsRef: { current: Record<string, () => void> },
	prefix: string,
): ShortcutDict {
	const result: ShortcutDict = {};
	for (const [key, entry] of Object.entries(dict)) {
		const path = prefix ? `${prefix}\0${key}` : key;
		if (isShortcutGroup(entry)) {
			result[key] = {
				label: entry.label,
				hidden: entry.hidden,
				children: makeStableDict(entry.children, actionsRef, path),
			};
		} else {
			result[key] = {
				label: entry.label,
				hidden: entry.hidden,
				action: () => actionsRef.current[path]?.(),
			};
		}
	}
	return result;
}

export function useShortcuts(shortcuts: ShortcutDict, enabled = true) {
	const { register } = useShortcutContext();
	const tabActive = useTabActive();
	const actionsRef = useRef<Record<string, () => void>>({});

	const actions: Record<string, () => void> = {};
	collectActions(shortcuts, "", actions);
	actionsRef.current = actions;

	const depsKey = serializeDict(shortcuts);

	// biome-ignore lint/correctness/useExhaustiveDependencies: depsKey is an intentional stable serialization to avoid re-registering on every render
	useEffect(() => {
		if (!enabled || !tabActive) return;

		const stableDict = makeStableDict(shortcuts, actionsRef, "");
		const unregister = register(stableDict);
		return unregister;
	}, [enabled, tabActive, register, depsKey]);
}

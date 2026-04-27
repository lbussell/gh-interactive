import { useInput } from "ink";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

export type Shortcut = {
	id: string;
	keys: string[];
	label: string;
	action: () => void;
	priority?: number;
};

type ShortcutContextType = {
	shortcuts: Shortcut[];
	register: (s: Shortcut) => () => void;
	buffer: string[];
};

const ShortcutContext = createContext<ShortcutContextType | null>(null);

const SEQUENCE_TIMEOUT = 1000;

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
	const [buffer, setBuffer] = useState<string[]>([]);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const register = useCallback((s: Shortcut) => {
		setShortcuts((prev) => [...prev, s]);
		return () => setShortcuts((prev) => prev.filter((x) => x.id !== s.id));
	}, []);

	useInput((input, key) => {
		if (key.escape) {
			setBuffer([]);
			return;
		}

		// Ignore modifier-only or arrow keys in the shortcut system
		if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) {
			return;
		}
		if (key.return || key.tab) {
			return;
		}

		const next = [...buffer, input];

		const exact = shortcuts.find(
			(s) =>
				s.keys.length === next.length && s.keys.every((k, i) => k === next[i]),
		);

		if (exact) {
			exact.action();
			setBuffer([]);
			if (timerRef.current) clearTimeout(timerRef.current);
			return;
		}

		const isPrefix = shortcuts.some(
			(s) =>
				s.keys.length > next.length && next.every((k, i) => s.keys[i] === k),
		);

		if (isPrefix) {
			setBuffer(next);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => setBuffer([]), SEQUENCE_TIMEOUT);
		} else {
			setBuffer([]);
		}
	});

	return (
		<ShortcutContext value={{ shortcuts, register, buffer }}>
			{children}
		</ShortcutContext>
	);
}

export function useShortcuts() {
	const ctx = useContext(ShortcutContext);
	if (!ctx) {
		throw new Error("useShortcuts must be used within ShortcutProvider.");
	}
	return ctx;
}

export function useShortcut(shortcut: Shortcut, enabled = true) {
	const { register } = useShortcuts();
	const actionRef = useRef(shortcut.action);
	actionRef.current = shortcut.action;

	const keysKey = shortcut.keys.join("\0");

	// biome-ignore lint/correctness/useExhaustiveDependencies: keysKey is an intentional stable serialization of shortcut.keys to avoid re-registering on every render
	useEffect(() => {
		if (!enabled) return;
		return register({
			id: shortcut.id,
			keys: shortcut.keys,
			label: shortcut.label,
			action: () => actionRef.current(),
			priority: shortcut.priority,
		});
	}, [
		enabled,
		register,
		shortcut.id,
		shortcut.label,
		shortcut.priority,
		keysKey,
	]);
}

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
	label?: string;
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
	if (input) return input;
	return null;
}

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
	const [buffer, setBuffer] = useState<string[]>([]);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const register = useCallback((s: Shortcut) => {
		setShortcuts((prev) => [...prev, s]);
		return () => setShortcuts((prev) => prev.filter((x) => x.id !== s.id));
	}, []);

	useInput((input, key) => {
		const resolved = resolveKey(
			input,
			key as unknown as Record<string, boolean>,
		);
		if (!resolved) return;

		if (resolved === "<escape>") {
			setBuffer([]);
			return;
		}

		const next = [...buffer, resolved];

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

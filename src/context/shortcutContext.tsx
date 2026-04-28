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
	locked: boolean;
	setLocked: (v: boolean) => void;
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

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
	const [buffer, setBuffer] = useState<string[]>([]);
	const [locked, setLocked] = useState(false);

	const register = useCallback((s: Shortcut) => {
		setShortcuts((prev) => [...prev, s]);
		return () => setShortcuts((prev) => prev.filter((x) => x.id !== s.id));
	}, []);

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

			const next = [...buffer, resolved];

			const exact = shortcuts.find(
				(s) =>
					s.keys.length === next.length &&
					s.keys.every((k, i) => k === next[i]),
			);

			if (exact) {
				exact.action();
				setBuffer([]);
				return;
			}

			const isPrefix = shortcuts.some(
				(s) =>
					s.keys.length > next.length && next.every((k, i) => s.keys[i] === k),
			);

			if (isPrefix) {
				setBuffer(next);
			} else {
				setBuffer([]);
			}
		},
		{ isActive: !locked },
	);

	return (
		<ShortcutContext value={{ shortcuts, register, buffer, locked, setLocked }}>
			{children}
		</ShortcutContext>
	);
}

export function useShortcutContext() {
	const ctx = useContext(ShortcutContext);
	if (!ctx) {
		throw new Error("useShortcutContext must be used within ShortcutProvider.");
	}
	return ctx;
}

export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
	const { register } = useShortcutContext();
	const actionsRef = useRef<Record<string, () => void>>({});

	for (const s of shortcuts) {
		actionsRef.current[s.id] = s.action;
	}

	const depsKey = shortcuts
		.map(
			(s) =>
				`${s.id}\0${s.keys.join(",")}\0${s.label ?? ""}\0${s.priority ?? ""}`,
		)
		.join("\n");

	// biome-ignore lint/correctness/useExhaustiveDependencies: depsKey is an intentional stable serialization to avoid re-registering on every render
	useEffect(() => {
		if (!enabled) return;

		const unregisters = shortcuts.map((s) =>
			register({
				id: s.id,
				keys: s.keys,
				label: s.label,
				action: () => actionsRef.current[s.id]?.(),
				priority: s.priority,
			}),
		);

		return () => {
			for (const unregister of unregisters) {
				unregister();
			}
		};
	}, [enabled, register, depsKey]);
}

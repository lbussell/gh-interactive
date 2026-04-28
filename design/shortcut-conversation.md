<user>How would you create a global shortcut footer in an Ink (React) TUI app? I want to have a dynamic list of shortcuts depending on what is currently focused. Also with the ability to have leader-key style combinations like o->b for “open browser”
</user>
<assistant>
# Global Shortcut Footer in Ink

Here's a clean architecture using React Context + a custom hook:

## 1. Context for registering shortcuts

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

type Shortcut = {
    id: string;
    keys: string[];        // e.g. ['o', 'b'] for leader sequence
    label: string;         // shown in footer
    action: () => void;
    priority?: number;     // higher = shown first / wins conflicts
};

type ShortcutContextType = {
    shortcuts: Shortcut[];
    register: (s: Shortcut) => () => void;
};

const ShortcutContext = createContext<ShortcutContextType | null>(null);

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

    const register = useCallback((s: Shortcut) => {
    setShortcuts(prev => [...prev, s]);
    return () => setShortcuts(prev => prev.filter(x => x.id !== s.id));
    }, []);

    return (
    <ShortcutContext.Provider value={{ shortcuts, register }}>
        {children}
    </ShortcutContext.Provider>
    );
};

export const useShortcuts = () => {
    const ctx = useContext(ShortcutContext);
    if (!ctx) throw new Error('useShortcuts must be inside ShortcutProvider');
    return ctx;
};
```

## 2. Hook components use to register shortcuts

```tsx
import { useEffect } from 'react';

export const useShortcut = (s: Omit<Shortcut, 'id'> & { id: string }, deps: any[] = []) => {
    const { register } = useShortcuts();
    useEffect(() => register(s), deps);
};
```

Components only register when focused — Ink's `useFocus` makes this easy:

```tsx
const FileList = () => {
    const { isFocused } = useFocus();

    useShortcut({
    id: 'file-list-open',
    keys: ['o', 'b'],
    label: 'open in browser',
    action: () => openBrowser(),
    }, [isFocused]);
    // Only register when focused — wrap useShortcut call in `if (isFocused)` guard
    // OR pass an `enabled` flag and skip registration inside the hook
};
```

A cleaner pattern: pass `enabled` and only register when true.

## 3. Key handler with leader-sequence buffer

```tsx
import { useInput } from 'ink';
import { useRef } from 'react';

const SEQUENCE_TIMEOUT = 1000;

export const useShortcutDispatcher = () => {
    const { shortcuts } = useShortcuts();
    const buffer = useRef<string[]>([]);
    const timer = useRef<NodeJS.Timeout | null>(null);

    useInput((input, key) => {
    if (key.escape) { buffer.current = []; return; }

    buffer.current.push(input);

    // Find exact match
    const exact = shortcuts.find(s =>
        s.keys.length === buffer.current.length &&
        s.keys.every((k, i) => k === buffer.current[i])
    );

    if (exact) {
        exact.action();
        buffer.current = [];
        if (timer.current) clearTimeout(timer.current);
        return;
    }

    // Check if buffer is a prefix of any shortcut
    const isPrefix = shortcuts.some(s =>
        s.keys.length > buffer.current.length &&
        buffer.current.every((k, i) => s.keys[i] === k)
    );

    if (!isPrefix) {
        buffer.current = [];
    } else {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { buffer.current = []; }, SEQUENCE_TIMEOUT);
    }
    });

    return buffer.current;
};
```

## 4. The footer

```tsx
const Footer = () => {
    const { shortcuts } = useShortcuts();
    const sorted = [...shortcuts].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return (
    <Box borderStyle="single" paddingX={1}>
        {sorted.map(s => (
        <Text key={s.id}>
            <Text color="cyan">{s.keys.join(' ')}</Text>
            <Text dimColor> {s.label}  </Text>
        </Text>
        ))}
    </Box>
    );
};
```

## Key design notes

- **Focus-driven registration** is the trick that makes the footer dynamic — components register/unregister via `useFocus`, and the footer just renders whatever's currently registered.
- **The buffer + prefix check** is what enables leader sequences. If `o` is also a single-key shortcut, give `o b` higher priority or require `o` shortcuts to be explicitly single-key only.
- **Timeout** clears stale sequences so a stray `o` doesn't trap you.
- For modal contexts (e.g. a dialog open), wrap with another provider layer or add a `mode` field to shortcuts and filter by active mode.

Want me to extend this with modal scopes or conflict resolution between overlapping prefixes?
</assistant>
<user>
Me: What if the definition for the sub-leader keys only showed up after the leader key was pressed? And all others disappeared.
</user>
<assistant>
Great UX touch — this is how tools like Helix and SpaceVim do it. You expose the buffer state and have the footer react to it.

## 1. Lift the buffer into context

Move the buffer from `useShortcutDispatcher` into the provider so the footer can read it:

```tsx
type ShortcutContextType = {
    shortcuts: Shortcut[];
    register: (s: Shortcut) => () => void;
    buffer: string[];
    setBuffer: (b: string[]) => void;
};

const ShortcutContext = createContext<ShortcutContextType | null>(null);

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [buffer, setBuffer] = useState<string[]>([]);

    const register = useCallback((s: Shortcut) => {
    setShortcuts(prev => [...prev, s]);
    return () => setShortcuts(prev => prev.filter(x => x.id !== s.id));
    }, []);

    return (
    <ShortcutContext.Provider value={{ shortcuts, register, buffer, setBuffer }}>
        {children}
    </ShortcutContext.Provider>
    );
};
```

## 2. Dispatcher updates buffer state

```tsx
export const useShortcutDispatcher = () => {
    const { shortcuts, buffer, setBuffer } = useShortcuts();
    const timer = useRef<NodeJS.Timeout | null>(null);

    useInput((input, key) => {
    if (key.escape) { setBuffer([]); return; }

    const next = [...buffer, input];

    const exact = shortcuts.find(s =>
        s.keys.length === next.length && s.keys.every((k, i) => k === next[i])
    );
    if (exact) {
        exact.action();
        setBuffer([]);
        if (timer.current) clearTimeout(timer.current);
        return;
    }

    const isPrefix = shortcuts.some(s =>
        s.keys.length > next.length && next.every((k, i) => s.keys[i] === k)
    );

    if (isPrefix) {
        setBuffer(next);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setBuffer([]), 1000);
    } else {
        setBuffer([]);
    }
    });
};
```

## 3. Footer filters by buffer

This is the whole trick — when the buffer is non-empty, only show shortcuts whose keys start with the buffer, and display the *remaining* keys:

```tsx
const Footer = () => {
    const { shortcuts, buffer } = useShortcuts();

    const visible = buffer.length === 0
    ? shortcuts.filter(s => s.keys.length === 1) // top-level only
    : shortcuts.filter(s =>
        s.keys.length > buffer.length &&
        buffer.every((k, i) => s.keys[i] === k)
        );

    return (
    <Box borderStyle="single" paddingX={1} flexDirection="column">
        {buffer.length > 0 && (
        <Text dimColor>
            <Text color="yellow">{buffer.join(' ')}</Text>
            <Text>-</Text>
        </Text>
        )}
        <Box>
        {visible.map(s => {
            const remaining = s.keys.slice(buffer.length).join(' ');
            return (
            <Text key={s.id}>
                <Text color="cyan">{remaining}</Text>
                <Text dimColor> {s.label}  </Text>
            </Text>
            );
        })}
        </Box>
    </Box>
    );
};
```

## How it feels

- Idle: footer shows `q quit  / search  o ...` (top-level keys)
- Press `o`: footer flips to `b browser  f file  e editor` with a `o-` indicator above
- Press `b`: action fires, footer resets
- Press `Esc` or wait 1s: buffer clears, top-level returns

## Two refinements worth adding

**Show that a key is a leader.** When a shortcut starts a sequence but has no top-level action, render it as `o …` or `o ▸` in the idle state so users know to expect more. You can detect this by checking if any shortcut has `keys[0] === s.keys[0]` and `keys.length > 1`.

**Group sub-shortcuts.** Define leader groups explicitly so the idle footer shows `o open…` rather than listing every `o *` shortcut individually:

```tsx
type Shortcut = {
    // ...
    group?: string; // e.g. 'open'
};
```

Then the idle footer shows one entry per group, and pressing the leader reveals the group's members. This scales much better once you have 5+ leader sequences.
</assistant>
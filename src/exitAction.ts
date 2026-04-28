import { spawnSync } from "node:child_process";

export type ExitAction =
	| { type: "print"; value: string }
	| { type: "exec"; command: string[]; cwd?: string };

export function handleExitAction(action: ExitAction): never {
	if (action.type === "print") {
		process.stdout.write(`${action.value}\n`);
		process.exit(0);
	}

	const result = spawnSync(action.command[0], action.command.slice(1), {
		stdio: "inherit",
		cwd: action.cwd,
	});
	process.exit(result.status ?? 1);
}

export function isExitAction(value: unknown): value is ExitAction {
	return (
		value !== null &&
		typeof value === "object" &&
		"type" in value &&
		((value as ExitAction).type === "print" ||
			(value as ExitAction).type === "exec")
	);
}
